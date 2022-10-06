const tencentcloud = require("tencentcloud-sdk-nodejs");
const OcrClient = tencentcloud.ocr.v20181119.Client;
import { getJsonObject } from '../../utils/file';
const ENVJSON = getJsonObject('env.json');

export const QrCodeScan = (base64str: string) => {
  return new Promise((res, rej) => {
    const client = new OcrClient({
      credential: {
        secretId: ENVJSON.tencent.secretId,
        secretKey: ENVJSON.tencent.secretKey
      },
      region: "ap-shanghai",
      profile: {
        httpProfile: {
          endpoint: "ocr.tencentcloudapi.com",
        },
      },
    });
    client.QrcodeOCR({
      "ImageBase64": base64str
    }).then(
      (data: any) => {
        res(data);
      }, (err: any) => {
        rej(err);
      }
    );
  });
};