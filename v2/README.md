# FitnessRPG v2 - Architecture Simple

Application fitness gamifiée avec authentification et mode hors ligne.

## 📁 Structure

```
v2/
├── backend/
│   ├── app.py              # API Flask (1 fichier)
│   ├── requirements.txt    # Dépendances Python
│   └── fitnessrpg.db       # Base SQLite (créée automatiquement)
│
├── frontend/
│   ├── index.html          # Structure HTML
│   ├── manifest.json       # Config PWA
│   ├── service-worker.js   # Cache offline
│   ├── css/
│   │   └── app.css         # Styles (1 fichier)
│   └── js/
│       ├── storage.js      # IndexedDB
│       ├── auth.js         # Authentification
│       ├── pages.js        # Pages HTML
│       └── app.js          # Point d'entrée
│
├── start.sh                # Script de démarrage
└── README.md               # Ce fichier
```

## 🚀 Démarrage rapide

```bash
cd v2
./start.sh
```

Ou manuellement :

```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
python3 app.py

# Frontend (autre terminal)
cd frontend
python3 -m http.server 8000
```

## 🌐 URLs

- **Frontend:** http://localhost:8000
- **Backend API:** http://localhost:5000
- **Health Check:** http://localhost:5000/api/health

## 🔑 Fonctionnalités (Phase 1 - Login/Register)

- ✅ Inscription avec username/email/password
- ✅ Connexion avec JWT
- ✅ Mode hors ligne (IndexedDB)
- ✅ PWA (fonctionne offline)
- ✅ Notifications toast
- ✅ Design moderne et responsive

## 🧪 Tester l'authentification

### 1. Inscription
```bash
curl -X POST http://localhost:5000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "email": "test@example.com", "password": "test123"}'
```

### 2. Connexion
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "test", "password": "test123"}'
```

### 3. Récupérer utilisateur (avec token)
```bash
curl http://localhost:5000/api/auth/me \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## 📝 Notes

- **Backend:** 1 fichier Python (~200 lignes)
- **Frontend:** 4 fichiers JS (~500 lignes total)
- **Pas de node_modules** : Vanilla JS pur
- **Pas de build step** : Prêt à l'emploi
- **SQLite:** Base locale simple
- **IndexedDB:** Stockage offline côté client

## 🔄 Prochaines étapes

1. ✅ Page Login/Register (terminée)
2. 🚧 Page Dashboard (en attente)
3. 🚧 Workout tracking (en attente)
4. 🚧 Système RPG/XP (en attente)

---

**Version actuelle:** v2.0 - Login/Register uniquement
**Focus:** Simplicité, performance, offline-first
