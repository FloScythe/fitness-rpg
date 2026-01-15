from datetime import datetime, timezone

from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from . import db

# On prépare notre outil une seule fois pour tout le fichier
ph = PasswordHasher()


class User(db.Model):

    __tablename__ = 'users'
    # Definition des colonnes
    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)  # UUID côté client
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(128), nullable=True)

    # Progression RPG
    total_xp = db.Column(db.Integer, default=0)
    current_level = db.Column(db.Integer, default=1)

    # Métadonnées
    created_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))
    last_sync = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relations
    stats = db.relationship('UserStats', back_populates='user', uselist=False)
    workouts = db.relationship('Workout', back_populates='user', uselist=True)

    def __init__(self, **kwargs):
        super(User, self).__init__(**kwargs)

    def set_password(self, password):
        """Hache le mot de passe et l'enregistre dans l'objet"""
        self.password_hash = ph.hash(password)

    def check_password(self, password):
        """Vérifie si le mot de passe fourni correspond au hash"""
        try:
            return ph.verify(self.password_hash, password)
        except VerifyMismatchError:
            return False
