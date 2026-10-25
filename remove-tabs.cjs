const fs = require('fs');
const files = [
  'src/pages/bo/DossierDetail.tsx',
  'src/pages/prescripteur/DossierDetail.tsx',
  'src/pages/dcf/DossierDetail.tsx',
  'src/pages/tresorerie/DossierDetail.tsx'
];

for (const file of files) {
  if (fs.existsSync(file)) {
    let content = fs.readFileSync(file, 'utf-8');

    // Remove the tab object from the array
    content = content.replace(/\{\s*id:\s*"transmissions"[^}]+\},?\s*/g, '');

    // Remove activeTab condition
    content = content.replace(/activeTab === "transmissions" \|\|\s*/g, '');

    fs.writeFileSync(file, content, 'utf-8');
    console.log('Updated ' + file);
  } else {
    console.log('Not found: ' + file);
  }
}
