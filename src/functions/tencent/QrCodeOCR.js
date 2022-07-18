import tencentcloud from "tencentcloud-sdk-nodejs";
import { getJsonObject } from '../../utils/file.js';
const OcrClient = tencentcloud.ocr.v20181119.Client;
const ENVJSON  = getJsonObject('env.json');

export const QrCodeScan = (base64str) => {
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
    })
    client.QrcodeOCR({
      "ImageBase64": base64str
    }).then(
      (data) => {
        res(data)
      }, (err) => {
        rej(err)
      }
    )
  })
}