"""
FitnessRPG - Authentification JWT
Système simple et sécurisé pour l'API
"""
import uuid

import jwt
from datetime import datetime, timezone
from functools import wraps
from flask import request, jsonify, current_app, Blueprint


from sqlalchemy.exc import IntegrityError

from models import db, User

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/register', methods=['POST'])
def register():
    """Inscription d'un nouvel utilisateur"""
    data = request.get_json()

    # Valider les données
    is_valid, errors = validate_registration_data(data)
    if not is_valid:
        return jsonify({'error': 'Données invalides', 'details': errors}), 400

    username = data['username'].strip()
    email = data['email'].strip().lower()
    password = data['password']

    # Vérifier si l'utilisateur existe déjà
    if User.query.filter_by(username=username).first():
        return jsonify({'error': 'Ce username existe déjà'}), 409

    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Cet email est déjà utilisé'}), 409

    # Créer l'utilisateur
    user_uuid = str(uuid.uuid4())
    new_user = User(
        uuid=user_uuid,
        username=username,
        email=email,
        password_hash=hash_password(password),
        total_xp=0,
        current_level=1,
        created_at = datetime.now(timezone.utc),
        last_sync=datetime.utcnow()
    )
    try:
        db.session.add(new_user)
        db.session.commit()
    except IntegrityError:
        # 1. On annule la transaction ratée
        db.session.rollback()
        return jsonify({'error': 'Ce nom d\'utilisateur ou cet email est déjà utilisé'}), 409

    # Générer un token
    token = generate_token(user_uuid, username)

    return jsonify({
        'success': True,
        'message': 'Inscription réussie',
        'user': {
            'uuid': user_uuid,
            'username': username,
            'email': email,
            'level': 1,
            'total_xp': 0
        },
        'token': token
    }), 201


@auth_bp.route('/login', methods=['POST'])
def login():
    """Connexion d'un utilisateur"""
    data = request.get_json()

    # Valider les données
    is_valid, errors = validate_login_data(data)
    if not is_valid:
        return jsonify({'error': 'Données invalides', 'details': errors}), 400

    username = data['username'].strip()
    password = data['password']

    # Trouver l'utilisateur
    user = User.query.filter_by(username=username).first()

    if not user or not verify_password(user.password_hash, password):
        return jsonify({'error': 'Identifiants incorrects'}), 401

    # Générer un token
    token = generate_token(user.uuid, user.username)

    return jsonify({
        'success': True,
        'message': 'Connexion réussie',
        'user': {
            'uuid': user.uuid,
            'username': user.username,
            'email': user.email,
            'level': user.current_level,
            'total_xp': user.total_xp
        },
        'token': token
    }), 200


def hash_password(password: str) -> str:
    # On demande à l'outil de créer l'empreinte sécurisée (le hash)
    return ph.hash(password)


def verify_password(password_hash: str, password: str) -> bool:
    try:
        ph.verify(password_hash, password)
        return True
    except VerifyMismatchError:
        return False


def generate_token(user_uuid: str, username: str) -> str:
    """Génère un JWT token pour un utilisateur"""
    payload = {
        'user_uuid': user_uuid,
        'username': username,
        'exp': datetime.now(timezone.utc) + current_app.config['JWT_ACCESS_TOKEN_EXPIRES'],
        'iat': datetime.now(timezone.utc)
    }

    token = jwt.encode(
        payload,
        current_app.config['JWT_SECRET_KEY'],
        algorithm='HS256'
    )

    return token


def decode_token(token: str) -> dict:
    """Décode et valide un JWT token"""
    try:
        payload = jwt.decode(
            token,
            current_app.config['JWT_SECRET_KEY'],
            algorithms=['HS256']
        )
        return payload
    except jwt.ExpiredSignatureError:
        raise ValueError('Token expiré')
    except jwt.InvalidTokenError:
        raise ValueError('Token invalide')


def token_required(f):
    """Décorateur pour protéger les routes avec JWT"""

    @wraps(f)
    def decorated(*args, **kwargs):
        token = None

        # Récupérer le token depuis le header Authorization
        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                # Format: "Bearer <token>"
                token = auth_header.split(' ')[1]
            except IndexError:
                return jsonify({'error': 'Format de token invalide'}), 401

        if not token:
            return jsonify({'error': 'Token manquant'}), 401

        try:
            # Décoder le token
            payload = decode_token(token)
            current_user = {
                'uuid': payload['user_uuid'],
                'username': payload['username']
            }
        except ValueError as e:
            return jsonify({'error': str(e)}), 401

        # Passer l'utilisateur à la fonction protégée
        return f(current_user, *args, **kwargs)

    return decorated


def optional_token(f):
    """Décorateur pour routes où le token est optionnel"""

    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = None

        if 'Authorization' in request.headers:
            auth_header = request.headers['Authorization']
            try:
                token = auth_header.split(' ')[1]
                payload = decode_token(token)
                current_user = {
                    'uuid': payload['user_uuid'],
                    'username': payload['username']
                }
            except (IndexError, ValueError):
                pass  # Token invalide, mais c'est optionnel

        return f(current_user, *args, **kwargs)

    return decorated


def validate_registration_data(data: dict) -> tuple:
    """Valide les données d'inscription"""
    errors = []

    # Vérifier les champs requis
    required_fields = ['username', 'email', 'password']
    for field in required_fields:
        if field not in data or not data[field]:
            errors.append(f'{field} est requis')

    # Valider le username
    if 'username' in data:
        username = data['username'].strip()
        if len(username) < 3:
            errors.append('Le username doit contenir au moins 3 caractères')
        if len(username) > 50:
            errors.append('Le username ne peut pas dépasser 50 caractères')

    # Valider l'email (simple)
    if 'email' in data:
        email = data['email'].strip()
        if '@' not in email or '.' not in email:
            errors.append('Email invalide')

    # Valider le mot de passe
    if 'password' in data:
        password = data['password']
        if len(password) < 6:
            errors.append('Le mot de passe doit contenir au moins 6 caractères')

    is_valid = len(errors) == 0
    return is_valid, errors


def validate_login_data(data: dict) -> tuple:
    """Valide les données de connexion"""
    errors = []

    # Vérifier les champs requis
    if 'username' not in data or not data['username']:
        errors.append('Username requis')

    if 'password' not in data or not data['password']:
        errors.append('Password requis')

    is_valid = len(errors) == 0
    return is_valid, errors
