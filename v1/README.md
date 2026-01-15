# FitnessRPG 🏋️‍♂️⚔️

Une Progressive Web App (PWA) de suivi d'entraînement sportif gamifiée avec mécaniques RPG.

## 🎮 Concept

FitnessRPG transforme vos séances de sport en aventure RPG :
- **Gagnez de l'XP** pour chaque série effectuée
- **Montez en niveau** en fonction de votre progression
- **Débloquez des Personal Records** (Boss Battles)
- **Suivez vos statistiques** de force et endurance
- **Mode Local-First** : fonctionne hors ligne avec synchronisation optionnelle

## 🏗️ Architecture

### Backend (Python/Flask)
- **Framework** : Flask avec SQLAlchemy ORM
- **Base de données** : SQLite (dev) / PostgreSQL (prod)
- **Authentification** : JWT avec Argon2 pour les mots de passe
- **API RESTful** : Routes pour sync, stats, exercices

### Frontend (Vanilla JS)
- **PWA** : Service Worker + Manifest
- **Stockage** : IndexedDB pour le mode offline
- **Router** : SPA avec système de routing custom
- **UI** : Mobile-first, responsive design

## 📦 Installation

### Prérequis
- Python 3.10+
- Node.js 18+ (optionnel, pour serveur de dev frontend)

### 1. Backend

```bash
cd backend

# Créer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Sur Windows: venv\Scripts\activate

# Installer les dépendances
pip install -r requirements.txt

# Créer le fichier .env
cat > .env << EOF
SECRET_KEY=your-secret-key-here-change-in-production
JWT_SECRET_KEY=your-jwt-secret-key-here
DATABASE_URL=sqlite:///instance/fitness.db
CORS_ORIGINS=http://localhost:8000,http://127.0.0.1:8000
FLASK_ENV=development
EOF

# Lancer le serveur
python app.py
```

Le backend sera disponible sur `http://localhost:5000`

### 2. Frontend

```bash
cd frontend

# Option 1 : Serveur Python simple
python -m http.server 8000

# Option 2 : Serveur Node.js
npx http-server -p 8000 -c-1

# Option 3 : Live Server (VS Code extension)
# Clic droit sur index.html → Open with Live Server
```

Le frontend sera disponible sur `http://localhost:8000`

## 🚀 Utilisation

### Workflow complet

1. **Inscription/Connexion**
   - Créer un compte ou utiliser le mode hors ligne
   - JWT stocké dans localStorage

2. **Démarrer une séance**
   - Aller sur "Séance"
   - Sélectionner un exercice dans la liste
   - Une séance est automatiquement créée

3. **Ajouter des séries**
   - Renseigner le poids (kg)
   - Renseigner les répétitions
   - Optionnel : RPE (Rate of Perceived Exertion, 6-10)
   - Marquer comme échauffement si besoin
   - Le chronomètre de repos démarre automatiquement

4. **Terminer la séance**
   - Cliquer sur "Terminer la séance"
   - L'XP est calculé automatiquement
   - La séance est ajoutée à l'historique
   - Synchronisation automatique si connecté

### Mode hors ligne

L'application fonctionne entièrement hors ligne :
- Les données sont stockées dans IndexedDB
- Une queue de synchronisation enregistre les changements
- À la reconnexion, les données sont synchronisées automatiquement

## 📊 Structure de la base de données

```
User (1) ←→ (1) UserStats
  ↓
  (1) ←→ (*) Workout
              ↓
              (1) ←→ (*) WorkoutExercise ←→ (*) Exercise
                          ↓
                          (1) ←→ (*) ExerciseSet
```

### Modèles principaux

- **User** : Utilisateur avec progression RPG (level, XP)
- **UserStats** : Statistiques agrégées par date
- **Workout** : Séance d'entraînement
- **WorkoutExercise** : Exercice dans une séance (table de liaison)
- **ExerciseSet** : Série individuelle (poids, reps, RPE)
- **Exercise** : Catalogue d'exercices (17 exercices par défaut)

## 🎯 Fonctionnalités implémentées

### ✅ Alpha test ready

- [x] Authentification (inscription/connexion/JWT)
- [x] Création de séance
- [x] Sélection d'exercices
- [x] Ajout de séries (poids, reps, RPE)
- [x] Chronomètre de repos automatique
- [x] Calcul automatique du volume et de l'XP
- [x] Système de niveaux RPG
- [x] Mode hors ligne (IndexedDB)
- [x] Synchronisation avec le backend
- [x] Historique des séances
- [x] Dashboard avec progression

### 🚧 En développement

- [ ] Statistiques avancées (graphiques)
- [ ] Smart Coach (suggestions de progression)
- [ ] Gestion des Personal Records (PR)
- [ ] Exercices personnalisés
- [ ] Profil détaillé
- [ ] Notifications push

## 🧪 Tests

### Test du flux complet

1. **Backend** : `http://localhost:5000/api/health`
   - Doit retourner `{"status": "online"}`

2. **Frontend** : `http://localhost:8000`
   - Ouvrir la console (F12)
   - Vérifier les logs : "✅ Application FitnessRPG initialisée"

3. **Créer un compte**
   ```
   Username: test
   Email: test@example.com
   Password: test123
   ```

4. **Créer une séance complète**
   - Sélectionner "Développé Couché (Bench Press)"
   - Ajouter 3 séries :
     - 60kg × 10 reps
     - 70kg × 8 reps
     - 80kg × 6 reps
   - Terminer la séance

5. **Vérifier les résultats**
   - Dashboard : XP gagné, niveau mis à jour
   - Historique : séance affichée
   - Backend : vérifier la sync dans les logs

## 🔧 API Endpoints

### Authentification
- `POST /api/auth/register` - Créer un compte
- `POST /api/auth/login` - Se connecter
- `GET /api/auth/me` - Récupérer le profil (JWT requis)

### Synchronisation
- `POST /api/sync/push` - Envoyer les données locales au serveur
- `GET /api/sync/pull` - Récupérer les données du serveur

### Exercices
- `GET /api/exercises` - Liste des exercices

### Statistiques
- `GET /api/stats/dashboard` - Stats pour le dashboard
- `GET /api/stats/history` - Historique des séances

## 🎨 Thème et Design

Le projet utilise un système de design tokens (CSS variables) :
- **Couleurs** : Indigo (primary), Violet (secondary)
- **Typographie** : System fonts (optimisé performance)
- **Spacing** : Échelle 4px (4, 8, 12, 16, 24, 32...)
- **Radius** : sm, md, lg, xl, full
- **Responsive** : Mobile-first (breakpoints: 640px, 768px, 1024px)

## 📱 PWA

L'application peut être installée sur mobile/desktop :
- **Manifest** : `/frontend/manifest.json`
- **Service Worker** : `/frontend/service-worker.js`
- **Icons** : `/frontend/assets/icons/`

### Installation sur mobile
1. Ouvrir l'app dans Chrome/Safari
2. Menu → "Ajouter à l'écran d'accueil"
3. L'icône apparaît sur l'écran d'accueil

## 🐛 Debug

### Logs backend
```bash
# Activer les logs SQL
# Dans config.py, DevelopmentConfig:
SQLALCHEMY_ECHO = True
```

### Logs frontend
```javascript
// Dans la console
localStorage.setItem('DEBUG', 'true')
```

### Reset de la base de données
```bash
cd backend
rm -rf instance/fitness.db
python app.py  # Recrée la DB automatiquement
```

### Reset IndexedDB
```javascript
// Dans la console du navigateur
indexedDB.deleteDatabase('FitnessRPG')
location.reload()
```

## 📝 Formules de calcul

### XP
```
XP = Volume × Multiplicateur de l'exercice
Volume = Poids (kg) × Répétitions
```

### Niveau
```
XP pour niveau N = 100 × N^1.5
Niveau 1 → 0 XP
Niveau 2 → 283 XP
Niveau 3 → 520 XP
```

### 1RM (One Rep Max - Formule de Brzycki)
```
1RM = Poids / (1.0278 - 0.0278 × Reps)
```

## 🤝 Contribution

Ce projet est en développement actif. Les contributions sont les bienvenues !

### Priorités pour l'alpha test
1. Tests en conditions réelles
2. Feedback UX mobile
3. Détection de bugs critiques
4. Performance IndexedDB

## 📄 Licence

MIT License - Libre d'utilisation

## 👤 Auteur

Développé avec ❤️ et Claude Code

---

**Version** : 1.0.0-alpha
**Status** : Alpha Test Ready
**Date** : Janvier 2026
