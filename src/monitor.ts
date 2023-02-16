import prompts from 'prompts';
import fs from 'fs';
import path from 'path';
import { blue, red } from 'kolorist';
import jsdom from 'jsdom';
import WebSocket from 'ws';
import { getPPTActiveInfo, preSign, preSign2, speculateType } from './functions/activity';
import { GeneralSign, GeneralSign_2 } from './functions/general';
import { LocationSign, LocationSign_2 } from './functions/location';
import { PhotoSign, getObjectIdFromcxPan, PhotoSign_2 } from './functions/photo';
import { getJsonObject, getStoredUser, storeUser } from './utils/file';
import { getIMParams, getLocalUsers, userLogin } from './functions/user';
import { sendEmail } from './utils/mailer';
import { delay } from './utils/helper';
const JSDOM = new jsdom.JSDOM('', { url: 'https://im.chaoxing.com/webim/me' });
(globalThis.window as any) = JSDOM.window;
(globalThis.WebSocket as any) = WebSocket;
globalThis.navigator = JSDOM.window.navigator;
globalThis.location = JSDOM.window.location;

const webIM = require('./utils/websdk3.1.4.js').default;

const PromptsOptions = {
  onCancel: () => {
    console.log(red('✖') + ' 操作取消');
    process.exit(0);
  },
};

const WebIMConfig = {
  xmppURL: 'https://im-api-vip6-v2.easecdn.com/ws',
  apiURL: 'https://a1-vip6.easecdn.com',
  appkey: 'cx-dev#cxstudy',
  Host: 'easemob.com',
  https: true,
  isHttpDNS: false,
  isMultiLoginSessions: true,
  isAutoLogin: true,
  isWindowSDK: false,
  isSandBox: false,
  isDebug: false,
  autoReconnectNumMax: 2,
  autoReconnectInterval: 2,
  isWebRTC: false,
  heartBeatWait: 4500,
  delivery: false,
};

const conn = new webIM.connection({
  isMultiLoginSessions: WebIMConfig.isMultiLoginSessions,
  https: WebIMConfig.https,
  url: WebIMConfig.xmppURL,
  apiUrl: WebIMConfig.apiURL,
  isAutoLogin: WebIMConfig.isAutoLogin,
  heartBeatWait: WebIMConfig.heartBeatWait,
  autoReconnectNumMax: WebIMConfig.autoReconnectNumMax,
  autoReconnectInterval: WebIMConfig.autoReconnectInterval,
  appKey: WebIMConfig.appkey,
  isHttpDNS: WebIMConfig.isHttpDNS,
});

async function configure(phone: string) {
  const config = getStoredUser(phone);
  if (process.argv[2] === '--auth') {
    if (config === null || !config.monitor) {
      console.log('未配置监听模式');
      process.send ? process.send('notconfigured') : null;
      process.exit(0);
    } else {
      return {
        mailing: { ...config.mailing },
        monitor: { ...config.monitor },
      };
    }
  }

  let local = false;
  console.log(blue('自动签到支持 [普通/手势/拍照/签到码/位置]'));
  if (config?.monitor) {
    local = (
      await prompts(
        {
          type: 'confirm',
          name: 'local',
          message: '是否用本地缓存的签到信息?',
          initial: true,
        },
        PromptsOptions
      )
    ).local;
  }
  // 若不使用本地，则配置并写入本地
  if (!local) {
    const response = await prompts(
      [
        {
          type: 'text',
          name: 'lon',
          message: '位置签到经度',
          initial: '113.516288',
        },
        {
          type: 'text',
          name: 'lat',
          message: '位置签到纬度',
          initial: '34.817038',
        },
        {
          type: 'text',
          name: 'address',
          message: '详细地址',
        },
        {
          type: 'number',
          name: 'delay',
          message: '签到延时（单位：秒）',
          initial: 0,
        },
        {
          type: 'confirm',
          name: 'mail',
          message: '是否启用邮件通知?',
          initial: false,
        },
        {
          type: (prev) => (prev ? 'text' : null),
          name: 'host',
          message: 'SMTP服务器',
          initial: 'smtp.qq.com',
        },
        {
          type: (prev) => (prev ? 'confirm' : null),
          name: 'ssl',
          message: '是否启用SSL',
          initial: true,
        },
        {
          type: (prev) => (prev ? 'number' : null),
          name: 'port',
          message: '端口号',
          initial: 465,
        },
        {
          type: (prev) => (prev ? 'text' : null),
          name: 'user',
          message: '邮件账号',
          initial: 'xxxxxxxxx@qq.com',
        },
        {
          type: (prev) => (prev ? 'text' : null),
          name: 'pass',
          message: '授权码(密码)',
        },
        {
          type: (prev) => (prev ? 'text' : null),
          name: 'to',
          message: '接收邮箱',
        },
      ],
      PromptsOptions
    );
    const monitor: any = {},
      mailing: any = {};
    monitor.delay = response.delay;
    monitor.lon = response.lon;
    monitor.lat = response.lat;
    monitor.address = response.address;
    mailing.host = response.host;
    mailing.ssl = response.ssl;
    mailing.port = response.port;
    mailing.user = response.user;
    mailing.pass = response.pass;
    mailing.to = response.to;
    config!.monitor = monitor;
    config!.mailing = mailing;

    const data = getJsonObject('configs/storage.json');
    for (let i = 0; i < data.users.length; i++) {
      if (data.users[i].phone === phone) {
        data.users[i].monitor = monitor;
        data.users[i].mailing = mailing;
        break;
      }
    }

    fs.writeFile(path.join(__dirname, './configs/storage.json'), JSON.stringify(data), 'utf8', () => {});
  }

  return JSON.parse(JSON.stringify({ mailing: config!.mailing, monitor: config!.monitor }));
}

async function Sign(realname: string, params: UserCookieType & { tuid: string }, config: any, activity: Activity) {
  let result = 'fail';
  // 群聊签到，无课程
  if (activity.courseId === 'null') {
    // 暂未处理 chatId 获取！！
    let page = await preSign2({ ...activity, ...params, chatId: '' });
    let activityType = speculateType(page);
    switch (activityType) {
      case 'general': {
        result = await GeneralSign_2({ activeId: activity.activeId, ...params });
        break;
      }
      case 'photo': {
        let objectId = await getObjectIdFromcxPan(params);
        if (objectId === null) return null;
        result = await PhotoSign_2({ objectId, activeId: activity.activeId, ...params });
        break;
      }
      case 'location': {
        result = await LocationSign_2({
          name: realname,
          address: config.address,
          activeId: activity.activeId,
          lat: config.lat,
          lon: config.lon,
          ...params,
        });
        break;
      }
      case 'qr': {
        console.log(red('二维码签到，无法自动签到！'));
        break;
      }
    }
    return result;
  }

  // 课程签到
  await preSign({ ...activity, ...params });
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      console.log(red('二维码签到，无法自动签到！'));
      break;
    }
    case 4: {
      // 位置签到
      result = await LocationSign({
        name: realname,
        address: config.address,
        activeId: activity.activeId,
        lat: config.lat,
        lon: config.lon,
        ...params,
      });
      break;
    }
    case 3: {
      // 手势签到
      result = await GeneralSign({ name: realname, activeId: activity.activeId, ...params });
      break;
    }
    case 5: {
      // 签到码签到
      result = await GeneralSign({ name: realname, activeId: activity.activeId, ...params });
      break;
    }
    case 0: {
      if (activity.ifphoto === 0) {
        result = await GeneralSign({ name: realname, activeId: activity.activeId, ...params });
        break;
      } else {
        let objectId = await getObjectIdFromcxPan(params);
        if (objectId === null) return null;
        result = await PhotoSign({ name: realname, activeId: activity.activeId, objectId, ...params });
        break;
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
    params.phone = process.argv[9];
  } else {
    // 打印本地用户列表，并返回用户数量
    let userItem = (
      await prompts(
        { type: 'select', name: 'userItem', message: '选择用户', choices: getLocalUsers(), initial: 0 },
        PromptsOptions
      )
    ).userItem;
    // 手动登录
    if (userItem === -1) {
      let phone = (await prompts({ type: 'text', name: 'phone', message: '手机号' }, PromptsOptions)).phone;
      let password = (await prompts({ type: 'password', name: 'password', message: '密码' }, PromptsOptions)).password;
      // 登录获取各参数
      params = await userLogin(phone, password);
      if (params === 'AuthFailed') process.exit(0);
      storeUser(phone, { phone, params }); // 储存到本地
      params.phone = phone;
    } else {
      // 使用本地储存的参数
      let user = getJsonObject('configs/storage.json').users[userItem];
      params = user.params;
      params.phone = user.phone;
    }
  }

  let IM_Params = await getIMParams(params as UserCookieType);
  if (IM_Params === 'AuthFailed') {
    if (process.send) process.send('authfail');
    process.exit(0);
  }
  params.tuid = IM_Params.myTuid;
  // 配置默认签到信息
  const config = await configure(params.phone);

  conn.open({
    apiUrl: WebIMConfig.apiURL,
    user: IM_Params.myTuid,
    accessToken: IM_Params.myToken,
    appKey: WebIMConfig.appkey,
  });

  console.log(blue('[监听中]'));
  conn.listen({
    onOpened: () => {
      if (process.send) process.send('success');
    },
    onClosed: () => {
      console.log('[监听停止]');
      process.exit(0);
    },
    onTextMessage: async (message: any) => {
      if (message?.ext?.attachment?.att_chat_course?.url.includes('sign')) {
        const IM_CourseInfo = {
          aid: message.ext.attachment.att_chat_course.aid,
          classId: message.ext.attachment.att_chat_course.courseInfo.classid,
          courseId: message.ext.attachment.att_chat_course.courseInfo.courseid,
        };
        const PPTActiveInfo = await getPPTActiveInfo({ activeId: IM_CourseInfo.aid, ...(params as UserCookieType) });

        // 签到 & 发邮件
        if (IM_Params !== 'AuthFailed') {
          await delay(config.monitor.delay);
          const result = await Sign(IM_Params.myName, params as UserCookieType & { tuid: string }, config.monitor, {
            classId: IM_CourseInfo.classId,
            courseId: IM_CourseInfo.courseId,
            activeId: IM_CourseInfo.aid,
            otherId: PPTActiveInfo.otherId,
            ifphoto: PPTActiveInfo.ifphoto,
          });
          if (config.mailing && result)
            sendEmail({
              aid: IM_CourseInfo.aid,
              uid: params._uid,
              realname: IM_Params.myName,
              status: result,
              mailing: config.mailing,
            });
        }
      }
    },
    onError: (msg: string) => {
      console.log(red('[发生异常]'), msg);
      process.exit(0);
    },
  });
})();
