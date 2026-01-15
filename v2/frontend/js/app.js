/**
 * App - Point d'entrée principal
 */

const App = {
  container: null,
  currentWorkout: null,
  workoutTimer: null,
  restTimer: null,

  /**
   * Initialiser l'application
   */
  async init() {
    console.log('🚀 Initialisation de FitnessRPG v2...');

    this.container = document.getElementById('app');

    // Attendre que Storage soit prêt
    if (!Storage.db) {
      await Storage.init();
    }

    // Vérifier l'authentification
    const isAuth = Auth.isAuthenticated();

    if (isAuth) {
      // Démarrer la synchronisation périodique
      Sync.startPeriodicSync();

      this.showDashboard();
    } else {
      // Arrêter la sync si on est pas authentifié
      Sync.stopPeriodicSync();
      this.showLogin();
    }

    console.log('✅ FitnessRPG v2 initialisée');
  },

  /**
   * Afficher la page de login
   */
  showLogin() {
    this.container.innerHTML = Pages.loginPage();
    this.initLoginEvents();
  },

  /**
   * Afficher le dashboard
   */
  async showDashboard() {
    // Récupérer l'utilisateur
    const user = await Auth.getCurrentUser();

    if (!user) {
      console.error('❌ Aucun utilisateur trouvé');
      this.showLogin();
      return;
    }

    // Afficher le dashboard
    this.container.innerHTML = Pages.dashboardPage(user);

    // Charger les statistiques
    await this.loadDashboardStats();

    // Initialiser les événements
    this.initDashboardEvents();

    // Marquer que nous sommes sur le Dashboard
    this.currentPage = 'dashboard';
  },

  /**
   * Rafraîchir la page actuelle après une synchronisation
   */
  async refreshCurrentPage() {
    // Ne rafraîchir que si on est sur le Dashboard ou l'Historique
    if (this.currentPage === 'dashboard') {
      const user = await Auth.getCurrentUser();
      if (user) {
        // Mettre à jour seulement les stats sans recharger toute la page
        await this.updateDashboardStats();
      }
    } else if (this.currentPage === 'history') {
      // Rafraîchir l'historique
      await this.refreshHistory();
    }
  },

  /**
   * Mettre à jour les stats du Dashboard sans tout recharger
   */
  async updateDashboardStats() {
    const user = await Auth.getCurrentUser();
    if (!user) return;

    // Mettre à jour le niveau et l'XP
    const levelBadge = document.querySelector('.level-badge');
    if (levelBadge) {
      levelBadge.textContent = `Niveau ${user.level}`;
    }

    const xpValue = document.querySelector('.xp-value');
    if (xpValue) {
      const xpForNextLevel = user.level * 100;
      const currentLevelXP = user.totalXP % 100;
      xpValue.textContent = `${currentLevelXP} / ${xpForNextLevel} XP`;
    }

    const xpBarFill = document.querySelector('.xp-bar-fill');
    if (xpBarFill) {
      const xpForNextLevel = user.level * 100;
      const currentLevelXP = user.totalXP % 100;
      const xpProgress = (currentLevelXP / xpForNextLevel) * 100;
      xpBarFill.style.width = `${xpProgress}%`;
    }

    const totalXPStat = document.querySelector('.stat-card:nth-child(3) .stat-value');
    if (totalXPStat) {
      totalXPStat.textContent = user.totalXP;
    }

    // Recharger les stats (workouts, streak, etc.)
    await this.loadDashboardStats();
  },

  /**
   * Rafraîchir l'historique
   */
  async refreshHistory() {
    const workouts = await Storage.getAll('workouts');
    const sortedWorkouts = workouts.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // Mettre à jour les stats de l'historique
    const totalWorkouts = sortedWorkouts.length;
    const totalXP = sortedWorkouts.reduce((sum, w) => sum + (w.totalXP || 0), 0);

    const totalWorkoutsStat = document.querySelector('.history-stat-card:nth-child(1) .history-stat-value');
    if (totalWorkoutsStat) {
      totalWorkoutsStat.textContent = totalWorkouts;
    }

    const totalXPStat = document.querySelector('.history-stat-card:nth-child(2) .history-stat-value');
    if (totalXPStat) {
      totalXPStat.textContent = totalXP;
    }

    // Recharger la liste des workouts
    const historyList = document.querySelector('.history-list');
    if (historyList && sortedWorkouts.length > 0) {
      historyList.innerHTML = sortedWorkouts.map(w => Pages.renderWorkoutHistoryCard(w)).join('');

      // Réattacher les événements pour les boutons "Voir les détails"
      const viewButtons = document.querySelectorAll('[data-action="view-workout"]');
      viewButtons.forEach(btn => {
        btn.addEventListener('click', () => {
          const workoutId = parseInt(btn.dataset.workoutId);
          this.showWorkoutDetail(workoutId);
        });
      });
    }
  },

  /**
   * Initialiser les événements de la page login
   */
  initLoginEvents() {
    // Toggle tabs
    const tabs = document.querySelectorAll('.auth-tab');
    const forms = document.querySelectorAll('.auth-form');

    tabs.forEach(tab => {
      tab.addEventListener('click', () => {
        const targetTab = tab.dataset.tab;

        // Update active tab
        tabs.forEach(t => t.classList.remove('active'));
        tab.classList.add('active');

        // Update active form
        forms.forEach(f => f.classList.remove('active'));
        document.getElementById(`${targetTab}-form`).classList.add('active');
      });
    });

    // Login form
    const loginForm = document.getElementById('login-form');
    loginForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('login-username').value.trim();
      const password = document.getElementById('login-password').value;

      if (!username || !password) {
        this.showToast('Veuillez remplir tous les champs', 'error');
        return;
      }

      // Disable button
      const submitBtn = loginForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Connexion...';

      // Login
      const result = await Auth.login(username, password);

      if (result.success) {
        this.showToast('Connexion réussie !', 'success');

        // Démarrer la synchronisation périodique
        Sync.startPeriodicSync();

        setTimeout(() => this.showDashboard(), 500);
      } else {
        this.showToast(result.error, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Se connecter';
      }
    });

    // Register form
    const registerForm = document.getElementById('register-form');
    registerForm.addEventListener('submit', async (e) => {
      e.preventDefault();

      const username = document.getElementById('register-username').value.trim();
      const email = document.getElementById('register-email').value.trim();
      const password = document.getElementById('register-password').value;

      if (!username || !email || !password) {
        this.showToast('Veuillez remplir tous les champs', 'error');
        return;
      }

      // Disable button
      const submitBtn = registerForm.querySelector('button[type="submit"]');
      submitBtn.disabled = true;
      submitBtn.textContent = 'Création...';

      // Register
      const result = await Auth.register(username, email, password);

      if (result.success) {
        this.showToast('Compte créé avec succès !', 'success');

        // Démarrer la synchronisation périodique
        Sync.startPeriodicSync();

        setTimeout(() => this.showDashboard(), 500);
      } else {
        this.showToast(result.error, 'error');
        submitBtn.disabled = false;
        submitBtn.textContent = 'Créer mon compte';
      }
    });

    // Offline mode
    const offlineBtn = document.getElementById('offline-btn');
    offlineBtn.addEventListener('click', async () => {
      offlineBtn.disabled = true;
      offlineBtn.textContent = 'Chargement...';

      const result = await Auth.continueOffline();

      if (result.success) {
        this.showToast('Mode hors ligne activé', 'success');
        setTimeout(() => this.showDashboard(), 500);
      } else {
        this.showToast(result.error, 'error');
        offlineBtn.disabled = false;
        offlineBtn.textContent = 'Continuer hors ligne';
      }
    });
  },

  /**
   * Charger les statistiques du dashboard
   */
  async loadDashboardStats() {
    // Pour l'instant, on affiche juste 0 partout
    // Plus tard, on ira chercher dans IndexedDB les workouts
    const workouts = await Storage.getAll('workouts');

    // Mettre à jour les stats
    document.getElementById('stat-workouts').textContent = workouts.length;

    // Calculer le streak (jours consécutifs)
    const streak = this.calculateStreak(workouts);
    document.getElementById('stat-streak').textContent = streak;

    // Dernière séance
    if (workouts.length > 0) {
      const lastWorkout = workouts[workouts.length - 1];
      const lastWorkoutDate = new Date(lastWorkout.date);
      const formattedDate = lastWorkoutDate.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'long',
        year: 'numeric'
      });

      const lastWorkoutCard = document.getElementById('last-workout');
      lastWorkoutCard.querySelector('.last-workout-date').textContent = formattedDate;
    }
  },

  /**
   * Calculer le streak (jours consécutifs)
   */
  calculateStreak(workouts) {
    if (workouts.length === 0) return 0;

    // Trier par date décroissante
    const sorted = workouts
      .map(w => new Date(w.date))
      .sort((a, b) => b - a);

    let streak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Vérifier si la dernière séance est aujourd'hui ou hier
    const lastWorkout = sorted[0];
    lastWorkout.setHours(0, 0, 0, 0);

    const diffDays = Math.floor((today - lastWorkout) / (1000 * 60 * 60 * 24));

    // Si plus de 1 jour, pas de streak
    if (diffDays > 1) return 0;

    // Compter les jours consécutifs
    for (let i = 1; i < sorted.length; i++) {
      const current = new Date(sorted[i]);
      current.setHours(0, 0, 0, 0);
      const previous = new Date(sorted[i - 1]);
      previous.setHours(0, 0, 0, 0);

      const diff = Math.floor((previous - current) / (1000 * 60 * 60 * 24));

      if (diff === 1) {
        streak++;
      } else {
        break;
      }
    }

    return streak;
  },

  /**
   * Initialiser les événements du dashboard
   */
  initDashboardEvents() {
    // Bouton déconnexion
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
      logoutBtn.addEventListener('click', async () => {
        // Arrêter la synchronisation périodique
        Sync.stopPeriodicSync();

        await Auth.logout();
        this.showToast('Déconnecté', 'success');
        setTimeout(() => this.showLogin(), 500);
      });
    }

    // Bouton démarrer séance
    const startWorkoutBtn = document.getElementById('start-workout-btn');
    if (startWorkoutBtn) {
      startWorkoutBtn.addEventListener('click', () => {
        this.startWorkout();
      });
    }

    // Bouton historique
    const viewHistoryBtn = document.getElementById('view-history-btn');
    if (viewHistoryBtn) {
      viewHistoryBtn.addEventListener('click', () => {
        this.showHistory();
      });
    }
  },

  /**
   * Afficher la page Historique
   */
  async showHistory() {
    const user = await Auth.getCurrentUser();

    // Récupérer tous les workouts
    const workouts = await Storage.getAll('workouts');

    // Trier par date décroissante (plus récent en premier)
    const sortedWorkouts = workouts.sort((a, b) =>
      new Date(b.date) - new Date(a.date)
    );

    // Afficher la page
    this.container.innerHTML = Pages.historyPage(sortedWorkouts, user);

    // Initialiser les événements
    this.initHistoryEvents();

    // Marquer que nous sommes sur l'Historique
    this.currentPage = 'history';
  },

  /**
   * Initialiser les événements de la page historique
   */
  initHistoryEvents() {
    // Bouton retour
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        this.showDashboard();
      });
    }

    // Bouton démarrer depuis historique
    const startWorkoutFromHistory = document.getElementById('start-workout-from-history');
    if (startWorkoutFromHistory) {
      startWorkoutFromHistory.addEventListener('click', () => {
        this.startWorkout();
      });
    }

    // Boutons "Voir les détails"
    const viewButtons = document.querySelectorAll('[data-action="view-workout"]');
    viewButtons.forEach(btn => {
      btn.addEventListener('click', () => {
        const workoutId = parseInt(btn.dataset.workoutId);
        this.showWorkoutDetail(workoutId);
      });
    });
  },

  /**
   * Afficher le détail d'une séance
   */
  async showWorkoutDetail(workoutId) {
    const workouts = await Storage.getAll('workouts');
    const workout = workouts.find(w => w.id === workoutId);

    if (!workout) {
      this.showToast('Séance non trouvée', 'error');
      return;
    }

    // Afficher un modal avec les détails
    this.showWorkoutDetailModal(workout);
  },

  /**
   * Modal détail d'une séance
   */
  showWorkoutDetailModal(workout) {
    const date = new Date(workout.date);
    const dateStr = date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
    const timeStr = date.toLocaleTimeString('fr-FR', {
      hour: '2-digit',
      minute: '2-digit'
    });

    const duration = workout.duration || 0;
    const durationMinutes = Math.floor(duration / 60000);
    const durationSeconds = Math.floor((duration % 60000) / 1000);
    const durationStr = `${durationMinutes}:${durationSeconds.toString().padStart(2, '0')}`;

    const modalHTML = `
      <div class="modal-overlay" id="workout-detail-modal">
        <div class="modal modal-large">
          <div class="modal-header">
            <h2 class="modal-title">Détail de la séance</h2>
            <button class="btn-icon" id="close-modal">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Date et stats -->
            <div class="workout-detail-header">
              <div class="workout-detail-date">
                <div>${dateStr}</div>
                <div class="workout-detail-time">${timeStr}</div>
              </div>
              <div class="workout-detail-stats-row">
                <div class="workout-detail-stat">
                  <span class="stat-icon">⏱️</span>
                  <span>${durationStr}</span>
                </div>
                <div class="workout-detail-stat">
                  <span class="stat-icon">⭐</span>
                  <span>+${workout.totalXP || 0} XP</span>
                </div>
              </div>
            </div>

            <!-- Exercices -->
            <div class="workout-detail-exercises">
              ${workout.exercises.map(ex => `
                <div class="workout-detail-exercise">
                  <div class="workout-detail-exercise-header">
                    <h3>${ex.name}</h3>
                    <span class="exercise-category-badge">
                      ${Exercises.categories[ex.category]?.icon || '💪'}
                      ${Exercises.categories[ex.category]?.name || 'Autre'}
                    </span>
                  </div>

                  <div class="workout-detail-sets">
                    ${ex.sets.map((set, idx) => {
                      let setContent = '';
                      if (ex.type === 'weight') {
                        setContent = `${set.weight || 0} kg × ${set.reps || 0} reps`;
                      } else if (ex.type === 'reps') {
                        setContent = `${set.reps || 0} reps`;
                      } else if (ex.type === 'duration') {
                        const min = Math.floor((set.duration || 0) / 60);
                        const sec = (set.duration || 0) % 60;
                        setContent = `${min}:${sec.toString().padStart(2, '0')}`;
                      }
                      return `
                        <div class="workout-detail-set">
                          <span class="set-num">Série ${idx + 1}</span>
                          <span class="set-data">${setContent}</span>
                          <span class="set-xp">+${set.xp || 0} XP</span>
                        </div>
                      `;
                    }).join('')}
                  </div>
                </div>
              `).join('')}
            </div>

            <button id="delete-workout-btn" class="btn btn-danger" data-workout-id="${workout.id}">
              Supprimer cette séance
            </button>
          </div>
        </div>
      </div>
    `;

    // Ajouter le modal au DOM
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    // Événements
    const modal = document.getElementById('workout-detail-modal');
    const closeBtn = document.getElementById('close-modal');
    const deleteBtn = document.getElementById('delete-workout-btn');

    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    deleteBtn.addEventListener('click', async () => {
      if (confirm('Êtes-vous sûr de vouloir supprimer cette séance ?')) {
        // 1. Supprimer localement
        await Storage.delete('workouts', workout.id);

        // 2. Supprimer sur le serveur (si connecté)
        const deleteResult = await Sync.deleteWorkout(workout.startTime);

        // 3. Recalculer l'XP et le niveau de l'utilisateur
        const user = await Auth.getCurrentUser();
        if (user) {
          // Récupérer tous les workouts restants
          const remainingWorkouts = await Storage.getAll('workouts');
          const totalXP = remainingWorkouts.reduce((sum, w) => sum + (w.totalXP || 0), 0);

          // Mettre à jour l'utilisateur
          user.totalXP = totalXP;
          user.level = Math.max(1, Math.floor(totalXP / 100) + 1);
          await Storage.save('user', user);

          // Si la suppression côté serveur a réussi et retourne les nouvelles données utilisateur
          if (deleteResult.success && deleteResult.data && deleteResult.data.user) {
            const serverUser = deleteResult.data.user;
            user.level = serverUser.level;
            user.totalXP = serverUser.total_xp;
            await Storage.save('user', user);
          }

          console.log(`✅ XP recalculé: ${user.totalXP}, Niveau: ${user.level}`);
        }

        this.showToast('Séance supprimée', 'success');
        modal.remove();
        this.showHistory();
      }
    });
  },

  /**
   * Démarrer une nouvelle séance
   */
  async startWorkout() {
    // Créer un nouveau workout
    this.currentWorkout = {
      id: Date.now(),
      date: new Date().toISOString(),
      startTime: Date.now(),
      exercises: []
    };

    // Afficher la page workout
    this.showWorkout();
  },

  /**
   * Afficher la page workout
   */
  showWorkout() {
    this.container.innerHTML = Pages.workoutPage(this.currentWorkout);
    this.initWorkoutEvents();
    this.startWorkoutTimer();
  },

  /**
   * Démarrer le chronomètre de séance
   */
  startWorkoutTimer() {
    const timerElement = document.getElementById('workout-timer');
    if (!timerElement) return;

    const startTime = this.currentWorkout.startTime;

    this.workoutTimer = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const minutes = Math.floor(elapsed / 60000);
      const seconds = Math.floor((elapsed % 60000) / 1000);
      timerElement.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
    }, 1000);
  },

  /**
   * Initialiser les événements de la page workout
   */
  initWorkoutEvents() {
    // Retour au dashboard
    const backBtn = document.getElementById('back-to-dashboard');
    if (backBtn) {
      backBtn.addEventListener('click', () => {
        if (confirm('Voulez-vous abandonner cette séance ?')) {
          this.cancelWorkout();
        }
      });
    }

    // Terminer la séance
    const finishBtn = document.getElementById('finish-workout-btn');
    if (finishBtn) {
      finishBtn.addEventListener('click', () => {
        this.finishWorkout();
      });
    }

    // Ajouter un exercice
    const addExerciseBtn = document.getElementById('add-exercise-btn');
    if (addExerciseBtn) {
      addExerciseBtn.addEventListener('click', () => {
        this.showExercisePicker();
      });
    }

    // Délégation d'événements pour les actions sur les exercices et séries
    const exercisesList = document.getElementById('exercises-list');
    if (exercisesList) {
      exercisesList.addEventListener('click', (e) => {
        const action = e.target.closest('[data-action]')?.dataset.action;

        if (action === 'delete-exercise') {
          const index = parseInt(e.target.closest('[data-action]').dataset.index);
          this.deleteExercise(index);
        } else if (action === 'add-set') {
          const exerciseIndex = parseInt(e.target.closest('[data-action]').dataset.exerciseIndex);
          this.showAddSetModal(exerciseIndex);
        } else if (action === 'delete-set') {
          const exerciseIndex = parseInt(e.target.closest('[data-action]').dataset.exerciseIndex);
          const setIndex = parseInt(e.target.closest('[data-action]').dataset.setIndex);
          this.deleteSet(exerciseIndex, setIndex);
        }
      });
    }
  },

  /**
   * Afficher le modal de sélection d'exercice
   */
  showExercisePicker() {
    // Créer le modal
    const modalHTML = Pages.exercisePickerModal();
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = document.getElementById('exercise-picker-modal');
    const exercisesList = document.getElementById('modal-exercises-list');
    const searchInput = document.getElementById('exercise-search');

    // Fermer le modal
    const closeBtn = document.getElementById('close-modal');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    // Cliquer en dehors ferme le modal
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Recherche
    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const exercises = query ? Exercises.search(query) : Exercises.list;
      this.renderExercisesList(exercisesList, exercises);
    });

    // Filtrer par catégorie
    const categoryBtns = modal.querySelectorAll('.exercise-category-btn');
    categoryBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const category = btn.dataset.category;

        // Toggle active
        categoryBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Filtrer
        const exercises = Exercises.getByCategory(category);
        this.renderExercisesList(exercisesList, exercises);
      });
    });

    // Sélectionner un exercice
    exercisesList.addEventListener('click', (e) => {
      const exerciseBtn = e.target.closest('.exercise-option');
      if (exerciseBtn) {
        const exerciseId = exerciseBtn.dataset.exerciseId;
        this.addExercise(exerciseId);
        modal.remove();
      }
    });

    // Exercice personnalisé
    const customBtn = document.getElementById('custom-exercise-btn');
    customBtn.addEventListener('click', () => {
      this.showToast('Exercice personnalisé - Prochainement', 'info');
    });
  },

  /**
   * Render la liste d'exercices dans le modal
   */
  renderExercisesList(container, exercises) {
    container.innerHTML = exercises.map(ex => `
      <button class="exercise-option" data-exercise-id="${ex.id}">
        <span>${ex.name}</span>
        <span class="exercise-type-badge">${Pages.getExerciseTypeBadge(ex.type)}</span>
      </button>
    `).join('');
  },

  /**
   * Ajouter un exercice à la séance
   */
  addExercise(exerciseId) {
    const exerciseData = Exercises.getById(exerciseId);
    if (!exerciseData) return;

    // Ajouter à la séance
    this.currentWorkout.exercises.push({
      ...exerciseData,
      sets: []
    });

    // Rafraîchir l'affichage
    this.refreshWorkoutDisplay();
    this.showToast(`${exerciseData.name} ajouté`, 'success');
  },

  /**
   * Supprimer un exercice
   */
  deleteExercise(index) {
    if (!confirm('Supprimer cet exercice ?')) return;

    this.currentWorkout.exercises.splice(index, 1);
    this.refreshWorkoutDisplay();
    this.showToast('Exercice supprimé', 'success');
  },

  /**
   * Afficher le modal d'ajout de série
   */
  showAddSetModal(exerciseIndex) {
    const exercise = this.currentWorkout.exercises[exerciseIndex];

    // Créer le modal
    const modalHTML = Pages.addSetModal(exercise);
    const modalContainer = document.createElement('div');
    modalContainer.innerHTML = modalHTML;
    document.body.appendChild(modalContainer.firstElementChild);

    const modal = document.getElementById('add-set-modal');
    const form = document.getElementById('add-set-form');

    // Fermer le modal
    const closeBtn = document.getElementById('close-modal');
    closeBtn.addEventListener('click', () => {
      modal.remove();
    });

    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        modal.remove();
      }
    });

    // Soumettre le formulaire
    form.addEventListener('submit', (e) => {
      e.preventDefault();

      const setData = {};

      if (exercise.type === 'weight') {
        setData.weight = parseFloat(document.getElementById('set-weight').value);
        setData.reps = parseInt(document.getElementById('set-reps').value);
      } else if (exercise.type === 'reps') {
        setData.reps = parseInt(document.getElementById('set-reps').value);
      } else if (exercise.type === 'duration') {
        const minutes = parseInt(document.getElementById('set-minutes').value) || 0;
        const seconds = parseInt(document.getElementById('set-seconds').value) || 0;
        setData.duration = minutes * 60 + seconds;
      }

      // Calculer l'XP
      setData.xp = Exercises.calculateSetXP(exercise, setData);

      // Ajouter la série
      this.addSet(exerciseIndex, setData);

      modal.remove();

      // Optionnel : démarrer un timer de repos
      // this.startRestTimer(90); // 90 secondes
    });
  },

  /**
   * Ajouter une série à un exercice
   */
  addSet(exerciseIndex, setData) {
    this.currentWorkout.exercises[exerciseIndex].sets.push(setData);
    this.refreshWorkoutDisplay();
    this.showToast(`+${setData.xp} XP`, 'success');
  },

  /**
   * Supprimer une série
   */
  deleteSet(exerciseIndex, setIndex) {
    if (!confirm('Supprimer cette série ?')) return;

    this.currentWorkout.exercises[exerciseIndex].sets.splice(setIndex, 1);
    this.refreshWorkoutDisplay();
    this.showToast('Série supprimée', 'success');
  },

  /**
   * Rafraîchir l'affichage de la séance
   */
  refreshWorkoutDisplay() {
    const exercisesList = document.getElementById('exercises-list');
    if (!exercisesList) return;

    exercisesList.innerHTML = this.currentWorkout.exercises
      .map((ex, idx) => Pages.renderExerciseCard(ex, idx))
      .join('');

    // Mettre à jour les stats
    const totalSets = this.currentWorkout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalXP = this.currentWorkout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + (set.xp || 0), 0), 0
    );

    const statsElements = document.querySelectorAll('.workout-stat-value');
    if (statsElements[0]) statsElements[0].textContent = this.currentWorkout.exercises.length;
    if (statsElements[1]) statsElements[1].textContent = totalSets;
    if (statsElements[2]) statsElements[2].textContent = totalXP;
  },

  /**
   * Annuler la séance
   */
  cancelWorkout() {
    if (this.workoutTimer) {
      clearInterval(this.workoutTimer);
      this.workoutTimer = null;
    }

    this.currentWorkout = null;
    this.showDashboard();
  },

  /**
   * Terminer la séance
   */
  async finishWorkout() {
    try {
      console.log('🏁 Début finishWorkout');

      if (this.currentWorkout.exercises.length === 0) {
        this.showToast('Ajoutez au moins un exercice', 'warning');
        return;
      }

      // Arrêter le timer
      if (this.workoutTimer) {
        clearInterval(this.workoutTimer);
        this.workoutTimer = null;
      }
      console.log('✅ Timer arrêté');

      // Calculer les stats finales
      this.currentWorkout.endTime = Date.now();
      this.currentWorkout.duration = this.currentWorkout.endTime - this.currentWorkout.startTime;

      const totalXP = this.currentWorkout.exercises.reduce((sum, ex) =>
        sum + ex.sets.reduce((s, set) => s + (set.xp || 0), 0), 0
      );
      this.currentWorkout.totalXP = totalXP;
      console.log('✅ Stats calculées, XP total:', totalXP);

      // Sauvegarder dans IndexedDB
      console.log('💾 Sauvegarde workout...');
      console.log('📦 Workout object:', JSON.stringify(this.currentWorkout, null, 2));
      console.log('🔑 Workout has id?', 'id' in this.currentWorkout, 'value:', this.currentWorkout.id);

      await Storage.save('workouts', this.currentWorkout);
      console.log('✅ Workout sauvegardé');

      // Mettre à jour l'XP de l'utilisateur
      const user = await Auth.getCurrentUser();
      console.log('👤 User récupéré:', user);

      if (user) {
        user.totalXP += totalXP;

        // Calculer le nouveau niveau
        const newLevel = Math.floor(user.totalXP / 100) + 1;
        const leveledUp = newLevel > user.level;
        user.level = newLevel;
        console.log('📊 Nouveau niveau:', newLevel, 'Level up:', leveledUp);

        // Sauvegarder l'utilisateur
        console.log('💾 Sauvegarde user...', user);
        await Storage.save('user', user);
        console.log('✅ User sauvegardé');

        if (leveledUp) {
          this.showToast(`🎉 Niveau ${user.level} atteint !`, 'success');
        } else {
          this.showToast(`+${totalXP} XP ! Séance terminée`, 'success');
        }

        // Synchroniser le workout et le profil si en ligne
        Sync.syncAll().catch(err => console.log('⚠️ Sync post-workout ignorée:', err));
      }

      // Retour au dashboard
      console.log('🔙 Retour au dashboard dans 1.5s');
      this.currentWorkout = null;
      setTimeout(() => {
        console.log('🔙 Affichage du dashboard');
        this.showDashboard();
      }, 1500);

    } catch (error) {
      console.error('❌ Erreur dans finishWorkout:', error);
      this.showToast(`Erreur: ${error.message}`, 'error');

      // En cas d'erreur, quand même revenir au dashboard
      this.currentWorkout = null;
      setTimeout(() => this.showDashboard(), 1500);
    }
  },

  /**
   * Afficher une notification toast
   */
  showToast(message, type = 'info') {
    const container = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = `toast ${type}`;
    toast.innerHTML = `<div class="toast-message">${message}</div>`;

    container.appendChild(toast);

    // Auto-remove after 3 seconds
    setTimeout(() => {
      toast.style.opacity = '0';
      setTimeout(() => toast.remove(), 300);
    }, 3000);
  }
};

// Démarrer l'application au chargement
window.addEventListener('DOMContentLoaded', () => {
  App.init();
});
