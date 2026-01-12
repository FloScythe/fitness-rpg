from datetime import datetime, timezone
from . import db


class WorkoutExercise(db.Model):
    """Exercice dans une séance (table de liaison avec séries)"""
    __tablename__ = 'workout_exercises'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)
    workout_id = db.Column(db.Integer, db.ForeignKey('workouts.id'), nullable=False)
    exercise_id = db.Column(db.Integer, db.ForeignKey('exercises.id'), nullable=False)

    # Ordre dans la séance
    order_index = db.Column(db.Integer, default=0)

    # Statistiques agrégées
    total_sets = db.Column(db.Integer, default=0)
    total_reps = db.Column(db.Integer, default=0)
    total_volume = db.Column(db.Float, default=0)  # Somme des (poids × reps)
    estimated_1rm = db.Column(db.Float)  # Meilleur 1RM estimé de la séance

    # Métadonnées
    notes = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))

    # Relations
    workout = db.relationship('Workout', back_populates='workout_exercises', uselist=False)
    exercises = db.relationship('ExerciseSet', back_populates='workouts', uselist=True)

    def __repr__(self):
        return f'<WorkoutExercise {self.exercise.name} - {self.total_sets} sets>'
