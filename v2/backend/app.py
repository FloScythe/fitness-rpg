"""
Backend FitnessRPG v2 - API d'authentification simple
"""
import os
import uuid
from datetime import datetime, timedelta, timezone

from flask import Flask, request, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
import jwt

# ====================================
# Configuration
# ====================================

app = Flask(__name__)
app.config['SECRET_KEY'] = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///fitnessrpg.db'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

CORS(app)
db = SQLAlchemy(app)
ph = PasswordHasher()

# ====================================
# Modèles
# ====================================

class User(db.Model):
    """Modèle utilisateur"""
    __tablename__ = 'users'

    uuid = db.Column(db.String(36), primary_key=True)
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)
    level = db.Column(db.Integer, default=1)
    total_xp = db.Column(db.Integer, default=0)
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relation avec les workouts
    workouts = db.relationship('Workout', backref='user', lazy=True, cascade='all, delete-orphan')

    def to_dict(self):
        return {
            'uuid': self.uuid,
            'username': self.username,
            'email': self.email,
            'level': self.level,
            'total_xp': self.total_xp,
            'created_at': self.created_at.isoformat()
        }


class Workout(db.Model):
    """Modèle workout (séance d'entraînement)"""
    __tablename__ = 'workouts'

    id = db.Column(db.Integer, primary_key=True)
    user_uuid = db.Column(db.String(36), db.ForeignKey('users.uuid'), nullable=False)
    date = db.Column(db.DateTime, nullable=False)
    start_time = db.Column(db.BigInteger, nullable=False)  # timestamp en millisecondes
    end_time = db.Column(db.BigInteger, nullable=True)
    duration = db.Column(db.Integer, nullable=True)  # durée en millisecondes
    total_xp = db.Column(db.Integer, default=0)
    exercises_json = db.Column(db.Text, nullable=False)  # JSON stringifié des exercices
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    def to_dict(self):
        import json
        return {
            'id': self.id,
            'user_uuid': self.user_uuid,
            'date': self.date.isoformat(),
            'startTime': self.start_time,
            'endTime': self.end_time,
            'duration': self.duration,
            'totalXP': self.total_xp,
            'exercises': json.loads(self.exercises_json) if self.exercises_json else [],
            'created_at': self.created_at.isoformat()
        }

# ====================================
# Utilitaires JWT
# ====================================

def generate_token(user_uuid):
    """Générer un token JWT"""
    payload = {
        'user_uuid': user_uuid,
        'exp': datetime.now(timezone.utc) + timedelta(days=30)
    }
    return jwt.encode(payload, app.config['SECRET_KEY'], algorithm='HS256')

def verify_token(token):
    """Vérifier un token JWT"""
    try:
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        return payload['user_uuid']
    except jwt.ExpiredSignatureError:
        return None
    except jwt.InvalidTokenError:
        return None

# ====================================
# Routes d'authentification
# ====================================

@app.route('/api/auth/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    data = request.get_json()

    # Validation
    username = data.get('username', '').strip()
    email = data.get('email', '').strip()
    password = data.get('password', '')

    if not username or not email or not password:
        return jsonify({'error': 'Tous les champs sont requis'}), 400

    if len(username) < 3:
        return jsonify({'error': 'Le nom d\'utilisateur doit contenir au moins 3 caractères'}), 400

    if len(password) < 6:
        return jsonify({'error': 'Le mot de passe doit contenir au moins 6 caractères'}), 400

    # Vérifier si l'utilisateur existe déjà
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Ce nom d\'utilisateur est déjà utilisé'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409

    # Créer l'utilisateur
    user_uuid = str(uuid.uuid4())
    password_hash = ph.hash(password)

    new_user = User(
        uuid=user_uuid,
        username=username,
        email=email,
        password_hash=password_hash
    )

    try:
        db.session.add(new_user)
        db.session.commit()

        # Générer le token
        token = generate_token(user_uuid)

        return jsonify({
            'message': 'Compte créé avec succès',
            'token': token,
            'user': new_user.to_dict()
        }), 201

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur inscription: {e}")
        return jsonify({'error': 'Erreur lors de la création du compte'}), 500


@app.route('/api/auth/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    data = request.get_json()

    # Validation
    username = data.get('username', '').strip()
    password = data.get('password', '')

    if not username or not password:
        return jsonify({'error': 'Nom d\'utilisateur et mot de passe requis'}), 400

    # Chercher l'utilisateur
    user = User.query.filter_by(username=username).first()

    if not user:
        return jsonify({'error': 'Nom d\'utilisateur ou mot de passe incorrect'}), 401

    # Vérifier le mot de passe
    try:
        ph.verify(user.password_hash, password)
    except VerifyMismatchError:
        return jsonify({'error': 'Nom d\'utilisateur ou mot de passe incorrect'}), 401

    # Générer le token
    token = generate_token(user.uuid)

    return jsonify({
        'message': 'Connexion réussie',
        'token': token,
        'user': user.to_dict()
    }), 200


@app.route('/api/auth/me', methods=['GET'])
def get_current_user():
    """Récupérer l'utilisateur actuel (avec token)"""
    auth_header = request.headers.get('Authorization')

    if not auth_header or not auth_header.startswith('Bearer '):
        return jsonify({'error': 'Token manquant'}), 401

    token = auth_header.split(' ')[1]
    user_uuid = verify_token(token)

    if not user_uuid:
        return jsonify({'error': 'Token invalide ou expiré'}), 401

    user = User.query.get(user_uuid)

    if not user:
        return jsonify({'error': 'Utilisateur non trouvé'}), 404

    return jsonify({
        'user': user.to_dict()
    }), 200


@app.route('/api/health', methods=['GET'])
def health():
    """Endpoint de santé"""
    return jsonify({'status': 'online'}), 200


# ====================================
# Middleware d'authentification
# ====================================

def require_auth(f):
    """Décorateur pour vérifier l'authentification"""
    from functools import wraps

    @wraps(f)
    def decorated_function(*args, **kwargs):
        auth_header = request.headers.get('Authorization')

        if not auth_header or not auth_header.startswith('Bearer '):
            return jsonify({'error': 'Token manquant'}), 401

        token = auth_header.split(' ')[1]
        user_uuid = verify_token(token)

        if not user_uuid:
            return jsonify({'error': 'Token invalide ou expiré'}), 401

        user = User.query.get(user_uuid)
        if not user:
            return jsonify({'error': 'Utilisateur non trouvé'}), 404

        # Passer l'utilisateur à la fonction
        return f(user, *args, **kwargs)

    return decorated_function


# ====================================
# Routes de synchronisation
# ====================================

@app.route('/api/sync/profile', methods=['POST'])
@require_auth
def sync_profile(user):
    """Synchroniser le profil (niveau et XP)"""
    data = request.get_json()

    level = data.get('level')
    total_xp = data.get('totalXP')

    if level is not None and level > user.level:
        user.level = level

    if total_xp is not None and total_xp > user.total_xp:
        user.total_xp = total_xp

    try:
        db.session.commit()
        return jsonify({
            'message': 'Profil synchronisé',
            'user': user.to_dict()
        }), 200
    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur sync profil: {e}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500


@app.route('/api/sync/workouts', methods=['POST'])
@require_auth
def sync_workouts(user):
    """Synchroniser les workouts locaux vers le serveur"""
    import json
    from dateutil import parser

    data = request.get_json()
    workouts = data.get('workouts', [])

    synced_count = 0
    errors = []

    for workout_data in workouts:
        try:
            # Vérifier si le workout existe déjà (par ID local ou date exacte)
            existing = Workout.query.filter_by(
                user_uuid=user.uuid,
                start_time=workout_data.get('startTime')
            ).first()

            if existing:
                continue  # Déjà synchronisé

            # Créer le nouveau workout
            new_workout = Workout(
                user_uuid=user.uuid,
                date=parser.parse(workout_data['date']),
                start_time=workout_data['startTime'],
                end_time=workout_data.get('endTime'),
                duration=workout_data.get('duration'),
                total_xp=workout_data.get('totalXP', 0),
                exercises_json=json.dumps(workout_data.get('exercises', []))
            )

            db.session.add(new_workout)
            synced_count += 1

        except Exception as e:
            errors.append(str(e))
            print(f"❌ Erreur sync workout: {e}")

    try:
        db.session.commit()

        # Recalculer l'XP total de l'utilisateur
        total_xp = db.session.query(db.func.sum(Workout.total_xp)).filter_by(user_uuid=user.uuid).scalar() or 0
        user.total_xp = total_xp
        user.level = max(1, total_xp // 100 + 1)
        db.session.commit()

        return jsonify({
            'message': f'{synced_count} séances synchronisées',
            'synced_count': synced_count,
            'errors': errors,
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur commit sync: {e}")
        return jsonify({'error': 'Erreur lors de la synchronisation'}), 500


@app.route('/api/workouts', methods=['GET'])
@require_auth
def get_workouts(user):
    """Récupérer tous les workouts d'un utilisateur"""
    workouts = Workout.query.filter_by(user_uuid=user.uuid).order_by(Workout.date.desc()).all()

    return jsonify({
        'workouts': [w.to_dict() for w in workouts]
    }), 200


@app.route('/api/workouts/<int:workout_id>', methods=['DELETE'])
@require_auth
def delete_workout(user, workout_id):
    """Supprimer un workout par ID ou startTime"""
    # Essayer de trouver par ID d'abord
    workout = Workout.query.filter_by(id=workout_id, user_uuid=user.uuid).first()

    # Si pas trouvé par ID, essayer par start_time (car le frontend utilise startTime)
    if not workout:
        workout = Workout.query.filter_by(start_time=workout_id, user_uuid=user.uuid).first()

    if not workout:
        return jsonify({'error': 'Séance non trouvée'}), 404

    try:
        db.session.delete(workout)
        db.session.commit()

        # Recalculer l'XP et le niveau de l'utilisateur après suppression
        total_xp = db.session.query(db.func.sum(Workout.total_xp)).filter_by(user_uuid=user.uuid).scalar() or 0
        user.total_xp = total_xp
        user.level = max(1, total_xp // 100 + 1)
        db.session.commit()

        return jsonify({
            'message': 'Séance supprimée',
            'user': user.to_dict()
        }), 200

    except Exception as e:
        db.session.rollback()
        print(f"❌ Erreur suppression workout: {e}")
        return jsonify({'error': 'Erreur lors de la suppression'}), 500

# ====================================
# Initialisation de la DB
# ====================================

with app.app_context():
    db.create_all()
    print('✅ Base de données initialisée')

# ====================================
# Lancement du serveur
# ====================================

if __name__ == '__main__':
    print('🚀 Démarrage du backend FitnessRPG v2...')
    print('📍 API: http://localhost:5000')
    print('📍 Health: http://localhost:5000/api/health')
    app.run(host='0.0.0.0', port=5000, debug=True)
