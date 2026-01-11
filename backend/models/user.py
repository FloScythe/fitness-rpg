from argon2 import PasswordHasher
from argon2.exceptions import VerifyMismatchError
from utils.db import db

# On prépare notre outil une seule fois pour tout le fichier
ph = PasswordHasher()


class User(db.models):
    def __init__(self, username, email, password_hash=None):
        self.username = username
        self.email = email
        self.password_hash = password_hash

    def set_password(self, password):
        """Hache le mot de passe et l'enregistre dans l'objet"""
        self.password_hash = ph.hash(password)

    def check_password(self, password):
        """Vérifie si le mot de passe fourni correspond au hash"""
        try:
            return ph.verify(self.password_hash,password)
        except VerifyMismatchError:
            return False
