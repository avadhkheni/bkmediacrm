const fs = require('fs');
const path = require('path');

const files = [
  'src/app/dashboard/video/page.tsx',
  'src/app/dashboard/led/page.tsx',
  'src/app/dashboard/sound/page.tsx',
  'src/app/dashboard/office/page.tsx',
];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');

  // Remove import
  content = content.replace(/import VendorSection from "@\/components\/VendorSection";\n?/g, '');

  // Remove the 'vendors' string from the activeTab useState
  content = content.replace(/'equipment' \| 'events' \| 'add' \| 'vendors'/g, "'equipment' | 'events' | 'add'");
  content = content.replace(/'stock' \| 'calculator' \| 'dispatch' \| 'vendors'/g, "'stock' | 'calculator' | 'dispatch'");
  content = content.replace(/'inventory' \| 'vendors'/g, "'inventory'");
  content = content.replace(/'tasks' \| 'vendors'/g, "'tasks'");

  // Remove the button rendering
  content = content.replace(/<button[^>]*onClick={\(\) => setActiveTab\('vendors'\)}[\s\S]*?<\/button>/g, '');
  
  // Remove the section rendering
  content = content.replace(/\{activeTab === 'vendors' && \([\s\S]*?<VendorSection department="[^"]+" \/>[\s\S]*?\}\)/g, '');

  fs.writeFileSync(file, content);
  console.log(`Updated ${file}`);
});
