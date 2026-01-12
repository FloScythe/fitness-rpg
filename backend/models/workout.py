from datetime import datetime, timezone

from . import db


class Workout(db.Model):
    """Séance d'entraînement"""
    __tablename__ = 'workouts'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Informations de la séance
    name = db.Column(db.String(100))  # "Push Day A", "Leg Day", etc.
    workout_date = db.Column(db.DateTime, nullable=False, index=True)
    duration_minutes = db.Column(db.Integer)  # Durée totale en minutes

    # Statistiques RPG
    total_volume = db.Column(db.Float, default=0)  # Volume total (kg) = XP gagné
    xp_earned = db.Column(db.Integer, default=0)

    # Métadonnées
    notes = db.Column(db.Text)
    is_completed = db.Column(db.Boolean, default=False)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc()))
    updated_at = db.Column(db.DateTime, default=datetime.now(timezone.utc()), onupdate=datetime.now(timezone.utc()))

    # Relations
    workout_exercises = db.relationship('WorkoutExercise', backref='workout', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Workout {self.name} - {self.workout_date.date()}>'
