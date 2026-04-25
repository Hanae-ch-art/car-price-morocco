import pandas as pd
import numpy as np
import warnings
import joblib
import json
import os

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import RobustScaler, OneHotEncoder
from sklearn.metrics import mean_squared_error, mean_absolute_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.compose import ColumnTransformer

warnings.filterwarnings("ignore")

try:
    import xgboost as xgb
    HAS_XGB = True
    print(" XGBoost disponible")
except:
    HAS_XGB = False
    print("  XGBoost non disponible - utilisation GradientBoosting")
    from sklearn.ensemble import GradientBoostingRegressor

print("\n" + "="*60)
print(" CHARGEMENT DES DONNÉES")
print("="*60)

df = pd.read_csv("data/AvitoCarsClean.csv", low_memory=False)
print(f" {df.shape[0]:,} lignes | colonnes: {df.columns.tolist()}")

# ─── Nettoyage prix ───────────────────────────────────────
df['prix'] = pd.to_numeric(df['prix'], errors='coerce')
before = len(df)
df = df[(df['prix'] >= 15000) & (df['prix'] <= 3000000)]
df = df.dropna(subset=['prix'])
print(f"Après nettoyage: {len(df):,} lignes (supprimé: {before-len(df)})")
df['log_prix'] = np.log1p(df['prix'])

# ─── Feature Engineering ──────────────────────────────────
print("\n  Feature Engineering...")
current_year = 2024

df['annee'] = pd.to_numeric(df['annee'], errors='coerce').fillna(2015).clip(1990, 2025)
df['age'] = current_year - df['annee']
df['age_squared'] = df['age'] ** 2
df['depreciation'] = np.exp(-0.08 * df['age'])

df['kilometrage'] = pd.to_numeric(df['kilometrage'], errors='coerce')
df['kilometrage'] = df['kilometrage'].fillna(df['kilometrage'].median()).clip(0, 1500000)
df['log_km'] = np.log1p(df['kilometrage'])
df['km_par_an'] = df['kilometrage'] / (df['age'].replace(0, 1))
df['log_km_par_an'] = np.log1p(df['km_par_an'])

df['puissance_fiscale'] = pd.to_numeric(df['puissance_fiscale'], errors='coerce').fillna(6).clip(1, 50)

df['is_premiere_main'] = df['premiere_main'].astype(str).str.lower().apply(lambda x: 1 if 'oui' in x else 0)

premium = ['bmw', 'mercedes', 'audi', 'porsche', 'lexus', 'land rover', 'volvo', 'jaguar']
df['marque_lower'] = df['marque'].astype(str).str.lower()
df['is_premium'] = df['marque_lower'].apply(lambda x: 1 if any(p in x for p in premium) else 0)

df['boite_lower'] = df['boite'].astype(str).str.lower()
df['is_automatique'] = df['boite_lower'].apply(lambda x: 1 if 'auto' in x else 0)

df['carburant_lower'] = df['carburant'].astype(str).str.lower()
df['is_electrique'] = df['carburant_lower'].apply(lambda x: 1 if any(e in x for e in ['electr', 'hybrid']) else 0)

# Nettoyage catégorielles
for col in ['marque', 'modele', 'boite', 'carburant', 'etat']:
    df[col] = df[col].astype(str).str.strip().str.lower().fillna('unknown')
    freq = df[col].value_counts()
    rare = freq[freq < 15].index
    df[col] = df[col].apply(lambda x: 'other' if x in rare else x)

print(f"Valeurs uniques - marque: {df['marque'].nunique()} | modele: {df['modele'].nunique()} | etat: {df['etat'].nunique()}")

# ─── Features ─────────────────────────────────────────────
num_features = [
    'annee', 'age', 'age_squared', 'depreciation',
    'log_km', 'km_par_an', 'log_km_par_an',
    'puissance_fiscale',
    'is_premiere_main', 'is_premium', 'is_automatique', 'is_electrique'
]

cat_features = ['marque', 'modele', 'boite', 'carburant', 'etat']

X = df[num_features + cat_features]
y = df['log_prix'].values

print(f"\n X: {X.shape} | features: {len(num_features)} num + {len(cat_features)} cat")

# ─── Preprocessor ─────────────────────────────────────────
preprocessor = ColumnTransformer([
    ('num', Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', RobustScaler())
    ]), num_features),
    ('cat', Pipeline([
        ('imputer', SimpleImputer(strategy='constant', fill_value='unknown')),
        ('encoder', OneHotEncoder(handle_unknown='ignore', sparse_output=False, max_categories=100))
    ]), cat_features)
])

# ─── Split ────────────────────────────────────────────────
X_train, X_test, y_train, y_test = train_test_split(
    X, y, test_size=0.2, random_state=42
)
print(f"Train: {len(X_train):,} | Test: {len(X_test):,}")

# ─── Entraînement ─────────────────────────────────────────
print("\n  Entraînement...")

if HAS_XGB:
    print("Utilisation de XGBoost (meilleure précision)...")
    model = Pipeline([
        ('pre', preprocessor),
        ('model', xgb.XGBRegressor(
            n_estimators=500,
            max_depth=8,
            learning_rate=0.05,
            subsample=0.8,
            colsample_bytree=0.8,
            reg_alpha=0.1,
            reg_lambda=1.0,
            min_child_weight=3,
            random_state=42,
            n_jobs=-1,
            verbosity=0
        ))
    ])
else:
    print("Utilisation de GradientBoosting...")
    from sklearn.ensemble import GradientBoostingRegressor
    model = Pipeline([
        ('pre', preprocessor),
        ('model', GradientBoostingRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.8,
            min_samples_leaf=5,
            random_state=42
        ))
    ])

model.fit(X_train, y_train)

# ─── Métriques ────────────────────────────────────────────
y_pred = np.expm1(model.predict(X_test))
y_real = np.expm1(y_test)

rmse = np.sqrt(mean_squared_error(y_real, y_pred))
mae = mean_absolute_error(y_real, y_pred)
r2 = r2_score(y_real, y_pred)
mape = np.mean(np.abs((y_real - y_pred) / y_real)) * 100

print(f"\n Résultats sur le jeu de test:")
print(f"   R²   : {r2:.4f}")
print(f"   RMSE : {rmse:,.0f} MAD")
print(f"   MAE  : {mae:,.0f} MAD")
print(f"   MAPE : {mape:.2f}%")

# ─── Ré-entraîner sur 100% ────────────────────────────────
print("\n Ré-entraînement sur 100% des données...")
model.fit(X, y)

# ─── Vérification sur quelques exemples du dataset ────────
print("\n Vérification sur 5 exemples réels du dataset:")
sample = df.sample(5, random_state=1)
sample_X = sample[num_features + cat_features]
sample_pred = np.expm1(model.predict(sample_X))
for i, (idx, row) in enumerate(sample.iterrows()):
    print(f"  [{row['marque']} {row['modele']} {int(row['annee'])} {int(row['kilometrage'])}km]")
    print(f"    Réel: {row['prix']:,.0f} MAD | Prédit: {sample_pred[i]:,.0f} MAD | Erreur: {abs(row['prix']-sample_pred[i])/row['prix']*100:.1f}%")

# ─── Statistiques dashboard ───────────────────────────────
print("\n Génération des statistiques...")

stats = {
    'total_listings': int(len(df)),
    'avg_price': float(df['prix'].mean()),
    'median_price': float(df['prix'].median()),
    'min_price': float(df['prix'].min()),
    'max_price': float(df['prix'].max()),
    'std_price': float(df['prix'].std()),
}

brand_stats = df.groupby('marque')['prix'].agg(['mean', 'median', 'count']).reset_index()
brand_stats.columns = ['brand', 'avg_price', 'median_price', 'count']
brand_stats = brand_stats[brand_stats['count'] >= 10].sort_values('avg_price', ascending=False).head(20)
stats['price_by_brand'] = brand_stats.to_dict('records')

fuel_stats = df.groupby('carburant')['prix'].median().reset_index()
fuel_stats.columns = ['fuel_type', 'median_price']
stats['price_by_fuel'] = fuel_stats.to_dict('records')

year_stats = df.groupby('annee')['prix'].median().reset_index()
year_stats.columns = ['year', 'median_price']
stats['price_by_year'] = year_stats.sort_values('year').to_dict('records')

os.makedirs("ml", exist_ok=True)
with open("ml/statistics.json", "w", encoding='utf-8') as f:
    json.dump(stats, f, ensure_ascii=False, indent=2)

# ─── Sauvegarde ───────────────────────────────────────────
model_data = {
    'model': model,
    'feature_columns': num_features + cat_features,
    'num_features': num_features,
    'cat_features': cat_features,
    'model_name': 'XGBoost' if HAS_XGB else 'Gradient Boosting',
    'metrics': {
        'rmse': float(rmse),
        'mae': float(mae),
        'r2': float(r2),
        'mape': float(mape)
    }
}

joblib.dump(model_data, "ml/car_price_model.pkl")

with open("ml/model_info.json", "w") as f:
    json.dump({
        'model_name': model_data['model_name'],
        'metrics': model_data['metrics'],
        'training_samples': int(len(X))
    }, f, indent=2)

print("\n" + "="*60)
print(" TERMINÉ!")
print("="*60)
print(f"  Modèle : {model_data['model_name']}")
print(f"  R²     : {r2:.4f}")
print(f"  RMSE   : {rmse:,.0f} MAD")
print(f"  MAE    : {mae:,.0f} MAD")
print(f"  MAPE   : {mape:.2f}%")
print(f"\n   ml/car_price_model.pkl")
print(f"   ml/statistics.json")
print(f"   ml/model_info.json")