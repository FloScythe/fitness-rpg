#!/bin/bash

# FitnessRPG - Script de démarrage rapide
# Lance le backend et le frontend en parallèle

echo "🚀 Lancement de FitnessRPG..."

# Couleurs
GREEN='\033[0;32m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Vérifier si on est dans le bon répertoire
if [ ! -d "backend" ] || [ ! -d "frontend" ]; then
    echo -e "${RED}❌ Erreur: backend/ et frontend/ introuvables${NC}"
    echo "Exécutez ce script depuis la racine du projet"
    exit 1
fi

# Fonction pour arrêter les processus à la fin
cleanup() {
    echo -e "\n${BLUE}🛑 Arrêt des serveurs...${NC}"
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

trap cleanup SIGINT SIGTERM

# 1. Backend
echo -e "${BLUE}📦 Démarrage du backend (Flask)...${NC}"
cd backend

# Activer l'environnement virtuel si il existe
if [ -d "venv" ]; then
    source venv/bin/activate
fi

# Lancer Flask en arrière-plan
python app.py > ../backend.log 2>&1 &
BACKEND_PID=$!

cd ..

# Attendre que le backend soit prêt
echo -e "${BLUE}⏳ Attente du backend...${NC}"
for i in {1..10}; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
        echo -e "${GREEN}✅ Backend prêt sur http://localhost:5000${NC}"
        break
    fi
    sleep 1
done

# 2. Frontend
echo -e "${BLUE}🌐 Démarrage du frontend...${NC}"
cd frontend
python3 -m http.server 8000 > ../frontend.log 2>&1 &
FRONTEND_PID=$!
cd ..

sleep 2
echo -e "${GREEN}✅ Frontend prêt sur http://localhost:8000${NC}"

# Afficher les infos
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}   FitnessRPG est prêt ! 🎮${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  🌐 Frontend: ${BLUE}http://localhost:8000${NC}"
echo -e "  🔌 Backend:  ${BLUE}http://localhost:5000${NC}"
echo ""
echo -e "${BLUE}📝 Logs:${NC}"
echo -e "  Backend:  tail -f backend.log"
echo -e "  Frontend: tail -f frontend.log"
echo ""
echo -e "${RED}⚠️  Appuyez sur Ctrl+C pour arrêter les serveurs${NC}"
echo ""

# Garder le script actif
wait
