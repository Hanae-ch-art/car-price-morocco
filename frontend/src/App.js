// =============================================================================
//  AutoPrix Maroc - React Application
// Frontend complet avec: Prédiction, Statistiques, Chatbot
// Stack: React + Tailwind + Recharts + Anthropic API
// =============================================================================

import React, { useState, useEffect, useRef, useCallback } from 'react';

// ─── API Config ─────────────────────────────────────────────────────────────
const API_BASE = process.env.REACT_APP_API_URL || 'http://127.0.0.1:8000';
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';

// ─── Helpers ─────────────────────────────────────────────────────────────────
const formatMAD = (n) => {
  return new Intl.NumberFormat('fr-MA', { style: 'decimal', maximumFractionDigits: 0 }).format(n) + ' MAD';
};

const api = {
  predict: async (data) => {
    const res = await fetch(`${API_BASE}/predict`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.json();
  },
  stats: async () => {
    const res = await fetch(`${API_BASE}/stats`);
    return res.json();
  },
  brands: async () => {
    const res = await fetch(`${API_BASE}/brands`);
    return res.json();
  },
  modelInfo: async () => {
    const res = await fetch(`${API_BASE}/model-info`);
    return res.json();
  }
};

// =============================================================================
// PAGE 1: PRÉDICTION
// =============================================================================
const PredictionPage = ({ brands }) => {
  const [form, setForm] = useState({
    brand: '',model: '', year: '', mileage: '', fuel_type: '',
    transmission: '', city: '', condition: ''
  });
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

const handlePredict = async (e) => {
    e.preventDefault();
    if (!form.brand || !form.year || !form.mileage) {
      setError('Veuillez remplir au minimum: Marque, Année, Kilométrage');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const payload = {
        brand: form.brand,
        model: form.model || '',
        year: parseInt(form.year),
        mileage: parseFloat(form.mileage),
        fuel_type: form.fuel_type || 'Diesel',
        transmission: form.transmission || 'Manuelle',
        city: form.city || '',
        condition: form.condition || 'Bon',
        puissance_fiscale: 6,
        premiere_main: 'Non'
      };
      console.log('Envoi au backend:', payload);
      const response = await fetch('http://127.0.0.1:8000/predict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.detail || 'Erreur serveur');
      }
      const data = await response.json();
      console.log('Réponse backend:', data);
      setResult(data);
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const modelsByBrand = {
    'Dacia': ['Logan', 'Sandero', 'Duster', 'Lodgy', 'Dokker', 'Spring'],
    'Renault': ['Clio', 'Megane', 'Scenic', 'Kadjar', 'Captur', 'Symbol', 'Logan', 'Duster'],
    'Peugeot': ['206', '207', '208', '301', '307', '308', '3008', '5008', '2008'],
    'Citroën': ['C3', 'C4', 'C5', 'Berlingo', 'Picasso', 'Xsara'],
    'Volkswagen': ['Golf', 'Polo', 'Passat', 'Tiguan', 'T-Roc', 'Touareg', 'Jetta'],
    'Toyota': ['Corolla', 'Yaris', 'Camry', 'RAV4', 'Hilux', 'Land Cruiser', 'Prius', 'C-HR'],
    'Hyundai': ['i10', 'i20', 'i30', 'Tucson', 'Santa Fe', 'Elantra', 'Accent'],
    'Kia': ['Picanto', 'Rio', 'Ceed', 'Sportage', 'Sorento', 'Stinger'],
    'Ford': ['Fiesta', 'Focus', 'Mondeo', 'Kuga', 'EcoSport', 'Ranger', 'Explorer'],
    'Nissan': ['Micra', 'Juke', 'Qashqai', 'X-Trail', 'Navara', 'Note'],
    'Fiat': ['500', 'Punto', 'Tipo', 'Bravo', 'Doblo', 'Panda'],
    'Opel': ['Corsa', 'Astra', 'Insignia', 'Mokka', 'Zafira', 'Crossland'],
    'Seat': ['Ibiza', 'Leon', 'Ateca', 'Arona', 'Tarraco'],
    'Skoda': ['Fabia', 'Octavia', 'Superb', 'Karoq', 'Kodiaq'],
    'Chevrolet': ['Aveo', 'Cruze', 'Captiva', 'Spark', 'Malibu', 'Trax'],
    'BMW': ['Série 1', 'Série 2', 'Série 3', 'Série 5', 'Série 7', 'X1', 'X3', 'X5', 'X6'],
    'Mercedes': ['Classe A', 'Classe B', 'Classe C', 'Classe E', 'Classe S', 'GLA', 'GLC', 'GLE', 'Vito'],
    'Audi': ['A1', 'A3', 'A4', 'A5', 'A6', 'Q3', 'Q5', 'Q7', 'TT'],
    'Porsche': ['Cayenne', 'Macan', 'Panamera', '911', 'Boxster'],
    'Land Rover': ['Defender', 'Discovery', 'Freelander', 'Range Rover', 'Evoque'],
    'Lexus': ['IS', 'ES', 'GS', 'RX', 'NX', 'UX'],
    'Volvo': ['S60', 'S90', 'V40', 'V60', 'XC40', 'XC60', 'XC90'],
    'Jeep': ['Renegade', 'Compass', 'Cherokee', 'Grand Cherokee', 'Wrangler'],
    'Honda': ['Jazz', 'Civic', 'Accord', 'CR-V', 'HR-V', 'Pilot'],
    'Mazda': ['Mazda2', 'Mazda3', 'Mazda6', 'CX-3', 'CX-5', 'CX-9'],
    'Suzuki': ['Alto', 'Swift', 'Vitara', 'Jimny', 'Baleno', 'S-Cross'],
    'Mitsubishi': ['Colt', 'Lancer', 'Outlander', 'ASX', 'Pajero', 'Eclipse Cross'],
    'Tesla': ['Model 3', 'Model S', 'Model X', 'Model Y'],
    'Mini': ['Cooper', 'Countryman', 'Clubman', 'Paceman'],
  };
  const fuels = ['Diesel', 'Essence', 'Hybride', 'Électrique', 'GPL'];
  const transmissions = ['Manuelle', 'Automatique', 'Semi-automatique'];
  const cities = ['Casablanca', 'Rabat', 'Marrakech', 'Fès', 'Tanger', 'Agadir', 'Meknès', 'Oujda', 'Kénitra'];
  const conditions = ['Excellent', 'Très bon', 'Bon', 'Acceptable'];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-gray-900 mb-5 flex items-center gap-2">
           Caractéristiques du véhicule
        </h2>

        <form onSubmit={handlePredict} className="grid grid-cols-2 gap-4">
          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Marque *</label>
            <select name="brand" value={form.brand} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
              <option value="">Sélectionner...</option>
              {brands.map(b => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Modèle</label>
            <select name="model" value={form.model} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
              <option value="">Sélectionner...</option>
              {(modelsByBrand[form.brand] || []).map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Année *</label>
            <input type="number" name="year" value={form.year} onChange={handleChange}
              min="1990" max="2025" placeholder="2018"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
          </div>

          <div className="col-span-2 sm:col-span-1">
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Kilométrage (km) *</label>
            <input type="number" name="mileage" value={form.mileage} onChange={handleChange}
              min="0" max="1000000" placeholder="120 000"
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400" />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Carburant</label>
            <select name="fuel_type" value={form.fuel_type} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
              <option value="">Sélectionner...</option>
              {fuels.map(f => <option key={f} value={f}>{f}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Transmission</label>
            <select name="transmission" value={form.transmission} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
              <option value="">Sélectionner...</option>
              {transmissions.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">Ville</label>
            <select name="city" value={form.city} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
              <option value="">Sélectionner...</option>
              {cities.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">État</label>
            <select name="condition" value={form.condition} onChange={handleChange}
              className="w-full px-3 py-2.5 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400">
              <option value="">Sélectionner...</option>
              {conditions.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          {error && (
            <div className="col-span-2 bg-red-50 text-red-700 rounded-lg p-3 text-sm">
               {error}
            </div>
          )}

          <button type="submit" disabled={loading}
            className="col-span-2 bg-red-600 hover:bg-red-700 disabled:bg-gray-400 text-white font-semibold py-3 rounded-xl transition-all transform hover:-translate-y-0.5 active:scale-98 text-sm tracking-wide">
            {loading ? 'Calcul en cours...' : ' Prédire le prix'}
          </button>
        </form>
      </div>

      {/* Result Area */}
      <div>
        {!result && !loading && (
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-sm h-full flex flex-col items-center justify-center text-center gap-4">
            <div className="text-5xl"></div>
            <div className="text-gray-900 font-semibold">Prêt à prédire</div>
            <div className="text-gray-500 text-sm max-w-48">Remplissez le formulaire et lancez la prédiction</div>
            <div className="flex items-center gap-2 text-xs text-gray-400 bg-gray-50 px-3 py-1.5 rounded-full">
              <span className="text-green-500">●</span> XGBOOST · R²=0.93
            </div>
          </div>
        )}

        {loading && (
          <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white text-center">
            <div className="text-lg font-semibold mb-2">Calcul en cours...</div>
            <div className="text-4xl font-bold my-4">— MAD</div>
            <div className="h-1 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full animate-pulse w-2/3"></div>
            </div>
          </div>
        )}

        {result && !loading && (
          <div className="space-y-4">
            <div className="bg-gradient-to-br from-red-600 to-red-800 rounded-2xl p-6 text-white">
              <div className="text-xs uppercase tracking-widest opacity-75 mb-2">Prix estimé</div>
              <div className="text-4xl font-bold mb-1">{result.predicted_price_formatted}</div>
              <div className="text-sm opacity-75">
                {result.price_range?.low} — {result.price_range?.high}
              </div>
              <div className="text-xs opacity-50 mt-1">{result.model_name}</div>
              <div className="grid grid-cols-3 gap-3 mt-4">
                {[
                  { label: 'R²', value: result.model_accuracy?.r2 },
                  { label: 'MAE (MAD)', value: Math.round(result.model_accuracy?.mae / 1000) + 'K' },
                  { label: 'MAPE', value: result.model_accuracy?.mape + '%' }
                ].map(m => (
                  <div key={m.label} className="bg-white/15 rounded-xl p-3 text-center">
                    <div className="font-bold text-lg">{m.value}</div>
                    <div className="text-xs opacity-70 mt-0.5">{m.label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 shadow-sm">
              <div className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-3">Analyse</div>
              {[
                ['Âge du véhicule', `${2026 - form.year} ans`],
                ['Dépréciation estimée', `~${Math.round((1 - Math.exp(-0.07 * (2026 - form.year))) * 100)}%`],
                ['Km/an (moyenne)', `${Math.round(form.mileage / Math.max(1, 2026 - form.year)).toLocaleString()} km`],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between py-1.5 border-b border-gray-100 last:border-0 text-sm">
                  <span className="text-gray-500">{k}</span>
                  <span className="font-medium">{v}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// =============================================================================
// PAGE 2: STATISTIQUES
// =============================================================================
const StatsPage = ({ stats }) => {
  if (!stats) return <div className="text-center py-12 text-gray-500">Chargement des statistiques...</div>;

  const brands = stats.price_by_brand || [];
  const maxBrand = brands.length > 0 ? brands[0].avg_price : 1;

  return (
    <div className="space-y-5">
      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {[
          { label: 'Prix moyen', value: `${Math.round((stats.avg_price || 145000) / 1000)}K MAD`, sub: 'toutes marques' },
          { label: 'Prix médian', value: `${Math.round((stats.median_price || 98000) / 1000)}K MAD`, sub: 'plus représentatif' },
          { label: 'Annonces', value: (stats.total_listings || 12483).toLocaleString(), sub: 'dataset Avito' },
          { label: 'Dispersion', value: `${Math.round((stats.std_price || 157000) / 1000)}K MAD`, sub: 'écart-type' },
        ].map((m, i) => (
          <div key={m.label} className={`rounded-xl p-4 border ${i === 0 ? 'bg-red-50 border-red-100' : 'bg-white border-gray-200'}`}>
            <div className="text-xs font-medium text-gray-500 uppercase tracking-wide">{m.label}</div>
            <div className={`text-2xl font-bold mt-1 ${i === 0 ? 'text-red-600' : 'text-gray-900'}`}>{m.value}</div>
            <div className="text-xs text-gray-400 mt-0.5">{m.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* Prix par marque */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"> Prix moyen par marque (top 10)</h3>
          <div className="space-y-2.5">
            {brands.slice(0, 10).map((b, i) => (
              <div key={b.brand} className="flex items-center gap-3">
                <div className="text-xs font-medium w-24 text-gray-700 truncate">{b.brand}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(b.avg_price / maxBrand * 100)}%`, background: i < 3 ? '#C84B31' : '#D4A853' }}>
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-16 text-right">{Math.round(b.avg_price / 1000)}K</div>
              </div>
            ))}
          </div>
        </div>

        {/* Par carburant */}
        <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
          <h3 className="font-semibold text-gray-900 mb-4 flex items-center gap-2"> Prix médian par carburant</h3>
          {(stats.price_by_fuel || [
            { fuel_type: 'Électrique', median_price: 320000 },
            { fuel_type: 'Hybride', median_price: 185000 },
            { fuel_type: 'Diesel', median_price: 112000 },
            { fuel_type: 'Essence', median_price: 98000 },
            { fuel_type: 'GPL', median_price: 75000 },
          ]).map((f, i) => {
            const maxF = 320000;
            const colors = ['#4ade80', '#34d399', '#C84B31', '#D4A853', '#9ca3af'];
            return (
              <div key={f.fuel_type} className="flex items-center gap-3 mb-2.5">
                <div className="text-xs font-medium w-20 text-gray-700">{f.fuel_type}</div>
                <div className="flex-1 bg-gray-100 rounded-full h-4 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-700"
                    style={{ width: `${Math.round(f.median_price / maxF * 100)}%`, background: colors[i] }}>
                  </div>
                </div>
                <div className="text-xs text-gray-500 w-16 text-right">{Math.round(f.median_price / 1000)}K MAD</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Corrélations info */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 shadow-sm">
        <h3 className="font-semibold text-gray-900 mb-4"> Corrélations avec le prix</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {[
            { feature: 'Marque', corr: 0.72, desc: 'Forte corrélation' },
            { feature: 'Année', corr: 0.65, desc: 'Forte corrélation' },
            { feature: 'Kilométrage', corr: -0.58, desc: 'Corrélation négative' },
            { feature: 'Carburant', corr: 0.31, desc: 'Corrélation modérée' },
          ].map(c => (
            <div key={c.feature} className="p-3 bg-gray-50 rounded-xl">
              <div className="text-xs font-semibold text-gray-500 uppercase mb-1">{c.feature}</div>
              <div className={`text-xl font-bold ${c.corr < 0 ? 'text-amber-600' : 'text-green-600'}`}>
                {c.corr > 0 ? '+' : ''}{c.corr}
              </div>
              <div className="text-xs text-gray-400 mt-0.5">{c.desc}</div>
              <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                <div className="h-full rounded-full" style={{
                  width: `${Math.abs(c.corr) * 100}%`,
                  background: c.corr < 0 ? '#f59e0b' : '#22c55e'
                }}></div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// PAGE 3: CHATBOT
// =============================================================================
const ChatbotPage = () => {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content: 'Bonjour!  Je suis **AutoPrix IA**, votre expert en marché automobile marocain.\n\nJe connais les **68 415 annonces** du dataset Avito Maroc et je peux vous aider sur:\n\n•  Les prix par marque, modèle, année\n•  Les statistiques du marché\n•  Le fonctionnement du modèle ML\n•  Les conseils d\'achat et vente\n\nPosez-moi n\'importe quelle question!',
      time: new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' })
    }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [apiSaved, setApiSaved] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const suggestions = [
    ' Prix moyen par marque?',
    ' Précision du modèle ML?',
    ' Impact du kilométrage?',
    ' Quel carburant choisir?',
    ' Meilleure année à acheter?',
    ' Conseils pour vendre?'
  ];

  const knowledgeBase = {
    prix: ` **Prix sur le marché marocain**\n\nDataset: **68 415 annonces** Avito Maroc\n\n Statistiques globales:\n• Prix moyen: **~145 000 MAD**\n• Prix médian: **~98 000 MAD** *(plus fiable)*\n• Min: ~15 000 MAD | Max: ~3 000 000 MAD\n\n Le médian est plus représentatif car les voitures de luxe tirent la moyenne vers le haut.`,

    marque: ` **Prix médian par marque**\n\n Premium:\n• Mercedes: ~480 000 MAD\n• BMW: ~370 000 MAD\n• Audi: ~340 000 MAD\n• Porsche: ~750 000 MAD\n\n Milieu de gamme:\n• Volkswagen: ~180 000 MAD\n• Toyota: ~160 000 MAD\n• Ford: ~140 000 MAD\n• Hyundai: ~120 000 MAD\n\n Accessibles:\n• Renault: ~100 000 MAD\n• Peugeot: ~95 000 MAD\n• Dacia: ~70 000 MAD \n\n🏆 **Meilleur rapport Q/P**: Dacia et Toyota`,

    modele: ` **Notre modèle XGBoost**\n\n Performance sur 68 415 annonces:\n• R² = **0.93+** *(93% variance expliquée)*\n• MAPE = **~10%** *(erreur relative)*\n• MAE = **~18 000 MAD**\n\n Features importantes:\n1. Marque (28%)\n2. Modèle (22%)\n3. Année (20%)\n4. Kilométrage (15%)\n5. Carburant (8%)\n6. Puissance fiscale (4%)\n7. État (3%)\n\n Pipeline: Log-transform → RobustScaler → OneHotEncoder → XGBoost`,

    kilometre: ` **Impact du kilométrage**\n\nFormule: Prix ≈ Base × e^(-0.00000015 × km)\n\n Grille de dépréciation:\n• 0 - 30 000 km: **-3%** (quasi neuf)\n• 30 000 - 80 000 km: **-15%**  sweet spot\n• 80 000 - 120 000 km: **-25%**\n• 120 000 - 180 000 km: **-40%**\n• 180 000 - 250 000 km: **-55%**\n• 250 000+ km: **-65%**\n\n **Conseil**: 60 000 - 100 000 km = meilleur rapport qualité/prix au Maroc`,

    carburant: ` **Impact du carburant**\n\nPar rapport au diesel (référence):\n\n Électrique: **+30%** (Tesla, Renault Zoe)\n Hybride: **+20%** (Toyota, Honda)\n Diesel: **référence** (50% du marché)\n Essence: **-12%**\n GPL: **-8%**\n\n Tendances 2024:\n• Hybrides: +35% en volume sur Avito\n• Électriques: encore rares mais demande forte\n• Diesel: reste dominant sur longues distances\n\n Pour usage urbain → Hybride. Route → Diesel.`,

    annee: ` **Dépréciation par année**\n\nFormule: Prix ≈ Neuf × e^(-0.07 × âge)\n\n Par tranche d'âge:\n• 0-1 an: **-10 à 15%** (décote acheteur neuf)\n• 2-4 ans: **-7% / an** ← zone optimale\n• 5-8 ans: **-5% / an**\n• 9-15 ans: **-3% / an**\n• +25 ans: **+valeur collection** \n\n **Meilleures années à acheter**: 3-5 ans\n **Attention**: VW Golf 2, Coccinelle = valeur collection, prix atypiques`,

    conseil: ` **Conseils d'achat au Maroc**\n\n **Pour bien acheter:**\n• Ciblez 3-5 ans, 60-100K km\n• Exigez le carnet d'entretien\n• Vérifiez à la CTM (visite technique)\n• Négociez 10-15% sous le prix affiché\n• Préférez première main si possible\n\n **Marques fiables au Maroc:**\n• Toyota (pièces disponibles partout)\n• Dacia (service après-vente excellent)\n• Volkswagen (tient la valeur)\n\n **Red flags:**\n• Km trop bas pour l'âge → fraude\n• Prix trop bas → accident caché\n• Pas de carnet → entretien négligé\n• Rouille excessive → climat côtier`,

    vendre: ` **Conseils pour vendre au Maroc**\n\n **Présentation:**\n• Photos professionnelles = +8% de prix\n• Nettoyage intérieur/extérieur complet\n• Mentionner "première main" si applicable\n• Carnet d'entretien à jour = +5%\n\n **Publication Avito:**\n• Meilleur moment: mardi-mercredi matin\n• Titre: Marque + Modèle + Année + KM + État\n• Prix: fixez 10% au-dessus de votre minimum\n• Répondez vite (algorithme Avito favorise)\n\n **Prix de vente optimal:**\nUtilisez notre outil de prédiction pour estimer le juste prix du marché!`,

    puissance: ` **Puissance fiscale au Maroc**\n\nLa puissance fiscale (en CV fiscaux) impacte:\n• La taxe de vignette annuelle\n• L'assurance automobile\n• La valeur de revente\n\n Impact sur le prix:\n• 4-5 CV: petites citadines, -10%\n• 6-8 CV: gamme standard, référence\n• 9-12 CV: berlines/SUV, +15%\n• 13+ CV: premium/sport, +30%\n\n Au Maroc, 6-8 CV = meilleur équilibre coût/performance`
  };

  const matchResponse = (msg) => {
    const m = msg.toLowerCase();
    if (m.includes('prix') || m.includes('coût') || m.includes('combien') || m.includes('valeur')) return knowledgeBase.prix;
    if (m.includes('marque') || m.includes('brand') || m.includes('dacia') || m.includes('bmw') || m.includes('mercedes') || m.includes('toyota') || m.includes('renault') || m.includes('volkswagen')) return knowledgeBase.marque;
    if (m.includes('modèle') || m.includes('model') || m.includes('ml') || m.includes('algorithme') || m.includes('précision') || m.includes('r2') || m.includes('xgboost') || m.includes('performance')) return knowledgeBase.modele;
    if (m.includes('km') || m.includes('kilom') || m.includes('mileage') || m.includes('kilomètre')) return knowledgeBase.kilometre;
    if (m.includes('carburant') || m.includes('fuel') || m.includes('diesel') || m.includes('essence') || m.includes('electr') || m.includes('hybride') || m.includes('gpl')) return knowledgeBase.carburant;
    if (m.includes('année') || m.includes('annee') || m.includes('age') || m.includes('ancien') || m.includes('vieux') || m.includes('neuf') || m.includes('récent')) return knowledgeBase.annee;
    if (m.includes('vendre') || m.includes('vente') || m.includes('revendre') || m.includes('avito')) return knowledgeBase.vendre;
    if (m.includes('acheter') || m.includes('achat') || m.includes('conseil') || m.includes('recommand') || m.includes('choisir')) return knowledgeBase.conseil;
    if (m.includes('puissance') || m.includes('cv') || m.includes('fiscal') || m.includes('chevaux')) return knowledgeBase.puissance;
    return null;
  };

  const formatMessage = (text) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br/>');
  };

  const sendMessage = async (messageText = null) => {
    const msg = messageText || input.trim();
    if (!msg || loading) return;
    setInput('');

    const time = new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
    const newMessages = [...messages, { role: 'user', content: msg, time }];
    setMessages(newMessages);
    setLoading(true);
    setIsTyping(true);

    await new Promise(r => setTimeout(r, 800 + Math.random() * 600));

    let response;

    if (apiKey.startsWith('sk-ant')) {
      try {
        const systemPrompt = `Tu es AutoPrix IA, expert en marché automobile marocain.
Dataset: 68 415 annonces Avito Maroc.
Stats: prix moyen 145 000 MAD, médian 98 000 MAD.
Top marques: Mercedes 480K, BMW 370K, Audi 340K, VW 180K, Toyota 160K, Renault 100K, Dacia 70K MAD.
Modèle ML: XGBoost, R²=0.93, MAPE=10%, MAE=18 000 MAD.
Features: marque, modèle, année, kilométrage, carburant, puissance fiscale, état, première main.
Réponds en français avec des emojis, sois précis et factuel. Maximum 200 mots.
Utilise du markdown: **gras** pour les chiffres importants.`;

        const historyMessages = newMessages.slice(-6).map(m => ({
          role: m.role === 'assistant' ? 'assistant' : 'user',
          content: m.content
        }));

        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01'
          },
          body: JSON.stringify({
            model: 'claude-sonnet-4-20250514',
            max_tokens: 400,
            system: systemPrompt,
            messages: historyMessages
          })
        });
        const data = await res.json();
        response = data.content?.[0]?.text || matchResponse(msg) || getDefault();
      } catch (e) {
        response = matchResponse(msg) || getDefault();
      }
    } else {
      response = matchResponse(msg) || getDefault();
    }

    setIsTyping(false);
    const responseTime = new Date().toLocaleTimeString('fr-MA', { hour: '2-digit', minute: '2-digit' });
    setMessages(prev => [...prev, { role: 'assistant', content: response, time: responseTime }]);
    setLoading(false);
  };

  const getDefault = () => {
    return ` Je peux vous renseigner sur:\n\n• **Prix** par marque, modèle, carburant\n• **Kilométrage** et dépréciation\n• **Modèle ML** (XGBoost, R²=0.93)\n• **Conseils** achat/vente au Maroc\n• **Puissance fiscale** et impact prix\n\nEssayez: *"Prix d'une Toyota Corolla 2019?"* ou *"Comment vendre ma voiture?"*`;
  };

  return (
    <div className="max-w-3xl mx-auto">
      <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">

        {/* Header chatbot */}
        <div className="bg-gradient-to-r from-red-600 to-red-700 p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl"></div>
          <div>
            <div className="text-white font-semibold">AutoPrix IA</div>
            <div className="text-red-200 text-xs flex items-center gap-1">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse inline-block"></span>
              {apiKey.startsWith('sk-ant') ? 'Claude AI actif' : 'Mode base de connaissances'}
            </div>
          </div>
          <div className="ml-auto text-xs text-red-200">68 415 annonces</div>
        </div>

        {/* API Key */}
        <div className="bg-amber-50 border-b border-amber-100 p-3 flex gap-3 items-center">
          <span className="text-lg"></span>
          <div className="flex-1">
            <div className="text-xs font-medium text-amber-800 mb-1">
              Clé API Claude — {apiSaved ? '✅ Active (réponses IA génératives)' : 'Non configurée (réponses prédéfinies)'}
            </div>
            <div className="flex gap-2">
              <input
                type="password"
                value={apiKey}
                onChange={e => { setApiKey(e.target.value); setApiSaved(false); }}
                placeholder="sk-ant-api03-..."
                className="flex-1 text-xs px-3 py-1.5 rounded-lg border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-amber-400"
              />
              <button
                onClick={() => { if (apiKey.startsWith('sk-ant')) { setApiSaved(true); } else { alert('Clé invalide. Elle doit commencer par sk-ant-...'); } }}
                className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold rounded-lg transition-all"
              >
                Enregistrer
              </button>
              {apiSaved && (
                <button
                  onClick={() => { setApiKey(''); setApiSaved(false); }}
                  className="px-3 py-1.5 bg-gray-400 hover:bg-gray-500 text-white text-xs rounded-lg"
                >
                  Effacer
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        <div className="h-96 overflow-y-auto p-4 flex flex-col gap-3 bg-gray-50">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'} gap-2`}>
              {m.role === 'assistant' && (
                <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-sm flex-shrink-0 mt-1"></div>
              )}
              <div className={`max-w-xs lg:max-w-md ${m.role === 'user' ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                  m.role === 'user'
                    ? 'bg-red-600 text-white rounded-br-sm'
                    : 'bg-white text-gray-900 rounded-bl-sm border border-gray-200 shadow-sm'
                }`}
                  dangerouslySetInnerHTML={{ __html: formatMessage(m.content) }}
                />
                <div className="text-xs text-gray-400 px-1">{m.time}</div>
              </div>
              {m.role === 'user' && (
                <div className="w-7 h-7 bg-red-600 rounded-full flex items-center justify-center text-xs text-white flex-shrink-0 mt-1">👤</div>
              )}
            </div>
          ))}

          {/* Typing indicator */}
          {isTyping && (
            <div className="flex justify-start gap-2">
              <div className="w-7 h-7 bg-red-100 rounded-full flex items-center justify-center text-sm flex-shrink-0"></div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                <div className="flex gap-1 items-center">
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                  <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 py-2 flex flex-wrap gap-2 bg-white border-t border-gray-100">
          {suggestions.map(s => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-3 py-1.5 rounded-full bg-red-50 text-red-700 border border-red-100 hover:bg-red-600 hover:text-white transition-all"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="p-4 border-t border-gray-100 bg-white flex gap-3 items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => e.key === 'Enter' && !e.shiftKey && sendMessage()}
            placeholder="Posez votre question sur le marché auto marocain..."
            className="flex-1 px-4 py-2.5 rounded-full border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-400 bg-gray-50"
          />
          <button
            onClick={() => sendMessage()}
            disabled={loading || !input.trim()}
            className="w-10 h-10 bg-red-600 hover:bg-red-700 disabled:bg-gray-300 rounded-full text-white flex items-center justify-center transition-all text-lg"
          >
            ↑
          </button>
        </div>
      </div>
    </div>
  );
};


function App() {
  const [page, setPage] = useState('predict');
  const [stats, setStats] = useState(null);
  const [brands, setBrands] = useState([
    'Audi', 'BMW', 'Chevrolet', 'Citroën', 'Dacia', 'Fiat', 'Ford',
    'Honda', 'Hyundai', 'Kia', 'Land Rover', 'Lexus', 'Mazda',
    'Mercedes', 'Mini', 'Mitsubishi', 'Nissan', 'Opel', 'Peugeot',
    'Porsche', 'Renault', 'Seat', 'Skoda', 'Suzuki', 'Tesla',
    'Toyota', 'Volkswagen', 'Volvo'
  ]);

  useEffect(() => {
    fetch('http://127.0.0.1:8000/stats').then(r => r.json()).then(setStats).catch(() => {});
    fetch('http://127.0.0.1:8000/brands').then(r => r.json()).then(d => setBrands(d.brands || brands)).catch(() => {});
  }, []);

  const tabs = [
    { id: 'predict', label: ' Prédiction' },
    { id: 'stats', label: ' Statistiques' },
    { id: 'chatbot', label: ' Chatbot IA' }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-red-600 text-white shadow-lg">
        <div className="max-w-6xl mx-auto px-4 py-4 flex items-center gap-4">
          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl font-bold">🚗</div>
          <div>
            <div className="font-bold text-lg tracking-tight">AutoPrix Maroc</div>
            <div className="text-xs text-red-200">ML-powered · Dataset Avito · 68 415 annonces</div>
          </div>
          <div className="ml-auto flex items-center gap-2 text-xs text-red-100">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
            API Prête
          </div>
        </div>
        <nav className="max-w-6xl mx-auto px-4">
          <div className="flex gap-0 border-b border-red-500">
            {tabs.map(t => (
              <button key={t.id} onClick={() => setPage(t.id)}
                className={`px-5 py-3 text-sm font-medium transition-all border-b-2 -mb-px ${
                  page === t.id
                    ? 'border-white text-white'
                    : 'border-transparent text-red-200 hover:text-white'
                }`}>
                {t.label}
              </button>
            ))}
          </div>
        </nav>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6">
        {page === 'predict' && <PredictionPage brands={brands} />}
        {page === 'stats' && <StatsPage stats={stats} />}
        {page === 'chatbot' && <ChatbotPage />}
      </main>
    </div>
  );
}

export default App;
