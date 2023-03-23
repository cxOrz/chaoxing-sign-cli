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
import { urlQrCodeScan } from './functions/tencent.qrcode';
import { CQWebSocket } from '@tsuk1ko/cq-websocket';
import { QRCodeSign } from './functions/qrcode';
const ENVJSON = getJsonObject('env.json');
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
          name: 'cqserver',
          message: '是否启用QQ机器人(go-cqhttp)通知?',
          initial: false,
        },
        {
          type: (prev) => (prev ? 'select' : null),
          name: 'cqtype',
          message: '要发送相关通知到?',
          choices: [
            { title: '群组', value: 'send_group_msg' },
            { title: '私聊', value: 'send_private_msg' }
          ],
        },
        {
          type: (prev) => (prev ? 'number' : null),
          name: 'cquin',
          message: '接收号码',
          initial: 10001,
        },
      ],
      PromptsOptions
    );
    const monitor: any = {},
      mailing: any = {},
      cqserver: any = {};
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
    cqserver.cqtype = response.cqtype;
    cqserver.cquin = response.cquin;
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

    fs.writeFile(path.join(__dirname, './configs/storage.json'), JSON.stringify(data), 'utf8', () => {});
  }

  return JSON.parse(JSON.stringify({ mailing: config!.mailing, monitor: config!.monitor, cqserver: config!.cqserver }));
}

async function Sign(realname: string, params: UserCookieType & { tuid: string }, config: any, activity: Activity) {
  let result = 'fail';
  // 群聊签到，无课程
  if (!activity.courseId) {
    let page = await preSign2({ ...activity, ...params, chatId: activity.chatId as string });
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
        result = 'fail-can-wait-cq'
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
      result = 'fail-can-wait-cq'
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

  /**
   * 解析签到类型
   * @param iptPPTActiveInfo Get 来的活动信息
   * @returns 返回具体的中文结果
   */
  function parseSignType(iptPPTActiveInfo: any) {
    switch(iptPPTActiveInfo.otherId) {
      case 0:
        if (iptPPTActiveInfo.ifphoto == 1) { return "拍照签到"; } else { return "普通签到"; }
      case 2: return "二维码签到";
      case 3: return "手势签到";
      case 4: return "位置签到";
      case 5: return "签到码签到";
      default: return "其他类型签到";
    }
  }
  
  /** 
   * 解析签到结果
   * @param iptResult 签到结果
   * @returns 返回具体的中文结果
   */
  function parseSignResult(iptResult: any) {
    switch(iptResult) {
      case 'success': return "成功";
      case 'fail': return "失败";
      case 'fail-can-wait-cq': return "请发送二维码";
      default: return iptResult;
    }
  }

  /**
   * 判断消息是否有图片
   * by @Tsuk1ko/cq-picsearcher-bot 56594b6 src/index.mjs:696
   *
   * @param {string} msg 消息
   * @returns 有则返回true
   */
  function hasImage(msg: string) {
    return msg.indexOf('[CQ:image') !== -1;
  }

  /**
   * 处理消息中的二维码
   */
  async function handleImages(e: any, context: any) {
    if (hasImage(context.message)) {
      // 从 CQ 码中取得图片 Url
      let msgSplitIndex: number
      if (config.cqserver.cqtype == "send_private_msg") {
        msgSplitIndex = 2
      } else {
        msgSplitIndex = 3
      }
      const imageUrl = context.message.split(",")[msgSplitIndex].split("=")[1]
      // 跑 Delay，免得超腾讯api限制了
      console.log("等待 " + config.monitor.delay + " 秒后开始签到…")
      // 开了会刷屏。不知道怎么回事。
      // if (cqbot.isReady() && IM_Params !== 'AuthFailed') { 
      //   const message = IM_Params.myName + "：等待 " + config.monitor.delay + " 秒后开始签到…"
      //   cqbot(config.cqserver.cqtype, {
      //     group_id: config.cqserver.cquin,
      //     user_id: config.cqserver.cquin
      //     message
      //   });
      // }
      await delay(config.monitor.delay);
      try {
        // 给腾讯云图片 url 等它发回签到url结果。
        let qrScanResult: any = await urlQrCodeScan(imageUrl);
        // 正则找 aid 和 enc
        let parseQrScanResult = qrScanResult.CodeResults[0].Url
        const REGEX_ENC = /(SIGNIN:|e\?).*(aid=|id=)(\d+)(&.*)?&enc=([\dA-F]+)/
        if (REGEX_ENC.test(parseQrScanResult)) {
          const qrScanResultEnc: any = REGEX_ENC.exec(parseQrScanResult)
          // 签到 & 发消息
          if (IM_Params !== 'AuthFailed') {
            const sendBasicCookie = {
              enc: qrScanResultEnc[5],
              name: IM_Params.myName,
              fid: params.fid,
              _uid: params._uid,
              activeId: qrScanResultEnc[3],
              uf: params.uf,
              _d: params._d,
              vc3: params.vc3,
            }
            let qrSignResult = await QRCodeSign(sendBasicCookie);
            if (qrSignResult === 'success') {
              if (cqbot.isReady()) {
                const message = IM_Params.myName + "：" + parseSignResult(qrSignResult)
                cqbot(config.cqserver.cqtype, {
                  group_id: config.cqserver.cquin,
                  user_id: config.cqserver.cquin,
                  message
                });
              }
            }
          }
        }
      } catch(error) {
        console.error(red('识别失败，错误原因：' + error));
      }
    }
  }

  let cqbot: CQWebSocket
  if (config.cqserver) {
    cqbot = new CQWebSocket(ENVJSON.cqserver);

    // 连接到CQ机器人监听
    cqbot
      .on("socket.connecting", (wsType, attempts) => console.log(`正在连接至 CQ 服务器 (${wsType} #${attempts})…`))
      .on("socket.failed", (wsType, attempts) => console.log(red(`CQ 服务器连接失败 (${wsType} #${attempts})…`)))
      .on("socket.error", (wsType, err) => {
        console.error(red(`CQ 服务器连接错误 (${wsType})`));
        console.error(err);
      })
      .on("socket.connect", (wsType, sock, attempts) => console.log(blue(`CQ 服务器连接成功 (${wsType} #${attempts})`)));

    cqbot.connect();
    if (config.cqserver.cqtype == "send_group_msg") {
      cqbot.on('message.group', handleImages);
    } else if (config.cqserver.cqtype == "send_private_msg") {
      cqbot.on('message.private', handleImages);
    }
  }

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

        // 发送收到签到的消息
        if (cqbot.isReady() && IM_Params !== 'AuthFailed') {
          let message: string
          if (PPTActiveInfo.otherId == 2) {
            message = IM_Params.myName + "的学习通收到" + parseSignType(PPTActiveInfo) + "，请等待签到初始化…"
          } else {
            message = IM_Params.myName + "的学习通收到" + parseSignType(PPTActiveInfo) + "，将在 " + config.monitor.delay + " 秒后开始执行签到…"
          }
          cqbot(config.cqserver.cqtype, {
            group_id: config.cqserver.cquin,
            user_id: config.cqserver.cquin,
            message
          });
        }

        // 签到 & 发消息
        if (IM_Params !== 'AuthFailed') {
          await delay(config.monitor.delay);
          const result = await Sign(IM_Params.myName, params as UserCookieType & { tuid: string }, config.monitor, {
            classId: IM_CourseInfo.classId,
            courseId: IM_CourseInfo.courseId,
            activeId: IM_CourseInfo.aid,
            otherId: PPTActiveInfo.otherId,
            ifphoto: PPTActiveInfo.ifphoto,
            chatId: message?.to,
          });
          // 若使用 pushplus 请改用 pushplusSend() 并填入所需参数 token, content, ...
          if (config.mailing && result)
            sendEmail({
              aid: IM_CourseInfo.aid,
              uid: params._uid,
              realname: IM_Params.myName,
              status: result,
              mailing: config.mailing,
            });
          if (cqbot.isReady() && result) {
            const message = IM_Params.myName + "：" + parseSignResult(result)
            cqbot(config.cqserver.cqtype, {
              group_id: config.cqserver.cquin,
              user_id: config.cqserver.cquin,
              message
            });
          }
        }
      }
    },
    onError: (msg: string) => {
      console.log(red('[发生异常]'), msg);
      process.exit(0);
    },
  });
})();
