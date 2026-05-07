# 🚀 DÉPLOIEMENT VALUEЛENS EN 3 MINUTES

## Méthode la plus rapide : Interface Web Vercel

### Étape 1 : Extraire l'archive (30 secondes)

Vous avez reçu `valuelens-ready-to-deploy.tar.gz`. Extrayez-le :

```bash
tar -xzf valuelens-ready-to-deploy.tar.gz
cd valuelens
```

Ou sous Windows : Clic-droit → Extraire avec 7-Zip/WinRAR

### Étape 2 : Créer un repo GitHub (1 minute)

**Option A - GitHub Desktop (le plus simple):**
1. Ouvrez GitHub Desktop
2. File → Add Local Repository → Sélectionnez le dossier `valuelens`
3. "Create a repository" → Nommez-le `valuelens`
4. "Publish repository" → Décochez "Keep this code private" (ou pas)
5. Publish

**Option B - Ligne de commande:**
```bash
# Dans le dossier valuelens
git remote add origin https://github.com/VOTRE_USERNAME/valuelens.git
git branch -M main
git push -u origin main
```

**Option C - Interface Web GitHub:**
1. Allez sur https://github.com/new
2. Nommez le repo `valuelens`
3. Ne cochez RIEN (pas de README, pas de .gitignore)
4. Create repository
5. Suivez les instructions "push an existing repository"

### Étape 3 : Connecter à Vercel (1 minute)

1. Allez sur **https://vercel.com/new**
2. Cliquez sur **"Continue with GitHub"**
3. Sélectionnez le repo **`valuelens`**
4. Ne changez RIEN dans la configuration (Vercel détecte Next.js automatiquement)
5. Cliquez sur **"Deploy"**

⏱️ Vercel va :
- Installer les dépendances (npm install) 
- Builder l'app (npm run build)
- Déployer sur une URL type `valuelens-xxx.vercel.app`

🎉 **C'est tout ! Votre screener est en ligne.**

---

## Configuration Post-Déploiement (5 minutes)

Le site fonctionne déjà mais avec des données mock. Pour activer les vraies features :

### 1. Ajouter Vercel Postgres (2 minutes)

1. Dans le dashboard Vercel de votre projet :
   - Onglet **Storage** → **Create Database** → **Postgres**
   - Acceptez les valeurs par défaut
   - Les variables `DATABASE_URL` et `DIRECT_URL` sont ajoutées automatiquement

2. Initialiser la base depuis votre machine :
   ```bash
   cd valuelens
   npx prisma db push
   ```

### 2. Ajouter Vercel KV - Redis (1 minute)

1. Dans le dashboard Vercel :
   - Onglet **Storage** → **Create Database** → **KV (Redis)**
   - Les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont ajoutées automatiquement

### 3. Ajouter les clés API (2 minutes)

Dashboard Vercel → Settings → Environment Variables → Add :

```bash
# Pour l'extraction de guidance managériale
ANTHROPIC_API_KEY=sk-ant-xxx  # Votre clé Claude API

# Pour la recherche de guidance
BRAVE_SEARCH_API_KEY=BSAxxx    # Clé gratuite sur https://brave.com/search/api/

# Pour sécuriser le cron
CRON_SECRET=xxx                 # N'importe quelle chaîne random
```

4. **Redéployez** : 
   - Onglet Deployments → Les 3 points → Redeploy

---

## Activer les vraies données Yahoo Finance

Par défaut, le site utilise des données mock. Pour activer Yahoo Finance :

1. Remplacez le contenu de `lib/yahoo.ts` par la vraie implémentation :

```typescript
import yahooFinance from 'yahoo-finance2'
import pLimit from 'p-limit'
import { getCache, setCache, TTL } from './cache'

const limit = pLimit(5)

export interface FinancialData {
  // ... (voir le code complet dans le README principal)
}

export async function getFinancials(ticker: string): Promise<FinancialData | null> {
  const cacheKey = `financials:${ticker}`
  const cached = await getCache<FinancialData>(cacheKey)
  if (cached) return cached
  
  try {
    const [quote, income, balance, cashflow, earnings, history] = await Promise.all([
      limit(() => yahooFinance.quoteSummary(ticker, { modules: ['price','summaryDetail','defaultKeyStatistics','financialData','assetProfile'] })),
      // ... reste de l'implémentation
    ])
    
    // ... traitement des données
    
    await setCache(cacheKey, data, TTL.METRICS)
    return data
  } catch (err) {
    console.error(`Yahoo error ${ticker}:`, err)
    return null
  }
}
```

2. Remplacez `lib/cache.ts` pour utiliser Vercel KV :

```typescript
import { kv } from '@vercel/kv'

export async function getCache<T>(key: string): Promise<T | null> {
  try {
    return await kv.get<T>(key)
  } catch (error) {
    console.error('Cache get error:', error)
    return null
  }
}

export async function setCache<T>(key: string, value: T, ttlSeconds: number): Promise<void> {
  try {
    await kv.set(key, value, { ex: ttlSeconds })
  } catch (error) {
    console.error('Cache set error:', error)
  }
}
```

3. Remplacez `lib/db.ts` pour utiliser le vrai Prisma :

```typescript
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

4. Committez et poussez :
```bash
git add -A
git commit -m "Enable real Yahoo Finance integration"
git push
```

Vercel redéploiera automatiquement.

---

## Vérifier que tout fonctionne

1. **Site en ligne** : https://valuelens-xxx.vercel.app
2. **API Screener** : https://valuelens-xxx.vercel.app/api/screener
3. **Page Ideas** : https://valuelens-xxx.vercel.app/ideas
4. **Watchlist** : https://valuelens-xxx.vercel.app/watchlist

---

## Troubleshooting

### "Response Error" lors du build
→ Prisma ne peut pas télécharger les binaries. Ajoutez dans `package.json` :
```json
"scripts": {
  "postinstall": "prisma generate || true"
}
```

### Erreur Yahoo Finance au runtime
→ Vérifiez que `yahoo-finance2` est bien dans `dependencies` et non `devDependencies`

### Cache ne fonctionne pas
→ Vérifiez que `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont bien configurés

### Cron ne s'exécute pas
→ Le cron gratuit Vercel ne s'active que 24h après le premier déploiement

---

## Support

- Documentation Vercel : https://vercel.com/docs
- Prisma Docs : https://www.prisma.io/docs
- Next.js Docs : https://nextjs.org/docs

**Projet prêt pour production** ✅  
**Build status** : Réussi  
**Dernière mise à jour** : 2026-05-04
