# 📝 Changelog - Système de synchronisation

## Version 2.8 - Page Historique + Correctifs synchronisation

### 🎯 Fonctionnalités ajoutées

#### Frontend
- ✅ **Page Historique des séances** complète avec :
  - Liste de toutes les séances triées par date
  - Stats résumées (nombre de séances, XP total)
  - Cartes de séances avec date, durée, exercices, XP
  - Modal de détails pour chaque séance
  - Fonction de suppression de séance
- ✅ Navigation vers l'historique depuis le Dashboard
- ✅ Bouton "Voir les détails" pour chaque séance
- ✅ Modal de détails avec vue complète des exercices
- ✅ Suppression de séances avec confirmation
- ✅ État vide quand aucune séance
- ✅ Design responsive (mobile + desktop)

### 🔧 Correctifs v2.8

#### Problème 1 : Workouts non synchronisés lors de la reconnexion
**Cause** : La fonction `syncAll()` envoyait les workouts locaux vers le serveur mais ne récupérait pas les workouts du serveur.

**Solution** :
```javascript
// sync.js - syncAll()
// 2. Récupérer tous les workouts depuis le serveur
const fetchResult = await this.fetchWorkouts();

if (fetchResult.success && fetchResult.workouts) {
  const localWorkouts = await Storage.getAll('workouts');
  const localWorkoutIds = new Set(localWorkouts.map(w => w.startTime));

  // Fusionner : ajouter les workouts du serveur qui ne sont pas en local
  for (const serverWorkout of fetchResult.workouts) {
    if (!localWorkoutIds.has(serverWorkout.startTime)) {
      await Storage.save('workouts', convertedWorkout);
    }
  }
}
```

**Résultat** : Les workouts créés sur un autre appareil sont maintenant récupérés lors de la synchronisation.

---

### Problème 2 : XP et niveau non mis à jour après suppression

**Avant** :
```javascript
// Seulement suppression locale
await Storage.delete('workouts', workout.id);
```

**Après** :
```javascript
// 1. Supprimer localement
await Storage.delete('workouts', workout.id);

// 2. Supprimer sur le serveur
const deleteResult = await Sync.deleteWorkout(workout.startTime);

// 3. Recalculer l'XP et le niveau
const user = await Auth.getCurrentUser();
const remainingWorkouts = await Storage.getAll('workouts');
const totalXP = remainingWorkouts.reduce((sum, w) => sum + (w.totalXP || 0), 0);
user.totalXP = totalXP;
user.level = Math.max(1, Math.floor(totalXP / 100) + 1);
await Storage.save('user', user);
```

#### Backend : Recalcul après suppression
**Ajout dans** `delete_workout()` :
```python
# Recalculer l'XP et le niveau de l'utilisateur après suppression
total_xp = db.session.query(db.func.sum(Workout.total_xp)).filter_by(user_uuid=user.uuid).scalar() or 0
user.total_xp = total_xp
user.level = max(1, total_xp // 100 + 1)
db.session.commit()
```

---

## Version 2.7 - Page Historique

### 🎯 Fonctionnalités ajoutées

#### Frontend
- ✅ **Page Historique des séances** complète
  - Liste de toutes les séances triées par date
  - Statistiques : Séances totales, XP gagnés
  - Carte par séance avec date, durée, exercices, XP
  - Modal de détails complet avec tous les exercices et séries
  - Bouton de suppression avec confirmation

- ✅ **Navigation**
  - Bouton "Historique des séances" sur le Dashboard
  - Bouton retour vers le Dashboard
  - État vide si aucune séance

- ✅ **CSS complet**
  - Design moderne avec hover effects
  - Badges XP avec gradient
  - Modal de détails responsive
  - Adapté mobile et desktop

---

## Version 2.8 - Correctifs Historique et Synchronisation

### 🐛 Correctifs critiques

#### Problème 1 : Workouts non synchronisés lors de la reconnexion
**Symptôme** :
- Les séances créées sur un appareil n'apparaissaient pas sur un autre
- Le nombre de séances et "Jours de suite" étaient à 0 après reconnexion

**Cause** :
- La fonction `syncAll()` envoyait les workouts locaux vers le serveur
- Mais elle ne récupérait JAMAIS les workouts depuis le serveur

**Solution** :
```javascript
// sync.js - ligne 159-184
async syncAll() {
  // 1. Push : Envoyer les workouts locaux vers le serveur
  await this.syncWorkouts();

  // 2. Pull : Récupérer les workouts depuis le serveur (NOUVEAU)
  const fetchResult = await this.fetchWorkouts();

  if (fetchResult.success && fetchResult.workouts) {
    const localWorkouts = await Storage.getAll('workouts');
    const localWorkoutIds = new Set(localWorkouts.map(w => w.startTime));

    // Fusionner : ajouter les workouts du serveur qui ne sont pas en local
    for (const serverWorkout of fetchResult.workouts) {
      if (!localWorkoutIds.has(serverWorkout.startTime)) {
        await Storage.save('workouts', convertedWorkout);
      }
    }
  }

  // 3. Synchroniser le profil
  await this.syncProfile(user);
}
```

### Test 2 : Suppression d'une séance avec mise à jour XP

1. **Depuis l'Historique** :
   - Clique sur "Historique des séances"
   - Clique sur "Voir les détails" d'une séance
   - Clique sur "Supprimer cette séance"

2. **Vérifications** :
   - ✅ Séance supprimée localement
   - ✅ Séance supprimée du serveur
   - ✅ XP recalculé localement
   - ✅ XP recalculé sur le serveur
   - ✅ Niveau mis à jour
   - ✅ Historique mis à jour
   - ✅ Dashboard mis à jour au retour

---

## 📊 Exemple de flux

### Scénario : Utilisateur multi-appareils

```
Desktop                          Serveur                Mobile
  │                                │                      │
  │ Crée 2 séances (200 XP)         │                      │
  │──────────────────────────────────>│                      │
  │                                    │                      │
  │                                    │◄────── Connexion ───│
  │                                    │                      │
  │                                    │   Sync workouts      │
  │                                    │◄─────────────────────┤
  │                                    │   (récupère les 2)   │
  │                                    │                      │
  │    Supprime 1 séance               │                      │
  │───────────────────────────────────►│                      │
  │    (recalcul XP serveur)           │                      │
  │                                    │                      │
  │                                    │    Déco + Reco       │
  │                                    │◄─────────────────────│
  │                                    │    (sync auto)       │
  │                                    │─────────────────────►│
  │                                    │    (1 seule séance)  │
```

---

## 🚀 Prochaines étapes

- [ ] Page Historique des séances - ✅ **TERMINÉ** (v2.7)
- [ ] Correction sync bidirectionnelle - ✅ **TERMINÉ** (v2.8)
- [ ] Pull-to-refresh pour synchroniser manuellement
- [ ] Badge "Non synchronisé" sur les workouts locaux
- [ ] Résolution de conflits avancée (timestamps)
- [ ] Background sync (API Service Worker)
- [ ] Statistiques avancées (graphiques, progression)


### 🎯 Fonctionnalités ajoutées

#### Backend
- ✅ Modèle `Workout` avec relation vers `User`
- ✅ Route `/api/sync/profile` - Synchroniser niveau et XP
- ✅ Route `/api/sync/workouts` - Synchroniser les séances
- ✅ Route `/api/workouts` - Récupérer toutes les séances
- ✅ Route `/api/workouts/:id` - Supprimer une séance
- ✅ Middleware `@require_auth` pour sécuriser les routes
- ✅ Recalcul automatique de l'XP total après synchronisation

#### Frontend
- ✅ Module `sync.js` avec toutes les fonctions de synchronisation
- ✅ Synchronisation automatique au démarrage (toutes les 5 min)
- ✅ Synchronisation après connexion
- ✅ Synchronisation après inscription
- ✅ Synchronisation après fin de séance
- ✅ Détection automatique online/offline
- ✅ Conservation des données locales lors de la déconnexion

### 🔧 Correctifs

#### Problème : XP revient à 0 après déconnexion
**Avant** :
```javascript
async logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('offline_mode');
  await Storage.clear('user');  // ❌ Supprime tout !
}
```

**Après** :
```javascript
async logout() {
  const user = await this.getCurrentUser();
  localStorage.removeItem('auth_token');
  localStorage.removeItem('offline_mode');

  if (user) {
    user.isOffline = true;
    await Storage.save('user', user);  // ✅ Conserve les données
  }
}
```

#### Problème : Données serveur écrasent les données locales
**Avant** :
```javascript
async login(username, password) {
  // ...
  await Storage.save('user', {
    level: data.user.level || 1,        // ❌ XP serveur = 0
    totalXP: data.user.total_xp || 0,   // ❌ Écrase local
  });
}
```

**Après** :
```javascript
async login(username, password) {
  // ...
  const localUser = await this.getCurrentUser();
  const localXP = localUser?.totalXP || 0;

  const serverXP = data.user.total_xp || 0;
  const finalXP = Math.max(localXP, serverXP);  // ✅ Garde le max

  await Storage.save('user', {
    level: finalLevel,
    totalXP: finalXP,  // ✅ Conserve le meilleur
  });
}
```

### 📂 Fichiers modifiés

#### Backend
- `backend/app.py` - Ajout modèle Workout + routes sync
- `backend/requirements.txt` - Ajout python-dateutil

#### Frontend
- `frontend/js/sync.js` - **NOUVEAU** Module de synchronisation
- `frontend/js/auth.js` - Conservation données + fusion XP
- `frontend/js/app.js` - Appels de synchronisation
- `frontend/index.html` - Chargement de sync.js
- `frontend/service-worker.js` - Cache v2.6 avec sync.js

### 🔄 Flux de synchronisation

```
┌─────────────────┐
│  Inscription    │
│  ou Connexion   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Sync.syncAll() │
└────────┬────────┘
         │
         ├─► Sync workouts locaux → Serveur
         │   (évite les doublons par startTime)
         │
         └─► Sync profil (niveau, XP) → Serveur
             (garde le max entre local et serveur)
```

### 💾 Structure de données

#### Workout (Backend)
```python
class Workout(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.uuid'))
    date = db.Column(db.DateTime)
    start_time = db.Column(db.BigInteger)  # timestamp
    end_time = db.Column(db.BigInteger)
    duration = db.Column(db.Integer)  # ms
    total_xp = db.Column(db.Integer)
    exercises_json = db.Column(db.Text)  # JSON stringifié
```

#### Workout (Frontend IndexedDB)
```javascript
{
  id: 1234567890,  // timestamp
  date: "2026-01-14T10:30:00.000Z",
  startTime: 1234567890,
  endTime: 1234567900,
  duration: 10000,  // ms
  totalXP: 150,
  exercises: [
    {
      id: 'bench-press',
      name: 'Développé couché',
      category: 'chest',
      type: 'weight',
      sets: [
        { weight: 50, reps: 10, xp: 60 }
      ]
    }
  ]
}
```

### 🔑 Points clés

1. **Offline-First** : Les données locales sont la source de vérité
2. **Pas de perte de données** : La déconnexion conserve tout
3. **Fusion intelligente** : Le max entre local et serveur est gardé
4. **Pas de doublons** : Les workouts déjà synchronisés sont ignorés
5. **Graceful degradation** : Fonctionne hors ligne sans erreur

### 🚀 Prochaines étapes

- [ ] Page Historique des séances
- [ ] Pull-to-refresh pour synchroniser manuellement
- [ ] Badge "Non synchronisé" sur les workouts locaux
- [ ] Résolution de conflits avancée (timestamps)
- [ ] Background sync (API Service Worker)

### 📖 Documentation

Voir [SYNC_TEST.md](./SYNC_TEST.md) pour le guide de test complet.
