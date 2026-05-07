// Script pour créer un déploiement Vercel via l'API
async function deployToVercel() {
  const teamId = 'team_pUViMi816tckYsGye9QBOXhP';
  const projectId = 'prj_pg4lmLchLNn7M636hXbHZR4Prrg3';
  
  // Fichiers essentiels pour le déploiement
  const files = {
    'package.json': btoa(JSON.stringify({
      "name": "valuelens",
      "version": "1.0.0",
      "private": true,
      "scripts": {
        "dev": "next dev",
        "build": "next build",
        "start": "next start"
      },
      "dependencies": {
        "@prisma/client": "^5.11.0",
        "next": "14.2.0",
        "react": "^18.3.0",
        "react-dom": "^18.3.0",
        "recharts": "^2.12.0"
      },
      "devDependencies": {
        "@types/node": "^20",
        "@types/react": "^18",
        "autoprefixer": "^10.4.19",
        "postcss": "^8.4.38",
        "prisma": "^5.11.0",
        "tailwindcss": "^3.4.1",
        "typescript": "^5"
      }
    }, null, 2)),
    'next.config.js': btoa('module.exports = {}'),
    'app/page.tsx': btoa('export default function Home() { return <main className="min-h-screen p-8"><h1 className="text-4xl font-bold">ValueLens - Investment Screener</h1><p className="mt-4">Déploiement réussi!</p></main> }'),
    'app/layout.tsx': btoa('export default function RootLayout({ children }: { children: React.ReactNode }) { return <html lang="fr"><body>{children}</body></html> }')
  };
  
  const deployment = {
    name: 'valuelens',
    files,
    projectSettings: {
      framework: 'nextjs'
    },
    target: 'production'
  };
  
  try {
    const response = await fetch(`https://api.vercel.com/v13/deployments?teamId=${teamId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      credentials: 'include',
      body: JSON.stringify(deployment)
    });
    
    const result = await response.json();
    return result;
  } catch (error) {
    return { error: error.message };
  }
}

deployToVercel();
