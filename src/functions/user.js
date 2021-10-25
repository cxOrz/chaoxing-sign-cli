const http = require('http')
const { LOGIN_PAGE, LOGIN } = require("../configs/api")

exports.userLogin = (uname, password) => {
  let data = '', formData
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
        method: LOGIN.METHOD
      }, (res) => {
        res.on('data', (chunk) => { data += chunk })
        res.on('end', () => {
          console.log(res.rawHeaders)
          if(JSON.parse(data).status){
            console.log('登陆成功')
          }
        })
      })
      // 密码进行 Base64 编码
      password = Buffer.from(password).toString('base64')
      // 填充表单
      formData = new FormData()
      formData.set('uname', uname)
      formData.set('password', password)
      formData.set('fid', '-1')
      formData.set('t', 'true')
      formData.set('refer', 'http%3A%2F%2Fi.chaoxing.com')
      req.write(formData)
      req.end()
    })
  })
}