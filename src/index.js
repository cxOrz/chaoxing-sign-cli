const { getSignActivity } = require("./functions/activity");
const { GeneralSign } = require("./functions/general");
const { LocationSign } = require("./functions/location");
const { QRCodeSign } = require("./functions/QRCode");
const { userLogin, getCourses, getAccountInfo } = require("./functions/user");
const readline = require('./utils/readline')

const rl = readline.createInterface()

!async function () {
  let uname = await readline.question(rl, '用户名(手机号)：')
  let password = await readline.question(rl, '密码：')
  // 登录，获取各参数
  let params = await userLogin(uname, password)

  // 获取用户名
  let name = await getAccountInfo(params.uf, params._d, params._uid, params.vc3)
  console.log(`你好，${name}`)

  // 获取所有课程
  let courses = await getCourses(params._uid, params._d, params.vc3)
  // 获取进行中的签到活动id
  let aid = await getSignActivity(courses, params.uf, params._d, params._uid, params.vc3)

  // 检测到签到活动
  if (aid != null) {
    // 二维码签到
    if (process.argv.includes('--qrcode')) {
      let enc = await readline.question(rl, 'enc(微信或其他识别二维码，可得enc参数)：')
      await QRCodeSign(enc, name, params.fid, params._uid, aid, params.uf, params._d, params.vc3)
      process.exit(0)
    }
    // 位置签到
    if (process.argv.includes('--location')) {
      console.log('https://api.map.baidu.com/lbsapi/getpoint/index.html')
      let lnglat = await readline.question(rl, '经纬度，如\"113.516288,34.817038\": ')
      let address = await readline.question(rl, '详细地址: ')
      await LocationSign(params.uf, params._d, params.vc3, name, address, aid, params._uid, Number(lnglat.substring(lnglat.indexOf(',') + 1, lnglat.length)), Number(lnglat.substring(0, lnglat.indexOf(','))), params.fid)
      process.exit(0)
    }
    // 普通签到、手势签到
    if (process.argv.includes('--general')) {
      await GeneralSign(params.uf, params._d, params.vc3, name, aid, params._uid, params.fid)
      process.exit(0)
    }
  }
}()