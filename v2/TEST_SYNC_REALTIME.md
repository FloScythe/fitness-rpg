# 🔄 Test Synchronisation Temps Réel

## 🎯 Correctif v2.9 - Synchronisation multi-appareils

### Problème identifié
Lorsque 2 appareils sont connectés avec le même compte :
- La dernière déconnexion écrasait les données de l'autre appareil
- Décalage entre XP Dashboard et XP Historique
- Pas de rafraîchissement automatique des données

### Solution implémentée

#### 1. **Synchronisation périodique automatique**
- Sync toutes les 30 secondes quand la page est visible
- Sync immédiate quand la page redevient visible (changement d'onglet)
- Arrêt automatique lors de la déconnexion

#### 2. **Rafraîchissement automatique**
- Dashboard : Met à jour niveau, XP, stats sans recharger la page
- Historique : Met à jour liste des séances et stats
- Pas de rechargement complet = expérience fluide

#### 3. **Détection de changements**
- Fusion intelligente des données locales et serveur
- Toujours garde le maximum entre local et serveur
- Évite les pertes de données

---

## 🧪 Tests à effectuer

### Test 1 : Synchronisation multi-appareils en temps réel

**Matériel nécessaire** : 2 appareils (ordinateur + mobile) ou 2 navigateurs

1. **Sur l'ordinateur** :
   - Connecte-toi avec un compte (ex: `multitest`)
   - Note l'XP actuel
   - Laisse la page ouverte sur le Dashboard

2. **Sur le mobile** :
   - Connecte-toi avec le même compte
   - Attends 30 secondes (première sync)
   - **Vérifie** : Les données correspondent à l'ordinateur

3. **Sur le mobile** :
   - Fais une séance d'entraînement (ex: 100 XP)
   - Termine la séance
   - **Vérifie** : L'XP est mis à jour sur le mobile

4. **Sur l'ordinateur** :
   - Attends maximum 30 secondes
   - **Vérifie** : Le Dashboard se rafraîchit automatiquement
   - **Vérifie** : L'XP est maintenant à jour (+100 XP)
   - **Vérifie** : Le niveau est recalculé si nécessaire
   - Va dans "Historique des séances"
   - **Vérifie** : La nouvelle séance apparaît

5. **Logs console attendus** (F12) :
```
🔄 Sync périodique...
✅ 1 workouts récupérés
📥 Workout 1737654321 récupéré du serveur
✅ Profil synchronisé
✅ Synchronisation complète terminée
```

---

### Test 2 : Détection changement d'onglet

1. **Connexion** :
   - Connecte-toi sur l'ordinateur
   - Va sur un autre onglet (Google, YouTube, etc.)
   - Attends 10 secondes

2. **Sur mobile** :
   - Fais une séance
   - Termine-la

3. **Retour sur l'onglet FitnessRPG** :
   - Clique sur l'onglet FitnessRPG
   - **Vérifie** : Message console `🔄 Page visible - sync...`
   - **Vérifie** : Dashboard rafraîchi automatiquement
   - **Vérifie** : Nouvelle séance visible

---

### Test 3 : Synchronisation Dashboard ↔ Historique

1. **Dashboard** :
   - Reste sur le Dashboard
   - Note l'XP total

2. **Sur un autre appareil** :
   - Supprime une séance dans l'Historique

3. **Retour sur Dashboard** (premier appareil) :
   - Attends 30 secondes
   - **Vérifie** : XP mis à jour automatiquement
   - **Vérifie** : Niveau recalculé
   - **Vérifie** : Nombre de séances mis à jour

4. **Va dans Historique** :
   - Clique sur "Historique des séances"
   - **Vérifie** : La séance supprimée n'apparaît pas
   - **Vérifie** : Stats de l'historique correctes
   - **Vérifie** : Cohérence entre Dashboard et Historique

---

### Test 4 : Déconnexion/Reconnexion

1. **Avec sync active** :
   - Vérifie que la sync tourne (logs console toutes les 30s)
   - Clique sur Déconnexion
   - **Vérifie** : Message console `Sync périodique arrêtée` (si ajouté)

2. **Reconnexion** :
   - Reconnecte-toi
   - **Vérifie** : Message console `🔄 Sync périodique...`
   - **Vérifie** : Sync démarre automatiquement
   - Attends 30 secondes
   - **Vérifie** : Un nouveau message `🔄 Sync périodique...`

---

### Test 5 : Cohérence XP Dashboard vs Historique

**Objectif** : S'assurer qu'il n'y a plus de décalage

1. **Dashboard** :
   - Note l'XP total affiché (ex: 450 XP)

2. **Historique** :
   - Va dans "Historique des séances"
   - Note l'XP total affiché en haut
   - **Vérifie** : Les deux valeurs sont identiques

3. **Après une séance** :
   - Retourne au Dashboard
   - Fais une séance (ex: 50 XP)
   - Termine-la
   - **Vérifie** : Dashboard affiche 500 XP
   - Va dans Historique
   - **Vérifie** : Historique affiche 500 XP

4. **Après suppression** :
   - Depuis l'Historique, supprime une séance (ex: 100 XP)
   - **Vérifie** : Historique affiche 400 XP
   - Retourne au Dashboard
   - **Vérifie** : Dashboard affiche 400 XP
   - **Vérifie** : Niveau recalculé (400 XP = niveau 5)

---

## 📊 Vérifications console

### Logs normaux (toutes les 30 secondes)
```
🔄 Sync périodique...
✅ 0 workouts synchronisés (ou X si nouveaux)
✅ X workouts récupérés
✅ Profil synchronisé
✅ Synchronisation complète terminée
```

### Logs changement d'onglet
```
🔄 Page visible - sync...
✅ X workouts synchronisés
✅ X workouts récupérés
📥 Workout 1737654321 récupéré du serveur
✅ Profil synchronisé
✅ Synchronisation complète terminée
```

### Logs après séance
```
✅ Workout sauvegardé
✅ User sauvegardé
🔄 Début synchronisation complète...
✅ 1 workouts synchronisés
✅ Profil synchronisé
✅ Synchronisation complète terminée
```

---

## ✅ Résultats attendus

Après ces tests, tu devrais constater :
- ✅ **Multi-appareils** : Les changements sur un appareil apparaissent sur l'autre en 30 secondes max
- ✅ **Cohérence** : XP Dashboard = XP Historique toujours
- ✅ **Pas de perte** : Aucune donnée n'est écrasée ou perdue
- ✅ **Fluidité** : Rafraîchissement sans rechargement de page
- ✅ **Automatique** : Tout se fait sans intervention manuelle
- ✅ **Efficace** : Sync seulement quand la page est visible

---

## 🔧 Fonctionnalités techniques

### Synchronisation périodique
- **Intervalle** : 30 secondes
- **Condition** : Page visible ET connecté
- **Démarrage** : À la connexion/inscription
- **Arrêt** : À la déconnexion

### Détection visibilité
- **API** : `document.visibilitychange`
- **Comportement** : Sync immédiate quand l'onglet redevient actif
- **Économie** : Pas de sync en arrière-plan

### Rafraîchissement intelligent
- **Dashboard** : Met à jour niveau, XP, barre de progression, stats
- **Historique** : Recharge liste des séances + stats
- **Pas de reload** : Utilise DOM manipulation directe

---

## 🐛 Problèmes possibles

### Sync ne démarre pas
**Solution** : Vérifie dans la console que `Sync.startPeriodicSync()` est appelé après connexion

### Pas de rafraîchissement
**Solution** : Vérifie que `App.currentPage` est bien défini ('dashboard' ou 'history')

### Logs d'erreur
**Solution** : Vérifie que le backend est lancé et accessible

### Décalage persiste
**Solution** : Rafraîchis complètement la page (Ctrl+Shift+R) pour vider le cache
