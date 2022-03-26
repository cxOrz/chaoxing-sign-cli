const https = require('https')
const { PPTSIGN } = require('../configs/api')

exports.LocationSign = async (uf, _d, vc3, name, address, activeId, uid, lat, lon, fid) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PPTSIGN.URL + `?name=${name}&address=${address}&activeId=${activeId}&uid=${uid}&clientip=&latitude=${lat}&longitude=${lon}&fid=${fid}&appType=15&ifTiJiao=1`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[位置]签到成功`)
          resolve('success')
        } else resolve(data)
      })
    })
  })
}