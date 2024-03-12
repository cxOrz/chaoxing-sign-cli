import { PPTSIGN } from '../configs/api';
import { cookieSerialize, request } from '../utils/request';

export const QRCodeSign = async (args: BasicCookie & { enc: string; name: string; fid: string; activeId: string; address: string; lat: string; lon: string; altitude: string; }) => {
  const { enc, name, fid, activeId, lat, lon, address, altitude, ...cookies } = args;
  const urlParams = `${PPTSIGN.URL}?enc=${enc}&name=${name}&activeId=${activeId}&uid=${cookies._uid}&clientip=&location={"result":"1","address":"${address}","latitude":${lat},"longitude":${lon},"altitude":${altitude}}&latitude=-1&longitude=-1&fid=${fid}&appType=15`;
  const result = await request(encodeURI(urlParams), {
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  const msg = result.data === 'success' ? '[二维码]签到成功' : `[二维码]${result.data}`;
  console.log(msg);

  return msg;
};