# AgroToken — Guide rapide (français)

## 1. Lancer le projet sur Windows

1. Décompresse `AgroToken_Complete_MVP.zip`.
2. Installe Python (version 3.10 ou plus récente), si nécessaire.
3. Double-clique sur **`run_demo_windows.bat`**.
4. Ouvre ton navigateur sur **http://localhost:8000**.

La première fois, il faut une connexion Internet pour télécharger les bibliothèques Python. Le projet se lance **sans Node.js**, **sans Meta API key** et **sans configuration MySQL**.

Pour ouvrir les endpoints et leur documentation : **http://localhost:8000/docs**.

## 2. Présenter une démo complète

- **Overview** : montre la plateforme et les statistiques.
- **My Farms** : affiche une exploitation à Djerba et ajoute une autre ferme si tu veux démontrer le côté international.
- **Water Calculator** : sélectionne ta ferme, clique sur « Load live weather » puis calcule les besoins en eau.
- **Proof of Savings** : entre une consommation d'eau **simulée** acceptable et clique sur « Mint demo AGT ».
- **AgroWallet** : montre que ton solde augmente. Tu peux aussi envoyer des AGT à un autre agriculteur de démonstration.
- **Marketplace** : achète un article virtuel en AGT. Le solde diminue.
- **Blockchain Ledger** : montre les transactions et teste « Verify hashes ».
- **AgroAI Assistant** : pose une question au chatbot.

**Important :** les capteurs sont simulés. Le ledger est une chaîne de hashes SHA-256, pas encore une vraie blockchain décentralisée. Sans clé Meta, le chatbot fonctionne en mode local, et ne prétend pas être une vraie IA Meta.

## 3. Connecter la véritable IA de Meta (facultatif)

Dans PowerShell :

```powershell
cd backend
$env:MODEL_API_KEY="VOTRE_CLE_META"
$env:META_MODEL="muse-spark-1.3"
python -m uvicorn main:app --reload --port 8000
```

Ne publie **jamais** ta clé dans GitHub. Elle reste dans le terminal/backend. Si l'API Meta n'est pas accessible, conserve le mode local (en désactivant la variable d'environnement).

## 4. Mettre ton code sur GitHub

Crée un dépôt vide nommé `agrotoken` sur GitHub, puis lance ces commandes dans le dossier du projet :

```bash
git init
git add .
git commit -m "AgroToken working hackathon MVP"
git branch -M main
git remote add origin https://github.com/TON_PSEUDO/agrotoken.git
git push -u origin main
```

Remplace `TON_PSEUDO` par ton identifiant GitHub. Ne copie pas les fichiers `.env`, `.db` ou les clés privées ; `.gitignore` les ignore déjà.

## 5. Structure et évolutions

- `backend/` : calcul mathématique, API FastAPI, SQLite, wallet, hash chain, chatbot.
- `frontend/standalone.html` et `.js` : **démo prête à l'emploi**, sans installation npm.
- `frontend/src/` : version supplémentaire **React + Tailwind**. Pour la lancer : `cd frontend`, `npm install`, puis `npm run dev` après avoir démarré l'API sur le port 8000.
- `backend/tests/` : tests automatiques (`cd backend && python -m pytest -q`).
- `docs/DEMO_SCRIPT.md` : texte en anglais pour enregistrer ta vidéo.

Le passage à une vraie monnaie agricole nécessite des capteurs vérifiables, une validation agronomique, une gouvernance des tokens et des fournisseurs partenaires. Le prototype sert à **démontrer concrètement ton innovation**, pas à garantir une valeur économique ou des économies réelles.
