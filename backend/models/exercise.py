from datetime import datetime, timezone
from . import db


class Exercise(db.Model):
    """Exercice personnalisé (créé par l'utilisateur ou préchargé)"""
    __tablename__ = 'exercises'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # NULL = exercice global

    # Informations de base
    name = db.Column(db.String(100), nullable=False)
    category = db.Column(db.String(50), nullable=False)  # push, pull, legs, cardio
    muscle_group = db.Column(db.String(50))  # chest, back, shoulders, etc.

    # Métadonnées RPG
    xp_multiplier = db.Column(db.Float, default=1.0)  # Multiplicateur d'XP pour cet exercice
    stat_type = db.Column(db.String(20), default='strength')  # strength, endurance

    # Paramètres
    is_custom = db.Column(db.Boolean, default=False)
    is_archived = db.Column(db.Boolean, default=False)

    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc()))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc()), onupdate=datetime.now(timezone.utc()))

    # Relations
    workout_exercises = db.relationship('WorkoutExercise', backref='exercise', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Exercise {self.name}>'
