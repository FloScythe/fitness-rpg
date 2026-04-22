# Cahier des charges MVP - Application de suivi coach sportif

## 1. Vision du projet

L'application a pour objectif de faciliter le suivi sportif personnalise entre un coach et ses clients.

Le MVP doit permettre deux usages independants :

- Un client peut utiliser l'application seul pour creer ses seances, organiser son calendrier, renseigner ses performances et suivre son evolution.
- Un coach peut utiliser l'application seul pour creer des profils clients, planifier des seances, suivre des performances et organiser son activite.

Lorsque le client et le coach souhaitent travailler ensemble dans l'application, ils peuvent se lier via un code d'invitation ou un moyen similaire afin de partager certaines donnees sportives.

Pour le MVP, les informations medicales, les donnees confidentielles sensibles et l'acces d'un tiers professionnel sont exclus du perimetre. Ces sujets pourront etre etudies plus tard, lorsque le cadre juridique, technique et fonctionnel sera mieux maitrise.

## 2. Objectifs du MVP

Le MVP doit valider les usages essentiels suivants :

- Un utilisateur peut creer un compte avec un role : client ou coach.
- Un client peut creer son profil sportif.
- Un client peut creer ses propres seances.
- Un client peut organiser son calendrier.
- Un client peut renseigner ses performances apres une seance.
- Un client peut consulter son evolution.
- Un coach peut creer son profil professionnel.
- Un coach peut creer ou gerer des profils clients.
- Un coach peut creer des seances personnalisees pour un client.
- Un coach peut consulter les performances et l'historique des clients lies ou suivis.
- Un client et un coach peuvent se lier de facon optionnelle via un code d'invitation.
- L'application peut envoyer des notifications simples liees aux seances.

## 3. Utilisateurs cibles

### Client

Personne suivie dans un objectif sportif, de remise en forme, de performance, de reprise d'activite non medicalisee ou de progression physique.

Le client peut utiliser l'application sans coach. La liaison avec un coach est optionnelle.

### Coach

Professionnel qui accompagne plusieurs clients, cree des programmes, suit les performances et adapte les seances.

Le coach peut utiliser l'application sans que ses clients aient obligatoirement un compte actif. La liaison avec un compte client permet ensuite de partager les donnees.

### Tiers professionnel

Le tiers professionnel est exclu du MVP.

Cette fonctionnalite pourra etre etudiee dans une version future, avec un cadre specifique pour les permissions, la confidentialite et la responsabilite des donnees partagees.

## 4. Roles et permissions

### Client

Le client peut :

- Creer et modifier son profil.
- Renseigner ses objectifs.
- Renseigner ses particularites sportives : points forts, points faibles, preferences, contraintes d'entrainement non medicales.
- Creer ses propres seances.
- Consulter ses seances planifiees.
- Organiser son calendrier.
- Renseigner ses performances.
- Consulter son historique.
- Consulter son evolution.
- Saisir un code d'invitation coach, si souhaite.
- Accepter ou refuser une liaison avec un coach.
- Revoquer une liaison avec un coach.

### Coach

Le coach peut :

- Creer et modifier son profil professionnel.
- Renseigner ses diplomes ou certifications, si disponibles.
- Creer ou gerer des fiches clients.
- Inviter un client via un code ou un lien.
- Consulter la fiche des clients suivis ou lies.
- Creer des seances personnalisees.
- Planifier des seances dans le calendrier client.
- Consulter les performances renseignees par le client, si les comptes sont lies.
- Ajouter des notes de suivi sportif.
- Envoyer des notifications simples au client.

## 5. Fonctionnalites du MVP

### 5.1 Authentification

L'application doit permettre :

- La creation de compte par email et mot de passe.
- La connexion.
- La deconnexion.
- Le choix du role au moment de l'inscription : client ou coach.
- La recuperation du profil utilisateur apres connexion.

### 5.2 Profil client

Le profil client contient :

- Nom et prenom.
- Date de naissance, optionnel.
- Sexe, optionnel.
- Taille, optionnel.
- Poids, optionnel.
- Objectifs principaux.
- Niveau sportif.
- Points forts.
- Points faibles.
- Preferences d'entrainement.
- Contraintes d'organisation : disponibilites, materiel disponible, lieu d'entrainement.
- Notes sportives personnelles, optionnel.

Le MVP ne collecte pas d'informations medicales, de diagnostic, de pathologie, de blessure ou de donnee confidentielle sensible.

### 5.3 Profil coach

Le profil coach contient :

- Nom et prenom.
- Specialite.
- Diplomes ou certifications, optionnel.
- Description courte.
- Coordonnees professionnelles, optionnel.
- Liste des clients suivis ou lies.

### 5.4 Profil tiers

Le profil tiers est mis de cote pour le MVP.

Il pourra devenir une fonctionnalite future si le projet evolue vers un suivi professionnel plus large, avec des regles d'acces et de confidentialite adaptees.

### 5.5 Liaison coach-client

La liaison coach-client est optionnelle.

Le client et le coach peuvent utiliser l'application chacun de leur cote. La liaison sert uniquement lorsqu'ils souhaitent partager des donnees sportives dans l'application.

Le MVP doit permettre une liaison simple :

1. Le coach genere un code d'invitation.
2. Le client saisit le code dans l'application, si souhaite.
3. Le client accepte la liaison.
4. Le coach et le client sont relies.
5. Les donnees sportives autorisees deviennent partagees entre les deux comptes.

Une liaison peut avoir les statuts suivants :

- En attente.
- Acceptee.
- Refusee.
- Revoquee.

### 5.6 Liaison client-tiers

La liaison client-tiers est hors perimetre du MVP.

Elle pourra etre ajoutee dans une version future, apres clarification du cadre de responsabilite, des permissions et de la confidentialite.

### 5.7 Creation de seances

Une seance contient :

- Titre.
- Description.
- Date et heure prevues.
- Duree estimee.
- Objectif de la seance.
- Liste d'exercices.
- Notes sportives.
- Statut : planifiee, terminee, annulee.

Une seance peut etre creee :

- Par le client pour lui-meme.
- Par le coach pour un client suivi.
- Par le coach pour un client lie, avec partage visible cote client.

### 5.8 Exercices dans une seance

Chaque exercice contient :

- Nom de l'exercice.
- Series prevues.
- Repetitions prevues.
- Charge prevue, optionnel.
- Temps de repos, optionnel.
- Consigne technique, optionnel.

Pour le MVP, une bibliotheque complete d'exercices n'est pas obligatoire.
Le client ou le coach peut saisir les exercices manuellement.

### 5.9 Saisie des performances

Apres une seance, le client peut renseigner :

- Exercices realises.
- Series effectuees.
- Repetitions effectuees.
- Charge utilisee.
- Difficulte ressentie.
- Ressenti general.
- Commentaire libre sportif.
- Statut de la seance : realisee, partiellement realisee, non realisee.

Le MVP ne prevoit pas de champ medical, de niveau de douleur ou de suivi de blessure.

### 5.10 Calendrier

Le calendrier doit permettre :

- Au client de voir ses seances planifiees.
- Au client d'organiser ses propres seances.
- Au coach de voir les seances d'un client suivi ou lie.
- Au coach de planifier une seance.
- Au client de distinguer les seances a venir, realisees et annulees.

Pour le MVP, une vue mensuelle ou hebdomadaire simple suffit.

### 5.11 Notifications

Le MVP doit prevoir des notifications simples :

- Rappel de seance a venir.
- Notification lorsqu'un coach ajoute ou modifie une seance partagee.
- Notification lorsqu'un client renseigne une performance partagee.

Les notifications peuvent etre activees apres la validation des fonctionnalites principales.

### 5.12 Tableau de bord coach

Le coach doit avoir une vue simple avec :

- Liste des clients suivis ou lies.
- Prochaine seance de chaque client.
- Derniere performance renseignee.
- Alertes simples : seance non completee, absence de saisie, performance recente.

### 5.13 Tableau de bord client

Le client doit avoir une vue simple avec :

- Prochaine seance.
- Derniere seance realisee.
- Acces rapide au calendrier.
- Acces rapide a la creation de seance.
- Acces rapide a la saisie des performances.
- Resume de son evolution.

### 5.14 Vue tiers

La vue tiers est hors perimetre du MVP.

### 5.15 Mode freemium

Le MVP doit etre pense pour accueillir deux offres freemium independantes :

- Une experience client autonome.
- Une experience coach autonome.

Le paiement, l'abonnement et la facturation restent hors perimetre du MVP, mais l'application doit deja pouvoir distinguer les usages gratuits et les usages qui pourront devenir premium.

Exemples de limites possibles cote client :

- Nombre de seances creees.
- Nombre d'historiques visibles.
- Acces aux statistiques d'evolution avancees.

Exemples de limites possibles cote coach :

- Nombre de clients suivis.
- Nombre de seances planifiees.
- Acces aux notifications avancees.
- Acces aux statistiques detaillees par client.

Ces limites exactes devront etre confirmees avant le developpement de la logique premium.

## 6. Parcours utilisateurs principaux

### Parcours client

1. Le client cree son compte.
2. Il choisit le role client.
3. Il complete son profil sportif.
4. Il saisit le code d'invitation de son coach, optionnellement.
5. Il cree ses seances.
6. Il consulte ses seances.
7. Il organise son calendrier.
8. Il realise une seance.
9. Il renseigne ses performances.
10. Il consulte son evolution.

### Parcours coach

1. Le coach cree son compte.
2. Il choisit le role coach.
3. Il complete son profil professionnel.
4. Il genere une invitation client, si necessaire.
5. Il cree une seance personnalisee.
6. Il planifie la seance.
7. Il suit les performances du client.
8. Il adapte les prochaines seances.

### Parcours tiers

Le parcours tiers est exclu du MVP.

## 7. Ecrans MVP

### Ecrans communs

- Ecran d'accueil / connexion.
- Creation de compte.
- Choix du role.
- Profil utilisateur.
- Parametres.

### Ecrans client

- Tableau de bord client.
- Profil sportif.
- Calendrier.
- Creation / modification d'une seance.
- Detail d'une seance.
- Saisie de performance.
- Historique des seances.
- Evolution.
- Gestion de la liaison coach, optionnelle.

### Ecrans coach

- Tableau de bord coach.
- Liste des clients.
- Fiche client.
- Creation / modification d'une seance.
- Calendrier client.
- Detail des performances.
- Generation d'invitation.
- Profil professionnel avec diplomes ou certifications.

### Ecrans tiers

Les ecrans tiers sont hors perimetre du MVP.

## 8. Donnees principales

### User

- id
- email
- role
- created_at

### Profile

- id
- user_id
- first_name
- last_name
- avatar_url
- created_at
- updated_at

### ClientProfile

- id
- user_id
- birth_date
- height
- weight
- goals
- level
- strengths
- weaknesses
- training_preferences
- training_constraints
- available_equipment
- training_location
- notes

### CoachProfile

- id
- user_id
- specialty
- diplomas
- description
- professional_contact
- created_at
- updated_at

### CoachClientLink

- id
- coach_id
- client_id
- status
- invite_code
- created_at
- accepted_at
- revoked_at

### CoachManagedClient

- id
- coach_id
- first_name
- last_name
- notes
- linked_client_id
- created_at
- updated_at

Cette table permet au coach de gerer un client dans son espace, meme si ce client n'a pas encore cree de compte ou n'est pas encore lie.

### Session

- id
- client_id
- coach_id
- created_by
- title
- description
- scheduled_at
- duration_minutes
- objective
- status
- notes
- created_at
- updated_at

### SessionExercise

- id
- session_id
- name
- planned_sets
- planned_reps
- planned_load
- rest_seconds
- instructions
- order_index

### PerformanceLog

- id
- session_id
- client_id
- exercise_id
- completed_sets
- completed_reps
- load_used
- perceived_difficulty
- general_feeling
- comment
- created_at

### Notification

- id
- user_id
- type
- title
- body
- read_at
- created_at

## 9. Contraintes techniques proposees

### Application mobile

- React Native.
- Expo.
- TypeScript.
- Navigation avec Expo Router ou React Navigation.
- Gestion des donnees distantes avec TanStack Query.

### Backend

- Supabase.
- PostgreSQL.
- Supabase Auth.
- Supabase Row Level Security pour proteger les donnees par role.
- Supabase Storage pour les avatars et documents futurs.

### Notifications

- Expo Notifications.

### Qualite

- Code TypeScript strict autant que possible.
- Composants reutilisables.
- Structure claire par domaine : auth, profile, clients, sessions, performance, calendar.

## 10. Contraintes de securite et confidentialite

Le MVP doit tenir compte des points suivants :

- Un utilisateur ne voit que les donnees auxquelles il a acces.
- Le coach ne peut acceder qu'aux clients qu'il suit ou qui lui sont lies.
- Le client peut utiliser l'application sans partager ses donnees avec un coach.
- La liaison coach-client doit pouvoir etre revoquee.
- Les donnees partagees doivent etre limitees aux donnees sportives necessaires.
- Les suppressions de compte et demandes d'export devront etre prevues dans une version future.

## 11. Points RGPD et donnees sensibles

Le MVP doit eviter la collecte de donnees medicales ou sensibles.

Pour le MVP :

- Ne pas collecter de diagnostic, pathologie, blessure, douleur ou information medicale.
- Afficher un consentement clair lorsque le client lie son compte a un coach.
- Expliquer quelles donnees sportives sont partagees avec le coach.
- Permettre au client de retirer une liaison coach.
- Preparer une architecture compatible avec l'export et la suppression des donnees.

## 12. Hors perimetre du MVP

Les fonctionnalites suivantes sont interessantes mais doivent etre gardees pour une version ulterieure :

- Profil tiers professionnel.
- Acces tiers en lecture seule.
- Donnees medicales, blessures, douleurs, pathologies ou diagnostics.
- Messagerie integree coach-client.
- Paiement ou abonnement.
- Facturation.
- Bibliotheque complete d'exercices avec videos.
- Creation automatique de programmes.
- Intelligence artificielle d'adaptation des seances.
- Export PDF avance.
- Chat avec un professionnel de sante.
- Integration objets connectes.
- Suivi nutritionnel complet.
- Gestion multi-coachs complexe.

## 13. Criteres d'acceptation du MVP

Le MVP est considere comme valide si :

- Un client peut creer son compte et son profil.
- Un client peut creer une seance pour lui-meme.
- Un client peut organiser son calendrier.
- Un client peut renseigner ses performances apres une seance.
- Un client peut consulter son evolution.
- Un coach peut creer son compte.
- Un coach peut renseigner son profil, y compris ses diplomes ou certifications si disponibles.
- Un coach peut creer ou gerer un client dans son espace.
- Un coach peut creer et planifier une seance pour un client.
- Un coach peut lier un client via une invitation optionnelle.
- Le client voit les seances partagees dans son calendrier lorsque les comptes sont lies.
- Le coach peut consulter les performances partagees.
- Les permissions de base empechent les acces non autorises.
- Aucune fonctionnalite MVP ne demande d'information medicale.
- L'application fonctionne sur un telephone iOS ou Android via Expo.

## 14. Priorisation de developpement

### Phase 1 - Fondations

- Creation du projet React Native.
- Mise en place Supabase.
- Authentification.
- Roles utilisateur client et coach.
- Structure de navigation.

### Phase 2 - Experience client autonome

- Profil client.
- Creation de seances par le client.
- Calendrier client.
- Saisie des performances.
- Historique et evolution.

### Phase 3 - Experience coach autonome

- Profil coach.
- Diplomes ou certifications.
- Liste des clients suivis.
- Fiche client.
- Creation et planification de seances.

### Phase 4 - Liaison coach-client optionnelle

- Generation d'invitation.
- Acceptation d'invitation cote client.
- Partage des seances.
- Partage des performances.
- Revocation de la liaison.

### Phase 5 - Notifications simples

- Rappel de seance.
- Notification de nouvelle seance partagee.
- Notification de performance renseignee.

### Phase 6 - Ameliorations apres validation MVP

- Bibliotheque d'exercices.
- Exports.
- Messagerie.
- Gestion du tiers professionnel.
- Cadre avance de confidentialite.

## 15. Decisions a prendre avant le developpement

Avant de commencer le code, il faut confirmer :

- Le nom de l'application.
- La stack backend definitive : Supabase recommande.
- Le mode de liaison : code court, lien d'invitation ou les deux.
- Le niveau de detail des donnees sportives a saisir.
- Le modele freemium client.
- Le modele freemium coach.
- Le design general souhaite : sobre professionnel, sportif premium, simple et efficace, etc.
- La priorite iOS, Android ou les deux via Expo.

## 16. Proposition de MVP minimal strict

Pour eviter de trop charger la premiere version, le MVP minimal strict pourrait etre :

1. Authentification et roles client / coach.
2. Profil client.
3. Creation de seances par le client.
4. Calendrier client.
5. Saisie de performance par le client.
6. Profil coach avec diplomes optionnels.
7. Gestion simple de clients cote coach.
8. Creation de seance par le coach.
9. Liaison coach-client optionnelle par code.
10. Consultation des performances partagees par le coach.

Ce socle permet de tester rapidement la valeur principale de l'application : un suivi sportif utilisable seul, puis partageable entre coach et client lorsque les deux parties le souhaitent.
