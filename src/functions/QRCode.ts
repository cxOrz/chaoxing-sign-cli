import { PPTSIGN } from '../configs/api';
import { request } from '../utils/request';

export const QRCodeSign = async (
  enc: string,
  name: string,
  fid: string,
  uid: string,
  aid: string | number,
  uf: string,
  _d: string,
  vc3: string
) => {
  const url = `${PPTSIGN.URL}?enc=${enc}&name=${encodeURI(
    name
  )}&activeId=${aid}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=${fid}&appType=15`;
  const result = await request(url, {
    SSL: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  if (result.data === 'success') {
    console.log(`[二维码]签到成功`);
    return 'success';
  } else {
    console.log(result.data);
    return result.data;
  }
};
