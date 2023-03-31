import { randomBytes } from 'crypto';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { CHAT_GROUP, PANCHAOXING, PANLIST, PANUPLOAD, PPTSIGN } from '../configs/api';
import { cookieSerialize, request } from '../utils/request';

export const PhotoSign = async (
  args: BasicCookie & { fid: string; objectId: string; name: string; activeId: string }
): Promise<string> => {
  const { name, activeId, fid, objectId, ...cookies } = args;
  const url = `${PPTSIGN.URL}?activeId=${activeId}&uid=${
    cookies._uid
  }&clientip=&useragent=&latitude=-1&longitude=-1&appType=15&fid=${fid}&objectId=${objectId}&name=${encodeURIComponent(name)}`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  const msg = result.data === 'success' ? '[拍照]签到成功' : `[拍照]${result.data}`;
  console.log(msg);
  return msg;
};

export const PhotoSign_2 = async (args: BasicCookie & { objectId: string; activeId: string }): Promise<string> => {
  const { activeId, objectId, ...cookies } = args;
  const url = `${CHAT_GROUP.SIGN.URL}?activeId=${activeId}&uid=${cookies._uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=0&objectId=${objectId}`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  const msg = result.data === 'success' ? '[拍照]签到成功' : `[拍照]${result.data}`;
  console.log(msg);
  return msg;
};

// 在Termux或其他终端中使用，从云盘获取图片
export const getObjectIdFromcxPan = async (cookies: BasicCookie) => {
  // 获得 parentId, enc
  const result = await request(PANCHAOXING.URL, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  const data = result.data;
  const start_of_enc = data.indexOf('enc ="') + 6;
  const enc = data.slice(start_of_enc, data.indexOf('"', start_of_enc));
  const start_of_rootdir = data.indexOf('_rootdir = "') + 12;
  const parentId = data.slice(start_of_rootdir, data.indexOf('"', start_of_rootdir));

  // 获得文件列表，找到符合要求的 ObjectID
  const result_panlist = await request(
    `${PANLIST.URL}?puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`,
    {
      secure: true,
      method: PANLIST.METHOD,
      headers: {
        Cookie: cookieSerialize(cookies),
      },
    },
    `puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`
  );
  const objectList = JSON.parse(result_panlist.data).list;
  for (let i = 0; i < objectList.length; i++) {
    if (objectList[i].name === '0.jpg' || objectList[i].name === '0.png') {
      return objectList[i].objectId as string;
    }
  }

  console.log('未查询到符合要求的图片，请去网盘检查检查！');
  return null;
};

// 直接上传图片获得 objectId，在UI项目里使用
export const uploadPhoto = async (args: BasicCookie & { buffer: Buffer; token: string }) => {
  const { token, buffer, ...cookies } = args;
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  const tempFilePath = path.join(tmpdir(), randomBytes(16).toString('hex') + '.jpg');

  // form-data 库只支持文件流，所以只能先写入文件再从文件读了
  fs.writeFileSync(tempFilePath, buffer);
  const file = fs.readFileSync(tempFilePath);
  form.append('file', file, { filename: '1.png' }); // 必须指定文件名，form-data 才能识别出文件 MimeType
  form.append('puid', cookies._uid);

  const result = await request(
    `${PANUPLOAD.URL}?_from=mobilelearn&_token=${token}`,
    {
      secure: true,
      method: PANUPLOAD.METHOD,
      headers: {
        Cookie: cookieSerialize(cookies),
        'Content-Type': `multipart/form-data;boundary=${form.getBoundary()}`,
      },
    },
    form.getBuffer()
  );

  // 删除临时文件
  fs.unlink(tempFilePath, (err) => {
    err && console.error(err);
  });

  return result.data;
};
