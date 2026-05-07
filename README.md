# ValueLens - Investment Screener

## 🚀 DÉPLOIEMENT RAPIDE (3 minutes)

Le projet est **prêt à déployer**. Build réussi ✅

### Option 1: Upload direct (le plus rapide)

1. Allez sur https://vercel.com/new
2. Cliquez sur "Continue with GitHub"
3. Créez un nouveau repo (public ou privé)
4. Uploadez tous les fichiers de ce dossier SAUF `node_modules` et `.next`
5. Vercel détectera automatiquement Next.js et déploiera

### Option 2: Via GitHub Desktop

1. Ouvrez GitHub Desktop
2. Créez un nouveau repo depuis ce dossier
3. Publiez sur GitHub
4. Allez sur https://vercel.com/new
5. Sélectionnez votre repo
6. Cliquez sur Deploy

### Option 3: Via la ligne de commande

```bash
# Si vous avez git et gh CLI installés
gh repo create valuelens --public
git remote add origin https://github.com/VOTRE_USERNAME/valuelens.git
git push -u origin master

# Puis allez sur vercel.com/new et importez le repo
```

## ⚙️ Configuration Post-Déploiement

Après le premier déploiement, configurez ces variables d'environnement dans **Vercel Dashboard → Settings → Environment Variables**:

### Obligatoires pour les features complètes

```bash
# Base de données Vercel Postgres
DATABASE_URL=          # Auto-généré après ajout de Vercel Postgres
DIRECT_URL=            # Auto-généré après ajout de Vercel Postgres

# Cache Vercel KV  
KV_REST_API_URL=       # Auto-généré après ajout de Vercel KV
KV_REST_API_TOKEN=     # Auto-généré après ajout de Vercel KV

# APIs externes
ANTHROPIC_API_KEY=     # Votre clé API Claude (pour extraction guidance)
BRAVE_SEARCH_API_KEY=  # Votre clé Brave Search (pour recherche guidance)
CRON_SECRET=           # Chaîne aléatoire pour sécuriser /api/refresh
```

### Ajouter Vercel Postgres et KV

1. Dans le dashboard Vercel, onglet **Storage**
2. Cliquez sur **Connect Store** → **Postgres** → Create
3. Répétez pour **KV (Redis)**
4. Les variables DATABASE_URL, DIRECT_URL, KV_REST_API_URL, KV_REST_API_TOKEN seront ajoutées automatiquement

### Initialiser la base de données

```bash
# Après avoir ajouté Vercel Postgres, exécutez depuis votre machine locale:
npx prisma db push
```

## 📦 Structure du Projet

```
valuelens/
├── app/                    # Pages et API Routes Next.js
│   ├── page.tsx           # Screener principal
│   ├── ideas/             # Idea generation
│   ├── watchlist/         # Gestion watchlists
│   └── api/               # API serverless
├── components/            # Composants React
├── lib/                   # Logique métier
│   ├── yahoo.ts          # Integration Yahoo Finance (simplifié)
│   ├── scoring.ts        # Scoring /100
│   ├── dcf.ts            # DCF & valuation
│   ├── cache.ts          # Cache en mémoire (sera remplacé par Vercel KV)
│   └── db.ts             # Client Prisma (mock pour l'instant)
├── prisma/
│   └── schema.prisma     # Schéma BDD (6 modèles)
└── config/               # Configuration scoring

```

## 🔧 État Actuel du Projet

### ✅ Implémenté

- Structure Next.js 14 App Router complète
- Build réussi et optimisé
- Schéma Prisma (6 modèles : Company, Metric, Valuation, GuidanceHistory, GuidanceMeta, Watchlist)
- Architecture API Routes pour screener, company detail, guidance, watchlist, refresh cron
- Configuration Vercel (vercel.json avec cron 06:00 UTC)
- Dark mode natif
- Placeholder data pour tester l'UI

### ⚠️ À finaliser après déploiement

1. **Yahoo Finance Integration** : Remplacer le placeholder par `yahoo-finance2` réel
2. **Vercel KV** : Remplacer le cache mémoire par Vercel KV
3. **Prisma Client** : Configurer avec vraie BDD Vercel Postgres
4. **Brave Search** : Implémenter la recherche de guidance managériale
5. **Claude API** : Implémenter l'extraction structurée de guidance

### 🎯 Fichiers simplifiés pour le premier build

- `lib/yahoo.ts` : Mock data (à remplacer par vraie intégration)
- `lib/cache.ts` : Cache mémoire (à remplacer par Vercel KV)
- `lib/db.ts` : Mock Prisma (à remplacer après config BDD)

## 🚧 Roadmap Post-Déploiement

1. **Jour 1** : Déploiement initial + configuration Postgres + KV
2. **Jour 2** : Intégration Yahoo Finance réelle
3. **Jour 3** : Module de scoring complet
4. **Jour 4** : Guidance tracking (Brave Search + Claude API)
5. **Jour 5** : Frontend complet (tables, filtres, charts)

## 📊 Fonctionnalités Prévues

- Screener multi-colonnes avec tri et filtres
- Score global /100 (4 dimensions)
- Classification automatique (Deep Value, Quality Value, etc.)
- Valeur intrinsèque (DCF + multiples)
- Score de Guidance /5 (Beat & Raise tracking)
- Idea generation (5 signaux)
- Watchlists multi-listes
- Refresh automatique quotidien (Vercel Cron)

## 🎨 Design

- Dark mode natif
- Interface financière moderne
- Tables triables et paginées
- Charts Recharts pour visualisations
- Badges et indicateurs colorés

## 📝 Notes Techniques

- Next.js 14.1.0 (App Router)
- React 18.3.0
- Tailwind CSS
- Prisma ORM
- Yahoo Finance (gratuit, sans clé API)
- Brave Search API (gratuit jusqu'à 2000 req/mois)
- Claude API (Sonnet 4)

## 🆘 Troubleshooting

### Build échoue avec erreur Prisma

```bash
PRISMA_ENGINES_CHECKSUM_IGNORE_MISSING=1 npx prisma generate
npm run build
```

### Token Vercel invalide

Créez un nouveau token sur https://vercel.com/account/tokens avec scope "Full Access"

### Variables d'environnement manquantes

Le site fonctionnera mais avec données mock. Ajoutez les vraies variables pour activer toutes les features.

---

**Projet créé le:** 2026-05-04  
**Version:** 1.0.0 (Initial deployment ready)  
**Build status:** ✅ Réussi  
**Prêt pour production:** ✅ Oui (avec mocks)
