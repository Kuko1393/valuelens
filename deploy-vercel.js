#!/usr/bin/env node
const fs = require('fs');
const path = require('path');
const https = require('https');

// Lire récursivement tous les fichiers
function getAllFiles(dir, baseDir = dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    // Ignorer certains dossiers
    if (item === 'node_modules' || item === '.git' || item === '.next' || item === '.vercel') {
      continue;
    }
    
    if (stat.isDirectory()) {
      files.push(...getAllFiles(fullPath, baseDir));
    } else {
      const relativePath = path.relative(baseDir, fullPath);
      const content = fs.readFileSync(fullPath);
      files.push({
        file: relativePath,
        data: content.toString('base64')
      });
    }
  }
  
  return files;
}

async function deploy() {
  const projectDir = __dirname;
  const files = getAllFiles(projectDir);
  
  console.log(`📦 Collecte de ${files.length} fichiers...`);
  
  const deployment = {
    name: 'valuelens',
    files: files.map(f => ({
      file: f.file,
      data: f.data,
      encoding: 'base64'
    })),
    projectSettings: {
      framework: 'nextjs',
      buildCommand: 'next build',
      outputDirectory: '.next'
    },
    target: 'production'
  };
  
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    console.error('❌ VERCEL_TOKEN non défini');
    process.exit(1);
  }
  
  const data = JSON.stringify(deployment);
  
  const options = {
    hostname: 'api.vercel.com',
    path: '/v13/deployments',
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
      'Content-Length': data.length
    }
  };
  
  console.log('🚀 Déploiement en cours...');
  
  const req = https.request(options, (res) => {
    let responseData = '';
    
    res.on('data', (chunk) => {
      responseData += chunk;
    });
    
    res.on('end', () => {
      if (res.statusCode === 200 || res.statusCode === 201) {
        const result = JSON.parse(responseData);
        console.log('✅ Déploiement réussi !');
        console.log(`🌐 URL: https://${result.url}`);
      } else {
        console.error('❌ Échec du déploiement');
        console.error(`Status: ${res.statusCode}`);
        console.error(responseData);
      }
    });
  });
  
  req.on('error', (error) => {
    console.error('❌ Erreur:', error);
  });
  
  req.write(data);
  req.end();
}

deploy().catch(console.error);
