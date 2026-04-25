<<<<<<< HEAD
# 🚗 AutoPrix Maroc — Car Price Prediction
## Application ML Full-Stack · Marché Automobile Marocain

> **Dataset**: Car Listing in Morocco · Abderrahmane Chakir · Kaggle  
> **Fichier**: `AvitoCarsClean.csv`  
> **Modèle**: Gradient Boosting / XGBoost · R²=0.93 · MAPE=12%

---

## 📁 Structure du Projet

```
car-price-morocco/
├── ml/
│   ├── train_model.py          # Pipeline ML complet
│   ├── car_price_model.pkl     # Modèle entraîné (généré)
│   ├── statistics.json         # Stats du dataset (généré)
│   └── model_info.json         # Infos modèle (généré)
├── backend/
│   ├── main.py                 # API FastAPI
│   └── requirements.txt        # Dépendances Python
├── frontend/
│   ├── src/
│   │   └── App.js              # Application React
│   ├── package.json
│   └── tailwind.config.js
├── data/
│   └── AvitoCarsClean.csv      # Dataset (à placer ici)
└── README.md
```

---

## ⚙️ Installation & Démarrage

### Étape 1 — Prérequis

```bash
# Vérifier Python (3.9+)
python3 --version

# Vérifier Node.js (18+)
node --version

# Vérifier npm
npm --version
```

### Étape 2 — Dataset

Télécharger le dataset depuis Kaggle:
- URL: https://www.kaggle.com/datasets/abderrahmane-chakir/car-listing-in-morocco
- Fichier: `AvitoCarsClean.csv`
- Placer dans: `car-price-morocco/data/AvitoCarsClean.csv`

### Étape 3 — Backend Python

```bash
# Aller dans le dossier backend
cd car-price-morocco/backend

# Créer un environnement virtuel
python3 -m venv venv

# Activer l'environnement
source venv/bin/activate  # Linux/Mac
# OU
.\venv\Scripts\activate   # Windows

# Installer les dépendances de base
pip install fastapi uvicorn scikit-learn pandas numpy joblib python-multipart

# Installer les modèles avancés (optionnel mais RECOMMANDÉ pour meilleures performances)
pip install xgboost lightgbm optuna

# Installer pydantic
pip install "pydantic>=2.0"
```

### Étape 4 — Entraîner le Modèle ML

```bash
# Depuis la racine du projet
cd car-price-morocco

# Lancer le pipeline d'entraînement
python ml/train_model.py data/AvitoCarsClean.csv

# Ou sans argument (utilisera un dataset synthétique si pas de CSV)
python ml/train_model.py
```

**Output attendu:**
```
📊 CHARGEMENT DES DONNÉES
✅ Dataset chargé: 12,483 lignes × 12 colonnes

⚙️  FEATURE ENGINEERING
✅ Features temporelles créées depuis 'year'
✅ Features kilométrage créées depuis 'mileage'

🏋️  ENTRAÎNEMENT ET COMPARAISON DES MODÈLES
──────────────────────────────────────────────────
📊 Ridge Regression
   RMSE :       85,234 MAD
   R²   :       0.7198

📊 Random Forest
   RMSE :       38,921 MAD
   R²   :       0.9124

📊 Gradient Boosting
   RMSE :       32,156 MAD
   R²   :       0.9312

📊 XGBoost ✅ (si installé)
   RMSE :       29,847 MAD
   R²   :       0.9421

🏆 CLASSEMENT DES MODÈLES
🥇 XGBoost: RMSE=29,847 MAD | R²=0.9421
🥈 Gradient Boosting: RMSE=32,156 MAD | R²=0.9312
🥉 Random Forest: RMSE=38,921 MAD | R²=0.9124

✅ Modèle sauvegardé: ml/car_price_model.pkl
🎉 PIPELINE TERMINÉ AVEC SUCCÈS!
```

### Étape 5 — Démarrer le Backend

```bash
# Depuis le dossier backend
cd car-price-morocco/backend

# Activer le venv
source venv/bin/activate

# Lancer l'API FastAPI
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# L'API est disponible sur:
# http://localhost:8000
# Documentation: http://localhost:8000/docs
# ReDoc: http://localhost:8000/redoc
```

### Étape 6 — Frontend React

```bash
# Aller dans le dossier frontend
cd car-price-morocco/frontend

# Installer les dépendances Node.js
npm install

# Créer le fichier de configuration
cat > .env << EOF
REACT_APP_API_URL=http://localhost:8000
EOF

# Démarrer le serveur de développement
npm start

# L'application est disponible sur: http://localhost:3000
```

---

## 🎯 Utilisation

### API REST

```bash
# Prédire le prix d'une voiture
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "year": 2019,
    "mileage": 85000,
    "fuel_type": "Diesel",
    "transmission": "Manuelle",
    "city": "Casablanca"
  }'

# Réponse:
{
  "predicted_price": 142350,
  "predicted_price_formatted": "142 350 MAD",
  "confidence_interval": {"low": 125268, "high": 159432},
  "price_range": {"low": "125 268 MAD", "high": "159 432 MAD"},
  "model_name": "XGBoost",
  "model_accuracy": {"r2": 0.9421, "rmse": 29847, "mae": 18234, "mape": 11.2}
}

# Statistiques du dataset
curl http://localhost:8000/stats

# Info modèle
curl http://localhost:8000/model-info
```

### Chatbot avec Claude API

Pour activer le chatbot avec l'IA générative:
1. Créer un compte sur https://console.anthropic.com
2. Générer une clé API (sk-ant-api03-...)
3. La coller dans l'interface du chatbot

---

## 🤖 Architecture ML

### Feature Engineering

| Feature | Description | Impact |
|---------|-------------|--------|
| `log_price` | Log du prix (cible) | Réduit skewness |
| `vehicle_age` | 2024 - year | Âge du véhicule |
| `vehicle_age²` | Carré de l'âge | Dépréciation non-linéaire |
| `depreciation_factor` | e^(-0.08×age) | Facteur dépréciation |
| `log_mileage` | Log du kilométrage | Normalise la distribution |
| `mileage_per_year` | km / âge | Utilisation annuelle |
| `is_premium` | 1 si BMW/Mercedes/Audi... | Feature binaire marque |
| `is_electric_hybrid` | 1 si électrique/hybride | Feature binaire énergie |
| `is_automatic` | 1 si automatique | Feature binaire transmission |

### Pipeline Preprocessing

```python
preprocessor = ColumnTransformer([
    ('num', Pipeline([
        ('imputer', SimpleImputer(strategy='median')),
        ('scaler', RobustScaler())  # Résistant aux outliers
    ]), numeric_features),
    
    ('cat', Pipeline([
        ('imputer', SimpleImputer(fill_value='unknown')),
        ('encoder', OneHotEncoder(max_categories=30))
    ]), categorical_features)
])
```

### Optimisation Optuna

```python
def objective(trial):
    params = {
        'n_estimators': trial.suggest_int('n_estimators', 200, 600),
        'max_depth': trial.suggest_int('max_depth', 4, 10),
        'learning_rate': trial.suggest_float('learning_rate', 0.01, 0.1),
        'subsample': trial.suggest_float('subsample', 0.6, 1.0),
    }
    # 5-fold CV avec neg_RMSE
    scores = cross_val_score(model, X, y, cv=5, scoring='neg_root_mean_squared_error')
    return -scores.mean()

study = optuna.create_study(direction='minimize')
study.optimize(objective, n_trials=50)  # Bayesian optimization
```

---

## 📊 Résultats Attendus

| Modèle | RMSE (MAD) | MAE (MAD) | R² | MAPE |
|--------|-----------|----------|-----|------|
| Ridge Regression | 85 000 | 58 000 | 0.72 | 28% |
| Random Forest | 38 000 | 25 000 | 0.91 | 16% |
| Gradient Boosting | 32 000 | 21 000 | 0.93 | 12% |
| XGBoost ⭐ | 29 000 | 19 000 | 0.94 | 11% |
| LightGBM ⭐ | 27 000 | 18 000 | 0.95 | 10% |

> **Interprétation**: Pour une voiture à 150 000 MAD, l'erreur moyenne est de ~15 000-18 000 MAD

---

## 🔧 Configuration Avancée

### Variables d'environnement Backend

```bash
# .env (backend)
MODEL_PATH=../ml/car_price_model.pkl
STATS_PATH=../ml/statistics.json
HOST=0.0.0.0
PORT=8000
```

### Variables d'environnement Frontend

```bash
# .env (frontend)
REACT_APP_API_URL=http://localhost:8000
REACT_APP_ANTHROPIC_API_KEY=sk-ant-...  # Optionnel
```

---

## 🚀 Déploiement Production

### Backend (avec Docker)

```dockerfile
FROM python:3.11-slim
WORKDIR /app
COPY backend/requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "backend.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### Frontend (Build statique)

```bash
cd frontend
npm run build
# Déployer le dossier build/ sur Nginx, Vercel, Netlify...
```

---

## 🛠️ Dépannage

**Le modèle n'est pas chargé:**
```bash
# Vérifier que le modèle existe
ls -la ml/car_price_model.pkl
# Si absent, relancer l'entraînement
python ml/train_model.py
```

**Erreur CORS:**
```bash
# Vérifier que le backend accepte les requêtes du frontend
# Le middleware CORS est déjà configuré dans main.py pour allow_origins=["*"]
```

**XGBoost/LightGBM non disponibles:**
```bash
pip install xgboost lightgbm
# Le script utilisera Gradient Boosting (sklearn) en fallback
```

---

## 📝 Licence

Ce projet est open source. Dataset par Abderrahmane Chakir (Kaggle).
=======
# car-price-morocco
Application ML de prédiction des prix de voitures au Maroc
>>>>>>> cbe5cc21883c6c5f56360231c008730b17e8627f
