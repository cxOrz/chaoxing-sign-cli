import { PPTSIGN } from '../configs/api';
import { cookieSerialize, request } from '../utils/request';

export const QRCodeSign = async (args: BasicCookie & { enc: string; name: string; fid: string; activeId: string; address: string;  lat: string; lon: string; }) => {
  const { enc, name, fid, activeId,lat, lon, address, ...cookies } = args;

let urlParams = "enc=" + enc + "&name=" + name + "&activeId=" + activeId + "&uid=" + cookies._uid + "&clientip=&location={\"result\":\"1\",\"address\":\"" + address + "\",\"latitude\":" + lat + ",\"longitude\":" + lon + ",\"altitude\":84.71114730834961}&latitude=-1&longitude=-1&fid=" + fid +"&appType=15";

let encodedUrlParams = urlParams.replace(/[^=&]+/g, encodeURIComponent);

  const url = PPTSIGN.URL +"?"+ encodedUrlParams;

  const result = await request(url, {
    secure: true,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
      Cookie: cookieSerialize(cookies),
    },
  });
  const msg = result.data === 'success' ? '[二维码]签到成功' : `[二维码]${result.data}`;
  console.log(msg);
 
  return msg;
};