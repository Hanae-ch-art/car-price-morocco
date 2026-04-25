#  AutoPrix Maroc — Prédiction des Prix de Voitures par Machine Learning

<div align="center">

![Python](https://img.shields.io/badge/Python-3.9+-3776AB?style=for-the-badge&logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react&logoColor=black)
![FastAPI](https://img.shields.io/badge/FastAPI-0.115-009688?style=for-the-badge&logo=fastapi&logoColor=white)
![XGBoost](https://img.shields.io/badge/XGBoost-2.0-FF6600?style=for-the-badge)
![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)

**Application intelligente de prédiction des prix de voitures d'occasion sur le marché marocain**

</div>

---

##  À propos du projet

**AutoPrix Maroc** est une application web full-stack qui utilise le **Machine Learning** pour prédire le prix de vente d'un véhicule d'occasion sur le marché marocain, en s'appuyant sur un dataset de **68 415 annonces** extraites de la plateforme Avito Maroc.

### Problématique

Le marché de l'automobile d'occasion au Maroc souffre d'une forte asymétrie informationnelle : les acheteurs ne disposent pas des mêmes informations que les vendeurs, ce qui génère des prix arbitraires et des risques de fraude. Notre solution apporte un outil d'estimation objectif et fiable basé sur des données réelles.

### Fonctionnalités

- **Prédiction de prix** : Estimation instantanée avec intervalle de confiance
- **Dashboard statistique** : Visualisation des tendances du marché marocain
- **Chatbot IA** : Assistant intelligent sur le marché automobile (intègre l'API Claude d'Anthropic)
- **API REST** : Endpoints documentés et prêts pour l'intégration

---

##  Technologies utilisées

### Machine Learning
| Librairie | Version | Usage |
|---|---|---|
| scikit-learn | 1.5+ | Pipeline, preprocessing, métriques |
| XGBoost | 2.0+ | Modèle principal de prédiction |
| Optuna | 3.6+ | Optimisation bayésienne des hyperparamètres |
| pandas | 2.2+ | Manipulation des données |
| numpy | 1.26+ | Calculs numériques |
| joblib | 1.4+ | Sérialisation du modèle |

### Backend
| Technologie | Version | Usage |
|---|---|---|
| FastAPI | 0.115+ | Framework API REST |
| Uvicorn | 0.32+ | Serveur ASGI |
| Pydantic | 2.0+ | Validation des données |

### Frontend
| Technologie | Version | Usage |
|---|---|---|
| React.js | 18 | Interface utilisateur |
| Tailwind CSS | 3 | Styling |

---

##  Modèle ML

### Pipeline complet
Dataset Avito (68 415 annonces)
↓
Nettoyage & Filtrage (prix 15K–3M MAD)
↓
Feature Engineering (17 features créées)
↓
Preprocessing (RobustScaler + OneHotEncoder)
↓
Comparaison de modèles (Ridge, RF, GB, XGBoost)
↓
Optimisation Optuna (30 trials bayésiens)
↓
Modèle XGBoost final
↓
Déploiement FastAPI

### Performances comparées

| Modèle | R² | RMSE (MAD) | MAE (MAD) | MAPE |
|---|---|---|---|---|
| Ridge Regression | 0.72 | 85 234 | 58 120 | 28.4% |
| Random Forest | 0.91 | 38 921 | 25 340 | 16.2% |
| Gradient Boosting | 0.93 | 32 156 | 21 080 | 12.8% |
| **XGBoost ★** | **0.94** | **28 940** | **18 620** | **10.9%** |

### Hyperparamètres XGBoost finaux

```python
XGBRegressor(
    n_estimators      = 600,
    max_depth         = 8,
    learning_rate     = 0.04,
    subsample         = 0.85,
    colsample_bytree  = 0.85,
    reg_alpha         = 0.05,
    reg_lambda        = 1.5,
    min_child_weight  = 5,
    gamma             = 0.1,
    random_state      = 42
)
```

---

##  Structure du projet
car-price-morocco/
│
├── ml/
│   └── train_model.py          # Pipeline ML complet
│
├── backend/
│   ├── main.py                 # API FastAPI
│   └── requirements.txt        # Dépendances Python
│
├── frontend/
│   ├── src/
│   │   ├── App.js              # Application React
│   │   └── index.js            # Point d'entrée
│   ├── public/
│   │   └── index.html
│   └── package.json
│
├── data/                       # Dataset à télécharger depuis Kaggle
├── .gitignore
└── README.md

---

##  Installation

### 1. Cloner le dépôt

```bash
git clone https://github.com/Hanae-ch-art/car-price-morocco.git
cd car-price-morocco
```

### 2. Télécharger le dataset

Télécharger `AvitoCarsClean.csv` depuis Kaggle :

 https://www.kaggle.com/datasets/abderrahmane-chakir/car-listing-in-morocco

Placer le fichier dans `data/AvitoCarsClean.csv`

### 3. Installer les dépendances Python

```bash
pip install fastapi uvicorn scikit-learn pandas numpy joblib pydantic xgboost optuna python-multipart
```

### 4. Entraîner le modèle ML

```bash
python ml/train_model.py
```

Durée estimée : 3 à 8 minutes.

Output attendu :
 XGBoost disponible
 CHARGEMENT DES DONNÉES
 68,415 lignes
  Entraînement XGBoost optimisé...
R²   : 0.9421
RMSE : 28,940 MAD
MAPE : 10.90%
 TERMINÉ!

### 5. Démarrer le backend

```bash
cd backend
uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

API disponible sur : http://127.0.0.1:8000
Documentation : http://127.0.0.1:8000/docs

### 6. Démarrer le frontend

```bash
cd frontend
npm install
npm start
```

Application disponible sur : http://localhost:3000

---

##  API Endpoints

| Méthode | Endpoint | Description |
|---|---|---|
| `GET` | `/health` | Statut de l'API et du modèle |
| `POST` | `/predict` | Prédiction du prix d'un véhicule |
| `GET` | `/stats` | Statistiques du dataset |
| `POST` | `/chatbot` | Chatbot intelligent |
| `GET` | `/brands` | Liste des marques disponibles |
| `GET` | `/model-info` | Informations sur le modèle ML |
| `GET` | `/docs` | Documentation Swagger interactive |

### Exemple de requête

```bash
curl -X POST http://127.0.0.1:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "brand": "Toyota",
    "model": "Corolla",
    "year": 2019,
    "mileage": 85000,
    "fuel_type": "Diesel",
    "transmission": "Manuelle",
    "condition": "Très bon",
    "puissance_fiscale": 6,
    "premiere_main": "Oui"
  }'
```

### Réponse

```json
{
  "predicted_price": 142350,
  "predicted_price_formatted": "142 350 MAD",
  "confidence_interval": { "low": 127000, "high": 158000 },
  "model_name": "XGBoost",
  "model_accuracy": { "r2": 0.9421, "mape": 10.9 }
}
```

---

##  Dataset

| Propriété | Valeur |
|---|---|
| Source | Avito Maroc via Kaggle |
| Auteur | Abderrahmane Chakir |
| Lien | [Kaggle Dataset](https://www.kaggle.com/datasets/abderrahmane-chakir/car-listing-in-morocco) |
| Taille | 68 415 annonces |
| Variables | 11 colonnes |

### Variables

| Variable | Description |
|---|---|
| `annee` | Année de mise en circulation |
| `boite` | Type de boîte de vitesses |
| `carburant` | Type de carburant |
| `kilometrage` | Kilométrage total (km) |
| `marque` | Marque du véhicule |
| `modele` | Modèle du véhicule |
| `puissance_fiscale` | Puissance fiscale (CV) |
| `premiere_main` | Premier propriétaire ? |
| `etat` | État général |
| `prix` | **Prix de vente (MAD) — Variable cible** |

---

##  Résultats

### Performance du modèle final
R²   = 0.9421  →  94.2% de la variance des prix expliquée
RMSE = 28 940 MAD
MAE  = 18 620 MAD
MAPE = 10.9%   →  erreur relative moyenne de 11%

### Exemples de prédictions réelles

| Véhicule | Prix réel | Prix prédit | Erreur |
|---|---|---|---|
| Peugeot 301 2018 — 52K km | 112 000 MAD | 116 735 MAD | 4.2% |
| Dacia Duster 2020 — 72K km | 170 000 MAD | 172 050 MAD | 1.2% |
| Alfa Romeo Giulietta 2013 | 110 000 MAD | 111 596 MAD | 1.5% |
| VW Polo 1997 — 22K km | 25 000 MAD | 26 549 MAD | 6.2% |

### Importance des features
Marque              ████████████████████  28.3%
Modèle              ████████████████      22.1%
Année / Âge         ███████████████       19.8%
Kilométrage         ██████████            14.7%
Puissance fiscale   ████                   6.2%
Carburant           ███                    4.8%
Première main       ██                     2.3%
État                █                      1.8%

---

##  Contribution

1. Fork le projet
2. Créez votre branche : `git checkout -b feature/amelioration`
3. Committez : `git commit -m "Ajout de la fonctionnalité X"`
4. Poussez : `git push origin feature/amelioration`
5. Ouvrez une Pull Request

---

## 📄 Licence

Ce projet est sous licence **MIT**.

---

##  Auteur

Développé dans le cadre d'un **Projet de Fin d'Études (PFE)**
Filière : Data Science
Année universitaire : **2025-2026**

---

##  Remerciements

- **Abderrahmane Chakir** pour le dataset Avito Maroc sur Kaggle
- **Chen & Guestrin (2016)** pour XGBoost
- **Akiba et al. (2019)** pour Optuna
- La communauté **scikit-learn** et **FastAPI**

---

