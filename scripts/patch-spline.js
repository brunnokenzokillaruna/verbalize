const fs = require('fs');
const path = require('path');

const packagePath = path.resolve(__dirname, '../node_modules/@splinetool/react-spline/package.json');

if (fs.existsSync(packagePath)) {
  const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
  
  if (pkg.exports && pkg.exports['.'] && !pkg.exports['.'].require) {
    console.log('Patching @splinetool/react-spline package.json...');
    pkg.exports['.'].require = './dist/react-spline.js';
    fs.writeFileSync(packagePath, JSON.stringify(pkg, null, 2));
    console.log('Successfully patched @splinetool/react-spline');
  } else {
    console.log('@splinetool/react-spline already patched or not found in expected format');
  }
} else {
  console.log('@splinetool/react-spline package.json not found at', packagePath);
}
