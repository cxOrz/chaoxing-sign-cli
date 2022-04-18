const tencentcloud = require("tencentcloud-sdk-nodejs")

const OcrClient = tencentcloud.ocr.v20181119.Client

exports.QrCodeScan = (base64str) => {
  return new Promise((res, rej) => {
    const client = new OcrClient({
      credential: {
        secretId: "", // 在腾讯云开通OCR服务
        secretKey: "", // 并填写 secretId 和 secretKey
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