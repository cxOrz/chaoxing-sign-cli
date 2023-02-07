import { join } from 'path';
import { copyFiles } from '../utils/copyFiles';

copyFiles([
  {
    from: join(__dirname, '../utils/websdk3.1.4.js'),
    to: join(__dirname, '../../build/utils/websdk3.1.4.js'),
  },
]);
