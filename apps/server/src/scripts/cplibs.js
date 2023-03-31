/* eslint-disable @typescript-eslint/no-var-requires */
const { execSync } = require('child_process');
const { join } = require('path');

const options = {
  windowsHide: true,
  stdio: 'inherit',
  cwd: join(__dirname, '../../'),
};

if (process.platform === 'win32') {
  execSync('copy .\\src\\utils\\websdk3.1.4.js .\\build\\utils\\websdk3.1.4.js', options);
} else {
  execSync('cp ./src/utils/websdk3.1.4.js ./build/utils/websdk3.1.4.js', options);
}
