const https = require('https')
const { PPTSIGN } = require('../configs/api')

exports.QRCodeSign = async (enc, name, fid, uid, aid, uf, _d, vc3) => {
  return new Promise((resolve) => {
    let data = ''
    https.get(PPTSIGN.URL + `?enc=${enc}&name=${encodeURI(name)}&activeId=${aid}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=${fid}&appType=15`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (data == 'success')
          console.log(`${data}签到成功`)
          resolve()
      })
    })
  })
}