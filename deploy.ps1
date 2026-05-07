# Script de déploiement PowerShell pour Windows
# Exécutez avec: .\deploy.ps1

Write-Host "🚀 ValueLens - Déploiement automatique sur Vercel" -ForegroundColor Cyan
Write-Host "==================================================" -ForegroundColor Cyan
Write-Host ""

# Vérifier que nous sommes dans le bon dossier
if (!(Test-Path "package.json")) {
    Write-Host "❌ Erreur : Exécutez ce script depuis le dossier valuelens" -ForegroundColor Red
    exit 1
}

# Vérifier si Git est initialisé
if (!(Test-Path ".git")) {
    Write-Host "📦 Initialisation Git..." -ForegroundColor Yellow
    git init
    git config user.email "vous@example.com"
    git config user.name "Votre Nom"
    git add .
    git commit -m "Initial commit - ValueLens"
}

# Vérifier si gh CLI est disponible
$ghInstalled = Get-Command gh -ErrorAction SilentlyContinue
if ($ghInstalled) {
    Write-Host "📤 Création du repo GitHub avec gh CLI..." -ForegroundColor Yellow
    gh repo create valuelens --public --source=. --remote=origin --push
    $repoCreated = $true
} else {
    Write-Host "⚠️  gh CLI non trouvé. Utilisation de l'approche manuelle..." -ForegroundColor Yellow
    $repoCreated = $false
}

if (!$repoCreated) {
    Write-Host ""
    Write-Host "📋 Instructions manuelles :" -ForegroundColor Cyan
    Write-Host "1. Allez sur https://github.com/new"
    Write-Host "2. Nommez le repo 'valuelens'"
    Write-Host "3. Ne cochez RIEN (pas de README, pas de .gitignore)"
    Write-Host "4. Cliquez sur 'Create repository'"
    Write-Host "5. Copiez l'URL du repo"
    Write-Host ""
    $repoUrl = Read-Host "Collez l'URL du repo ici"
    
    git remote add origin $repoUrl
    git branch -M main
    git push -u origin main
    
    Write-Host "✅ Code poussé sur GitHub" -ForegroundColor Green
}

# Vérifier si vercel CLI est disponible
$vercelInstalled = Get-Command vercel -ErrorAction SilentlyContinue
if (!$vercelInstalled) {
    Write-Host "📦 Installation de Vercel CLI..." -ForegroundColor Yellow
    npm install -g vercel
}

Write-Host ""
Write-Host "🔐 Connexion à Vercel..." -ForegroundColor Yellow
Write-Host "Une page web va s'ouvrir pour l'authentification"
vercel login

Write-Host ""
Write-Host "🚀 Déploiement sur Vercel..." -ForegroundColor Yellow
vercel --prod --yes

Write-Host ""
Write-Host "✅ DÉPLOIEMENT RÉUSSI !" -ForegroundColor Green
Write-Host ""
Write-Host "📋 Prochaines étapes :" -ForegroundColor Cyan
Write-Host "1. Ajoutez Vercel Postgres : Dashboard → Storage → Create Database → Postgres"
Write-Host "2. Ajoutez Vercel KV : Dashboard → Storage → Create Database → KV"
Write-Host "3. Ajoutez les variables d'environnement (voir README.md)"
Write-Host "4. Exécutez : npx prisma db push"
Write-Host "5. Remplacez les placeholders dans lib/ par les vraies intégrations"
Write-Host ""
Write-Host "🌐 Votre site est en ligne !"
