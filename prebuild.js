const path = require('path');
const fs = require('fs');

const files = ['activation-email-template.html', 'activation-page-template.html'];

try {
  if (!fs.existsSync(path.join('build', 'lib', 'templates')))
    fs.mkdirSync(path.join('build', 'lib', 'templates'));

  files.forEach(file => {
    let data = fs.readFileSync(path.join('templates', file));
    fs.writeFileSync(path.join('build', 'lib', 'templates', file), data);
  });

  process.exit(0);
} catch (err) {
  console.error(err);
  process.exit(1);
}