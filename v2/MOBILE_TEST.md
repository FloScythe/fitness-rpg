# 📱 Guide de test Mobile

## 🔧 Configuration

### 1. Redémarrer les serveurs

```bash
cd v2
./start.sh
```

Tu devrais voir :
```
✅ FitnessRPG v2 démarré !

📍 Desktop:  http://localhost:8000
📍 Mobile:   http://192.168.1.98:8000
📍 Backend:  http://localhost:5000
📍 Health:   http://localhost:5000/api/health

💡 Utilise l'URL Mobile sur ton téléphone
```

### 2. Vérifier la connexion

#### Sur ton ordinateur
Ouvre http://localhost:8000 → Tout doit fonctionner normalement

#### Sur ton téléphone
1. **Assure-toi que ton téléphone et ton ordinateur sont sur le même réseau WiFi**
2. Ouvre le navigateur mobile
3. Tape l'URL : **http://192.168.1.98:8000**
4. L'application doit se charger

---

## 🧪 Tests Mobile

### Test 1 : Inscription
1. Clique sur "Inscription"
2. Remplis : username=`mobile`, email=`mobile@test.com`, password=`test123`
3. Clique "Créer mon compte"
4. **Attendu** : Notification "Compte créé avec succès !" + Dashboard

### Test 2 : Connexion
1. Recharge la page
2. Reste sur "Connexion"
3. Remplis : username=`mobile`, password=`test123`
4. Clique "Se connecter"
5. **Attendu** : Notification "Connexion réussie !" + Dashboard

### Test 3 : Mode hors ligne
1. Recharge la page
2. Clique "Continuer hors ligne"
3. **Attendu** : Dashboard avec "⚠️ Mode hors ligne"

### Test 4 : PWA (bonus)
1. Sur mobile, clique sur "Ajouter à l'écran d'accueil" (menu du navigateur)
2. Lance l'app depuis l'icône
3. **Attendu** : App en plein écran (comme une app native)

---

## ❌ Problèmes courants

### Erreur "Failed to fetch"
**Cause** : Le téléphone ne peut pas joindre l'ordinateur

**Solutions** :
1. Vérifie que ton téléphone et ordinateur sont sur **le même WiFi**
2. Vérifie que le firewall de ton Mac n'est pas trop restrictif
   - Préférences Système → Sécurité et confidentialité → Pare-feu
   - Autorise Python à recevoir des connexions entrantes
3. Utilise l'IP exacte affichée par `./start.sh`

### Page blanche
**Cause** : Service Worker cache l'ancienne version

**Solution** :
1. Ouvre DevTools mobile (Chrome Remote Debugging)
2. Vide le cache : Settings → Clear browsing data
3. Recharge la page

### "This site can't be reached"
**Cause** : Le serveur n'écoute pas sur toutes les interfaces

**Solution** :
- Vérifie que `./start.sh` utilise bien `--bind 0.0.0.0`
- Vérifie que le backend écoute sur `host='0.0.0.0'`

---

## 🔍 Debug

### Voir les logs en temps réel

```bash
# Terminal 1 : Backend logs
cd v2/backend
source venv/bin/activate
python3 app.py

# Terminal 2 : Frontend
cd v2/frontend
python3 -m http.server 8000 --bind 0.0.0.0
```

### Tester l'API directement depuis le téléphone

Ouvre le navigateur mobile et va sur :
- http://192.168.1.98:5000/api/health

Tu devrais voir : `{"status": "online"}`

---

## ✅ Checklist

- [ ] Les deux serveurs démarrent sans erreur
- [ ] L'URL mobile s'affiche correctement
- [ ] Desktop : http://localhost:8000 fonctionne
- [ ] Mobile : http://192.168.1.98:8000 fonctionne
- [ ] Inscription mobile OK
- [ ] Connexion mobile OK
- [ ] Mode hors ligne mobile OK
- [ ] Déconnexion mobile OK
- [ ] Dashboard s'affiche correctement
- [ ] Responsive fonctionne (profil en colonne, stats en 1 colonne)

---

**Note** : L'IP `192.168.1.98` est détectée automatiquement par `./start.sh`. Si ton IP change (changement de réseau), relance simplement `./start.sh` pour obtenir la nouvelle IP.
