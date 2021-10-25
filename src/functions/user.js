const http = require('http')
const { LOGIN_PAGE, LOGIN } = require("../configs/api")

exports.userLogin = (uname, password) => {
  let data = ''
  let fid = '-1', pid = '-1', refer = 'http%3A%2F%2Fi.chaoxing.com', _blank = '1', t = 'true'
  http.get(LOGIN_PAGE.URL, {
  }, (res) => {
    // 获取 fid,pid,refer 等参数
    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => {
      // 首次访问登录页所得的响应头，以及页面内容
      console.log(res.rawHeaders)
      // console.log(data)

      // 登录
      let req = http.request(LOGIN.URL, {
        method: LOGIN.METHOD,
        headers:{
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-Requested-With': 'XMLHttpRequest'
        }
      }, (res) => {
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          console.log(res.rawHeaders)
        })
      })
      // 密码进行 Base64 编码
      password = Buffer.from(password).toString('base64')
      // 填充表单
      let formdata = `uname=${uname}&password=${password}&fid=-1&t=true&refer=http://i.chaoxing.com`
      req.write(formdata)
      req.end()
    })
  })
}