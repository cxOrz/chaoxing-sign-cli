import fs from 'fs';
import jsdom from 'jsdom';
import { blue, red } from 'kolorist';
import path from 'path';
import prompts from 'prompts';
import WebSocket from 'ws';
import { getPPTActiveInfo, getSignType, preSign, preSign2, speculateType } from './functions/activity';
import CQ from './functions/cq';
import { GeneralSign, GeneralSign_2 } from './functions/general';
import { LocationSign, LocationSign_2 } from './functions/location';
import { getObjectIdFromcxPan, PhotoSign, PhotoSign_2 } from './functions/photo';
import { QRCodeSign } from './functions/qrcode';
import { QrCodeScan } from './functions/tencent.qrcode';
import { getIMParams, getLocalUsers, userLogin } from './functions/user';
import { getJsonObject, getStoredUser, storeUser } from './utils/file';
import { delay } from './utils/helper';
import { sendEmail } from './utils/mailer';
const JSDOM = new jsdom.JSDOM('', { url: 'https://im.chaoxing.com/webim/me' });
(globalThis.window as any) = JSDOM.window;
(globalThis.WebSocket as any) = WebSocket;
globalThis.navigator = JSDOM.window.navigator;
globalThis.location = JSDOM.window.location;

// eslint-disable-next-line @typescript-eslint/no-var-requires
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
        cqserver: { ...config.cqserver },
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
        {
          type: 'confirm',
          name: 'cq_enabled',
          message: '是否连接到go-cqhttp服务?',
          initial: false,
        },
        {
          type: (prev) => (prev ? 'text' : null),
          name: 'ws_url',
          message: 'Websocket 地址',
          initial: 'ws://127.0.0.1:8080',
        },
        {
          type: (prev) => (prev ? 'select' : null),
          name: 'target_type',
          message: '选择消息的推送目标',
          choices: [
            { title: '群组', value: 'group' },
            { title: '私聊', value: 'private' }
          ],
        },
        {
          type: (prev) => (prev ? 'number' : null),
          name: 'target_id',
          message: '接收号码',
          initial: 10001,
        },
      ],
      PromptsOptions
    );
    const monitor: any = {};
    const mailing: any = {};
    const cqserver: any = {};
    monitor.delay = response.delay;
    monitor.lon = response.lon;
    monitor.lat = response.lat;
    monitor.address = response.address;
    mailing.enabled = response.mail;
    mailing.host = response.host;
    mailing.ssl = response.ssl;
    mailing.port = response.port;
    mailing.user = response.user;
    mailing.pass = response.pass;
    mailing.to = response.to;
    cqserver.cq_enabled = response.cq_enabled;
    cqserver.ws_url = response.ws_url;
    cqserver.target_type = response.target_type;
    cqserver.target_id = response.target_id;
    config!.monitor = monitor;
    config!.mailing = mailing;
    config!.cqserver = cqserver;

    const data = getJsonObject('configs/storage.json');
    for (let i = 0; i < data.users.length; i++) {
      if (data.users[i].phone === phone) {
        data.users[i].monitor = monitor;
        data.users[i].mailing = mailing;
        data.users[i].cqserver = cqserver;
        break;
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-empty-function
    fs.writeFile(path.join(__dirname, './configs/storage.json'), JSON.stringify(data), 'utf8', () => { });
  }

  return JSON.parse(JSON.stringify({ mailing: config!.mailing, monitor: config!.monitor, cqserver: config!.cqserver }));
}

async function Sign(realname: string, params: UserCookieType & { tuid: string; }, config: any, activity: Activity) {
  let result = null;
  // 群聊签到，无课程
  if (!activity.courseId) {
    const page = await preSign2({ ...activity, ...params, chatId: activity.chatId as string });
    const activityType = speculateType(page);
    switch (activityType) {
      case 'general': {
        result = await GeneralSign_2({ activeId: activity.activeId, ...params });
        break;
      }
      case 'photo': {
        const objectId = await getObjectIdFromcxPan(params);
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
        result = '[二维码]请发送二维码照片';
        console.log(red('二维码签到，需人工干预！'));
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
      result = '[二维码]请发送二维码照片';
      console.log(red('二维码签到，需人工干预！'));
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
        const objectId = await getObjectIdFromcxPan(params);
        if (objectId === null) return null;
        result = await PhotoSign({ name: realname, activeId: activity.activeId, objectId, ...params });
        break;
      }
    }
  }
  return result;
}

async function handleMsg(this: CQ, data: string) {
  // 处理图片，是否二维码，发送一些其他反馈
  if (CQ.hasImage(data) && this.getCache('params') !== undefined) {
    console.log('[图片]尝试二维码识别');
    const img_url = data.match(/https:\/\/[\S]+[^\]]/g)![0];
    const params = this.getCache('params');
    const qr_str = (await QrCodeScan(img_url, 'url')).CodeResults?.[0].Url;

    if (typeof qr_str === 'undefined') this.send('是否已配置腾讯云OCR？图像是否包含清晰二维码？', this.getTargetID());
    else {
      params.enc = qr_str.match(/(?<=&enc=)[\dA-Z]+/)[0];
      const result = await QRCodeSign(params);
      this.send(`${result} - ${params.name}`, this.getTargetID());
      // 签到成功则清理缓存
      result === '[二维码]签到成功' && this.clearCache();
    }
  }
}

// 开始运行
(async () => {
  let params: any = {};
  let config: any = {};
  // 若凭证由命令参数传来，直接解析赋值；否则，直接用户名密码登录获取凭证
  if (process.argv[2] === '--auth') {
    const auth_config = JSON.parse(Buffer.from(process.argv[4], 'base64').toString('utf8'));
    params.phone = auth_config.credentials.phone;
    params.uf = auth_config.credentials.uf;
    params._d = auth_config.credentials._d;
    params.vc3 = auth_config.credentials.vc3;
    params._uid = auth_config.credentials.uid;
    params.lv = auth_config.credentials.lv;
    params.fid = auth_config.credentials.fid;
    config.monitor = { ...auth_config.config.monitor };
    config.mailing = { ...auth_config.config.mailing };
    config.cqserver = { ...auth_config.config.cqserver };
  } else {
    // 打印本地用户列表，并返回用户数量
    const userItem = (
      await prompts(
        { type: 'select', name: 'userItem', message: '选择用户', choices: getLocalUsers(), initial: 0 },
        PromptsOptions
      )
    ).userItem;
    // 手动登录
    if (userItem === -1) {
      const phone = (await prompts({ type: 'text', name: 'phone', message: '手机号' }, PromptsOptions)).phone;
      const password = (await prompts({ type: 'password', name: 'password', message: '密码' }, PromptsOptions)).password;
      // 登录获取各参数
      params = await userLogin(phone, password);
      if (params === 'AuthFailed') process.exit(0);
      storeUser(phone, { phone, params }); // 储存到本地
      params.phone = phone;
    } else {
      // 使用本地储存的参数
      const user = getJsonObject('configs/storage.json').users[userItem];
      params = user.params;
      params.phone = user.phone;
    }
    // 手动配置签到信息
    config = await configure(params.phone);
  }

  // 获取IM参数
  const IM_Params = await getIMParams(params as UserCookieType);
  if (IM_Params === 'AuthFailed') {
    if (process.send) process.send('authfail');
    process.exit(0);
  }
  params.tuid = IM_Params.myTuid;
  params.name = IM_Params.myName;

  let cq: CQ;
  // 建立连接，添加监听事件并绑定处理函数
  if (config.cqserver?.cq_enabled) {
    cq = new CQ(config.cqserver.ws_url, config.cqserver.target_type, config.cqserver.target_id);
    cq.connect();
    cq.onMessage(handleMsg);
  }

  conn.open({
    apiUrl: WebIMConfig.apiURL,
    user: IM_Params.myTuid,
    accessToken: IM_Params.myToken,
    appKey: WebIMConfig.appkey,
  });

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
          classId: message.ext.attachment.att_chat_course?.courseInfo?.classid,
          courseId: message.ext.attachment.att_chat_course?.courseInfo?.courseid,
        };
        const PPTActiveInfo = await getPPTActiveInfo({ activeId: IM_CourseInfo.aid, ...(params as UserCookieType) });

        // 签到 & 推送消息
        // 签到检测通知推送
        if (config.cqserver?.cq_enabled) {
          cq.send(`${IM_Params.myName}，检测到${getSignType(PPTActiveInfo)}，将在${config.monitor.delay}秒后处理`, config.cqserver.target_id);
          cq.setCache('params', { ...params, activeId: IM_CourseInfo.aid });
        }

        await delay(config.monitor.delay);
        const result = await Sign(IM_Params.myName, params, config.monitor, {
          classId: IM_CourseInfo.classId,
          courseId: IM_CourseInfo.courseId,
          activeId: IM_CourseInfo.aid,
          otherId: PPTActiveInfo.otherId,
          ifphoto: PPTActiveInfo.ifphoto,
          chatId: message?.to,
        });
        // 邮件推送签到结果
        if (config.mailing?.enabled) {
          sendEmail({
            aid: IM_CourseInfo.aid,
            uid: params._uid,
            realname: IM_Params.myName,
            status: result,
            mailing: config.mailing,
          });
        }
        // CQ 推送签到结果
        if (config.cqserver?.cq_enabled) {
          cq.send(`${result} - ${IM_Params.myName}`, config.cqserver.target_id);
        }

      }
    },
    onError: (msg: string) => {
      console.log(red('[发生异常]'), msg);
      process.exit(0);
    },
  });

  console.log(blue(`[监听中] ${config.cqserver.cq_enabled ? 'CQ服务器已连接' : ''} ${config.mailing?.enabled ? '邮件推送已开启' : ''}...`));
})();
