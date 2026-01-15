"""
FitnessRPG - Application Flask Principale
Point d'entrée de l'API Backend
"""
from datetime import datetime

from flask import Flask, jsonify
from flask_cors import CORS

# Import de la configuration
from config import get_config
# Import des modèles
from models import (
    User,
    UserStats,
    Workout,
    WorkoutExercise,
    Exercise,
    ExerciseSet,
    SyncQueue,
    db
)
from routes.exercises import exercises_bp
from routes.stats import stats_bp
# Import des routes
from routes.sync import sync_bp
# Import des utilitaires
from utils.auth import auth_bp


def create_app(config_name='development'):
    """Factory pour créer l'application Flask"""
    app = Flask(__name__)

    # Charger la configuration
    app.config.from_object(get_config())

    # Créer le dossier instance s'il n'existe pas
    import os
    instance_path = os.path.join(os.path.dirname(__file__), 'instance')
    if not os.path.exists(instance_path):
        os.makedirs(instance_path)
        print(f'📁 Dossier instance créé : {instance_path}')

    # Initialiser les extensions
    db.init_app(app)
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config['CORS_ORIGINS'],
            "methods": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })

    # Créer les tables si nécessaire
    with app.app_context():
        db.create_all()
        _seed_default_exercises()

    # ═══════════════════════════════════════════════════════════
    # BLUEPRINTS
    # ═══════════════════════════════════════════════════════════
    # Enregistrer les blueprints
    app.register_blueprint(sync_bp)
    app.register_blueprint(stats_bp)
    app.register_blueprint(exercises_bp, url_prefix='/api')
    app.register_blueprint(auth_bp, url_prefix='/api/auth')

    # ═══════════════════════════════════════════════════════════
    # ROUTES GÉNÉRALES
    # ═══════════════════════════════════════════════════════════

    @app.route('/api/health', methods=['GET'])
    def health_check():
        """Vérification de l'état du serveur"""
        return jsonify({
            'status': 'online',
            'message': 'FitnessRPG API is running',
            'version': '1.0.0'
        }), 200

    # ═══════════════════════════════════════════════════════════
    # GESTION DES ERREURS
    # ═══════════════════════════════════════════════════════════

    @app.errorhandler(404)
    def not_found(error):
        return jsonify({'error': 'Route non trouvée'}), 404

    @app.errorhandler(500)
    def internal_error(error):
        db.session.rollback()
        return jsonify({'error': 'Erreur serveur interne'}), 500

    return app


def _seed_default_exercises():
    """Charge les exercices par défaut dans la base de données"""
    # Vérifier si des exercices existent déjà
    if Exercise.query.filter_by(is_custom=False).count() > 0:
        return

    print('🌱 Chargement des exercices par défaut...')

    # Liste des exercices (identique à exercises-seed.js)
    default_exercises = [
        # PUSH
        {'uuid': 'ex-bench-press', 'name': 'Développé Couché (Bench Press)', 'category': 'push',
         'muscle_group': 'chest', 'stat_type': 'strength', 'xp_multiplier': 1.5},
        {'uuid': 'ex-incline-bench', 'name': 'Développé Incliné', 'category': 'push', 'muscle_group': 'chest',
         'stat_type': 'strength', 'xp_multiplier': 1.3},
        {'uuid': 'ex-dumbbell-press', 'name': 'Développé Haltères', 'category': 'push', 'muscle_group': 'chest',
         'stat_type': 'strength', 'xp_multiplier': 1.2},
        {'uuid': 'ex-overhead-press', 'name': 'Développé Militaire (OHP)', 'category': 'push',
         'muscle_group': 'shoulders', 'stat_type': 'strength', 'xp_multiplier': 1.4},
        {'uuid': 'ex-dips', 'name': 'Dips', 'category': 'push', 'muscle_group': 'triceps', 'stat_type': 'strength',
         'xp_multiplier': 1.3},
        {'uuid': 'ex-pushups', 'name': 'Pompes (Push-ups)', 'category': 'push', 'muscle_group': 'chest',
         'stat_type': 'endurance', 'xp_multiplier': 0.7},

        # PULL
        {'uuid': 'ex-deadlift', 'name': 'Soulevé de Terre (Deadlift)', 'category': 'pull', 'muscle_group': 'back',
         'stat_type': 'strength', 'xp_multiplier': 2.0},
        {'uuid': 'ex-barbell-row', 'name': 'Rowing Barre', 'category': 'pull', 'muscle_group': 'back',
         'stat_type': 'strength', 'xp_multiplier': 1.4},
        {'uuid': 'ex-pullups', 'name': 'Tractions (Pull-ups)', 'category': 'pull', 'muscle_group': 'back',
         'stat_type': 'strength', 'xp_multiplier': 1.5},
        {'uuid': 'ex-lat-pulldown', 'name': 'Tirage Vertical', 'category': 'pull', 'muscle_group': 'back',
         'stat_type': 'strength', 'xp_multiplier': 1.2},
        {'uuid': 'ex-barbell-curl', 'name': 'Curl Barre', 'category': 'pull', 'muscle_group': 'biceps',
         'stat_type': 'strength', 'xp_multiplier': 0.9},

        # LEGS
        {'uuid': 'ex-squat', 'name': 'Squat Barre', 'category': 'legs', 'muscle_group': 'quads',
         'stat_type': 'strength', 'xp_multiplier': 1.8},
        {'uuid': 'ex-leg-press', 'name': 'Presse à Cuisses', 'category': 'legs', 'muscle_group': 'quads',
         'stat_type': 'strength', 'xp_multiplier': 1.3},
        {'uuid': 'ex-romanian-deadlift', 'name': 'Soulevé de Terre Roumain', 'category': 'legs',
         'muscle_group': 'hamstrings', 'stat_type': 'strength', 'xp_multiplier': 1.5},
        {'uuid': 'ex-lunges', 'name': 'Fentes', 'category': 'legs', 'muscle_group': 'quads', 'stat_type': 'endurance',
         'xp_multiplier': 1.0},

        # CORE
        {'uuid': 'ex-plank', 'name': 'Planche (Plank)', 'category': 'core', 'muscle_group': 'abs',
         'stat_type': 'endurance', 'xp_multiplier': 0.5},
        {'uuid': 'ex-hanging-leg-raise', 'name': 'Relevé de Jambes Suspendu', 'category': 'core', 'muscle_group': 'abs',
         'stat_type': 'strength', 'xp_multiplier': 1.0},

        # CARDIO
        {'uuid': 'ex-running', 'name': 'Course à Pied', 'category': 'cardio', 'muscle_group': 'full-body',
         'stat_type': 'endurance', 'xp_multiplier': 0.5},
    ]

    for ex_data in default_exercises:
        exercise = Exercise(
            uuid=ex_data['uuid'],
            user_id=None,  # Exercice global
            name=ex_data['name'],
            category=ex_data['category'],
            muscle_group=ex_data['muscle_group'],
            stat_type=ex_data['stat_type'],
            xp_multiplier=ex_data['xp_multiplier'],
            is_custom=False,
            is_archived=False,
            created_at=datetime.utcnow(),
            updated_at=datetime.utcnow()
        )
        db.session.add(exercise)

    db.session.commit()
    print(f'✅ {len(default_exercises)} exercices chargés !')


# ═══════════════════════════════════════════════════════════
# POINT D'ENTRÉE
# ═══════════════════════════════════════════════════════════

if __name__ == '__main__':
    app = create_app('development')
    app.run(host='0.0.0.0', port=5000, debug=True)
