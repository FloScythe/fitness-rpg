from flask_sqlalchemy import SQLAlchemy

# On initialise l'objet db ici pour qu'il soit partagé par tous les modèles
db = SQLAlchemy()

# 2. On importe nos classes pour qu'elles soient "visibles" par l'application
from .user import User
from .stats import UserStats
from .workout import Workout
from .workoutexercise import WorkoutExercise
from .exercise import Exercise
from .exerciseset import ExerciseSet
from .sync import SyncQueue
