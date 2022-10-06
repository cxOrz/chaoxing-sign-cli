import https from 'https';
import { PPTSIGN, CHAT_GROUP } from '../configs/api';

export const GeneralSign = async (uf: string, _d: string, vc3: string, name: string, activeId: string | number, uid: string, fid: string): Promise<string> => {
  let data = '';
  return new Promise((resolve) => {
    https.get(PPTSIGN.URL + `?activeId=${activeId}&uid=${uid}&clientip=&latitude=-1&longitude=-1&appType=15&fid=${fid}&name=${name}`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[通用]签到成功`);
          resolve('success');
        } else {
          console.log(data);
          resolve(data);
        }
      });
    });
  });
};

/**
 * 群聊签到方式，无课程
 */
export const GeneralSign_2 = async (uf: string, _d: string, vc3: string, activeId: string | number, uid: string): Promise<string> => {
  let data = '';
  return new Promise((resolve) => {
    https.get(CHAT_GROUP.SIGN.URL + `?activeId=${activeId}&uid=${uid}&clientip=`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        if (data === 'success') {
          console.log(`[通用]签到成功`);
          resolve('success');
        } else {
          console.log(data);
          resolve(data);
        }
      });
    });
  });
};