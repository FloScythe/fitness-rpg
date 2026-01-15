#!/bin/bash

# Script de démarrage FitnessRPG v2

echo "🚀 Démarrage de FitnessRPG v2..."

# Vérifier Python
if ! command -v python3 &> /dev/null; then
    echo "❌ Python3 n'est pas installé"
    exit 1
fi

# Installer les dépendances backend si nécessaire
if [ ! -d "backend/venv" ]; then
    echo "📦 Création de l'environnement virtuel..."
    cd backend
    python3 -m venv venv
    source venv/bin/activate
    pip install -r requirements.txt
    cd ..
fi

# Démarrer le backend
echo "🔧 Démarrage du backend..."
cd backend
source venv/bin/activate
python3 app.py &
BACKEND_PID=$!
cd ..

# Attendre que le backend démarre
sleep 2

# Démarrer le frontend
echo "🌐 Démarrage du frontend..."
cd frontend
python3 -m http.server 8000 --bind 0.0.0.0 &
FRONTEND_PID=$!
cd ..

# Récupérer l'IP locale
LOCAL_IP=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | awk '{print $2}' | head -1)

echo ""
echo "✅ FitnessRPG v2 démarré !"
echo ""
echo "📍 Desktop:  http://localhost:8000"
echo "📍 Mobile:   http://${LOCAL_IP}:8000"
echo "📍 Backend:  http://localhost:5000"
echo "📍 Health:   http://localhost:5000/api/health"
echo ""
echo "💡 Utilise l'URL Mobile sur ton téléphone"
echo ""
echo "Appuyez sur Ctrl+C pour arrêter les serveurs"
echo ""

# Attendre Ctrl+C
trap "echo '🛑 Arrêt des serveurs...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT
wait
