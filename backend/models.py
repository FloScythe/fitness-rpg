"""
Modèles de base de données pour FitnessRPG
Architecture: Stockage serveur pour synchronisation et backup
"""
from datetime import datetime
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    """Utilisateur de l'application"""
    __tablename__ = 'users'

    id = db.Column(db.Integer, primary_key=True)
    uuid = db.Column(db.String(36), unique=True, nullable=False, index=True)  # UUID côté client
    username = db.Column(db.String(50), unique=True, nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password_hash = db.Column(db.String(255), nullable=False)

    # Progression RPG
    total_xp = db.Column(db.Integer, default=0)
    current_level = db.Column(db.Integer, default=1)

    # Métadonnées
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    last_sync = db.Column(db.DateTime, default=datetime.utcnow)

    # Relations
    workouts = db.relationship('Workout', backref='user', lazy=True, cascade='all, delete-orphan')
    exercises = db.relationship('Exercise', backref='user', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<User {self.username} - Lvl {self.current_level}>'


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

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    workout_exercises = db.relationship('WorkoutExercise', backref='exercise', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Exercise {self.name}>'


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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relations
    workout_exercises = db.relationship('WorkoutExercise', backref='workout', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<Workout {self.name} - {self.workout_date.date()}>'


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
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    # Relations
    sets = db.relationship('ExerciseSet', backref='workout_exercise', lazy=True, cascade='all, delete-orphan')

    def __repr__(self):
        return f'<WorkoutExercise {self.exercise.name} - {self.total_sets} sets>'


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

    created_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Set {self.set_number}: {self.weight_kg}kg × {self.reps}>'


class SyncQueue(db.Model):
    """File d'attente de synchronisation (logs des syncs)"""
    __tablename__ = 'sync_queue'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)

    # Données de synchronisation
    entity_type = db.Column(db.String(50), nullable=False)  # workout, exercise, set
    entity_uuid = db.Column(db.String(36), nullable=False, index=True)
    action = db.Column(db.String(20), nullable=False)  # create, update, delete

    # Métadonnées
    sync_status = db.Column(db.String(20), default='pending')  # pending, synced, failed
    payload = db.Column(db.Text)  # JSON des données
    error_message = db.Column(db.Text)

    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    synced_at = db.Column(db.DateTime)

    def __repr__(self):
        return f'<SyncQueue {self.entity_type} - {self.action}>'


class UserStats(db.Model):
    """Statistiques calculées périodiquement (cache)"""
    __tablename__ = 'user_stats'

    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    stat_date = db.Column(db.Date, nullable=False, index=True)

    # Statistiques RPG
    strength_stat = db.Column(db.Integer, default=0)
    endurance_stat = db.Column(db.Integer, default=0)

    # Statistiques d'entraînement
    total_workouts = db.Column(db.Integer, default=0)
    total_volume = db.Column(db.Float, default=0)
    total_sets = db.Column(db.Integer, default=0)

    # Records personnels
    heaviest_lift = db.Column(db.Float)
    best_1rm = db.Column(db.Float)

    calculated_at = db.Column(db.DateTime, default=datetime.utcnow)

    __table_args__ = (
        db.UniqueConstraint('user_id', 'stat_date', name='_user_date_uc'),
    )

    def __repr__(self):
        return f'<UserStats {self.stat_date} - STR:{self.strength_stat} END:{self.endurance_stat}>'