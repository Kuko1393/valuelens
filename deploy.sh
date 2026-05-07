#!/bin/bash
# Script de déploiement automatique ValueLens
# Exécutez ce script demain matin pour déployer en 1 minute

set -e

echo "🚀 ValueLens - Déploiement automatique sur Vercel"
echo "=================================================="
echo ""

# Vérifier que nous sommes dans le bon dossier
if [ ! -f "package.json" ]; then
    echo "❌ Erreur : Exécutez ce script depuis le dossier valuelens"
    exit 1
fi

# Vérifier si Git est initialisé
if [ ! -d ".git" ]; then
    echo "📦 Initialisation Git..."
    git init
    git config user.email "vous@example.com"
    git config user.name "Votre Nom"
    git add .
    git commit -m "Initial commit - ValueLens"
fi

# Vérifier si gh CLI est disponible
if command -v gh &> /dev/null; then
    echo "📤 Création du repo GitHub avec gh CLI..."
    gh repo create valuelens --public --source=. --remote=origin --push
    REPO_CREATED=true
else
    echo "⚠️  gh CLI non trouvé. Utilisation de l'approche manuelle..."
    REPO_CREATED=false
fi

if [ "$REPO_CREATED" = false ]; then
    echo ""
    echo "📋 Instructions manuelles :"
    echo "1. Allez sur https://github.com/new"
    echo "2. Nommez le repo 'valuelens'"
    echo "3. Ne cochez RIEN (pas de README, pas de .gitignore)"
    echo "4. Cliquez sur 'Create repository'"
    echo "5. Copiez l'URL du repo (format: https://github.com/USERNAME/valuelens.git)"
    echo ""
    read -p "Collez l'URL du repo ici : " REPO_URL
    
    git remote add origin "$REPO_URL"
    git branch -M main
    git push -u origin main
    
    echo "✅ Code poussé sur GitHub"
fi

# Vérifier si vercel CLI est disponible
if ! command -v vercel &> /dev/null; then
    echo "📦 Installation de Vercel CLI..."
    npm install -g vercel
fi

echo ""
echo "🔐 Connexion à Vercel..."
echo "Une page web va s'ouvrir pour l'authentification"
vercel login

echo ""
echo "🚀 Déploiement sur Vercel..."
vercel --prod --yes

echo ""
echo "✅ DÉPLOIEMENT RÉUSSI !"
echo ""
echo "📋 Prochaines étapes :"
echo "1. Ajoutez Vercel Postgres : Dashboard → Storage → Create Database → Postgres"
echo "2. Ajoutez Vercel KV : Dashboard → Storage → Create Database → KV"
echo "3. Ajoutez les variables d'environnement (voir README.md)"
echo "4. Exécutez : npx prisma db push"
echo "5. Remplacez les placeholders dans lib/ par les vraies intégrations"
echo ""
echo "🌐 Votre site est en ligne !"
vercel --prod --yes 2>&1 | grep -oP '(?<=https://)[^\s]+' | head -1 | xargs -I {} echo "URL: https://{}"
