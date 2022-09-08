import { extendGlobalThis } from './utils/helper';
extendGlobalThis(globalThis)
import prompts from 'prompts';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { Activity, getPPTActiveInfo, preSign, preSign2, speculateType } from './functions/activity';
import { GeneralSign, GeneralSign_2 } from "./functions/general";
import { LocationSign, LocationSign_2 } from "./functions/location";
import { PhotoSign, getObjectIdFromcxPan, PhotoSign_2 } from "./functions/photo";
import { getJsonObject, storeUser } from './utils/file';
import { getIMParams, getLocalUsers, IMParamsType, userLogin } from './functions/user';
import { blue, red } from 'kolorist';
import { sendEmail } from './utils/mailer';
const convert = (from: any, to: any) => (str: string) => Buffer.from(str, from).toString(to);
const utf8ToHex = convert('utf8', 'hex')
const hexToUtf8 = convert('hex', 'utf8');
const hexToBase64 = convert('hex', 'base64');
const base64toHex = convert('base64', 'hex');

const PromptsOptions = {
  onCancel: () => {
    console.log(red('✖') + ' 操作取消')
    process.exit(0);
  }
}

class Monitor {
  static WebSocketURL = 'wss://im-api-vip6-v2.easecdn.com/ws/468/c4lxie22/websocket';
  static COMING_SIGN_PREFIX = '080040024a2b0a2912';
  static CONFIRM = '["CABAAVgA"]';
  static ChatIDHex = '';
  static UNKNOWN_PREFIX_0 = '0800123c0a0e63782d64657623637873747564791208';
  static UNKNOWN_PREFIX_1 = '0800123d0a0e63782d64657623637873747564791209';

  // 生成登录请求数据包
  generateLoginHex(IM_Params: IMParamsType, mode: string | number) {
    const timestampHex = utf8ToHex(new Date().getTime().toString());

    // 兼容三种账号类型
    switch (mode) {
      case 0: mode = Monitor.UNKNOWN_PREFIX_0; break;
      default: mode = Monitor.UNKNOWN_PREFIX_1;
    }

    return (mode + utf8ToHex(IM_Params.myTuid) + "1a0b656173656d6f622e636f6d2213776562696d5f" +
      timestampHex + "1a8501247424" + utf8ToHex(IM_Params.myToken) +
      "40034ac00108101205332e302e30280030004a0d" + timestampHex +
      "6205776562696d6a13776562696d5f" + timestampHex + "728501247424" +
      utf8ToHex(IM_Params.myToken) + "50005800");
  }

  // 生成活动请求数据包
  generateGetActivityHex() {
    return '080040004a2b1a29120f' + Monitor.ChatIDHex + '1a16636f6e666572656e63652e656173656d6f622e636f6d5800';
  }

  // 生成请求保持连接数据包
  generateKeepAliveHex() {
    return '080040004a3510d09580acd5a2d2a90e1a29120f' + Monitor.ChatIDHex + '1a16636f6e666572656e63652e656173656d6f622e636f6d5800';
  }

}

// 提取活动数据的JSON部分
function parseCourseInfo(hexStr: string) {
  const textStr = hexToUtf8(hexStr);
  const position = textStr.lastIndexOf('/preSign?') + 9;
  let data = [];
  let data_start = textStr.indexOf('courseId=', position) + 9;
  let data_end = textStr.indexOf('&', data_start);
  data.push(textStr.substring(data_start, data_end));
  data_start = textStr.indexOf('classId=', position) + 8;
  data_end = textStr.indexOf('&', data_start);
  data.push(textStr.substring(data_start, data_end));
  data_start = textStr.indexOf('activePrimaryId=', position) + 16;
  // -1+16=15，说明未检索到 activePrimaryId，似乎是群聊签到，尝试 activeId
  if (data_start === 15) {
    data_start = textStr.indexOf('activeId=', position) + 9;
  }
  data_end = textStr.indexOf('&', data_start);
  data.push(textStr.substring(data_start, data_end));
  return ({ courseId: data[0], classId: data[1], aid: data[2] });
}
// 提取聊天群组ID
function getchatIdHex(hexStr: string) {
  return hexStr.substring(hexStr.indexOf('29120f') + 6, hexStr.indexOf('1a16636f'))
}

async function configure() {
  const config = getJsonObject('configs/storage.json');
  if (process.argv[2] === '--auth') return ({
    mailing: { ...config.mailing },
    monitor: { ...config.monitor }
  });

  let local = false;
  console.log(blue('自动签到支持 [普通/手势/拍照/签到码/位置]'))
  if (config.monitor.address !== "") {
    local = (await prompts({
      type: 'confirm',
      name: 'local',
      message: '是否用本地缓存的签到信息?',
      initial: true
    }, PromptsOptions)).local
  }
  // 若不使用本地，则配置并写入本地
  if (!local) {
    const response = await prompts([
      {
        type: 'text',
        name: 'lon',
        message: '位置签到经度',
        initial: '113.516288'
      },
      {
        type: 'text',
        name: 'lat',
        message: '位置签到纬度',
        initial: '34.817038'
      },
      {
        type: 'text',
        name: 'address',
        message: '详细地址'
      },
      {
        type: 'confirm',
        name: 'mail',
        message: '是否启用邮件通知?',
        initial: false
      },
      {
        type: prev => prev ? 'text' : null,
        name: 'host',
        message: 'SMTP服务器',
        initial: 'smtp.qq.com'
      },
      {
        type: prev => prev ? 'confirm' : null,
        name: 'ssl',
        message: '是否启用SSL',
        initial: true
      },
      {
        type: prev => prev ? 'number' : null,
        name: 'port',
        message: '端口号',
        initial: 465
      },
      {
        type: prev => prev ? 'text' : null,
        name: 'user',
        message: '邮件账号',
        initial: 'xxxxxxxxx@qq.com'
      },
      {
        type: prev => prev ? 'text' : null,
        name: 'pass',
        message: '授权码(密码)'
      },
      {
        type: prev => prev ? 'text' : null,
        name: 'to',
        message: '接收邮箱'
      }
    ], PromptsOptions)
    config.monitor.lon = response.lon;
    config.monitor.lat = response.lat;
    config.monitor.address = response.address;
    config.mailing.host = response.host;
    config.mailing.ssl = response.ssl;
    config.mailing.port = response.port;
    config.mailing.user = response.user;
    config.mailing.pass = response.pass;
    config.mailing.to = response.to;
    fs.writeFile(path.join(__dirname, './configs/storage.json'), JSON.stringify(config), 'utf8', () => { });
  }
  return ({
    mailing: { ...config.mailing },
    monitor: { ...config.monitor }
  });
}

async function Sign(realname: string, params: any, config: any, activity: Activity) {
  let result = 'fail';
  // 群聊签到，无课程
  if (activity.courseId === 'null') {
    let page = await preSign2(params.uf, params._d, params.vc3, activity.aid, Monitor.ChatIDHex, params._uid, params.tuid);
    let activityType = speculateType(page);
    switch (activityType) {
      case 'general': {
        result = await GeneralSign_2(params.uf, params._d, params.vc3, activity.aid, params._uid); break;
      }
      case 'photo': {
        let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params._uid);
        result = await PhotoSign_2(params.uf, params._d, params.vc3, activity.aid, params._uid, objectId);
        break;
      }
      case 'location': {
        result = await LocationSign_2(params.uf, params._d, params.vc3, config.address, activity.aid, params._uid, config.lat, config.lon); break;
      }
      case 'qr': {
        console.log(red('二维码签到，无法自动签到！')); break;
      }
    }
    return result;
  }

  await preSign(params.uf, params._d, params.vc3, activity.aid, activity.classId, activity.courseId, params._uid);
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      console.log(red('二维码签到，无法自动签到！')); break;
    }
    case 4: {
      // 位置签到
      result = await LocationSign(params.uf, params._d, params.vc3, realname, config.address, activity.aid, params._uid, config.lat, config.lon, params.fid); break;
    }
    case 3: {
      // 手势签到
      result = await GeneralSign(params.uf, params._d, params.vc3, realname, activity.aid, params._uid, params.fid); break;
    }
    case 5: {
      // 签到码签到
      result = await GeneralSign(params.uf, params._d, params.vc3, realname, activity.aid, params._uid, params.fid); break;
    }
    case 0: {
      if (activity.ifphoto === 0) {
        result = await GeneralSign(params.uf, params._d, params.vc3, realname, activity.aid, params._uid, params.fid); break;
      } else {
        let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params._uid);
        result = await PhotoSign(params.uf, params._d, params.vc3, realname, activity.aid, params._uid, params.fid, objectId); break;
      }
    }
  }
  return result;
}

// 开始运行
(async () => {
  let params: any = {};
  // 若凭证由命令参数传来，直接赋值；否则，直接用户名密码登录获取凭证
  if (process.argv[2] === '--auth') {
    params.uf = process.argv[3];
    params._d = process.argv[4];
    params.vc3 = process.argv[5];
    params._uid = process.argv[6];
    params.lv = process.argv[7];
    params.fid = process.argv[8];
  } else {
    // 打印本地用户列表，并返回用户数量
    let userItem = (await prompts({ type: 'select', name: 'userItem', message: '选择用户', choices: getLocalUsers(), initial: 0 }, PromptsOptions)).userItem;
    // 手动登录
    if (userItem === -1) {
      let phone = (await prompts({ type: 'text', name: 'phone', message: '手机号' }, PromptsOptions)).phone;
      let password = (await prompts({ type: 'password', name: 'password', message: '密码' }, PromptsOptions)).password;
      // 登录获取各参数
      params = await userLogin(phone, password);
      if (params === "AuthFailed") process.exit(1);
      storeUser(phone, params); // 储存到本地
    } else {
      // 使用本地储存的参数
      params = getJsonObject('configs/storage.json').users[userItem].params;
    }
  }
  let IM_Params = await getIMParams(params.uf, params._d, params._uid, params.vc3);
  if (IM_Params === 'AuthFailed') process.exit(0);
  params.tuid = IM_Params.myTuid;
  // 配置默认签到信息
  const config = await configure();

  const monitor = new Monitor();
  // 两种 loginhex ，第一种登录失败，尝试第二种
  const loginHex = [monitor.generateLoginHex(IM_Params, 0), monitor.generateLoginHex(IM_Params, 1)];

  console.log(blue('[监听中]'));

  const errors = []; // 记录错误次数
  while (errors.length < 2) {
    await new Promise<void>((resolve, reject) => {
      const ws = new WebSocket(Monitor.WebSocketURL);
      let data = null;
      ws.on('message', async (rawData) => {
        data = rawData.toString();
        // console.log(data);
        if (data === 'o') {
          // 发送登录数据包
          ws.send(`["${hexToBase64(loginHex[errors.length])}"]`)
        } else if (data.charAt(0) === 'a') {
          // 向父进程发送连接正常消息
          if (process.send) process.send('success');
          const temp = base64toHex(data.split('"')[1])
          // 有签到活动，发送请求获取签到内容
          if (temp.startsWith(Monitor.COMING_SIGN_PREFIX)) {
            Monitor.ChatIDHex = getchatIdHex(temp)
            ws.send(`["${hexToBase64(monitor.generateGetActivityHex())}"]`)
          } else if (temp.includes('7369676e')) {
            // 当前内容包含 sign ，说明是签到信息
            const IM_CourseInfo = parseCourseInfo(temp);
            const PPTActiveInfo = await getPPTActiveInfo(IM_CourseInfo.aid, params.uf, params._d, params._uid, params.vc3);

            // 签到 & 发邮件
            if (IM_Params !== 'AuthFailed') {
              const result = await Sign(IM_Params.myName, params, config.monitor, {
                classId: IM_CourseInfo.classId,
                courseId: IM_CourseInfo.courseId,
                aid: Number(IM_CourseInfo.aid),
                otherId: PPTActiveInfo.otherId,
                ifphoto: PPTActiveInfo.ifphoto
              });
              if (config.mailing.to) sendEmail(IM_CourseInfo.aid, params._uid, IM_Params.myName, result, config.mailing);
            }

            // // 当获取到消息内容后，请求保持连接
            // ws.send(`["${hexToBase64(monitor.generateKeepAliveHex())}"]`)
            // 还是直接重连吧
            ws.terminate();
            resolve();
          }
        } else if (data.charAt(0) === 'c') {
          // 本次是第二次错误，再向子进程发送登录失败信息
          if (process.send && errors.length === 1) process.send('authfail');
          reject('authfail');
        }
      })
    }).catch((err) => {
      errors.push(err);
    });
  }
  console.log('失败次数到达2次，程序终止')
})();