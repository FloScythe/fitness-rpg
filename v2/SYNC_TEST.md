# 🔄 Guide de test Synchronisation

## 📋 Prérequis

1. Installer la nouvelle dépendance backend :
```bash
cd v2/backend
source venv/bin/activate
pip install python-dateutil==2.8.2
```

2. Redémarrer les serveurs :
```bash
cd v2
./start.sh
```

## 🧪 Tests de synchronisation

### Test 1 : Mode hors ligne puis connexion

1. **Ouvre l'app en mode hors ligne**
   - Clique "Continuer hors ligne"
   - Nom : `testoffline`

2. **Fais une séance**
   - Ajoute un exercice (ex: Développé couché)
   - Ajoute 3 séries (ex: 50kg × 10 reps)
   - Termine la séance
   - **Vérifie** : Tu gagnes de l'XP et le niveau augmente

3. **Déconnecte-toi**
   - Clique sur le bouton déconnexion
   - **Vérifie** : Tu reviens à l'écran de connexion
   - **IMPORTANT** : Ton XP est conservé localement

4. **Crée un compte**
   - Clique "Inscription"
   - Username: `testoffline`, Email: `test@offline.com`, Password: `test123`
   - Clique "Créer mon compte"
   - **Vérifie** : Le compte est créé ET ton XP local est conservé

5. **Ouvre la console du navigateur**
   - Regarde les logs de synchronisation
   - Tu devrais voir : `🔄 Auto-sync démarrée...`
   - Puis : `✅ X workouts synchronisés`
   - Et : `✅ Profil synchronisé`

6. **Déconnecte-toi et reconnecte-toi**
   - Déconnexion
   - Connexion avec `testoffline` / `test123`
   - **Vérifie** : Ton XP est toujours là !

---

### Test 2 : Inscription classique avec synchronisation

1. **Crée un nouveau compte**
   - Username: `user1`, Email: `user1@test.com`, Password: `test123`

2. **Fais 2 séances**
   - Séance 1 : Pectoraux (3 exercices)
   - Séance 2 : Jambes (3 exercices)
   - **Vérifie après chaque séance** : Console montre `🔄 Sync post-workout`

3. **Déconnecte-toi et reconnecte-toi**
   - **Vérifie** : Tes 2 séances et ton XP sont préservés

---

### Test 3 : Multi-appareils (Desktop + Mobile)

1. **Sur Desktop**
   - Crée un compte : `multitest` / `multi@test.com` / `test123`
   - Fais 1 séance
   - Note ton XP total

2. **Sur Mobile** (même réseau WiFi)
   - Ouvre `http://192.168.1.98:8000` (ton IP locale)
   - Connecte-toi avec `multitest` / `test123`
   - **Vérifie** : Ton XP est là !
   - Fais une autre séance
   - Déconnecte-toi

3. **Retour sur Desktop**
   - Déconnecte + Reconnecte
   - **Vérifie** : L'XP des deux séances est synchronisé

---

## 🔍 Vérifications console

Ouvre les DevTools (F12) et regarde les logs :

### Au démarrage (si connecté)
```
🚀 Initialisation de FitnessRPG v2...
🔄 Auto-sync démarrée...
✅ X workouts synchronisés
✅ Profil synchronisé
✅ Synchronisation complète terminée
```

### Après une séance
```
🏁 Début finishWorkout
✅ Workout sauvegardé
👤 User récupéré
💾 Sauvegarde user...
✅ User sauvegardé
🔄 Début synchronisation complète...
✅ X séances synchronisées
✅ Profil synchronisé
```

### En mode hors ligne
```
⚠️ Sync ignorée (hors ligne ou non connecté)
```

---

## ✅ Comportements attendus

### Synchronisation automatique
- **Au démarrage** : Si connecté et dernière sync > 5 min
- **Après connexion** : Toujours
- **Après inscription** : Toujours
- **Après une séance** : Toujours (si connecté)

### Conservation des données
- **Déconnexion** : Les données locales sont CONSERVÉES
- **Reconnexion** : Les données sont synchronisées avec le serveur
- **Conflit XP** : Le maximum entre local et serveur est gardé

### Mode hors ligne
- Tu peux travailler sans connexion
- Les données sont stockées localement
- À la prochaine connexion, tout est synchronisé

---

## 🐛 Problèmes possibles

### La synchronisation ne se déclenche pas
**Cause** : Pas de token ou mode offline_mode
**Solution** : Vérifie localStorage dans DevTools → Application → Local Storage

### Erreur 401 (Unauthorized)
**Cause** : Token expiré ou invalide
**Solution** : Déconnecte + Reconnecte

### Workouts pas synchronisés
**Cause** : Les workouts existent déjà côté serveur (même startTime)
**Solution** : C'est normal ! Pas de doublons

### XP revient à 0
**Cause** : Ce bug est maintenant CORRIGÉ
**Solution** : Si ça arrive encore, ouvre une issue avec les logs console

---

## 📊 Vérifier la base de données

Si tu veux voir les données synchronisées côté serveur :

```bash
cd v2/backend
source venv/bin/activate
python3

# Dans Python :
from app import app, db, User, Workout
with app.app_context():
    # Voir tous les users
    users = User.query.all()
    for u in users:
        print(f"User: {u.username}, Level: {u.level}, XP: {u.total_xp}")

    # Voir tous les workouts
    workouts = Workout.query.all()
    for w in workouts:
        print(f"Workout {w.id}: {w.total_xp} XP, User: {w.user_uuid}")
```

---

## 🎉 Résultat attendu

Après ces tests :
- ✅ Les workouts sont sauvegardés localement ET sur le serveur
- ✅ L'XP est toujours conservé (déconnexion/reconnexion)
- ✅ Tu peux travailler hors ligne et synchroniser plus tard
- ✅ Multi-appareils fonctionne (même compte sur Desktop + Mobile)
- ✅ Pas de perte de données
