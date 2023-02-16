import { randomBytes } from 'crypto';
import fs from 'fs';
import { tmpdir } from 'os';
import path from 'path';
import { CHAT_GROUP, PANCHAOXING, PANLIST, PANUPLOAD, PPTSIGN } from '../configs/api';
import { request } from '../utils/request';

export const PhotoSign = async (
  uf: string,
  _d: string,
  vc3: string,
  name: string,
  activeId: string | number,
  uid: string,
  fid: string,
  objectId: string
): Promise<string> => {
  const url = `${PPTSIGN.URL}?activeId=${activeId}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&appType=15&fid=${fid}&objectId=${objectId}&name=${name}`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  if (result.data === 'success') {
    console.log(`[拍照]签到成功`);
    return 'success';
  }
  return result.data;
};

export const PhotoSign_2 = async (
  uf: string,
  _d: string,
  vc3: string,
  activeId: string | number,
  uid: string,
  objectId: string
): Promise<string> => {
  const url = `${CHAT_GROUP.SIGN.URL}?activeId=${activeId}&uid=${uid}&clientip=&useragent=&latitude=-1&longitude=-1&fid=0&objectId=${objectId}`;
  const result = await request(url, {
    secure: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  if (result.data === 'success') {
    console.log(`[拍照]签到成功`);
    return 'success';
  }
  return result.data;
};

// 在Termux或其他终端中使用，从云盘获取图片
export const getObjectIdFromcxPan = async (uf: string, _d: string, vc3: string, uid: string) => {
  // 获得 parentId, enc
  const result = await request(PANCHAOXING.URL, {
    secure: true,
    headers: {
      Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
    },
  });
  let data = result.data;
  let start_of_enc = data.indexOf('enc ="') + 6;
  let enc = data.slice(start_of_enc, data.indexOf('"', start_of_enc));
  let start_of_rootdir = data.indexOf('_rootdir = "') + 12;
  let parentId = data.slice(start_of_rootdir, data.indexOf('"', start_of_rootdir));

  // 获得文件列表，找到符合要求的 ObjectID
  const result_panlist = await request(
    `${PANLIST.URL}?puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`,
    {
      secure: true,
      method: PANLIST.URL,
      headers: {
        Cookie: `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`,
      },
    },
    `puid=0&shareid=0&parentId=${parentId}&page=1&size=50&enc=${enc}`
  );
  let objectList = JSON.parse(result_panlist.data).list;
  for (let i = 0; i < objectList.length; i++) {
    if (objectList[i].name == '0.jpg' || objectList[i].name == '0.png') {
      return objectList[i].objectId as string;
    }
  }

  console.log('未查询到符合要求的图片，请去网盘检查检查！');
  return null;
};

// 直接上传图片获得 objectId，在UI项目里使用
export const uploadPhoto = async (uf: string, _d: string, _uid: string, vc3: string, token: string, buffer: Buffer) => {
  const FormData = (await import('form-data')).default;
  const form = new FormData();
  const tempFilePath = path.join(tmpdir(), randomBytes(16).toString('hex') + '.jpg');

  // form-data 库只支持文件流，所以只能先写入文件再从文件读了
  fs.writeFileSync(tempFilePath, buffer);
  const fStream = fs.createReadStream(tempFilePath);
  form.append('file', fStream);
  form.append('puid', _uid);

  const result = await request(
    `${PANUPLOAD.URL}?_token=${token}`,
    {
      secure: true,
      method: PANUPLOAD.METHOD,
      headers: {
        Cookie: `uf=${uf}; _d=${_d}; UID=${_uid}; vc3=${vc3};`,
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
