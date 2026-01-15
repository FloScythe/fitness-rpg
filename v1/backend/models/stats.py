from datetime import datetime, timezone

from . import db


class UserStats(db.Model):
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

    calculated_at = db.Column(db.DateTime, default=lambda: datetime.now(timezone.utc))

    # Relations
    user = db.relationship('User', back_populates='stats')

    def __repr__(self):
        return f'<UserStats {self.stat_date} - STR:{self.strength_stat} END:{self.endurance_stat}>'
