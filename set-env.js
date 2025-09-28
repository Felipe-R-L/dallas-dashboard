const fs = require('fs');
const path = require('path');

const templatePath = path.join(__dirname, 'src', 'environments', 'environment.template.ts');
const prodPath = path.join(__dirname, 'src', 'environments', 'environment.prod.ts');

let templateContent = fs.readFileSync(templatePath, 'utf8');

templateContent = templateContent.replace(/#{apiKey}#/g, process.env['apiKey']);
templateContent = templateContent.replace(/#{authDomain}#/g, process.env['authDomain']);
templateContent = templateContent.replace(/#{projectId}#/g, process.env['projectId']);
templateContent = templateContent.replace(/#{storageBucket}#/g, process.env['storageBucket']);
templateContent = templateContent.replace(
  /#{messagingSenderId}#/g,
  process.env['messagingSenderId'],
);
templateContent = templateContent.replace(/#{appId}#/g, process.env['appId']);

fs.writeFileSync(prodPath, templateContent);

console.log('Ficheiro environment.prod.ts gerado com sucesso!');
