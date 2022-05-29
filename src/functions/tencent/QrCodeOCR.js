const tencentcloud = require("tencentcloud-sdk-nodejs")
const { tencent: { secretId, secretKey } } = require('../../env.json')
const OcrClient = tencentcloud.ocr.v20181119.Client

exports.QrCodeScan = (base64str) => {
  return new Promise((res, rej) => {
    const client = new OcrClient({
      credential: {
        secretId: secretId,
        secretKey: secretKey
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