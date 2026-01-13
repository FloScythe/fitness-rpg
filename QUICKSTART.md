# 🚀 Guide de démarrage rapide - Alpha Test

## Démarrage en 3 étapes

### 1️⃣ Installation des dépendances (première fois seulement)

```bash
# Installer les dépendances Python
cd backend
python3 -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate
pip install -r requirements.txt
cd ..
```

### 2️⃣ Configuration

Créer le fichier `backend/.env` :

```bash
SECRET_KEY=dev-secret-key-change-me
JWT_SECRET_KEY=dev-jwt-secret-key-change-me
DATABASE_URL=sqlite:///instance/fitness.db
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
FLASK_ENV=development
```

### 3️⃣ Lancer l'application

```bash
# Option A : Script automatique (recommandé)
./start.sh

# Option B : Manuel
# Terminal 1 - Backend
cd backend
source venv/bin/activate
python app.py

# Terminal 2 - Frontend
cd frontend
python3 -m http.server 8000
```

## 📱 Accès

- **Frontend** : http://localhost:8000
- **Backend** : http://localhost:5000
- **Health check** : http://localhost:5000/api/health

## 🧪 Test du workflow complet

### 1. Créer un compte

- Ouvrir http://localhost:8000
- Cliquer sur "Créer un compte"
- Remplir :
  - Username: `test`
  - Email: `test@example.com`
  - Password: `test123`

### 2. Démarrer une séance

- Aller sur l'onglet "Séance" (icône éclair)
- Sélectionner un exercice (ex: "Développé Couché (Bench Press)")
- La séance démarre automatiquement

### 3. Ajouter des séries

L'interface affiche maintenant la page d'ajout de séries :

**Série 1 :**
- Poids : `60` kg
- Répétitions : `10`
- RPE : `7` (optionnel)
- Cliquer sur "Ajouter la série"

**Série 2 :**
- Poids : `70` kg
- Répétitions : `8`
- Cliquer sur "Ajouter la série"

**Série 3 :**
- Poids : `80` kg
- Répétitions : `6`
- RPE : `9`
- Cliquer sur "Ajouter la série"

🎯 Le chronomètre de repos démarre automatiquement après chaque série !

### 4. Ajouter un autre exercice (optionnel)

- Cliquer sur "Ajouter un exercice"
- Sélectionner un nouvel exercice
- Répéter le processus

### 5. Terminer la séance

- Cliquer sur le gros bouton vert "Terminer la séance"
- 🎉 Vous gagnez de l'XP !
- Vous êtes redirigé vers le dashboard

### 6. Vérifier les résultats

**Dashboard (onglet Accueil) :**
- XP total augmenté
- Niveau mis à jour si suffisant
- Barre de progression XP
- Séance dans "Séances Récentes"

**Historique (onglet horloge) :**
- Votre séance apparaît
- Volume total calculé
- XP gagné affiché
- Durée de la séance

## 🎮 Fonctionnalités à tester

### ✅ Fonctionnalités critiques

- [ ] Inscription/Connexion
- [ ] Création de séance automatique
- [ ] Ajout d'exercices
- [ ] Saisie de séries (poids/reps/RPE)
- [ ] Chronomètre de repos
- [ ] Marquer une série comme "échauffement"
- [ ] Terminer la séance
- [ ] Calcul XP et niveau
- [ ] Historique des séances
- [ ] Dashboard avec stats

### ✅ Mode hors ligne

- [ ] Déconnecter le réseau
- [ ] Créer une séance hors ligne
- [ ] Reconnecter le réseau
- [ ] Vérifier que la sync fonctionne

### 🎨 Interface

- [ ] Responsive mobile (tester sur téléphone)
- [ ] Navigation fluide entre les pages
- [ ] Notifications (toasts) fonctionnelles
- [ ] Timer visible et utilisable

## 🐛 Problèmes connus

### Backend ne démarre pas
```bash
# Vérifier que le port 5000 n'est pas déjà utilisé
lsof -i :5000
# Si occupé, tuer le processus
kill -9 [PID]
```

### Frontend ne charge pas
```bash
# Vérifier que le port 8000 n'est pas utilisé
lsof -i :8000
```

### Erreur de CORS
- Vérifier que `CORS_ORIGINS` dans `.env` contient bien `http://localhost:8000`
- Redémarrer le backend

### Base de données corrompue
```bash
cd backend
rm -rf instance/fitness.db
python app.py  # Recrée la DB
```

### IndexedDB pleine/corrompue
Dans la console du navigateur (F12) :
```javascript
indexedDB.deleteDatabase('FitnessRPG')
location.reload()
```

## 📊 Vérification de la synchronisation

### Dans les logs backend

Chercher ces messages lors de l'enregistrement d'une séance :
```
POST /api/sync/push
✅ {N} items synchronisés
```

### Dans la console frontend (F12)

Chercher :
```
✅ Séance terminée: {volume: XXX, xp: YYY}
🔄 Synchronisation...
✅ Sync réussie
```

## 📝 Feedback

Pendant l'alpha test, noter :

1. **Bugs bloquants** : empêchent d'utiliser l'app
2. **Bugs mineurs** : gênants mais contournables
3. **UX/UI** : ce qui est confus ou peu intuitif
4. **Performance** : lenteurs, lag
5. **Suggestions** : fonctionnalités manquantes

## 🔄 Reset complet

Pour repartir de zéro :

```bash
# Supprimer la base de données
rm backend/instance/fitness.db

# Supprimer IndexedDB
# Dans la console navigateur :
indexedDB.deleteDatabase('FitnessRPG')
localStorage.clear()
location.reload()
```

## 💡 Conseils

- **Ouvrir la console** (F12) pour voir les logs
- **Tester sur mobile** pour l'expérience complète
- **Utiliser le mode offline** pour tester la résilience
- **Essayer des valeurs limites** (0kg, 1000kg, etc.)

---

**Bon test ! 🎉**
