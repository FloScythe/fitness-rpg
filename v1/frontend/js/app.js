/**
 * FitnessRPG - Application Principale
 * Point d'entrée JavaScript
 */

(async function() {
  'use strict';

  console.log('🚀 Lancement de FitnessRPG...');

  // ═══════════════════════════════════════════════════════════
  // CONFIGURATION
  // ═══════════════════════════════════════════════════════════

  const API_URL = 'http://localhost:5000/api';

  // ═══════════════════════════════════════════════════════════
  // INITIALISATION
  // ═══════════════════════════════════════════════════════════

  async function initApp() {
    try {
      // 1. Attendre que IndexedDB soit prête
      if (!window.fitnessDB || !window.fitnessDB.db) {
        await new Promise((resolve) => {
          const checkDB = setInterval(() => {
            if (window.fitnessDB && window.fitnessDB.db) {
              clearInterval(checkDB);
              resolve();
            }
          }, 100);
        });
      }

      console.log('✅ IndexedDB prête');

      // 2. Charger les exercices par défaut
      await window.seedExercises();

      // 3. Initialiser les managers
      if (window.RPGManager) {
        await window.RPGManager.init();
      } else {
        console.warn('⚠️ RPGManager non chargé');
      }

      if (window.NotificationManager) {
        window.NotificationManager.init();
      } else {
        console.warn('⚠️ NotificationManager non chargé');
      }

      if (window.TimerManager) {
        window.TimerManager.init();
      } else {
        console.warn('⚠️ TimerManager non chargé');
      }

      if (window.SyncQueueManager) {
        // Init non-bloquant pour éviter de bloquer l'app
        window.SyncQueueManager.init().catch(err => {
          console.warn('⚠️ SyncQueueManager init warning:', err);
        });
      } else {
        console.warn('⚠️ SyncQueueManager non chargé');
      }

      console.log('✅ Tous les managers initialisés');

      // 4. Enregistrer les routes AVANT d'initialiser le router
      registerRoutes();

      // 5. Initialiser le router (va charger la route actuelle)
      window.router.init('main-content');

      // 6. Configurer les événements globaux
      setupGlobalEvents();

      // 7. Vérifier la connexion réseau
      checkNetworkStatus();

      // 8. Écouter les événements RPG
      listenToRPGEvents();

      console.log('✅ Application FitnessRPG initialisée');

    } catch (error) {
      console.error('❌ Erreur d\'initialisation:', error);
      showError('Erreur de chargement de l\'application');
    }
  }

  // ═══════════════════════════════════════════════════════════
  // ENREGISTREMENT DES ROUTES
  // ═══════════════════════════════════════════════════════════

  function registerRoutes() {
    console.log('📍 Enregistrement des routes...');

    // Dashboard (Accueil)
    router.register('dashboard', renderDashboard, {
      title: 'Accueil - FitnessRPG'
    });

    // Séance d'entraînement
    router.register('workout', renderWorkout, {
      title: 'Séance - FitnessRPG'
    });

    // Séance active (en cours)
    router.register('workout-active', renderWorkoutActive, {
      title: 'Séance en cours - FitnessRPG'
    });

    // Historique
    router.register('history', renderHistory, {
      title: 'Historique - FitnessRPG'
    });

    // Statistiques
    router.register('stats', renderStats, {
      title: 'Statistiques - FitnessRPG'
    });

    // Profil
    router.register('profile', renderProfile, {
      title: 'Profil - FitnessRPG'
    });

    // Login (optionnel)
    router.register('login', renderLogin, {
      title: 'Connexion - FitnessRPG'
    });

    // Register (optionnel)
    router.register('register', renderRegister, {
      title: 'Inscription - FitnessRPG'
    });

    console.log('✅ Routes enregistrées:', router.routes.size);
  }

  // ═══════════════════════════════════════════════════════════
  // PAGES (Templates HTML)
  // ═══════════════════════════════════════════════════════════

  async function renderDashboard() {
    // Récupérer les stats depuis IndexedDB
    const user = await getUserData();
    const recentWorkouts = await getRecentWorkouts(5);
    const totalWorkouts = await getTotalWorkouts();

    return `
      <div class="container">
        <section class="section">
          <h1 class="section__title">Bienvenue, ${user.username || 'Aventurier'} !</h1>
          <p class="section__subtitle">Niveau ${user.level} • ${user.totalXP} XP</p>

          <!-- Barre de progression XP -->
          <div class="card mb-6">
            <div class="flex justify-between items-center mb-2">
              <span class="text-sm text-secondary">Progression vers niveau ${user.level + 1}</span>
              <span class="text-sm font-semibold text-primary">${user.currentXP} / ${user.xpForNextLevel} XP</span>
            </div>
            <div class="progress progress--lg progress--xp">
              <div class="progress__bar" style="width: ${user.progress}%"></div>
            </div>
          </div>

          <!-- Stats RPG -->
          <div class="grid grid--2 mb-6">
            <div class="stat-card">
              <div class="stat-card__label">Séances Totales</div>
              <div class="stat-card__value">${totalWorkouts}</div>
            </div>

            <div class="stat-card">
              <div class="stat-card__label">XP Total</div>
              <div class="stat-card__value">${user.totalXP}</div>
            </div>
          </div>

          <!-- Actions rapides -->
          <div class="grid grid--2 gap-4 mb-6">
            <button class="btn btn--primary btn--xl" onclick="router.navigate('workout')">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Nouvelle Séance
            </button>

            <button class="btn btn--secondary btn--xl" onclick="router.navigate('history')">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Historique
            </button>
          </div>

          <!-- Séances récentes -->
          <div class="section__title mb-4">Séances Récentes</div>
          ${recentWorkouts.length > 0 ? renderRecentWorkouts(recentWorkouts) : renderEmptyWorkouts()}
        </section>
      </div>
    `;
  }

  async function renderWorkout() {
    const exercises = await window.fitnessDB.getAll('exercises');

    return `
      <div class="container">
        <section class="section">
          <h1 class="section__title">Nouvelle Séance</h1>
          <p class="section__subtitle">Sélectionnez vos exercices</p>

          <div class="card mb-6">
            <input
              type="text"
              class="form-input mb-4"
              placeholder="Rechercher un exercice..."
              id="exercise-search"
            />

            <div class="flex gap-2 mb-4" id="category-filters">
              <button class="btn btn--sm btn--primary" data-category="all">Tous</button>
              <button class="btn btn--sm btn--secondary" data-category="push">Push</button>
              <button class="btn btn--sm btn--secondary" data-category="pull">Pull</button>
              <button class="btn btn--sm btn--secondary" data-category="legs">Legs</button>
              <button class="btn btn--sm btn--secondary" data-category="core">Core</button>
            </div>
          </div>

          <div id="exercises-list">
            ${exercises.map(ex => `
              <div class="card card--interactive mb-3" onclick="selectExercise('${ex.uuid}')">
                <div class="flex justify-between items-center">
                  <div>
                    <div class="card__title">${ex.name}</div>
                    <div class="card__subtitle">${ex.category.toUpperCase()} • ${ex.muscleGroup || ''}</div>
                  </div>
                  <span class="badge badge--primary">XP ×${ex.xpMultiplier}</span>
                </div>
              </div>
            `).join('')}
          </div>
        </section>
      </div>
    `;
  }

  async function renderWorkoutActive() {
    const workout = window.WorkoutManager.currentWorkout;

    if (!workout) {
      return `
        <div class="container">
          <div class="empty-state">
            <h2 class="empty-state__title">Aucune séance en cours</h2>
            <p class="empty-state__description">Démarrez une séance pour commencer</p>
            <button class="btn btn--primary" onclick="router.navigate('workout')">
              Nouvelle séance
            </button>
          </div>
        </div>
      `;
    }

    const currentExercise = window.WorkoutManager.currentExercise;

    return `
      <div class="container">
        <section class="section">
          <!-- En-tête de la séance -->
          <div class="card mb-4" style="background: linear-gradient(135deg, var(--accent-primary), var(--accent-secondary));">
            <div style="color: white;">
              <h1 class="section__title" style="color: white; margin-bottom: 0.5rem;">${workout.name}</h1>
              <div class="flex gap-4 text-sm">
                <span>${workout.exercises.length} exercice${workout.exercises.length > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>${Math.round(workout.totalVolume)} kg</span>
                <span>•</span>
                <span id="workout-duration">0 min</span>
              </div>
            </div>
          </div>

          <!-- Exercice en cours -->
          ${currentExercise ? `
            <div class="card card--glow mb-6">
              <div class="flex justify-between items-start mb-4">
                <div>
                  <h2 class="text-2xl font-bold mb-2">${currentExercise.exercise.name}</h2>
                  <div class="flex gap-3 text-sm text-secondary">
                    <span>${currentExercise.totalSets} série${currentExercise.totalSets > 1 ? 's' : ''}</span>
                    <span>•</span>
                    <span>${Math.round(currentExercise.totalVolume)} kg</span>
                  </div>
                </div>
                <span class="badge badge--primary">XP ×${currentExercise.exercise.xpMultiplier}</span>
              </div>

              <!-- Formulaire d'ajout de série -->
              <form id="add-set-form" class="mb-4">
                <div class="grid grid--2 gap-4 mb-4">
                  <div class="form-group">
                    <label class="form-label">Poids (kg)</label>
                    <input
                      type="number"
                      step="0.5"
                      class="form-input"
                      id="set-weight"
                      placeholder="Ex: 80"
                      required
                      autocomplete="off"
                    />
                  </div>
                  <div class="form-group">
                    <label class="form-label">Répétitions</label>
                    <input
                      type="number"
                      class="form-input"
                      id="set-reps"
                      placeholder="Ex: 10"
                      required
                      autocomplete="off"
                    />
                  </div>
                </div>

                <div class="form-group mb-4">
                  <label class="form-label">RPE (optionnel) - Difficulté ressentie</label>
                  <input
                    type="range"
                    min="6"
                    max="10"
                    step="0.5"
                    class="form-range"
                    id="set-rpe"
                    value="8"
                  />
                  <div class="flex justify-between text-xs text-tertiary mt-1">
                    <span>6 - Facile</span>
                    <span id="rpe-value">8.0</span>
                    <span>10 - Max</span>
                  </div>
                </div>

                <div class="flex gap-2">
                  <button type="submit" class="btn btn--primary btn--lg flex-1">
                    <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Ajouter la série
                  </button>
                  <button type="button" class="btn btn--secondary" onclick="toggleWarmup()" id="warmup-btn" title="Série d'échauffement">
                    🔥
                  </button>
                </div>
              </form>

              <!-- Séries effectuées -->
              <div id="sets-list">
                ${currentExercise.sets.length > 0 ? `
                  <div class="mb-3">
                    <h3 class="text-sm font-semibold text-secondary mb-2">Séries effectuées</h3>
                    ${currentExercise.sets.map(set => `
                      <div class="flex justify-between items-center p-3 mb-2 rounded-lg ${set.isWarmup ? 'bg-warning/10' : 'bg-elevated'} border border-color">
                        <div class="flex gap-4">
                          <span class="font-bold">#${set.setNumber}</span>
                          <span>${set.weight_kg} kg × ${set.reps}</span>
                          ${set.rpe ? `<span class="text-xs text-tertiary">RPE ${set.rpe}</span>` : ''}
                          ${set.isWarmup ? '<span class="badge badge--sm badge--warning">Échauffement</span>' : ''}
                          ${set.isPR ? '<span class="badge badge--sm badge--danger">🏆 PR!</span>' : ''}
                        </div>
                        <div class="text-sm text-secondary">
                          ${Math.round(set.volume)} kg
                        </div>
                      </div>
                    `).join('')}
                  </div>
                ` : '<p class="text-sm text-tertiary text-center py-4">Aucune série effectuée</p>'}
              </div>

              <!-- Actions -->
              <div class="flex gap-2 mt-4">
                <button class="btn btn--success flex-1" onclick="finishExercise()">
                  Terminer cet exercice
                </button>
              </div>
            </div>
          ` : ''}

          <!-- Liste des exercices de la séance -->
          <div class="card mb-6">
            <h3 class="text-lg font-bold mb-4">Exercices de la séance</h3>
            ${workout.exercises.length > 0 ? `
              <div class="flex flex-col gap-2">
                ${workout.exercises.map((ex, idx) => `
                  <div class="flex justify-between items-center p-3 rounded-lg ${ex === currentExercise ? 'bg-primary/10 border border-primary' : 'bg-elevated'}">
                    <div>
                      <div class="font-semibold">${ex.exercise.name}</div>
                      <div class="text-xs text-tertiary">${ex.totalSets} série${ex.totalSets > 1 ? 's' : ''} • ${Math.round(ex.totalVolume)} kg</div>
                    </div>
                    ${ex === currentExercise ? '<span class="badge badge--primary">En cours</span>' : ''}
                  </div>
                `).join('')}
              </div>
            ` : '<p class="text-sm text-tertiary text-center py-4">Aucun exercice ajouté</p>'}

            <button class="btn btn--secondary btn--block mt-4" onclick="router.navigate('workout')">
              <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Ajouter un exercice
            </button>
          </div>

          <!-- Boutons d'action -->
          <div class="flex gap-3 mb-6">
            <button class="btn btn--success btn--lg flex-1" onclick="completeWorkout()">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              Terminer la séance
            </button>
            <button class="btn btn--danger" onclick="cancelWorkout()">
              <svg width="24" height="24" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </section>
      </div>

      <script>
        // Gestion du formulaire d'ajout de série
        let isWarmup = false;

        document.getElementById('add-set-form')?.addEventListener('submit', async (e) => {
          e.preventDefault();
          await addSet();
        });

        // RPE slider
        const rpeSlider = document.getElementById('set-rpe');
        const rpeValue = document.getElementById('rpe-value');
        if (rpeSlider && rpeValue) {
          rpeSlider.addEventListener('input', (e) => {
            rpeValue.textContent = parseFloat(e.target.value).toFixed(1);
          });
        }

        // Mise à jour de la durée
        const startTime = ${workout ? `new Date('${workout.workoutDate}').getTime()` : 'Date.now()'};
        setInterval(() => {
          const elapsed = Math.floor((Date.now() - startTime) / 60000);
          const durationEl = document.getElementById('workout-duration');
          if (durationEl) {
            durationEl.textContent = elapsed + ' min';
          }
        }, 10000);

        window.toggleWarmup = function() {
          isWarmup = !isWarmup;
          const btn = document.getElementById('warmup-btn');
          if (btn) {
            btn.classList.toggle('btn--warning', isWarmup);
            btn.classList.toggle('btn--secondary', !isWarmup);
          }
        };

        window.addSet = async function() {
          const weight = parseFloat(document.getElementById('set-weight').value);
          const reps = parseInt(document.getElementById('set-reps').value);
          const rpe = parseFloat(document.getElementById('set-rpe').value);

          if (!weight || !reps) {
            window.NotificationManager.error('Veuillez remplir tous les champs');
            return;
          }

          try {
            await window.WorkoutManager.addSet(weight, reps, {
              rpe: rpe,
              isWarmup: isWarmup
            });

            window.NotificationManager.success('Série ajoutée !');

            // Démarrer le timer de repos
            if (!isWarmup) {
              const restTime = 90; // 90 secondes par défaut
              window.TimerManager.startTimer(restTime);
            }

            // Reset form
            document.getElementById('add-set-form').reset();
            document.getElementById('rpe-value').textContent = '8.0';
            isWarmup = false;
            document.getElementById('warmup-btn')?.classList.remove('btn--warning');
            document.getElementById('warmup-btn')?.classList.add('btn--secondary');

            // Recharger la page
            await router.handleRoute();
          } catch (error) {
            console.error('Erreur:', error);
            window.NotificationManager.error('Erreur lors de l\'ajout de la série');
          }
        };

        window.finishExercise = function() {
          window.WorkoutManager.currentExercise = null;
          router.navigate('workout');
        };

        window.completeWorkout = async function() {
          try {
            const result = await window.WorkoutManager.completeWorkout();
            window.NotificationManager.success(
              \`Séance terminée ! +\${result.xpEarned} XP\`,
              'Bravo !'
            );
            router.navigate('dashboard');
          } catch (error) {
            console.error('Erreur:', error);
            window.NotificationManager.error(error.message);
          }
        };

        window.cancelWorkout = function() {
          if (confirm('Voulez-vous vraiment annuler cette séance ?')) {
            window.WorkoutManager.cancelWorkout();
            window.NotificationManager.info('Séance annulée');
            router.navigate('dashboard');
          }
        };
      </script>
    `;
  }

  async function renderHistory() {
    const workouts = await window.fitnessDB.getAll('workouts');
    const sortedWorkouts = workouts.sort((a, b) =>
      new Date(b.workoutDate) - new Date(a.workoutDate)
    );

    return `
      <div class="container">
        <section class="section">
          <h1 class="section__title">Historique</h1>
          <p class="section__subtitle">${workouts.length} séances enregistrées</p>

          ${sortedWorkouts.length > 0 ? `
            <div class="flex flex-col gap-3">
              ${sortedWorkouts.map(w => `
                <div class="card">
                  <div class="flex justify-between items-start mb-3">
                    <div>
                      <div class="card__title">${w.name || 'Séance'}</div>
                      <div class="card__subtitle">${new Date(w.workoutDate).toLocaleDateString('fr-FR')}</div>
                    </div>
                    ${w.isCompleted ? '<span class="badge badge--success">Terminée</span>' : '<span class="badge badge--warning">En cours</span>'}
                  </div>

                  <div class="grid grid--3 gap-4">
                    <div>
                      <div class="text-xs text-tertiary">Volume</div>
                      <div class="text-lg font-bold">${Math.round(w.totalVolume)} kg</div>
                    </div>
                    <div>
                      <div class="text-xs text-tertiary">XP Gagné</div>
                      <div class="text-lg font-bold text-warning">${w.xpEarned}</div>
                    </div>
                    <div>
                      <div class="text-xs text-tertiary">Durée</div>
                      <div class="text-lg font-bold">${w.durationMinutes || '-'} min</div>
                    </div>
                  </div>
                </div>
              `).join('')}
            </div>
          ` : `
            <div class="empty-state">
              <svg class="empty-state__icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h2 class="empty-state__title">Aucune séance enregistrée</h2>
              <p class="empty-state__description">Commencez votre première séance pour voir votre historique ici</p>
              <button class="btn btn--primary" onclick="router.navigate('workout')">
                Commencer une séance
              </button>
            </div>
          `}
        </section>
      </div>
    `;
  }

  async function renderStats() {
    const user = await getUserData();

    return `
      <div class="container">
        <section class="section">
          <h1 class="section__title">Statistiques RPG</h1>
          <p class="section__subtitle">Vos performances</p>

          <!-- Niveau et XP -->
          <div class="card card--glow mb-6">
            <div class="text-center">
              <div class="badge badge--level mb-4" style="font-size: 1.5rem; padding: 0.75rem 2rem;">
                Niveau ${user.level}
              </div>
              <div class="text-5xl font-extrabold mb-4">${user.totalXP} XP</div>
              <div class="progress progress--lg progress--xp mb-2">
                <div class="progress__bar" style="width: ${user.progress}%"></div>
              </div>
              <div class="text-sm text-secondary">
                ${user.currentXP} / ${user.xpForNextLevel} XP pour le prochain niveau
              </div>
            </div>
          </div>

          <!-- Stats secondaires -->
          <div class="grid grid--2 gap-4">
            <div class="stat-card">
              <div class="stat-card__label">Force</div>
              <div class="stat-card__value">42</div>
              <div class="progress progress--strength mt-3">
                <div class="progress__bar" style="width: 42%"></div>
              </div>
            </div>

            <div class="stat-card">
              <div class="stat-card__label">Endurance</div>
              <div class="stat-card__value">58</div>
              <div class="progress progress--endurance mt-3">
                <div class="progress__bar" style="width: 58%"></div>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async function renderProfile() {
    const user = await getUserData();
    const hasToken = !!localStorage.getItem('auth_token');

    return `
      <div class="container">
        <section class="section">
          <h1 class="section__title">Profil</h1>

          <div class="card mb-6">
            <div class="text-center mb-6">
              <div style="width: 80px; height: 80px; margin: 0 auto; background: var(--accent-primary); border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 2rem; font-weight: bold; color: white;">
                ${user.username ? user.username[0].toUpperCase() : 'U'}
              </div>
              <h2 class="mt-4 text-2xl font-bold">${user.username || 'Utilisateur'}</h2>
              <p class="text-secondary">Niveau ${user.level}</p>
              ${!hasToken ? '<p class="text-warning text-sm mt-2">⚠️ Mode hors ligne</p>' : '<p class="text-success text-sm mt-2">✅ Connecté</p>'}
            </div>

            <div class="flex flex-col gap-3">
              ${!hasToken ? `
                <button class="btn btn--primary btn--block" onclick="router.navigate('login')">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                  </svg>
                  Se connecter
                </button>
              ` : `
                <button class="btn btn--secondary btn--block" onclick="syncData()">
                  <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  Synchroniser les données
                </button>

                <button class="btn btn--danger btn--block" onclick="logout()">
                  Déconnexion
                </button>
              `}

              <button class="btn btn--secondary btn--block" onclick="window.location.reload()">
                <svg width="20" height="20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres
              </button>
            </div>
          </div>
        </section>
      </div>
    `;
  }

  async function renderLogin() {
    return `
      <div class="container container--narrow">
        <section class="section">
          <h1 class="section__title text-center">Connexion</h1>
          <p class="section__subtitle text-center">Connectez-vous pour synchroniser vos données</p>

          <div class="card">
            <form id="login-form" class="flex flex-col gap-4">
              <div class="form-group">
                <label class="form-label">Username</label>
                <input type="text" class="form-input" id="login-username" placeholder="Votre username" required>
              </div>

              <div class="form-group">
                <label class="form-label">Mot de passe</label>
                <input type="password" class="form-input" id="login-password" placeholder="••••••••" required>
              </div>

              <button type="submit" class="btn btn--primary btn--block btn--lg">
                Se connecter
              </button>

              <button type="button" class="btn btn--ghost btn--block" onclick="router.navigate('register')">
                Créer un compte
              </button>

              <button type="button" class="btn btn--ghost btn--block" onclick="router.navigate('dashboard')">
                Continuer hors ligne
              </button>
            </form>
          </div>
        </section>
      </div>

      <script>
        document.getElementById('login-form').addEventListener('submit', async (e) => {
          e.preventDefault();

          const username = document.getElementById('login-username').value;
          const password = document.getElementById('login-password').value;

          try {
            const response = await fetch('http://localhost:5000/api/auth/login', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, password })
            });

            const data = await response.json();

            if (response.ok) {
              localStorage.setItem('auth_token', data.token);

              // Sauvegarder/mettre à jour l'utilisateur dans IndexedDB
              await window.fitnessDB.put('user', {
                uuid: data.user.uuid,
                username: data.user.username,
                email: data.user.email,
                totalXP: data.user.total_xp || 0,
                currentLevel: data.user.level || 1,
                lastSync: new Date().toISOString()
              });

              window.NotificationManager.success('Connexion réussie !');

              // Démarrer la sync auto (non-bloquant)
              window.SyncQueueManager.init().catch(err => {
                console.warn('Sync init warning:', err);
              });

              router.navigate('dashboard');
            } else {
              window.NotificationManager.error(data.error || 'Erreur de connexion');
            }
          } catch (error) {
            console.error('Erreur:', error);
            window.NotificationManager.error('Impossible de se connecter au serveur');
          }
        });
      </script>
    `;
  }

  async function renderRegister() {
    return `
      <div class="container container--narrow">
        <section class="section">
          <h1 class="section__title text-center">Créer un compte</h1>
          <p class="section__subtitle text-center">Synchronisez vos données sur tous vos appareils</p>

          <div class="card">
            <form id="register-form" class="flex flex-col gap-4">
              <div class="form-group">
                <label class="form-label form-label--required">Username</label>
                <input type="text" class="form-input" id="register-username" placeholder="Votre username" required minlength="3">
              </div>

              <div class="form-group">
                <label class="form-label form-label--required">Email</label>
                <input type="email" class="form-input" id="register-email" placeholder="votre@email.com" required>
              </div>

              <div class="form-group">
                <label class="form-label form-label--required">Mot de passe</label>
                <input type="password" class="form-input" id="register-password" placeholder="••••••••" required minlength="6">
              </div>

              <button type="submit" class="btn btn--primary btn--block btn--lg">
                Créer mon compte
              </button>

              <button type="button" class="btn btn--ghost btn--block" onclick="router.navigate('login')">
                Déjà un compte ? Se connecter
              </button>

              <button type="button" class="btn btn--ghost btn--block" onclick="router.navigate('dashboard')">
                Continuer hors ligne
              </button>
            </form>
          </div>
        </section>
      </div>

      <script>
        document.getElementById('register-form').addEventListener('submit', async (e) => {
          e.preventDefault();

          const username = document.getElementById('register-username').value;
          const email = document.getElementById('register-email').value;
          const password = document.getElementById('register-password').value;

          try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ username, email, password })
            });

            const data = await response.json();

            if (response.ok) {
              localStorage.setItem('auth_token', data.token);

              // Sauvegarder l'utilisateur dans IndexedDB
              await window.fitnessDB.put('user', {
                uuid: data.user.uuid,
                username: data.user.username,
                email: data.user.email,
                totalXP: data.user.total_xp || 0,
                currentLevel: data.user.level || 1,
                lastSync: new Date().toISOString()
              });

              window.NotificationManager.success('Compte créé avec succès !');

              // Démarrer la sync auto (non-bloquant)
              window.SyncQueueManager.init().catch(err => {
                console.warn('Sync init warning:', err);
              });

              router.navigate('dashboard');
            } else {
              window.NotificationManager.error(data.error || 'Erreur lors de la création du compte');
            }
          } catch (error) {
            console.error('Erreur:', error);
            window.NotificationManager.error('Impossible de contacter le serveur');
          }
        });
      </script>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // HELPERS DE DONNÉES
  // ═══════════════════════════════════════════════════════════

  async function getUserData() {
    // Récupérer ou créer l'utilisateur local
    let users = await window.fitnessDB.getAll('user');

    if (users.length === 0) {
      // Créer un utilisateur par défaut
      const defaultUser = {
        uuid: crypto.randomUUID(),
        username: 'Aventurier',
        level: 1,
        totalXP: 0,
        currentXP: 0,
        xpForNextLevel: 100,
        progress: 0,
        lastSync: new Date().toISOString()
      };

      await window.fitnessDB.put('user', defaultUser);
      return defaultUser;
    }

    const user = users[0];

    // Calculer le niveau avec RPG_FORMULAS
    if (window.RPG_FORMULAS) {
      const levelData = window.RPG_FORMULAS.calculateLevel(user.totalXP || 0);
      return { ...user, ...levelData };
    }

    return user;
  }

  async function getRecentWorkouts(limit = 5) {
    const workouts = await window.fitnessDB.getAll('workouts');
    return workouts
      .sort((a, b) => new Date(b.workoutDate) - new Date(a.workoutDate))
      .slice(0, limit);
  }

  async function getTotalWorkouts() {
    const workouts = await window.fitnessDB.getAll('workouts');
    return workouts.filter(w => w.isCompleted).length;
  }

  function renderRecentWorkouts(workouts) {
    return workouts.map(w => `
      <div class="card mb-3">
        <div class="flex justify-between">
          <div>
            <div class="card__title">${w.name || 'Séance'}</div>
            <div class="card__subtitle">${new Date(w.workoutDate).toLocaleDateString('fr-FR')}</div>
          </div>
          <div class="text-right">
            <div class="text-lg font-bold text-warning">+${w.xpEarned} XP</div>
            <div class="text-sm text-tertiary">${Math.round(w.totalVolume)} kg</div>
          </div>
        </div>
      </div>
    `).join('');
  }

  function renderEmptyWorkouts() {
    return `
      <div class="empty-state">
        <p class="text-secondary">Aucune séance récente</p>
      </div>
    `;
  }

  // ═══════════════════════════════════════════════════════════
  // ÉVÉNEMENTS GLOBAUX
  // ═══════════════════════════════════════════════════════════

  function setupGlobalEvents() {
    // Bouton de synchronisation
    document.getElementById('sync-btn')?.addEventListener('click', syncData);

    // Bouton de profil
    document.getElementById('profile-btn')?.addEventListener('click', () => {
      router.navigate('profile');
    });
  }

  async function syncData() {
    console.log('🔄 Synchronisation...');
    // TODO: Implémenter la synchro complète
    showToast('Synchronisation en cours...', 'info');
  }

  function checkNetworkStatus() {
    window.addEventListener('online', () => {
      console.log('✅ Connexion rétablie');
      window.NotificationManager.success('Connexion rétablie', 'Réseau');
    });

    window.addEventListener('offline', () => {
      console.log('⚠️ Hors ligne');
      window.NotificationManager.warning('Mode hors ligne activé', 'Réseau');
    });
  }

  /**
   * Écoute les événements RPG pour afficher des notifications
   */
  function listenToRPGEvents() {
    // Level up
    window.RPGManager.on('level-up', ({ newLevel }) => {
      console.log(`🎉 LEVEL UP ! Niveau ${newLevel}`);
    });

    // XP gagné
    window.RPGManager.on('xp-gained', ({ amount, hasLeveledUp }) => {
      if (!hasLeveledUp) {
        window.NotificationManager.xpGained(amount);
      }
    });

    // Boss Battle
    window.RPGManager.on('boss-battle', ({ exerciseName }) => {
      console.log('⚔️ BOSS BATTLE:', exerciseName);
    });

    // Achievement débloqué
    window.RPGManager.on('achievement-unlocked', (achievement) => {
      window.NotificationManager.achievement(achievement.title, achievement.description);
    });

    // Séance terminée
    window.WorkoutManager.on('workout-completed', async ({ workout, xpResult }) => {
      window.NotificationManager.success(
        `${workout.xpEarned} XP gagnés ! Volume: ${Helpers.formatWeight(workout.totalVolume)}`,
        'Séance terminée'
      );

      // Recharger le dashboard si on y est
      if (router.getCurrentRoute() === 'dashboard') {
        await router.handleRoute();
      }
    });
  }

  function showToast(message, type = 'info') {
    window.NotificationManager.show({ type, message });
  }

  function showError(message) {
    console.error('❌', message);
    window.NotificationManager.error(message);
  }

  // Exposer des fonctions globalement (pour onclick dans le HTML)
  window.selectExercise = async (uuid) => {
    try {
      console.log('Exercice sélectionné:', uuid);

      // Démarrer une séance si aucune n'est en cours
      if (!window.WorkoutManager.currentWorkout) {
        console.log('🔄 Démarrage automatique d\'une séance...');
        await window.WorkoutManager.startWorkout();
        window.NotificationManager.info('Séance démarrée automatiquement');
      }

      // Ajouter l'exercice
      await window.WorkoutManager.addExercise(uuid);
      window.NotificationManager.success('Exercice ajouté à la séance');

      // Rediriger vers la page de saisie de séries
      router.navigate('workout-active');

    } catch (error) {
      console.error('❌ Erreur lors de l\'ajout d\'exercice:', error);
      window.NotificationManager.error('Impossible d\'ajouter l\'exercice');
    }
  };

  window.syncData = async () => {
    try {
      const hasToken = !!localStorage.getItem('auth_token');

      if (!hasToken) {
        window.NotificationManager.warning(
          'Connectez-vous pour synchroniser avec le serveur',
          'Authentification requise'
        );
        return;
      }

      await window.SyncQueueManager.forceSync();
    } catch (error) {
      window.NotificationManager.error('Erreur de synchronisation');
    }
  };

  window.logout = () => {
    window.NotificationManager.confirm({
      title: 'Déconnexion',
      message: 'Êtes-vous sûr de vouloir vous déconnecter ?',
      confirmText: 'Déconnexion',
      onConfirm: () => {
        localStorage.removeItem('auth_token');
        window.location.reload();
      }
    });
  };

  // ═══════════════════════════════════════════════════════════
  // DÉMARRAGE
  // ═══════════════════════════════════════════════════════════

  initApp();

})();