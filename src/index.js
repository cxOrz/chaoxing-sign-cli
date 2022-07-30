import { blue } from 'kolorist';
import prompts from 'prompts';
import { getSignActivity, preSign } from "./functions/activity.js";
import { GeneralSign } from "./functions/general.js";
import { LocationSign } from "./functions/location.js";
import { PhotoSign, getObjectIdFromcxPan } from "./functions/photo.js";
import { QRCodeSign } from "./functions/QRCode.js";
import { userLogin, getCourses, getAccountInfo, getLocalUsers } from "./functions/user.js";
import { getJsonObject, storeUser } from './utils/file.js';

const PromptsOptions = {
  onCancel: () => {
    console.log(red('✖') + ' 操作取消')
    process.exit(0);
  }
}

!async function () {
  let params;
  // 本地与登录之间的抉择
  {
    // 打印本地用户列表，并返回用户数量
    let userItem = (await prompts({ type: 'select', name: 'userItem', message: '选择用户', choices: getLocalUsers(), initial: 0 }, PromptsOptions)).userItem;
    // 使用新用户登录
    if (userItem === -1) {
      let uname = (await prompts({ type: 'text', name: 'uname', message: '手机号' }, PromptsOptions)).uname
      let password = (await prompts({ type: 'password', name: 'password', message: '密码' }, PromptsOptions)).password
      // 登录获取各参数
      params = await userLogin(uname, password)
      if (params === "AuthFailed") process.exit(1)
      storeUser(uname, params) // 储存到本地
    } else {
      // 使用本地储存的参数
      params = getJsonObject('configs/storage.json').users[userItem].params;
    }
  }

  // 获取用户名
  let name = await getAccountInfo(params.uf, params._d, params._uid, params.vc3)
  console.log(blue(`你好，${name}`))

  // 获取所有课程
  let courses = await getCourses(params._uid, params._d, params.vc3)
  if (courses === "AuthRequired" || courses === "NoCourse") process.exit(1);
  // 获取进行中的签到活动
  let activity = await getSignActivity(courses, params.uf, params._d, params._uid, params.vc3)
  if (activity === "NoActivity") process.exit(1)

  // 处理签到，先进行预签
  await preSign(params.uf, params._d, params.vc3, activity.aid, activity.classId, activity.courseId, params._uid)
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      let enc = (await prompts({ type: 'text', name: 'enc', message: 'enc(微信或其他识别二维码，可得enc参数)' }, PromptsOptions)).enc
      await QRCodeSign(enc, name, params.fid, params._uid, activity.aid, params.uf, params._d, params.vc3)
      process.exit(0)
    }
    case 4: {
      // 位置签到
      console.log('[获取经纬度]https://api.map.baidu.com/lbsapi/getpoint/index.html')
      let lnglat = (await prompts({ type: 'text', name: 'lnglat', message: '经纬度', initial: '113.516288,34.817038' }, PromptsOptions)).lnglat
      let address = (await prompts({ type: 'text', name: 'address', message: '详细地址' })).address
      await LocationSign(params.uf, params._d, params.vc3, name, address, activity.aid, params._uid, lnglat.substring(lnglat.indexOf(',') + 1, lnglat.length), lnglat.substring(0, lnglat.indexOf(',')), params.fid);
      process.exit(0)
    }
    case 3: {
      // 手势签到
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid)
      process.exit(0)
    }
    case 5: {
      // 签到码签到
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid)
      process.exit(0)
    }
    case 0: {
      let photo = (await prompts({ type: 'confirm', name: 'photo', message: '是否拍照签到', initial: false }, PromptsOptions)).photo
      if (photo) {
        // 拍照签到
        console.log('访问 https://pan-yz.chaoxing.com 并在根目录上传你想要提交的照片，格式为jpg或png，命名为 0.jpg 或 0.png');
        await prompts({ type: 'confirm', message: '已上传完毕?' })
        // 获取照片objectId
        let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params._uid)
        await PhotoSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid, objectId)
      } else {
        // 普通签到
        await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid)
      }
      process.exit(0)
    }
  }
}();