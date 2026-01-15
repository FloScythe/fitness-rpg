"""
Modèles de base de données pour FitnessRPG
Architecture: Stockage serveur pour synchronisation et backup
"""
from datetime import datetime, timezone
from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


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

    created_at = db.Column(db.DateTime, default=datetime.now(timezone.utc))
    synced_at = db.Column(db.DateTime)

    def __repr__(self):
        return f'<SyncQueue {self.entity_type} - {self.action}>'