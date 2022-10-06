import https from 'https';
import { PPTSIGN } from '../configs/api';

export const QRCodeSign = async (enc: string, name: string, fid: string, uid: string, aid: string | number, uf: string, _d: string, vc3: string) => {
  return new Promise((resolve) => {
    let data = '';
    https.get(PPTSIGN.URL + `?enc=${enc}&name=${encodeURI(name)}&activeId=${aid}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=${fid}&appType=15`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[二维码]签到成功`);
          resolve("success");
        } else {
          console.log(data);
          resolve(data);
        }
      });
    });
  });
};