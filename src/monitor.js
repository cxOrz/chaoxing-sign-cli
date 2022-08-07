import prompts from 'prompts';
import WebSocket from 'ws';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { aPromise, preSign } from './functions/activity.js';
import { GeneralSign } from "./functions/general.js";
import { LocationSign } from "./functions/location.js";
import { PhotoSign, getObjectIdFromcxPan } from "./functions/photo.js";
import { getJsonObject } from './utils/file.js';
import { getIMParams, userLogin } from './functions/user.js';
import { blue, red } from 'kolorist';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const convert = (from, to) => str => Buffer.from(str, from).toString(to)
const utf8ToHex = convert('utf8', 'hex')
const hexToUtf8 = convert('hex', 'utf8');
const hexToBase64 = convert('hex', 'base64');
const base64toHex = convert('base64', 'hex');

class Monitor {
  static WebSocketURL = 'ws://im-api-vip6-v2.easecdn.com/ws/917/0k4vnu0o/websocket';
  static COMING_SIGN_PREFIX = '080040024a2b0a2912';
  static CONFIRM = '["CABAAVgA"]';
  static ChatIDHex = '';
  static UNKNOWN_PREFIX_0 = '0800123c0a0e63782d64657623637873747564791208';
  static UNKNOWN_PREFIX_1 = '0800123d0a0e63782d64657623637873747564791209';

  // 生成登录请求数据包
  generateLoginHex(IM_Params, mode) {
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
function parseActivityHexJSON(hexStr) {
  hexStr = hexStr.substring(hexStr.lastIndexOf('7b22617474'), hexStr.lastIndexOf('226174746163686d656e7454797065223a31357d') + 40);
  return JSON.parse(hexToUtf8(hexStr));
}
// 提取聊天群组ID
function getchatIdHex(hexStr) {
  return hexStr.substring(hexStr.indexOf('29120f') + 6, hexStr.indexOf('1a16636f'))
}

async function fetchParams() {
  const response = await prompts([
    {
      type: 'text',
      name: 'uname',
      message: '手机号码'
    },
    {
      type: 'password',
      name: 'password',
      message: '密码'
    }
  ], {
    onCancel: () => {
      console.log(red('✖') + ' 操作取消')
      process.exit(0);
    }
  })
  return (await userLogin(response.uname, response.password));
}

async function configure() {
  const config = getJsonObject('configs/storage.json');
  if (process.argv[2] === '--auth') return config.monitor;

  let local = false;
  console.log(blue('自动签到支持 [普通/手势/拍照/签到码/位置]'))
  if (config.monitor.address !== "") {
    local = (await prompts({
      type: 'confirm',
      name: 'local',
      message: '是否用本地缓存的签到信息?',
      initial: true
    })).local
  }
  if (!local) {
    const response = await prompts([
      {
        type: 'confirm',
        name: 'photo',
        message: '普通和拍照签到无法区分，是否将拍照按普通签?',
        initial: true
      },
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
      }
    ], {
      onCancel: () => {
        console.log(red('✖') + ' 操作取消')
        process.exit(0);
      }
    })
    config.monitor.photo = response.photo;
    config.monitor.lon = response.lon;
    config.monitor.lat = response.lat;
    config.monitor.address = response.address;
    fs.writeFile(path.join(__dirname, './configs/storage.json'), JSON.stringify(config), 'utf8', () => { });
  }
  return { ...config.monitor };
}

async function Sign(name, params, config, activity) {
  await preSign(params.uf, params._d, params.vc3, activity.aid, activity.classId, activity.courseId, params._uid)
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      console.log(red('二维码签到，无法自动签到！')); break;
    }
    case 4: {
      // 位置签到
      await LocationSign(params.uf, params._d, params.vc3, name, config.address, activity.aid, params._uid, config.lat, config.lon, params.fid); break;
    }
    case 3: {
      // 手势签到
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid); break;
    }
    case 5: {
      // 签到码签到
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid); break;
    }
    case 0: {
      // photo == true 就按照普通签
      if (config.photo) {
        await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid); break;
      } else {
        let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params._uid);
        await PhotoSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid, objectId); break;
      }
    }
  }
}

// 开始运行
(async () => {
  let params = {};
  // 若凭证由命令参数传来，直接赋值；否则，直接用户名密码登录获取凭证
  if (process.argv[2] === '--auth') {
    params.uf = process.argv[3];
    params._d = process.argv[4];
    params.vc3 = process.argv[5];
    params._uid = process.argv[6];
    params.lv = process.argv[7];
    params.fid = process.argv[8];
  } else {
    params = await fetchParams();
    if (params === 'AuthFailed') process.exit(0);
  }
  let IM_Params = await getIMParams(params.uf, params._d, params._uid, params.vc3);
  // 配置默认签到信息
  const config = await configure();

  const monitor = new Monitor();
  // 两种 loginhex ，第一种登录失败，尝试第二种
  const loginHex = [monitor.generateLoginHex(IM_Params, 0), monitor.generateLoginHex(IM_Params, 1)];

  console.log(blue('[监听中]'));

  const errors = []; // 记录错误次数
  while (errors.length < 2) {
    await new Promise((resolve, reject) => {
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
            const IM_activity = parseActivityHexJSON(temp);

            // 获取网页版签到信息，内容更全
            const web_activity = await aPromise({
              classId: IM_activity.att_chat_course.courseInfo.classid,
              courseId: IM_activity.att_chat_course.courseInfo.courseid
            }, params.uf, params._d, params._uid, params.vc3);

            // 签到
            await Sign(IM_Params.myName, params, config, web_activity);

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