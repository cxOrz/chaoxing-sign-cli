import http from 'http';
import https from 'https';
import zlib from 'zlib';
import cryptojs from 'crypto-js';
import { LOGIN_PAGE, LOGIN, COURSELIST, ACCOUNTMANAGE, PANTOKEN, WEBIM } from "../configs/api.js";
import { getJsonObject } from '../utils/file.js';
import { blue } from 'kolorist';

export const userLogin = async (uname, password) => {
  return new Promise((resolve) => {
    let params = {
      fid: '-1', pid: '-1', refer: 'http%3A%2F%2Fi.chaoxing.com', _blank: '1', t: true,
      vc3: null, _uid: null, _d: null, uf: null
    }
    let data = ''
    http.get(LOGIN_PAGE.URL, {
    }, (res) => {
      // 获取 fid,pid,refer 等参数
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        // 首次访问登录页所得的响应头，以及页面内容
        // console.log(res.rawHeaders)
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
            // console.log(res.headers)
            if (JSON.parse(data).status) {
              console.log('登陆成功')
              let cookies = res.headers['set-cookie']
              let c_equal, c_semi, itemName, itemValue, rt_cookies
              const map = new Map()
              for (let i = 0; i < cookies.length; i++) {
                c_equal = cookies[i].indexOf('=')
                c_semi = cookies[i].indexOf(';')
                itemName = cookies[i].substring(0, c_equal)
                itemValue = cookies[i].substring(c_equal + 1, c_semi)
                map.set(itemName, itemValue)
              }
              rt_cookies = Object.fromEntries(map.entries())
              params = Object.assign(params, rt_cookies)
              // console.log(params)
              resolve(params)
            } else {
              console.log('登陆失败')
              resolve("AuthFailed")
            }
          })
        })
        // 密码DES加密
        let wordArray = cryptojs.enc.Utf8.parse('u2oh6Vu^HWe40fj')
        let encryptedPassword = cryptojs.DES.encrypt(password, wordArray, {
          mode: cryptojs.mode.ECB,
          padding: cryptojs.pad.Pkcs7
        })
        password = encryptedPassword.ciphertext.toString()
        // 填充表单
        let formdata = `uname=${uname}&password=${password}&fid=-1&t=true&refer=https%253A%252F%252Fi.chaoxing.com&forbidotherlogin=0&validate=`
        req.write(formdata)
        req.end()
      })
    })
  })
}

// 获取全部课程
export const getCourses = async (_uid, _d, vc3) => {
  return new Promise((resolve) => {
    let data = ''
    let req = http.request(COURSELIST.URL, {
      method: COURSELIST.METHOD,
      headers: {
        'Accept': 'text/html, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;',
        'Cookie': `_uid=${_uid}; _d=${_d}; vc3=${vc3}`
      }
    }, (res) => {
      if (res.statusCode === 302) {
        console.log('身份过期，程序将关闭，请你使用手动填写用户名密码的方式登录！手动登录后身份信息刷新，之后可继续使用本地凭证！\n')
        resolve("AuthRequired")
        return
      }
      // 解决gzip乱码问题
      let gzip = zlib.createGunzip();
      let output
      res.pipe(gzip)
      output = gzip
      output.on('data', (chunk) => {
        data += chunk
      })
      output.on('end', () => {
        // 全部课程数据
        // console.log(data)
        // console.log(res.rawHeaders)
        let arr = []
        let end_of_courseid
        // 解析出所有 courseId 和 classId，填充到数组返回
        for (let i = 1; ; i++) {
          i = data.indexOf('course_', i)
          if (i == -1) break
          end_of_courseid = data.indexOf('_', i + 7)
          arr.push({
            courseId: data.slice(i + 7, end_of_courseid),
            classId: data.slice(end_of_courseid + 1, data.indexOf('"', i + 1))
          })
        }
        // console.log(arr)
        // 若无课程，返回NoCourse，输出提示
        if (arr.length === 0) {
          resolve('NoCourse');
          console.log(`${blue('[提示]')}无课程可查.`)
        } else {
          resolve(arr);
        }
        return;
      })
    })
    let formdata = `courseType=1&courseFolderId=0&courseFolderSize=0`
    req.write(formdata)
    req.end()
  })
}

// 获取用户名
export const getAccountInfo = async (uf, _d, _uid, vc3) => {
  return new Promise((resolve) => {
    let data = ''
    http.get(ACCOUNTMANAGE.URL, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${_uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        // console.log(data)
        let end_of_messageName = data.indexOf('messageName') + 13
        let name = data.slice(end_of_messageName, data.indexOf('<', end_of_messageName))
        resolve(name)
      })
    })
  })
}

// 获取用户鉴权token
export const getPanToken = (uf, _d, _uid, vc3) => {
  return new Promise((resolve) => {
    let data = ''
    https.get(PANTOKEN.URL, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${_uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve(data)
      })
    })
  })
}

/**
 * 
 * @returns 用户数量
 */
export const printUsers = () => {
  const data = getJsonObject('configs/storage.json')
  console.log('####################')
  console.log('##    用户列表    ##')
  console.log('####################')
  if (data.users.length === 0) {
    console.log('#        空        #')
  }
  for (let i = 0; i < data.users.length; i++) {
    if (i > 9) console.log(`# ${i} # ${data.users[i].phone} #`)
    else console.log(`# ${i}  # ${data.users[i].phone} #`)
  }
  console.log('####################')
  return data.users.length
}

/**
 * 返回用户列表
 * 
 * @returns [ { title: '手机号码', value: 索引 } , ...]
 */
export const getLocalUsers = () => {
  const data = getJsonObject('configs/storage.json');
  const arr = [];
  for (let i = 0; i < data.users.length; i++) {
    arr.push({
      title: data.users[i].phone,
      value: i
    })
  }
  arr.push({ title: '手动登录', value: -1 });
  return [...arr];
}

/**
 * 
 * @returns 返回的对象包含 myName, myToken, myTuid, myPuid
 */
export const getIMParams = (uf, _d, _uid, vc3) => {
  let htmlPage = ''
  let params = {
    myName: '',
    myToken: '',
    myTuid: '',
    myPuid: ''
  }
  return new Promise((resolve) => {
    https.get(WEBIM.URL, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${_uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', chunk => htmlPage += chunk);
      res.on('end', () => {
        let index = htmlPage.indexOf('id="myName"');
        params.myName = htmlPage.slice(index + 35, htmlPage.indexOf('<', index + 35));
        index = htmlPage.indexOf('id="myToken"')
        params.myToken = htmlPage.slice(index + 36, htmlPage.indexOf('<', index + 36));
        index = htmlPage.indexOf('id="myTuid"')
        params.myTuid = htmlPage.slice(index + 35, htmlPage.indexOf('<', index + 35));
        params.myPuid = _uid
        resolve({ ...params })
      })
    })
  })
}