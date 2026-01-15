# 🧪 Comptes de test

## Comptes pré-configurés

Pour faciliter les tests, voici des comptes que vous pouvez créer rapidement :

### Compte Alpha Tester
```
Username: alpha
Email: alpha@fitnessrpg.test
Password: Alpha123!
```

### Compte Demo
```
Username: demo
Email: demo@fitnessrpg.test
Password: Demo123!
```

### Compte Test Simple
```
Username: test
Email: test@test.com
Password: test123
```

## Scénarios de test

### 🏋️ Scénario 1 : Push Day (20 min)

**Exercices suggérés :**
1. Développé Couché (Bench Press)
   - Échauffement: 40kg × 15
   - Série 1: 60kg × 12
   - Série 2: 70kg × 10
   - Série 3: 80kg × 8

2. Développé Incliné
   - Série 1: 50kg × 12
   - Série 2: 60kg × 10
   - Série 3: 65kg × 8

3. Dips
   - Série 1: Poids du corps × 12
   - Série 2: Poids du corps × 10
   - Série 3: Poids du corps × 8

**XP attendu :** ~1500-2000 XP

### 🦵 Scénario 2 : Leg Day (25 min)

**Exercices suggérés :**
1. Squat Barre
   - Échauffement: 50kg × 15
   - Série 1: 80kg × 12
   - Série 2: 100kg × 10
   - Série 3: 120kg × 8
   - Série 4: 140kg × 6

2. Presse à Cuisses
   - Série 1: 150kg × 15
   - Série 2: 180kg × 12
   - Série 3: 200kg × 10

**XP attendu :** ~2500-3000 XP

### 🏃 Scénario 3 : Quick Session (10 min)

**Exercice unique :**
1. Tractions (Pull-ups)
   - Série 1: Poids du corps × 10
   - Série 2: Poids du corps × 8
   - Série 3: Poids du corps × 6
   - Série 4: Poids du corps × 4

**XP attendu :** ~600-800 XP

### 💪 Scénario 4 : Full Body (40 min)

**Programme complet :**
1. Soulevé de Terre (Deadlift) - 4 séries
2. Développé Couché - 4 séries
3. Tractions - 3 séries
4. Squat Barre - 4 séries
5. Développé Militaire (OHP) - 3 séries

**XP attendu :** ~4000-5000 XP

## 🎯 Progression RPG

### Niveau 1 → 2
- XP requis : 283 XP
- Équivalent : ~1 séance courte

### Niveau 2 → 3
- XP requis : 520 XP
- Équivalent : ~2-3 séances courtes

### Niveau 3 → 4
- XP requis : 800 XP
- Équivalent : ~3-4 séances courtes

### Niveau 4 → 5
- XP requis : 1118 XP
- Équivalent : ~4-5 séances courtes

## 📊 Valeurs de test extrêmes

### Tester les limites basses
```
Poids: 0.5 kg
Reps: 1
RPE: 6
```

### Tester les limites hautes
```
Poids: 300 kg
Reps: 50
RPE: 10
```

### Tester des valeurs invalides
```
Poids: -10 kg (devrait être rejeté)
Reps: 0 (devrait être rejeté)
Poids: abc (devrait être rejeté)
```

## 🔄 Tests de synchronisation

### Test 1 : Sync normale
1. Se connecter avec un compte
2. Créer une séance
3. Vérifier dans les logs backend : `POST /api/sync/push`
4. Vérifier que la réponse est `200 OK`

### Test 2 : Sync après reconnexion
1. Créer un compte et une séance
2. Se déconnecter (cliquer sur "Déconnexion")
3. Créer une autre séance (mode offline)
4. Se reconnecter
5. Vérifier que les 2 séances apparaissent dans l'historique

### Test 3 : Multi-device (avancé)
1. Se connecter sur le navigateur Desktop
2. Créer une séance
3. Se connecter sur mobile avec le même compte
4. Vérifier que la séance apparaît

## 📱 Tests mobile

### Installation PWA
1. Ouvrir sur Chrome mobile
2. Menu → "Ajouter à l'écran d'accueil"
3. Vérifier que l'icône apparaît
4. Lancer depuis l'icône (mode standalone)

### Orientation
- Tester en mode portrait ✓
- Tester en mode paysage ✓
- Vérifier que l'interface s'adapte

### Touch
- Tester les boutons tactiles
- Vérifier le scroll
- Tester le slider RPE

## 🐛 Tests de régression

### Checklist avant release

- [ ] Inscription fonctionne
- [ ] Connexion fonctionne
- [ ] Déconnexion fonctionne
- [ ] Mode offline fonctionne
- [ ] Création de séance
- [ ] Ajout d'exercice
- [ ] Ajout de série
- [ ] Série d'échauffement
- [ ] Slider RPE
- [ ] Chronomètre de repos
- [ ] Terminer séance
- [ ] Calcul XP correct
- [ ] Calcul volume correct
- [ ] Dashboard mis à jour
- [ ] Historique affiché
- [ ] Sync backend
- [ ] Navigation router
- [ ] Notifications (toasts)

## 💾 Données de test SQL

Si vous voulez insérer des données directement dans la DB :

```sql
-- Créer un utilisateur de test avec XP
INSERT INTO users (uuid, username, email, password_hash, total_xp, current_level)
VALUES (
  'test-user-uuid',
  'power_lifter',
  'power@test.com',
  '$argon2id$v=19$m=65536,t=3,p=4$...',  -- Hash de "Power123!"
  5000,
  5
);

-- Créer une séance de test
INSERT INTO workouts (uuid, user_id, name, workout_date, total_volume, xp_earned, is_completed)
VALUES (
  'workout-test-uuid',
  1,
  'Push Day Test',
  datetime('now'),
  2500.0,
  3750,
  1
);
```

---

**Note :** Ces comptes sont à créer manuellement via l'interface pour tester le workflow complet.
