import { CHAT_GROUP, PPTSIGN } from '../configs/api';
import { delay } from '../utils/helper';
import { cookieSerialize, request } from '../utils/request';

interface AddressItem {
  lon: string;
  lat: string;
  address: string;
}
type PresetAddress = AddressItem[];
type CookieWithAddressItemArgs = BasicCookie & AddressItem & { name: string; activeId: string; fid: string; };
type CookieWithPresetAddressArgs = BasicCookie & { presetAddress: PresetAddress; name: string; activeId: string; fid: string; };

type LocationSignType = {
  (arg1: CookieWithAddressItemArgs): Promise<string>;
  (arg1: CookieWithPresetAddressArgs): Promise<string>;
};

export const LocationSign: LocationSignType = async (args): Promise<string> => {
  let msg = '';
  if ('address' in args) {
    // 单个位置直接签
    const { name, address, activeId, lat, lon, fid, ...cookies } = args;
    const url = `${PPTSIGN.URL}?name=${name}&address=${address}&activeId=${activeId}&uid=${cookies._uid}&clientip=&latitude=${lat}&longitude=${lon}&fid=${fid}&appType=15&ifTiJiao=1`;
    const result = await request(url, {
      headers: {
        Cookie: cookieSerialize(cookies),
      },
    });
    msg = result.data === 'success' ? '[位置]签到成功' : `[位置]${result.data}`;
  } else {
    // 多个位置尝试
    const { name, activeId, presetAddress, fid, ...cookies } = args;
    for (let i = 0; i < presetAddress.length; i++) {
      const url = `${PPTSIGN.URL}?name=${name}&address=${presetAddress[i].address}&activeId=${activeId}&uid=${cookies._uid}&clientip=&latitude=${presetAddress[i].lat}&longitude=${presetAddress[i].lon}&fid=${fid}&appType=15&ifTiJiao=1`;
      const result = await request(url, {
        headers: {
          Cookie: cookieSerialize(cookies),
        },
      });
      if (result.data === 'success') {
        msg = '[位置]签到成功';
        break;
      } else {
        msg = `[位置]${result.data}`;
        await delay(1);
      }
    }
  }
  console.log(msg);
  return msg;
};

/**
 * 位置签到，无课程群聊版本
 */
export const LocationSign_2: LocationSignType = async (args): Promise<string> => {
  let msg = '';
  if ('address' in args) {
    // 单个位置直接签
    const { address, activeId, lat, lon, ...cookies } = args;
    const formdata = `address=${encodeURIComponent(address)}&activeId=${activeId}&uid=${cookies._uid}&clientip=&useragent=&latitude=${lat}&longitude=${lon}&fid=&ifTiJiao=1`;
    const result = await request(
      CHAT_GROUP.SIGN.URL,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
          Cookie: cookieSerialize(cookies),
        },
      },
      formdata
    );
    msg = result.data === 'success' ? '[位置]签到成功' : `[位置]${result.data}`;
  } else {
    // 多个位置尝试
    const { activeId, presetAddress, ...cookies } = args;
    for (let i = 0; i < presetAddress.length; i++) {
      const formdata = `address=${encodeURIComponent(presetAddress[i].address)}&activeId=${activeId}&uid=${cookies._uid}&clientip=&useragent=&latitude=${presetAddress[i].lat}&longitude=${presetAddress[i].lon}&fid=&ifTiJiao=1`;
      const result = await request(
        CHAT_GROUP.SIGN.URL,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            Cookie: cookieSerialize(cookies),
          },
        },
        formdata
      );
      if (result.data === 'success') {
        msg = '[位置]签到成功';
        break;
      } else {
        msg = `[位置]${result.data}`;
        await delay(1);
      }
    }
  }
  console.log(msg);
  return msg;
};

export const presetAddressChoices = (presetAddress: any[] = []) => {
  const arr = [];
  for (let i = 0; i < presetAddress.length; i++) {
    arr.push({
      title: `${presetAddress[i].lon},${presetAddress[i].lat}/${presetAddress[i].address}`,
      value: i,
    });
  }
  arr.push({ title: '手动添加', value: -1 });
  return [...arr];
};
