const { getSignActivity } = require("./functions/activity");
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
  
  // 二维码签到
  if (aid != null && process.argv.includes('--qrcode')) {
    let enc = await readline.question(rl, 'enc(微信或其他识别二维码，可得enc参数)：')
    await QRCodeSign(enc, name, params.fid, params._uid, aid, params.uf, params._d, params.vc3)
    process.exit(0)
  }
}()