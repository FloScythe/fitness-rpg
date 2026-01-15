#!/usr/bin/env python3
"""
Script de test pour l'API de synchronisation
"""
import requests
import json

BASE_URL = "http://localhost:5000/api"

def test_register():
    """Test d'inscription"""
    print("\n📝 Test inscription...")
    response = requests.post(f"{BASE_URL}/auth/register", json={
        "username": "synctest",
        "email": "sync@test.com",
        "password": "test123"
    })

    if response.status_code == 201:
        data = response.json()
        print(f"✅ Compte créé : {data['user']['username']}")
        return data['token']
    else:
        print(f"❌ Erreur : {response.json()}")
        return None

def test_login():
    """Test de connexion"""
    print("\n🔐 Test connexion...")
    response = requests.post(f"{BASE_URL}/auth/login", json={
        "username": "synctest",
        "password": "test123"
    })

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Connecté : {data['user']['username']}")
        return data['token']
    else:
        print(f"❌ Erreur : {response.json()}")
        return None

def test_sync_workouts(token):
    """Test de synchronisation de workouts"""
    print("\n🔄 Test sync workouts...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # Créer des workouts de test
    workouts = [
        {
            "id": 1234567890,
            "date": "2026-01-14T10:00:00.000Z",
            "startTime": 1234567890000,
            "endTime": 1234570890000,
            "duration": 3000000,
            "totalXP": 150,
            "exercises": [
                {
                    "id": "bench-press",
                    "name": "Développé couché",
                    "category": "chest",
                    "type": "weight",
                    "sets": [
                        {"weight": 50, "reps": 10, "xp": 60},
                        {"weight": 50, "reps": 10, "xp": 60},
                        {"weight": 50, "reps": 10, "xp": 30}
                    ]
                }
            ]
        },
        {
            "id": 1234567891,
            "date": "2026-01-14T14:00:00.000Z",
            "startTime": 1234567891000,
            "endTime": 1234570891000,
            "duration": 3000000,
            "totalXP": 200,
            "exercises": [
                {
                    "id": "squat",
                    "name": "Squat",
                    "category": "legs",
                    "type": "weight",
                    "sets": [
                        {"weight": 80, "reps": 10, "xp": 120},
                        {"weight": 80, "reps": 8, "xp": 80}
                    ]
                }
            ]
        }
    ]

    response = requests.post(
        f"{BASE_URL}/sync/workouts",
        headers=headers,
        json={"workouts": workouts}
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ {data['synced_count']} workouts synchronisés")
        print(f"   Niveau: {data['user']['level']}, XP: {data['user']['total_xp']}")
        return True
    else:
        print(f"❌ Erreur : {response.json()}")
        return False

def test_get_workouts(token):
    """Test de récupération des workouts"""
    print("\n📥 Test get workouts...")

    headers = {
        "Authorization": f"Bearer {token}"
    }

    response = requests.get(
        f"{BASE_URL}/workouts",
        headers=headers
    )

    if response.status_code == 200:
        data = response.json()
        workouts = data['workouts']
        print(f"✅ {len(workouts)} workouts récupérés")
        for w in workouts:
            print(f"   - Workout {w['id']}: {w['totalXP']} XP, {len(w['exercises'])} exercices")
        return True
    else:
        print(f"❌ Erreur : {response.json()}")
        return False

def test_sync_profile(token):
    """Test de synchronisation du profil"""
    print("\n🔄 Test sync profile...")

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    response = requests.post(
        f"{BASE_URL}/sync/profile",
        headers=headers,
        json={
            "level": 5,
            "totalXP": 500
        }
    )

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Profil synchronisé")
        print(f"   Niveau: {data['user']['level']}, XP: {data['user']['total_xp']}")
        return True
    else:
        print(f"❌ Erreur : {response.json()}")
        return False

def main():
    """Fonction principale"""
    print("🚀 Tests API Synchronisation FitnessRPG v2")
    print("=" * 50)

    # Test inscription
    token = test_register()

    if not token:
        # Si l'inscription échoue (déjà existant), essayer login
        token = test_login()

    if not token:
        print("\n❌ Impossible d'obtenir un token")
        return

    print(f"\n🔑 Token obtenu : {token[:20]}...")

    # Test synchronisation workouts
    test_sync_workouts(token)

    # Test récupération workouts
    test_get_workouts(token)

    # Test synchronisation profil
    test_sync_profile(token)

    print("\n" + "=" * 50)
    print("✅ Tests terminés")

if __name__ == "__main__":
    main()
