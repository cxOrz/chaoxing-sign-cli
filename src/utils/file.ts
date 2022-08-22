import filehandle from 'fs';
import path from 'path';

/**
 * 储存用户凭证
 */
export const storeUser = (phone: string, params: any) => {
  const user = {
    phone: phone,
    params: params,
    date: new Date().getTime()
  }

  const data = getJsonObject('configs/storage.json');
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

export const getJsonObject = (fileURL: string) => {
  return JSON.parse(filehandle.readFileSync(path.join(__dirname, '../' + fileURL), 'utf8'))
}