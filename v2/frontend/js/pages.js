/**
 * Pages - Gestion du contenu des pages
 */

const Pages = {
  /**
   * Page Login/Register
   */
  loginPage() {
    return `
      <div class="auth-page">
        <div class="auth-container">

          <!-- Header -->
          <div class="auth-header">
            <div class="auth-logo">💪</div>
            <h1 class="auth-title">FitnessRPG</h1>
            <p class="auth-subtitle">Transformez vos entraînements en aventure</p>
          </div>

          <!-- Card -->
          <div class="auth-card">

            <!-- Tabs -->
            <div class="auth-tabs">
              <button class="auth-tab active" data-tab="login">Connexion</button>
              <button class="auth-tab" data-tab="register">Inscription</button>
            </div>

            <!-- Login Form -->
            <form class="auth-form active" id="login-form">
              <div class="form-group">
                <label class="form-label" for="login-username">Nom d'utilisateur</label>
                <input
                  type="text"
                  id="login-username"
                  class="form-input"
                  placeholder="Entrez votre nom d'utilisateur"
                  required
                  autocomplete="username"
                >
              </div>

              <div class="form-group">
                <label class="form-label" for="login-password">Mot de passe</label>
                <input
                  type="password"
                  id="login-password"
                  class="form-input"
                  placeholder="Entrez votre mot de passe"
                  required
                  autocomplete="current-password"
                >
              </div>

              <button type="submit" class="btn">Se connecter</button>
            </form>

            <!-- Register Form -->
            <form class="auth-form" id="register-form">
              <div class="form-group">
                <label class="form-label" for="register-username">Nom d'utilisateur</label>
                <input
                  type="text"
                  id="register-username"
                  class="form-input"
                  placeholder="Choisissez un nom d'utilisateur"
                  required
                  autocomplete="username"
                >
              </div>

              <div class="form-group">
                <label class="form-label" for="register-email">Email</label>
                <input
                  type="email"
                  id="register-email"
                  class="form-input"
                  placeholder="Entrez votre email"
                  required
                  autocomplete="email"
                >
              </div>

              <div class="form-group">
                <label class="form-label" for="register-password">Mot de passe</label>
                <input
                  type="password"
                  id="register-password"
                  class="form-input"
                  placeholder="Choisissez un mot de passe"
                  required
                  autocomplete="new-password"
                >
              </div>

              <button type="submit" class="btn">Créer mon compte</button>
            </form>

            <!-- Divider -->
            <div class="auth-divider">ou</div>

            <!-- Offline Mode -->
            <button id="offline-btn" class="btn btn-secondary">
              Continuer hors ligne
            </button>

          </div>

        </div>
      </div>
    `;
  },

  /**
   * Page Dashboard
   */
  dashboardPage(user) {
    // Calculer le pourcentage XP pour le niveau actuel
    const xpForNextLevel = user.level * 100;
    const currentLevelXP = user.totalXP % 100;
    const xpProgress = (currentLevelXP / xpForNextLevel) * 100;

    // Status de connexion
    const isOffline = user.isOffline || false;
    const statusBadge = isOffline
      ? '<span class="status-badge offline">⚠️ Mode hors ligne</span>'
      : '<span class="status-badge online">✅ Connecté</span>';

    return `
      <!-- Top Navigation -->
      <header class="top-nav">
        <div class="top-nav__logo">
          <span class="logo-icon">💪</span>
          <span class="logo-text">FitnessRPG</span>
        </div>
        <button id="logout-btn" class="btn-icon" title="Se déconnecter">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </header>

      <!-- Main Content -->
      <main class="dashboard">
        <div class="container">

          <!-- User Profile Card -->
          <div class="profile-card">
            <div class="profile-avatar">
              ${this.getAvatarEmoji(user.level)}
            </div>
            <div class="profile-info">
              <h1 class="profile-name">${user.username}</h1>
              ${statusBadge}
            </div>
            <div class="profile-level">
              <span class="level-badge">Niveau ${user.level}</span>
            </div>
          </div>

          <!-- XP Progress -->
          <div class="xp-card">
            <div class="xp-header">
              <span class="xp-label">Expérience</span>
              <span class="xp-value">${currentLevelXP} / ${xpForNextLevel} XP</span>
            </div>
            <div class="xp-bar">
              <div class="xp-bar-fill" style="width: ${xpProgress}%"></div>
            </div>
          </div>

          <!-- Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">🏋️</div>
              <div class="stat-value" id="stat-workouts">0</div>
              <div class="stat-label">Séances</div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">🔥</div>
              <div class="stat-value" id="stat-streak">0</div>
              <div class="stat-label">Jours de suite</div>
            </div>

            <div class="stat-card">
              <div class="stat-icon">⭐</div>
              <div class="stat-value">${user.totalXP}</div>
              <div class="stat-label">XP Total</div>
            </div>
          </div>

          <!-- Last Workout -->
          <div class="last-workout-card" id="last-workout">
            <div class="last-workout-icon">📅</div>
            <div class="last-workout-info">
              <div class="last-workout-label">Dernière séance</div>
              <div class="last-workout-date">Aucune séance enregistrée</div>
            </div>
          </div>

          <!-- Action Buttons -->
          <button id="start-workout-btn" class="btn btn-primary btn-large">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Démarrer une séance
          </button>

          <button id="view-history-btn" class="btn btn-secondary btn-large">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Historique des séances
          </button>

        </div>
      </main>
    `;
  },

  /**
   * Obtenir l'emoji avatar selon le niveau
   */
  getAvatarEmoji(level) {
    if (level >= 50) return '👑';
    if (level >= 30) return '⚔️';
    if (level >= 20) return '🛡️';
    if (level >= 10) return '🗡️';
    return '🥋';
  },

  /**
   * Page Workout - Séance en cours
   */
  workoutPage(workout) {
    const totalSets = workout.exercises.reduce((sum, ex) => sum + ex.sets.length, 0);
    const totalXP = workout.exercises.reduce((sum, ex) =>
      sum + ex.sets.reduce((s, set) => s + (set.xp || 0), 0), 0
    );

    return `
      <!-- Top Navigation -->
      <header class="top-nav">
        <button id="back-to-dashboard" class="btn-icon" title="Retour">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="top-nav__title">
          <span class="workout-timer" id="workout-timer">00:00</span>
        </div>
        <button id="finish-workout-btn" class="btn-icon btn-success" title="Terminer">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
          </svg>
        </button>
      </header>

      <!-- Main Content -->
      <main class="workout-page">
        <div class="container">

          <!-- Workout Stats -->
          <div class="workout-stats">
            <div class="workout-stat">
              <span class="workout-stat-value">${workout.exercises.length}</span>
              <span class="workout-stat-label">Exercices</span>
            </div>
            <div class="workout-stat">
              <span class="workout-stat-value">${totalSets}</span>
              <span class="workout-stat-label">Séries</span>
            </div>
            <div class="workout-stat">
              <span class="workout-stat-value">${totalXP}</span>
              <span class="workout-stat-label">XP</span>
            </div>
          </div>

          <!-- Exercises List -->
          <div class="exercises-list" id="exercises-list">
            ${workout.exercises.map((ex, idx) => this.renderExerciseCard(ex, idx)).join('')}
          </div>

          <!-- Add Exercise Button -->
          <button id="add-exercise-btn" class="btn btn-secondary btn-large">
            <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
            </svg>
            Ajouter un exercice
          </button>

        </div>
      </main>
    `;
  },

  /**
   * Render d'une carte exercice
   */
  renderExerciseCard(exercise, index) {
    const totalVolume = exercise.sets.reduce((sum, set) => {
      if (set.weight && set.reps) return sum + (set.weight * set.reps);
      return sum;
    }, 0);

    return `
      <div class="exercise-card" data-exercise-index="${index}">
        <div class="exercise-header">
          <div class="exercise-info">
            <h3 class="exercise-name">${exercise.name}</h3>
            <span class="exercise-category">${Exercises.categories[exercise.category]?.icon || '💪'} ${Exercises.categories[exercise.category]?.name || 'Autre'}</span>
          </div>
          <button class="btn-icon btn-small" data-action="delete-exercise" data-index="${index}" title="Supprimer">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Sets List -->
        <div class="sets-list">
          ${exercise.sets.map((set, setIdx) => this.renderSetRow(set, index, setIdx, exercise.type)).join('')}
        </div>

        <!-- Add Set Button -->
        <button class="btn btn-small btn-secondary" data-action="add-set" data-exercise-index="${index}">
          + Ajouter une série
        </button>

        ${totalVolume > 0 ? `<div class="exercise-volume">Volume total: ${totalVolume} kg</div>` : ''}
        ${exercise.notes ? `<div class="exercise-notes">📝 ${exercise.notes}</div>` : ''}
      </div>
    `;
  },

  /**
   * Render d'une ligne de série
   */
  renderSetRow(set, exerciseIdx, setIdx, exerciseType) {
    let content = '';

    if (exerciseType === 'weight') {
      content = `
        <span class="set-data">${set.weight || 0} kg × ${set.reps || 0} reps</span>
        <span class="set-xp">+${set.xp || 0} XP</span>
      `;
    } else if (exerciseType === 'reps') {
      content = `
        <span class="set-data">${set.reps || 0} reps</span>
        <span class="set-xp">+${set.xp || 0} XP</span>
      `;
    } else if (exerciseType === 'duration') {
      const minutes = Math.floor((set.duration || 0) / 60);
      const seconds = (set.duration || 0) % 60;
      content = `
        <span class="set-data">${minutes}:${seconds.toString().padStart(2, '0')}</span>
        <span class="set-xp">+${set.xp || 0} XP</span>
      `;
    }

    return `
      <div class="set-row">
        <span class="set-number">#${setIdx + 1}</span>
        ${content}
        <button class="btn-icon btn-tiny" data-action="delete-set" data-exercise-index="${exerciseIdx}" data-set-index="${setIdx}" title="Supprimer">
          <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
    `;
  },

  /**
   * Modal - Choisir un exercice
   */
  exercisePickerModal() {
    const categories = Object.entries(Exercises.categories);

    return `
      <div class="modal-overlay" id="exercise-picker-modal">
        <div class="modal">
          <div class="modal-header">
            <h2 class="modal-title">Choisir un exercice</h2>
            <button class="btn-icon" id="close-modal">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <!-- Search -->
            <input
              type="text"
              id="exercise-search"
              class="form-input"
              placeholder="Rechercher un exercice..."
            >

            <!-- Categories -->
            <div class="exercise-categories">
              ${categories.map(([key, cat]) => `
                <button class="exercise-category-btn" data-category="${key}">
                  <span class="category-icon">${cat.icon}</span>
                  <span class="category-name">${cat.name}</span>
                </button>
              `).join('')}
            </div>

            <!-- Exercises List -->
            <div class="modal-exercises-list" id="modal-exercises-list">
              ${Exercises.list.map(ex => `
                <button class="exercise-option" data-exercise-id="${ex.id}">
                  <span>${ex.name}</span>
                  <span class="exercise-type-badge">${this.getExerciseTypeBadge(ex.type)}</span>
                </button>
              `).join('')}
            </div>

            <!-- Custom Exercise -->
            <div class="modal-divider">ou</div>
            <button id="custom-exercise-btn" class="btn btn-secondary">
              Créer un exercice personnalisé
            </button>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Modal - Ajouter une série
   */
  addSetModal(exercise) {
    return `
      <div class="modal-overlay" id="add-set-modal">
        <div class="modal modal-small">
          <div class="modal-header">
            <h2 class="modal-title">Ajouter une série</h2>
            <button class="btn-icon" id="close-modal">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div class="modal-body">
            <h3 class="exercise-name-modal">${exercise.name}</h3>

            <form id="add-set-form">
              ${exercise.type === 'weight' ? `
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Poids (kg)</label>
                    <input type="number" id="set-weight" class="form-input" placeholder="50" step="0.5" required>
                  </div>
                  <div class="form-group">
                    <label class="form-label">Répétitions</label>
                    <input type="number" id="set-reps" class="form-input" placeholder="10" required>
                  </div>
                </div>
              ` : ''}

              ${exercise.type === 'reps' ? `
                <div class="form-group">
                  <label class="form-label">Répétitions</label>
                  <input type="number" id="set-reps" class="form-input" placeholder="10" required>
                </div>
              ` : ''}

              ${exercise.type === 'duration' ? `
                <div class="form-row">
                  <div class="form-group">
                    <label class="form-label">Minutes</label>
                    <input type="number" id="set-minutes" class="form-input" placeholder="5" min="0">
                  </div>
                  <div class="form-group">
                    <label class="form-label">Secondes</label>
                    <input type="number" id="set-seconds" class="form-input" placeholder="30" min="0" max="59">
                  </div>
                </div>
              ` : ''}

              <button type="submit" class="btn btn-primary">Ajouter la série</button>
            </form>

            <!-- Rest Timer -->
            <div class="rest-timer" id="rest-timer" style="display: none;">
              <div class="rest-timer-label">Repos</div>
              <div class="rest-timer-value" id="rest-timer-value">01:30</div>
              <button class="btn btn-small" id="skip-rest">Passer</button>
            </div>
          </div>
        </div>
      </div>
    `;
  },

  /**
   * Badge type d'exercice
   */
  getExerciseTypeBadge(type) {
    const badges = {
      weight: '⚖️ Poids',
      reps: '🔢 Reps',
      duration: '⏱️ Durée'
    };
    return badges[type] || type;
  },

  /**
   * Page Historique des séances
   */
  historyPage(workouts, user) {
    const totalWorkouts = workouts.length;
    const totalXP = workouts.reduce((sum, w) => sum + (w.totalXP || 0), 0);

    return `
      <!-- Top Navigation -->
      <header class="top-nav">
        <button id="back-to-dashboard" class="btn-icon" title="Retour">
          <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <div class="top-nav__title">
          <span>Historique</span>
        </div>
        <div class="btn-icon" style="opacity: 0; pointer-events: none;"></div>
      </header>

      <!-- Main Content -->
      <main class="history-page">
        <div class="container">

          <!-- Stats Summary -->
          <div class="history-stats">
            <div class="history-stat-card">
              <div class="history-stat-icon">🏋️</div>
              <div class="history-stat-value">${totalWorkouts}</div>
              <div class="history-stat-label">Séances totales</div>
            </div>
            <div class="history-stat-card">
              <div class="history-stat-icon">⭐</div>
              <div class="history-stat-value">${totalXP}</div>
              <div class="history-stat-label">XP gagnés</div>
            </div>
          </div>

          ${workouts.length === 0 ? `
            <div class="empty-state">
              <div class="empty-state-icon">📅</div>
              <h3 class="empty-state-title">Aucune séance enregistrée</h3>
              <p class="empty-state-text">Commence ta première séance pour voir ton historique ici</p>
              <button id="start-workout-from-history" class="btn btn-primary">
                Démarrer une séance
              </button>
            </div>
          ` : `
            <!-- Workouts List -->
            <div class="history-list">
              ${workouts.map(w => this.renderWorkoutHistoryCard(w)).join('')}
            </div>
          `}

        </div>
      </main>
    `;
  },

  /**
   * Render d'une carte workout dans l'historique
   */
  renderWorkoutHistoryCard(workout) {
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
    const durationStr = durationMinutes > 0
      ? `${durationMinutes} min`
      : '< 1 min';

    const exerciseCount = workout.exercises?.length || 0;
    const totalSets = workout.exercises?.reduce((sum, ex) =>
      sum + (ex.sets?.length || 0), 0
    ) || 0;

    return `
      <div class="history-card" data-workout-id="${workout.id}">
        <div class="history-card-header">
          <div class="history-card-date">
            <div class="history-date-main">${dateStr}</div>
            <div class="history-date-time">${timeStr}</div>
          </div>
          <div class="history-card-xp">
            <span class="xp-badge">+${workout.totalXP || 0} XP</span>
          </div>
        </div>

        <div class="history-card-stats">
          <div class="history-mini-stat">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>${durationStr}</span>
          </div>
          <div class="history-mini-stat">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <span>${exerciseCount} exercices</span>
          </div>
          <div class="history-mini-stat">
            <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            <span>${totalSets} séries</span>
          </div>
        </div>

        ${workout.exercises && workout.exercises.length > 0 ? `
          <div class="history-card-exercises">
            ${workout.exercises.slice(0, 3).map(ex => `
              <div class="history-exercise-tag">
                ${Exercises.categories[ex.category]?.icon || '💪'} ${ex.name}
              </div>
            `).join('')}
            ${workout.exercises.length > 3 ? `
              <div class="history-exercise-more">+${workout.exercises.length - 3}</div>
            ` : ''}
          </div>
        ` : ''}

        <button class="history-card-action" data-action="view-workout" data-workout-id="${workout.id}">
          Voir les détails
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    `;
  }
};
