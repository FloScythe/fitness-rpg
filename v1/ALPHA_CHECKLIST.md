# ✅ Checklist Alpha Test - FitnessRPG

## 🎯 Objectif de l'alpha test

Valider le flux complet de l'application en conditions réelles avant le déploiement.

---

## 📋 Avant de commencer

### Installation
- [ ] Backend installé (dépendances Python)
- [ ] Frontend accessible
- [ ] Fichier `.env` configuré
- [ ] Base de données créée automatiquement
- [ ] Les deux serveurs démarrent sans erreur

### Vérifications techniques
- [ ] `http://localhost:5000/api/health` retourne `{"status": "online"}`
- [ ] `http://localhost:8000` charge l'interface
- [ ] Console navigateur (F12) : pas d'erreurs critiques
- [ ] Logs backend : application Flask démarrée

---

## 🧪 Tests fonctionnels

### 1. Authentification (10 min)

#### Inscription
- [ ] Page d'inscription accessible
- [ ] Formulaire avec username/email/password
- [ ] Validation des champs (requis, formats)
- [ ] Message d'erreur si username déjà pris
- [ ] Redirection vers dashboard après inscription
- [ ] JWT stocké dans localStorage
- [ ] Notification "Compte créé avec succès"

#### Connexion
- [ ] Page de connexion accessible
- [ ] Formulaire avec username/password
- [ ] Message d'erreur si mauvais credentials
- [ ] Redirection vers dashboard après connexion
- [ ] JWT stocké dans localStorage
- [ ] Notification "Connexion réussie"

#### Déconnexion
- [ ] Bouton de déconnexion dans le profil
- [ ] Confirmation demandée
- [ ] JWT supprimé
- [ ] Redirection vers page login/accueil

#### Mode offline
- [ ] Bouton "Continuer hors ligne" fonctionne
- [ ] Dashboard accessible sans compte
- [ ] Données stockées localement (IndexedDB)

---

### 2. Création de séance (15 min)

#### Démarrage automatique
- [ ] Cliquer sur un exercice démarre une séance
- [ ] Notification "Séance démarrée automatiquement"
- [ ] Redirection vers page workout-active
- [ ] Titre de la séance affiché (ex: "Séance 13/01/2026")

#### Interface workout-active
- [ ] En-tête avec nom de la séance
- [ ] Compteur d'exercices
- [ ] Volume total affiché (initialement 0 kg)
- [ ] Durée en temps réel (mise à jour)
- [ ] Section exercice en cours visible
- [ ] Formulaire d'ajout de série présent

---

### 3. Ajout d'exercices (10 min)

#### Sélection
- [ ] Liste d'exercices chargée (17 exercices par défaut)
- [ ] Exercices triés par catégorie
- [ ] Badge XP multiplier affiché
- [ ] Clic sur exercice l'ajoute à la séance
- [ ] Notification "Exercice ajouté"

#### Filtres (optionnel)
- [ ] Barre de recherche fonctionne
- [ ] Filtres par catégorie (Push, Pull, Legs, Core)
- [ ] Résultats filtrés en temps réel

#### Multiple exercices
- [ ] Possibilité d'ajouter plusieurs exercices
- [ ] Liste des exercices de la séance affichée
- [ ] Exercice actif marqué visuellement

---

### 4. Ajout de séries (20 min) **CRITIQUE**

#### Formulaire
- [ ] Champ "Poids (kg)" présent et fonctionnel
- [ ] Champ "Répétitions" présent et fonctionnel
- [ ] Slider RPE présent (6-10)
- [ ] Valeur RPE affichée en temps réel
- [ ] Bouton "Ajouter la série" visible
- [ ] Bouton "Échauffement" (emoji feu) visible

#### Ajout de série
- [ ] Saisir 60kg × 10 reps
- [ ] Cliquer sur "Ajouter la série"
- [ ] Série apparaît dans la liste
- [ ] Volume calculé affiché (600 kg)
- [ ] Numéro de série correct (#1, #2, #3...)
- [ ] Formulaire réinitialisé après ajout

#### Série d'échauffement
- [ ] Cliquer sur bouton échauffement (🔥)
- [ ] Bouton change de couleur (warning)
- [ ] Ajouter une série (ex: 40kg × 15)
- [ ] Badge "Échauffement" affiché sur la série
- [ ] Série d'échauffement ne compte pas dans le volume total

#### RPE (Rate of Perceived Exertion)
- [ ] Slider se déplace de 6.0 à 10.0
- [ ] Valeur affichée change en temps réel
- [ ] RPE enregistré avec la série
- [ ] RPE affiché dans la liste des séries

#### Personal Record (Boss Battle)
- [ ] Ajouter une série avec poids record
- [ ] Badge "🏆 PR!" affiché si c'est un record
- [ ] Animation visuelle (pulse)
- [ ] Notification spéciale (optionnel)

---

### 5. Chronomètre de repos (10 min) **CRITIQUE**

#### Démarrage automatique
- [ ] Chronomètre démarre après ajout de série
- [ ] Timer affiché en bas de l'écran
- [ ] Temps par défaut : 90 secondes
- [ ] Barre de progression visible

#### Contrôles
- [ ] Bouton pause/reprise fonctionne
- [ ] Bouton "+30s" ajoute du temps
- [ ] Bouton stop arrête le timer
- [ ] Timer disparaît après fin

#### Fin du timer
- [ ] Notification "Repos terminé !"
- [ ] Vibration (si supportée)
- [ ] Son (optionnel)
- [ ] Timer disparaît automatiquement

---

### 6. Terminer la séance (15 min) **CRITIQUE**

#### Bouton terminer
- [ ] Bouton vert "Terminer la séance" visible
- [ ] Confirmation demandée (optionnel)
- [ ] Calculs effectués (volume, XP, durée)

#### Calculs automatiques
- [ ] Volume total correct (somme de toutes les séries)
- [ ] XP calculé (volume × multiplicateur)
- [ ] Durée calculée (en minutes)
- [ ] Niveau mis à jour si XP suffisant

#### Redirection
- [ ] Redirection vers dashboard
- [ ] Notification avec XP gagné
- [ ] Message de félicitations

#### Persistence
- [ ] Séance enregistrée dans IndexedDB
- [ ] Séance visible dans l'historique
- [ ] Données synchronisées avec backend (si connecté)

---

### 7. Annuler la séance (5 min)

#### Bouton annuler
- [ ] Bouton rouge (X) visible
- [ ] Confirmation demandée
- [ ] Message "Voulez-vous vraiment annuler ?"

#### Annulation
- [ ] Séance supprimée d'IndexedDB
- [ ] Exercices et séries supprimés
- [ ] Redirection vers dashboard
- [ ] Notification "Séance annulée"
- [ ] Aucun XP gagné

---

### 8. Dashboard (10 min)

#### Informations utilisateur
- [ ] Username affiché
- [ ] Niveau actuel affiché
- [ ] XP total affiché
- [ ] Barre de progression XP
- [ ] Pourcentage vers prochain niveau

#### Statistiques
- [ ] Nombre de séances totales
- [ ] XP total
- [ ] Volume total (optionnel)

#### Séances récentes
- [ ] 5 dernières séances affichées
- [ ] Date, nom, volume, XP pour chaque séance
- [ ] Ordre chronologique inversé (plus récent en haut)
- [ ] Message si aucune séance

#### Actions rapides
- [ ] Bouton "Nouvelle Séance" fonctionne
- [ ] Bouton "Historique" fonctionne

---

### 9. Historique (10 min)

#### Liste des séances
- [ ] Toutes les séances affichées
- [ ] Tri par date (plus récent en haut)
- [ ] Card par séance avec :
  - [ ] Nom de la séance
  - [ ] Date formatée (fr-FR)
  - [ ] Badge "Terminée" ou "En cours"
  - [ ] Volume total (kg)
  - [ ] XP gagné
  - [ ] Durée (min)

#### Détails séance (optionnel)
- [ ] Clic sur séance ouvre les détails
- [ ] Liste des exercices effectués
- [ ] Liste des séries par exercice

#### État vide
- [ ] Message si aucune séance
- [ ] Bouton "Commencer une séance"

---

### 10. Profil (5 min)

#### Informations
- [ ] Avatar (initiale du username)
- [ ] Username affiché
- [ ] Niveau affiché
- [ ] Status connexion (connecté/hors ligne)

#### Actions
- [ ] Bouton "Synchroniser" (si connecté)
- [ ] Bouton "Déconnexion" (si connecté)
- [ ] Bouton "Se connecter" (si hors ligne)
- [ ] Bouton "Paramètres" (optionnel)

---

### 11. Synchronisation (15 min) **IMPORTANT**

#### Sync automatique (connecté)
- [ ] Séance ajoutée à la queue de sync
- [ ] POST `/api/sync/push` appelé
- [ ] Réponse 200 OK
- [ ] Logs backend confirment la sync

#### Sync manuelle
- [ ] Bouton "Synchroniser" dans profil
- [ ] Notification "Synchronisation en cours..."
- [ ] Notification "Synchronisation réussie"
- [ ] Erreur gérée si serveur inaccessible

#### Mode offline puis reconnexion
- [ ] Créer séance hors ligne
- [ ] Se déconnecter du réseau (mode avion)
- [ ] Séance stockée localement
- [ ] Se reconnecter
- [ ] Sync automatique
- [ ] Séance apparaît sur le serveur

---

### 12. Navigation (5 min)

#### Bottom Navigation
- [ ] 4 onglets visibles (Accueil, Séance, Historique, Stats)
- [ ] Icônes claires
- [ ] Onglet actif mis en surbrillance
- [ ] Navigation fluide sans rechargement

#### Top Navigation
- [ ] Logo FitnessRPG affiché
- [ ] Bouton sync visible
- [ ] Bouton profil visible
- [ ] Actions fonctionnelles

#### Router
- [ ] URLs avec hash (#/dashboard, #/workout, etc.)
- [ ] Bouton retour navigateur fonctionne
- [ ] Changement de page sans rechargement (SPA)

---

### 13. Notifications (Toasts) (5 min)

#### Types de notifications
- [ ] Success (vert) : séance terminée, série ajoutée
- [ ] Info (bleu) : séance démarrée
- [ ] Warning (jaune) : mode offline
- [ ] Error (rouge) : erreur de connexion

#### Comportement
- [ ] Apparaît en haut de l'écran
- [ ] Disparaît automatiquement (3-5s)
- [ ] Plusieurs notifications empilées
- [ ] Clic pour fermer manuellement

---

### 14. Responsive Mobile (15 min)

#### Tailles d'écran
- [ ] Mobile (320px - 640px)
- [ ] Tablet (640px - 1024px)
- [ ] Desktop (1024px+)

#### Éléments UI
- [ ] Boutons suffisamment grands (touch-friendly)
- [ ] Textes lisibles
- [ ] Pas de scroll horizontal
- [ ] Navigation bottom visible sur mobile
- [ ] Formulaires adaptés

#### Orientation
- [ ] Portrait fonctionne
- [ ] Paysage fonctionne
- [ ] Pas de débordement

---

### 15. Performance (10 min)

#### Chargement initial
- [ ] Page charge en < 2 secondes
- [ ] Pas d'erreurs console
- [ ] Service Worker enregistré
- [ ] IndexedDB initialisée

#### Navigation
- [ ] Changement de page instantané
- [ ] Pas de lag visible
- [ ] Animations fluides

#### Opérations
- [ ] Ajout de série rapide (< 500ms)
- [ ] Calculs XP instantanés
- [ ] Sync backend < 1 seconde

---

### 16. PWA (Progressive Web App) (10 min)

#### Installation
- [ ] Prompt d'installation apparaît (mobile)
- [ ] Bouton "Ajouter à l'écran d'accueil"
- [ ] Icône créée sur l'écran d'accueil
- [ ] Manifest.json chargé

#### Mode standalone
- [ ] App s'ouvre en plein écran (sans barre navigateur)
- [ ] Splash screen affiché (optionnel)
- [ ] Toutes les fonctionnalités disponibles

#### Service Worker
- [ ] Enregistré sans erreur
- [ ] Cache les assets
- [ ] Mode offline fonctionne
- [ ] Mise à jour automatique

---

## 🐛 Tests de régression

### Cas limites

#### Valeurs extrêmes
- [ ] Poids : 0.5 kg fonctionne
- [ ] Poids : 500 kg fonctionne
- [ ] Reps : 1 fonctionne
- [ ] Reps : 100 fonctionne
- [ ] RPE : 6.0 min
- [ ] RPE : 10.0 max

#### Valeurs invalides
- [ ] Poids négatif rejeté
- [ ] Reps = 0 rejeté
- [ ] Champs vides bloquent la soumission
- [ ] Caractères non-numériques rejetés

#### Séance longue
- [ ] 10+ exercices fonctionnent
- [ ] 50+ séries fonctionnent
- [ ] Pas de ralentissement
- [ ] IndexedDB gère la charge

#### Reconnexion réseau
- [ ] Perte connexion pendant séance
- [ ] Notification mode offline
- [ ] Séance continue normalement
- [ ] Reconnexion sync automatique

---

## 📊 Résultats attendus

### XP et Niveaux

| Action | XP attendu |
|--------|-----------|
| Série 60kg × 10 (multiplier 1.5) | ~900 XP |
| Série 80kg × 8 (multiplier 1.5) | ~960 XP |
| Séance Push Day (3 exercices, 12 séries) | ~1500-2000 XP |
| Niveau 1 → 2 | 283 XP |
| Niveau 2 → 3 | 520 XP |

### Temps de réponse

| Opération | Temps max |
|-----------|-----------|
| Chargement initial | 2 secondes |
| Navigation entre pages | 100ms |
| Ajout de série | 500ms |
| Terminer séance | 1 seconde |
| Sync backend | 2 secondes |

---

## ✅ Validation finale

### Critères de succès

- [ ] **Flux complet** : inscription → séance → séries → terminer → historique fonctionne sans erreur
- [ ] **Mode offline** : application utilisable sans connexion
- [ ] **Synchronisation** : données sauvegardées sur le serveur
- [ ] **Calculs corrects** : XP, volume, niveau
- [ ] **Interface mobile** : utilisable sur téléphone
- [ ] **Performance** : pas de lag, navigation fluide
- [ ] **Aucun bug bloquant** : aucune erreur empêchant l'utilisation

### Bugs critiques (bloquants)

Liste des bugs qui empêchent l'utilisation :
- [ ] Aucun bug critique trouvé

### Bugs mineurs (non-bloquants)

Liste des bugs gênants mais contournables :
- [ ] ...

### Améliorations suggérées

Liste des fonctionnalités à ajouter :
- [ ] ...

---

## 📝 Notes de test

**Testeur :** ___________________
**Date :** ___________________
**Environnement :** Desktop / Mobile / Tablet
**Navigateur :** Chrome / Safari / Firefox
**OS :** iOS / Android / Windows / macOS

**Commentaires généraux :**

```
...
```

---

**✅ Alpha test terminé** : ___/___/___
