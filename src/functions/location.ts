import https from 'https';
import { PPTSIGN } from '../configs/api';

export const LocationSign = async (uf: string, _d: string, vc3: string, name: string, address: string, activeId: string | number, uid: string, lat: string, lon: string, fid: string) => {
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
        } else {
          console.log(data)
          resolve(data)
        }
      })
    })
  })
}