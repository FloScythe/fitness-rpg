from datetime import datetime, timezone
from . import db


class ExerciseSet(db.Model):
    """Série individuelle d'un exercice"""
    __tablename__ = 'exercise_sets'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)
    workout_exercise_id = db.Column(db.Integer, db.ForeignKey('workout_exercises.id'), nullable=False)

    # Données de la série
    set_number = db.Column(db.Integer, nullable=False)  # Numéro de série (1, 2, 3...)
    weight_kg = db.Column(db.Float, nullable=False)
    reps = db.Column(db.Integer, nullable=False)
    rpe = db.Column(db.Float)  # Rate of Perceived Exertion (6-10)

    # Calculs automatiques
    volume = db.Column(db.Float)  # weight_kg × reps
    estimated_1rm = db.Column(db.Float)  # Formule de Brzycki

    # Contexte
    is_warmup = db.Column(db.Boolean, default=False)
    is_pr = db.Column(db.Boolean, default=False)  # Personal Record (Boss Battle!)
    rest_seconds = db.Column(db.Integer)  # Temps de repos après cette série

    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc()))

    def __repr__(self):
        return f'<Set {self.set_number}: {self.weight_kg}kg × {self.reps}>'

