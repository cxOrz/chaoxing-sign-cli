const https = require('https')
const { PPTSIGN } = require('../configs/api')

exports.QRCodeSign = (enc, name, fid, uid, aid) => {
  let data = ''
  https.get(PPTSIGN.URL + `?enc=${enc}&name=${encodeURI(name)}&activeId=${aid}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=${fid}&appType=15`, (res) => {
    res.on('data', (chunk) => { data += chunk })
    res.on('end', () => {
      console.log(data)
    })
  })
}