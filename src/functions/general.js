import https from 'https';
import { PPTSIGN } from '../configs/api.js';

export const GeneralSign = async (uf, _d, vc3, name, activeId, uid, fid) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PPTSIGN.URL + `?activeId=${activeId}&uid=${uid}&clientip=&latitude=-1&longitude=-1&appType=15&fid=${fid}&name=${name}`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[通用]签到成功`)
          resolve('success')
        } else {
          console.log(data)
          resolve(data)
        }
      })
    })
  })
}