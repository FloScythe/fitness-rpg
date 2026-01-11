"""
FitnessRPG - Configuration Flask
Gestion des environnements (dev, prod)
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

# Chemin de base du projet
basedir = os.path.abspath(os.path.dirname(__file__))

load_dotenv()


class Config:
    """Configuration de base"""

    # Clé secrète pour sessions/JWT
    SECRET_KEY = os.environ['SECRET_KEY']

    # Base de données SQLite (chemin absolu)
    SQLALCHEMY_DATABASE_URI = os.environ.get('DATABASE_URL') or \
                              'sqlite:///' + os.path.join(basedir, 'instance', 'fitness.db')
    SQLALCHEMY_TRACK_MODIFICATIONS = False

    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY') or SECRET_KEY
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=4)  # Token valide 4 heures

    # CORS (Cross-Origin Resource Sharing)
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', '*').split(',')

    # Pagination
    MAX_ITEMS_PER_PAGE = 100

    # Upload (pour futures fonctionnalités)
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16 MB max

    # Timezone
    TIMEZONE = 'UTC'


class DevelopmentConfig(Config):
    """Configuration de développement"""
    DEBUG = True
    TESTING = False

    # Logs détaillés
    SQLALCHEMY_ECHO = True


class ProductionConfig(Config):
    """Configuration de production"""
    DEBUG = False
    TESTING = False

    # Forcer HTTPS en production
    PREFERRED_URL_SCHEME = 'https'

    # Logs minimaux
    SQLALCHEMY_ECHO = False

    # Restreindre CORS en production
    # CORS_ORIGINS = ['https://votre-domaine.com']


class TestingConfig(Config):
    """Configuration pour les tests"""
    DEBUG = True
    TESTING = True

    # Base de données en mémoire pour tests
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'


# Dictionnaire des configurations
config = {
    'development': DevelopmentConfig,
    'production': ProductionConfig,
    'testing': TestingConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Retourne la configuration selon l'environnement"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
