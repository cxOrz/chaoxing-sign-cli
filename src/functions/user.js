const http = require('http')
const zlib = require('zlib')
const { LOGIN_PAGE, LOGIN, COURSELIST } = require("../configs/api")

exports.userLogin = async (uname, password) => {
  return new Promise((resolve) => {
    let params = {
      fid: '-1', pid: '-1', refer: 'http%3A%2F%2Fi.chaoxing.com', _blank: '1', t: 'true',
      vc3: null, _uid: null, _d: null
    }
    let data = ''
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
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            'X-Requested-With': 'XMLHttpRequest'
          }
        }, (res) => {
          data = ''
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            console.log(res.rawHeaders)
            if (JSON.parse(data).status) {
              console.log('登陆成功')
              resolve(params)
            } else {
              console.log('登陆失败')
            }
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
  })
}

exports.getCourses = async (_uid, _d, vc3) => {
  return new Promise((resolve) => {
    let data = ''
    let req = http.request(COURSELIST.URL, {
      method: COURSELIST.METHOD,
      headers: {
        'Accept': ' text/html, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Connection': 'keep-alive',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;',
        'Cookie': `_uid=${_uid}; _d=${_d}; vc3=${vc3}`
      }
    }, (res) => {
      let gzip = zlib.createGunzip();
      let output
      res.pipe(gzip);
      output = gzip;
      output.on('data', (chunk) => {
        data += chunk
      })
      output.on('end', () => {
        // 全部课程数据
        // console.log(data)
        // console.log(res.rawHeaders)
        let arr = []
        let end_of_courseid
        for (let i = 1; ; i++) {
          i = data.indexOf('course_', i)
          if (i == -1) break
          end_of_courseid = data.indexOf('_', i + 7)
          arr.push({
            courseId: data.slice(i + 7, end_of_courseid),
            classId: data.slice(end_of_courseid + 1, data.indexOf('"', i + 1))
          })
        }
        console.log(arr)
        resolve(arr)
      })
    })
    let formdata = `courseType=1&courseFolderId=0&courseFolderSize=0`
    req.write(formdata)
    req.end()
  })
}