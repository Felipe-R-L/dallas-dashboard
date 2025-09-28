import { readFileSync, writeFileSync } from 'fs';

const filePath = 'src/environments/environment.prod.ts';
let content = readFileSync(filePath, 'utf8');

const keys = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

for (const k of keys) {
  const v = process.env[k];
  if (!v) {
    console.error(`ERRO: Variável de ambiente '${k}' não encontrada na Vercel.`);
    process.exit(1);
  }
  const token = `#{${k}}#`;
  content = content.split(token).join(v);
}

if (content.includes('#{') || content.includes('}#')) {
  console.error('ERRO: Restaram tokens não substituídos no environment.prod.ts');
  process.exit(1);
}

writeFileSync(filePath, content);
console.log('environment.prod.ts atualizado com as variáveis da Vercel.');
