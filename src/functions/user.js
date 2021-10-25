const http = require('http')
const { LOGIN, LOGIN_PAGE } = require("../configs/api")

exports.userLogin = () => {
  let data = ''
  http.get(LOGIN_PAGE.URL, {
  }, (res) => {
    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => {
      console.log(res.rawHeaders)
      console.log(data)
    })
  })
}