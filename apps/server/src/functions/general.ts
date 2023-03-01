import { CHAT_GROUP, PPTSIGN } from '../configs/api';
import { cookieSerialize, request } from '../utils/request';

export const GeneralSign = async (args: BasicCookie & { name: string; activeId: string; fid: string }): Promise<string> => {
  const { name, activeId, fid, ...cookies } = args;
  const url = `${PPTSIGN.URL}?activeId=${activeId}&uid=${cookies._uid}&clientip=&latitude=-1&longitude=-1&appType=15&fid=${fid}&name=${name}`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
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
export const GeneralSign_2 = async (args: BasicCookie & { activeId: string }): Promise<string> => {
  const { activeId, ...cookies } = args;
  const url = `${CHAT_GROUP.SIGN.URL}?activeId=${activeId}&uid=${cookies._uid}&clientip=`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  if (result.data === 'success') {
    console.log(`[通用]签到成功`);
    return 'success';
  }
  console.log(result.data);
  return result.data;
};
