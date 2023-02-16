import { CHAT_GROUP, PPTSIGN } from '../configs/api';
import { request } from '../utils/request';

export const LocationSign = async (
  uf: string,
  _d: string,
  vc3: string,
  name: string,
  address: string,
  activeId: string | number,
  uid: string,
  lat: string,
  lon: string,
  fid: string
): Promise<string> => {
  const url = `${PPTSIGN.URL}?name=${name}&address=${address}&activeId=${activeId}&uid=${uid}&clientip=&latitude=${lat}&longitude=${lon}&fid=${fid}&appType=15&ifTiJiao=1`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  if (result.data === 'success') {
    console.log(`[位置]签到成功`);
    return 'success';
  }
  console.log(result.data);
  return result.data;
};

/**
 * 位置签到，无课程群聊版本
 */
export const LocationSign_2 = async (
  uf: string,
  _d: string,
  vc3: string,
  address: string,
  activeId: string | number,
  uid: string,
  lat: string,
  lon: string
): Promise<string> => {
  let formdata = `address=${encodeURIComponent(
    address
  )}&activeId=${activeId}&uid=${uid}&clientip=&useragent=&latitude=${lat}&longitude=${lon}&fid=&ifTiJiao=1`;
  const result = await request(
    CHAT_GROUP.SIGN.URL,
    {
      secure: true,
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
        Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
      },
    },
    formdata
  );
  if (result.data === 'success') {
    console.log(`[位置]签到成功`);
    return 'success';
  }
  console.log(result.data);
  return result.data;
};
