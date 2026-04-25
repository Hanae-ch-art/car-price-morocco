from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional, List, Dict, Any
import joblib
import json
import numpy as np
import pandas as pd
import os
import logging
from pathlib import Path

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="AutoPrix Maroc API", version="3.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MODEL_PATH = Path(__file__).parent.parent / "ml" / "car_price_model.pkl"
STATS_PATH = Path(__file__).parent.parent / "ml" / "statistics.json"
MODEL_INFO_PATH = Path(__file__).parent.parent / "ml" / "model_info.json"

model_data = None
statistics = None
model_info = None


def load_resources():
    global model_data, statistics, model_info
    if MODEL_PATH.exists():
        try:
            model_data = joblib.load(MODEL_PATH)
            logger.info(f" Modèle chargé: {model_data.get('model_name')}")
        except Exception as e:
            logger.error(f" Erreur: {e}")
    if STATS_PATH.exists():
        with open(STATS_PATH, 'r', encoding='utf-8') as f:
            statistics = json.load(f)
    if MODEL_INFO_PATH.exists():
        with open(MODEL_INFO_PATH, 'r') as f:
            model_info = json.load(f)


load_resources()


class CarFeatures(BaseModel):
    brand: Optional[str] = None
    model: Optional[str] = None
    year: Optional[int] = None
    mileage: Optional[float] = None
    fuel_type: Optional[str] = None
    transmission: Optional[str] = None
    city: Optional[str] = None
    condition: Optional[str] = None
    puissance_fiscale: Optional[float] = None
    premiere_main: Optional[str] = None

    class Config:
        extra = "allow"


@app.get("/health")
async def health():
    return {
        "status": "healthy",
        "model_loaded": model_data is not None,
        "model_name": model_data.get('model_name', 'N/A') if model_data else 'N/A'
    }


@app.post("/predict")
async def predict_price(car: CarFeatures):
    if model_data is None:
        raise HTTPException(status_code=503, detail="Modèle non chargé. Lancez train_model.py d'abord.")

    try:
        model = model_data['model']
        num_features = model_data['num_features']
        cat_features = model_data['cat_features']
        all_features = num_features + cat_features

        current_year = 2024
        year = car.year or 2015
        mileage = car.mileage or 100000
        age = current_year - year

        # Mapping transmission → boite
        boite_map = {
            'automatique': 'automatique',
            'manuelle': 'manuelle',
            'semi-automatique': 'semi-automatique',
        }
        boite = boite_map.get((car.transmission or '').lower(), 'manuelle')

        # Mapping condition → etat
        etat_map = {
            'excellent': 'excellent',
            'très bon': 'très bon',
            'tres bon': 'très bon',
            'bon': 'bon',
            'acceptable': 'acceptable',
        }
        etat = etat_map.get((car.condition or '').lower(), 'bon')

        # Mapping carburant
        carburant_map = {
            'diesel': 'diesel',
            'essence': 'essence',
            'hybride': 'hybride',
            'électrique': 'électrique',
            'electrique': 'électrique',
            'gpl': 'gpl',
        }
        carburant = carburant_map.get((car.fuel_type or '').lower(), 'diesel')

        marque = (car.brand or 'unknown').lower().strip()
        modele = (car.model or 'unknown').lower().strip()
        puissance = car.puissance_fiscale or 6.0
        is_premiere_main = 1 if (car.premiere_main or '').lower() == 'oui' else 0

        

        
        premium = ['bmw', 'mercedes', 'audi', 'porsche', 'lexus', 'land rover', 'volvo', 'jaguar', 'ferrari', 'maserati']
        japonaise = ['toyota', 'honda', 'nissan', 'mazda', 'mitsubishi', 'subaru', 'suzuki']
        is_premium = 1 if any(p in marque for p in premium) else 0
        is_japonaise = 1 if any(j in marque for j in japonaise) else 0
        is_automatique = 1 if 'auto' in boite else 0
        is_electrique = 1 if any(e in carburant for e in ['electr', 'hybrid']) else 0
        is_diesel = 1 if 'diesel' in carburant else 0
        is_collection = 1 if age >= 25 else 0
        etat_str = etat.lower()
        premium_x_excellent = is_premium * (1 if 'excel' in etat_str else 0)

        row = {
            'annee': year,
            'age': age,
            'age_squared': age ** 2,
            'depreciation': np.exp(-0.08 * age) if age < 25 else np.exp(-0.08 * 25) * (1 + (age - 25) * 0.01),
            'log_km': np.log1p(mileage),
            'km_par_an': mileage / max(1, age),
            'log_km_par_an': np.log1p(min(mileage / max(1, age), 200000)),
            'puissance_fiscale': puissance,
            'puissance_x_recence': puissance * (1 / (age + 1)),
            'is_premiere_main': is_premiere_main,
            'is_premium': is_premium,
            'is_japonaise': is_japonaise,
            'is_automatique': is_automatique,
            'is_electrique': is_electrique,
            'is_diesel': is_diesel,
            'is_collection': is_collection,
            'premium_x_excellent': premium_x_excellent,
            'marque': marque,
            'modele': modele,
            'boite': boite,
            'carburant': carburant,
            'etat': etat,
        }
        

        input_df = pd.DataFrame([row])[all_features]

        log_pred = model.predict(input_df)[0]
        predicted_price = float(np.expm1(log_pred))

        metrics = model_data['metrics']
        mape = metrics.get('mape', 15) / 100
        low = predicted_price * (1 - mape)
        high = predicted_price * (1 + mape)

        def fmt(p):
            return f"{int(p):,} MAD".replace(',', ' ')

        return {
            "predicted_price": round(predicted_price, 2),
            "predicted_price_formatted": fmt(predicted_price),
            "confidence_interval": {"low": round(low, 2), "high": round(high, 2)},
            "price_range": {"low": fmt(low), "high": fmt(high)},
            "model_name": model_data.get('model_name', 'ML Model'),
            "model_accuracy": {
                "r2": round(metrics.get('r2', 0), 4),
                "rmse": round(metrics.get('rmse', 0), 0),
                "mae": round(metrics.get('mae', 0), 0),
                "mape": round(metrics.get('mape', 0), 2)
            },
            "debug": {
                "marque": marque, "modele": modele, "boite": boite,
                "carburant": carburant, "etat": etat, "age": age,
                "log_km": round(np.log1p(mileage), 3)
            }
        }

    except Exception as e:
        logger.error(f"Erreur prédiction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/stats")
async def get_statistics():
    if statistics:
        return statistics
    raise HTTPException(status_code=503, detail="Statistiques non disponibles")


@app.post("/chatbot")
async def chatbot(chat: dict):
    msg = chat.get('message', '').lower()

    responses = {
        ('prix', 'moyen'): " Prix moyen: ~145 000 MAD | Médian: ~98 000 MAD sur 68 415 annonces Avito Maroc.",
        ('marque', 'brand'): " Top marques: Mercedes ~480K, BMW ~370K, Audi ~340K, VW ~180K, Toyota ~160K, Dacia ~70K MAD",
        ('modele', 'model', 'algorithme', 'r2', 'précision'): f" Modèle: Gradient Boosting | R²={model_data['metrics']['r2']:.3f} | MAPE={model_data['metrics']['mape']:.1f}% | Entraîné sur {68415:,} annonces" if model_data else "Modèle non chargé",
        ('km', 'kilometre', 'kilométrage'): " Impact km: chaque 10 000 km réduit le prix d'environ 1.5%. Sweet spot: 80-120K km.",
        ('carburant', 'diesel', 'essence'): " Diesel: +10% vs essence. Hybride: +20%. Électrique: +30%.",
    }

    for keywords, response in responses.items():
        if any(k in msg for k in keywords):
            return {"response": response, "suggestions": []}

    return {
        "response": "Je peux répondre sur les prix, marques, kilométrage, carburant ou le modèle ML. Que voulez-vous savoir?",
        "suggestions": ["Prix moyen par marque?", "Précision du modèle?", "Impact du kilométrage?"]
    }


@app.get("/brands")
async def get_brands():
    return {"brands": sorted([
        "Audi", "BMW", "Chevrolet", "Citroën", "Dacia", "Fiat", "Ford",
        "Honda", "Hyundai", "Kia", "Land Rover", "Lexus", "Mazda",
        "Mercedes", "Mini", "Mitsubishi", "Nissan", "Opel", "Peugeot",
        "Porsche", "Renault", "Seat", "Skoda", "Suzuki", "Tesla",
        "Toyota", "Volkswagen", "Volvo"
    ])}


@app.get("/model-info")
async def get_model_info():
    if model_info:
        return model_info
    raise HTTPException(status_code=503, detail="Model info non disponible")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000, reload=True)