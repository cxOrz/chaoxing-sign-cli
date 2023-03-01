const tencentcloud = require('tencentcloud-sdk-nodejs');
const OcrClient = tencentcloud.ocr.v20181119.Client;
import { getJsonObject } from '../utils/file';
const ENVJSON = getJsonObject('env.json');

export const QrCodeScan = async (base64str: string) => {
  const client = new OcrClient({
    credential: {
      secretId: ENVJSON.tencent.secretId,
      secretKey: ENVJSON.tencent.secretKey,
    },
    region: 'ap-shanghai',
    profile: {
      httpProfile: {
        endpoint: 'ocr.tencentcloudapi.com',
      },
    },
  });
  return await client.QrcodeOCR({
    ImageBase64: base64str,
  });
};
