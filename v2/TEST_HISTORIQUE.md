# 🧪 Guide de test - Historique et Synchronisation

## 🔧 Correctifs appliqués

### Problème 1 : Workouts non synchronisés lors de la reconnexion
**Solution** : La fonction `syncAll()` récupère maintenant les workouts depuis le serveur et les fusionne avec les workouts locaux.

### Problème 2 : XP et niveau non mis à jour après suppression
**Solution** :
- La suppression côté serveur recalcule automatiquement l'XP et le niveau
- La suppression côté client recalcule également l'XP et le niveau localement
- Les données sont synchronisées entre client et serveur

---

## 📝 Tests à effectuer

### Test 1 : Synchronisation des workouts depuis le serveur

**Objectif** : Vérifier que les workouts créés sur un appareil sont visibles sur un autre appareil.

1. **Sur l'ordinateur** :
   - Connecte-toi avec un compte (ex: `multitest` / `test123`)
   - Fais 2 séances d'entraînement
   - Note le nombre de séances et l'XP total

2. **Sur le mobile** (ou un autre navigateur) :
   - Ouvre l'app et connecte-toi avec le même compte
   - Va dans "Historique des séances"
   - **Vérifie** : Les 2 séances sont bien affichées
   - **Vérifie** : L'XP total correspond
   - **Vérifie** : Le nombre de "Jours de suite" est correct

3. **Retour sur l'ordinateur** :
   - Fais une nouvelle séance
   - Déconnecte + Reconnecte
   - **Vérifie** : La nouvelle séance apparaît dans l'historique

---

### Test 2 : Suppression d'une séance

**Objectif** : Vérifier que la suppression met à jour l'XP et le niveau partout.

1. **Depuis l'Historique** :
   - Va dans "Historique des séances"
   - Note l'XP total affiché en haut (ex: 350 XP)
   - Clique sur "Voir les détails" d'une séance (ex: 150 XP)
   - Clique sur "Supprimer cette séance"
   - Confirme la suppression

2. **Vérifications immédiates** :
   - **Vérifie** : La séance n'apparaît plus dans l'historique
   - **Vérifie** : L'XP total dans l'historique est mis à jour (350 - 150 = 200 XP)
   - Retourne au Dashboard
   - **Vérifie** : L'XP sur le Dashboard est bien 200 XP
   - **Vérifie** : Le niveau est recalculé (200 XP = niveau 3)

3. **Vérification multi-appareils** :
   - Sur un autre appareil/navigateur
   - Connecte-toi avec le même compte
   - **Vérifie** : La séance supprimée n'apparaît pas
   - **Vérifie** : L'XP et le niveau sont corrects

---

### Test 3 : Déconnexion et reconnexion

**Objectif** : Vérifier que toutes les données persistent.

1. **Avec des workouts existants** :
   - Assure-toi d'avoir au moins 3 séances dans l'historique
   - Note le nombre exact de séances
   - Note l'XP total
   - Note le niveau
   - Note les "Jours de suite"

2. **Déconnexion** :
   - Clique sur le bouton de déconnexion
   - Attends l'écran de connexion

3. **Reconnexion** :
   - Reconnecte-toi avec les mêmes identifiants
   - Attends la synchronisation (vérifie les logs console : F12)
   - **Vérifie** : Dashboard affiche le bon nombre de séances
   - **Vérifie** : Dashboard affiche le bon XP total
   - **Vérifie** : Dashboard affiche le bon niveau
   - **Vérifie** : Dashboard affiche les bons "Jours de suite"
   - Va dans "Historique des séances"
   - **Vérifie** : Toutes les séances sont là

---

### Test 4 : Mode hors ligne puis connexion

**Objectif** : Vérifier que les données hors ligne sont bien synchronisées.

1. **Mode hors ligne** :
   - Si connecté, déconnecte-toi
   - Clique "Continuer hors ligne"
   - Nom : `offlinetest`
   - Fais 2 séances

2. **Créer un compte** :
   - Déconnecte-toi
   - Clique "Inscription"
   - Username : `offlinetest`, Email : `offline@test.com`, Password : `test123`
   - **Vérifie** : Tes 2 séances sont toujours là
   - **Vérifie** : L'XP est conservé

3. **Vérification serveur** :
   - Vérifie les logs console (F12)
   - Tu devrais voir : `✅ 2 workouts synchronisés`
   - Déconnecte + Reconnecte
   - **Vérifie** : Les 2 séances sont toujours là

---

## 🔍 Logs à surveiller

Ouvre la console du navigateur (F12) et vérifie ces messages :

### Lors de la connexion
```
🔄 Auto-sync démarrée...
✅ X workouts synchronisés
✅ X workouts récupérés
📥 Workout XXXX récupéré du serveur  (si des workouts existent sur le serveur)
✅ Profil synchronisé
✅ Synchronisation complète terminée
```

### Lors de la suppression
```
✅ Workout supprimé du serveur
✅ XP recalculé: XXX, Niveau: X
```

---

## ✅ Résultat attendu

Après ces tests :
- ✅ Les workouts sont synchronisés entre appareils
- ✅ La déconnexion/reconnexion conserve toutes les données
- ✅ La suppression met à jour l'XP et le niveau partout
- ✅ Le nombre de séances est toujours correct
- ✅ Les "Jours de suite" sont calculés correctement
- ✅ L'historique affiche toutes les séances
- ✅ Aucune perte de données

---

## 🐛 En cas de problème

### Les workouts n'apparaissent pas après reconnexion
1. Vérifie les logs console
2. Vérifie que la synchronisation s'est bien exécutée
3. Vérifie que tu es bien connecté (pas en mode hors ligne)

### L'XP n'est pas mis à jour après suppression
1. Vérifie que la suppression côté serveur a réussi (logs console)
2. Rafraîchis la page (Ctrl+Shift+R)
3. Retourne au Dashboard puis reviens à l'Historique

### Les stats Dashboard ne correspondent pas
1. Rafraîchis la page complètement (Ctrl+Shift+R)
2. Déconnecte + Reconnecte pour forcer une resynchronisation
3. Vérifie les logs console pour voir si la sync a fonctionné
