import { Decoder } from '@nuintun/qrcode';
import axios from 'axios';
import { general_api, location_api, ocr_api, photo_api, qrcode_api, upload_api, uvtoken_api } from '../../config/api';

export const generalSign = async (userParams: UserParamsType, activeId: number | undefined) => {
  const result = await axios.post(general_api, {
    uf: userParams.uf,
    _d: userParams._d,
    vc3: userParams.vc3,
    uid: userParams._uid,
    fid: userParams.fid,
    activeId: activeId,
    name: userParams.name,
  });
  return result.data;
};

export const photoSign = async (userParams: UserParamsType, activeId: number | undefined, objectId: string) => {
  const result = await axios.post(photo_api, {
    uf: userParams.uf,
    _d: userParams._d,
    vc3: userParams.vc3,
    uid: userParams._uid,
    fid: userParams.fid,
    activeId: activeId,
    name: userParams.name,
    objectId: objectId,
  });
  return result.data;
};

export const qrcodeSign = async (userParams: UserParamsType, activeId: number | undefined, enc: string) => {
  const result = await axios.post(qrcode_api, {
    uf: userParams.uf,
    _d: userParams._d,
    vc3: userParams.vc3,
    uid: userParams._uid,
    fid: userParams.fid,
    activeId: activeId,
    name: userParams.name,
    enc: enc,
  });
  return result.data;
};

export const locationSign = async (
  userParams: UserParamsType,
  activeId: number | undefined,
  lat: string,
  lon: string,
  address: string
) => {
  const result = await axios.post(location_api, {
    uf: userParams.uf,
    _d: userParams._d,
    vc3: userParams.vc3,
    uid: userParams._uid,
    fid: userParams.fid,
    activeId: activeId,
    name: userParams.name,
    lat: lat,
    lon: lon,
    address: address,
  });
  return result.data;
};

export const getuvToken = async (userParams: UserParamsType) => {
  const token = await axios.post(uvtoken_api, {
    uf: userParams.uf,
    _d: userParams._d,
    vc3: userParams.vc3,
    uid: userParams._uid,
  });
  return token.data._token;
};

// [默认] 使用浏览器解析ENC，成功率较低
export const parseEnc = (file: File): Promise<string> => {
  return new Promise((resolve) => {
    const url = window.URL || window.webkitURL;
    const img = new Image();
    const qrcode = new Decoder();
    img.src = url.createObjectURL(file);
    qrcode
      .scan(img.src)
      .then((result: any) => {
        const enc_start = result.data.indexOf('enc=') + 4;
        const rs = result.data.substring(enc_start, result.data.indexOf('&', enc_start));
        resolve(rs);
      })
      .catch((reason: any) => {
        console.log(reason);
        resolve('识别失败');
      });
  });
};

// [推荐] 使用腾讯云OCR解析ENC，请在cli项目中配置secretId和secretKey
// export const parseEnc = async (inputFile: File) => {
//   let data = new FormData()
//   data.append("file", inputFile)
//   let res = await axios.post(ocr_api, data, {
//     headers: {
//       'Content-type': 'multipart/form-data'
//     }
//   })
//   return res.data
// }

export const uploadFile = async (userParams: UserParamsType, inputFile: File, token: string) => {
  // 填入FormData
  const data = new FormData();
  data.append('uf', userParams.uf);
  data.append('_d', userParams._d);
  data.append('_uid', userParams._uid);
  data.append('vc3', userParams.vc3);
  data.append('file', inputFile);

  // 使用Token传文件，返回objectId
  const res = await axios.post(upload_api + `?_token=${token}`, data, {
    headers: {
      'Content-type': 'multipart/form-data',
    },
  });
  return res.data;
};

export const showResultWithTransition = (cb_setStatus: (res: string) => void, value: string) => {
  (document.getElementById('sign-btn') as HTMLButtonElement).disabled = true;
  const neum_form = document.getElementsByClassName('neum-form')[0];
  const content = document.getElementById('neum-form-content');
  content!.style.opacity = '0';
  setTimeout(() => {
    content!.style.display = 'none';
    neum_form.classList.add('form-height');
    cb_setStatus(value);
  }, 600);
};
