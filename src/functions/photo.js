const https = require('https')
const fs = require('fs')
const FormData = require('form-data')
const path = require('path')
const { PPTSIGN, PANCHAOXING, PANLIST, PANUPLOAD } = require('../configs/api')

exports.PhotoSign = async (uf, _d, vc3, name, activeId, uid, fid, objectId) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PPTSIGN.URL + `?activeId=${activeId}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&appType=15&fid=${fid}&objectId=${objectId}&name=${name}`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[拍照]签到成功`)
          resolve('success')
        }
        resolve(data)
      })
    })
  })
}

// 在Termux或其他终端中使用，从云盘获取图片
exports.getObjectIdFromcxPan = (uf, _d, vc3, uid) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PANCHAOXING.URL, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        let start_of_enc = data.indexOf('enc ="') + 6
        let enc = data.slice(start_of_enc, data.indexOf('"', start_of_enc))
        let start_of_rootdir = data.indexOf('_rootdir = "') + 12
        let parentId = data.slice(start_of_rootdir, data.indexOf('"', start_of_rootdir))
        let objectId = ''

        data = ''
        let postreq = https.request(PANLIST.URL + `?puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`, {
          method: PANLIST.METHOD,
          headers: {
            'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
          }
        }, (res) => {
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            let result = JSON.parse(data)
            for (let i = 0; i < result.list.length; i++) {
              if (result.list[i].name == '0.jpg' || result.list[i].name == '0.png') {
                objectId = result.list[i].objectId
                break
              }
            }
            if (objectId != '') {
              resolve(objectId)
            } else {
              console.log('未查询到符合的图片，请去网盘检查检查！')
            }
          })
        })
        postreq.write(`puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`)
        postreq.end()
      })
    })
  })
}

// 直接上传图片获得objectId，在UI项目里使用
exports.uploadPhoto = (uf, _d, _uid, vc3, token, buffer) => {
  let form = new FormData()
  let data = ''
  let tempFilePath = path.join(__dirname, '../tmp/temp.jpg')
  fs.mkdirSync(path.join(__dirname, '../tmp'), { recursive: true })
  // 若部署在云函数中，使用以下路径
  // let tempFilePath = '/tmp/temp.jpg'
  fs.writeFileSync(tempFilePath, buffer)
  let readStream = fs.createReadStream(tempFilePath)
  form.append('file', readStream)
  form.append('puid', _uid)

  return new Promise((resolve) => {
    // 上传文件
    let request = https.request(PANUPLOAD.URL + '?_token=' + token, {
      method: PANUPLOAD.METHOD,
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${_uid}; vc3=${vc3};`,
        'Content-Type': `multipart/form-data;boundary=${form.getBoundary()}`
      }
    }, (res) => {
      res.on('data', (chunk) => {
        data += chunk
      })
      res.on('end', () => {
        resolve(data)
      })
    })
    form.pipe(request)
  })
}