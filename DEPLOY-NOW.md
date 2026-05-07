# 🚀 DÉPLOYER VALUELENS MAINTENANT

## Option 1 : Script Automatique (1 minute) ⭐ **RECOMMANDÉ**

### Mac / Linux
```bash
cd valuelens
./deploy.sh
```

### Windows
```powershell
cd valuelens
.\deploy.ps1
```

**Le script fait TOUT automatiquement** :
- ✅ Initialise Git si besoin
- ✅ Crée le repo GitHub
- ✅ Pousse le code
- ✅ Se connecte à Vercel
- ✅ Déploie en production

**Temps total : 1-2 minutes**

---

## Option 2 : Vercel Interface Web (30 secondes)

Si vous avez déjà un compte GitHub connecté à Vercel :

1. Extrayez `valuelens-ready-to-deploy.tar.gz`
2. Allez sur **https://vercel.com/new**
3. Cliquez **"Continue with GitHub"**
4. Sélectionnez **"Import Git Repository"**
5. Si vous voyez vos repos : sélectionnez `valuelens` et cliquez Deploy
6. Sinon : cliquez **"Import Third-Party Git Repository"**
   - Collez l'URL de votre repo GitHub
   - Cliquez Deploy

**C'est tout !** Vercel détecte Next.js automatiquement.

---

## Option 3 : GitHub Desktop + Vercel (2 minutes)

1. **Ouvrez GitHub Desktop**
2. **File → Add Local Repository**
3. **Sélectionnez** le dossier `valuelens`
4. **Publish repository** (public ou privé)
5. **Allez sur** https://vercel.com/new
6. **Sélectionnez** votre repo `valuelens`
7. **Cliquez** Deploy

---

## Après le Premier Déploiement

### Configuration Minimale (5 minutes)

**Dans le Dashboard Vercel de votre projet :**

#### 1. Ajouter la Base de Données (2 min)
- Onglet **Storage** → **Create Database** → **Postgres**
- Laissez les valeurs par défaut → Create
- Les variables `DATABASE_URL` et `DIRECT_URL` sont ajoutées automatiquement

#### 2. Ajouter le Cache (1 min)
- Onglet **Storage** → **Create Database** → **KV (Redis)**
- Laissez les valeurs par défaut → Create  
- Les variables `KV_REST_API_URL` et `KV_REST_API_TOKEN` sont ajoutées automatiquement

#### 3. Ajouter les Clés API (2 min)
- Onglet **Settings** → **Environment Variables**
- Ajoutez :
  ```
  ANTHROPIC_API_KEY=sk-ant-xxx  (votre clé Claude)
  BRAVE_SEARCH_API_KEY=BSAxxx   (clé gratuite sur brave.com/search/api)
  CRON_SECRET=choix_aleatoire    (n'importe quelle chaîne random)
  ```

#### 4. Initialiser la Base (30 secondes)
```bash
cd valuelens
npx prisma db push
```

#### 5. Redéployer
- Dashboard Vercel → Onglet **Deployments**
- Les 3 points → **Redeploy**

---

## URLs Importantes

Après déploiement, vous aurez :
- **Site principal** : `https://valuelens-xxx.vercel.app`
- **API Screener** : `https://valuelens-xxx.vercel.app/api/screener`
- **Dashboard Vercel** : `https://vercel.com/erwans-projects-f4ee5d4d/project-xxx`

---

## Troubleshooting

### "Build failed" lors du déploiement
→ Normal si les variables d'environnement ne sont pas encore configurées
→ Ajoutez-les puis redéployez

### "Prisma Client not initialized"
→ Exécutez `npx prisma generate` localement
→ Committez et poussez les changements

### Le site affiche des données mock
→ C'est normal ! Suivez la section "Après le Premier Déploiement"
→ Les vraies intégrations sont documentées dans README.md

---

## Support

- **Vercel Docs** : https://vercel.com/docs
- **Next.js Docs** : https://nextjs.org/docs
- **Logs de déploiement** : Dashboard Vercel → Deployments → Build Logs

---

## ✅ Checklist Déploiement

- [ ] Extraire valuelens-ready-to-deploy.tar.gz
- [ ] Exécuter deploy.sh OU créer repo GitHub manuellement
- [ ] Déployer sur Vercel
- [ ] Ajouter Vercel Postgres
- [ ] Ajouter Vercel KV
- [ ] Ajouter les 3 variables d'environnement
- [ ] Exécuter `npx prisma db push`
- [ ] Redéployer

**Durée totale estimée : 8 minutes** ⏱️

---

**🎉 Votre screener d'investissement sera en ligne demain matin !**
