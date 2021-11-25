const filehandle = require('fs')
const path = require('path')

/**
 * 储存用户凭证
 */
exports.storeUser = (phone, params) => {
  const user = {
    phone: phone,
    params: params,
    date: new Date().getTime()
  }

  const data = this.getStore()
  const file = path.join(__dirname, '../configs/storage.json')
  let i = 0

  // 存了则替换
  for (; i < data.users.length; i++) {
    if (data.users[i].phone === phone) {
      data.users[i] = user
    }
  }
  // 未存则push
  if (i === data.users.length) {
    data.users.push(user)
  }

  filehandle.writeFile(file, JSON.stringify(data), 'utf8', () => { })
}

exports.getStore = () => {
  return JSON.parse(filehandle.readFileSync(path.join(__dirname, '../configs/storage.json'), 'utf8'))
}
