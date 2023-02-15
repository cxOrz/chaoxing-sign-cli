import { PPTSIGN, CHAT_GROUP } from '../configs/api';
import { request } from '../utils/request';

export const GeneralSign = async (
  uf: string,
  _d: string,
  vc3: string,
  name: string,
  activeId: string | number,
  uid: string,
  fid: string
): Promise<string> => {
  const url = `${PPTSIGN.URL}?activeId=${activeId}&uid=${uid}&clientip=&latitude=-1&longitude=-1&appType=15&fid=${fid}&name=${name}`;
  const result = await request(url, {
    SSL: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  if (result.data === 'success') {
    console.log(`[通用]签到成功`);
    return 'success';
  }
  console.log(result.data);
  return result.data;
};

/**
 * 群聊签到方式，无课程
 */
export const GeneralSign_2 = async (
  uf: string,
  _d: string,
  vc3: string,
  activeId: string | number,
  uid: string
): Promise<string> => {
  const url = `${CHAT_GROUP.SIGN.URL}?activeId=${activeId}&uid=${uid}&clientip=`;
  const result = await request(url, {
    SSL: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  if (result.data === 'success') {
    console.log(`[通用]签到成功`);
    return 'success';
  }
  console.log(result.data);
  return result.data;
};
