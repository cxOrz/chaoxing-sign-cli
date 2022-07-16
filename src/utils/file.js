import filehandle from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
/**
 * 储存用户凭证
 */
export const storeUser = (phone, params) => {
  const user = {
    phone: phone,
    params: params,
    date: new Date().getTime()
  }

  const data = getStore()
  const file = path.join(__dirname, '../configs/storage.json')
  let i = 0

  // 存了则替换
  for (; i < data.users.length; i++) {
    if (data.users[i].phone === phone) {
      data.users[i] = user;
      break;
    }
  }
  // 未存则push
  if (i === data.users.length) {
    data.users.push(user)
  }

  filehandle.writeFile(file, JSON.stringify(data), 'utf8', () => { })
}

export const getStore = () => {
  return JSON.parse(filehandle.readFileSync(path.join(__dirname, '../configs/storage.json'), 'utf8'))
}
