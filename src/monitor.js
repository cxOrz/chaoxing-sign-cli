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
  static UNKNOWN_PREFIX_LV2_LV0 = '0800123d0a0e63782d64657623637873747564791209';
  static UNKNOWN_PREFIX_LV1 = '0800123c0a0e63782d64657623637873747564791208';

  generateLoginHex(IM_Params, lv) {
    const timestampHex = utf8ToHex(new Date().getTime().toString());

    switch (lv) {
      case '1': lv = Monitor.UNKNOWN_PREFIX_LV1; break;
      default: lv = Monitor.UNKNOWN_PREFIX_LV2_LV0;
    }

    return (lv + utf8ToHex(IM_Params.myTuid) + "1a0b656173656d6f622e636f6d2213776562696d5f" +
      timestampHex + "1a8501247424" + utf8ToHex(IM_Params.myToken) +
      "40034ac00108101205332e302e30280030004a0d" + timestampHex +
      "6205776562696d6a13776562696d5f" + timestampHex + "728501247424" +
      utf8ToHex(IM_Params.myToken) + "50005800");
  }

  generateGetActivityHex() {
    return '080040004a2b1a29120f' + Monitor.ChatIDHex + '1a16636f6e666572656e63652e656173656d6f622e636f6d5800';
  }

  generateKeepAliveHex() {
    return '080040004a3510d09580acd5a2d2a90e1a29120f' + Monitor.ChatIDHex + '1a16636f6e666572656e63652e656173656d6f622e636f6d5800';
  }

}

function parseActivityHexJSON(hexStr) {
  hexStr = hexStr.substring(hexStr.lastIndexOf('7b22617474'), hexStr.lastIndexOf('4a02'));
  return JSON.parse(hexToUtf8(hexStr));
}
function getchatIdHex(hexStr) {
  return hexStr.substring(hexStr.indexOf('29120f') + 6, hexStr.indexOf('1a16636f'))
}

async function fetchParams() {
  const response = await prompts([
    {
      type: 'text',
      name: 'uname',
      message: '????????????'
    },
    {
      type: 'password',
      name: 'password',
      message: '??????'
    }
  ], {
    onCancel: () => {
      console.log(red('???') + ' ????????????')
      process.exit(0);
    }
  })
  return (await userLogin(response.uname, response.password));
}

async function configure() {
  const config = getJsonObject('configs/storage.json');
  let local = false;
  console.log(blue('?????????????????? [??????/??????/??????/?????????/??????]'))
  if (config.monitor.address !== "") {
    local = (await prompts({
      type: 'confirm',
      name: 'local',
      message: '?????????????????????????????????????',
      initial: true
    })).local
  }
  if (!local) {
    const response = await prompts([
      {
        type: 'confirm',
        name: 'photo',
        message: '????????????????????????????????????????????????????????????????',
        initial: true
      },
      {
        type: 'text',
        name: 'lon',
        message: '??????????????????',
        initial: '113.516288'
      },
      {
        type: 'text',
        name: 'lat',
        message: '??????????????????',
        initial: '34.817038'
      },
      {
        type: 'text',
        name: 'address',
        message: '????????????'
      }
    ], {
      onCancel: () => {
        console.log(red('???') + ' ????????????')
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
      // ???????????????
      console.log(red('???????????????????????????????????????')); break;
    }
    case 4: {
      // ????????????
      await LocationSign(params.uf, params._d, params.vc3, name, config.address, activity.aid, params._uid, config.lat, config.lon, params.fid); break;
    }
    case 3: {
      // ????????????
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid); break;
    }
    case 5: {
      // ???????????????
      await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid); break;
    }
    case 0: {
      // photo == true ??????????????????
      if (config.photo) {
        await GeneralSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid); break;
      } else {
        let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params._uid);
        await PhotoSign(params.uf, params._d, params.vc3, name, activity.aid, params._uid, params.fid, objectId); break;
      }
    }
  }
}

// ????????????
(async () => {
  // ?????????????????????
  let params = await fetchParams();
  let IM_Params = await getIMParams(params.uf, params._d, params._uid, params.vc3);
  // ????????????????????????
  const config = await configure();

  const monitor = new Monitor();
  const loginHex = monitor.generateLoginHex(IM_Params, params.lv);

  console.log(blue('[?????????]'));

  while (true) {
    await new Promise((resolve) => {
      const ws = new WebSocket(Monitor.WebSocketURL);
      ws.on('message', async (data) => {
        // console.log(data.toString())
        if (data.toString() == 'o') {
          // ?????????????????????
          ws.send(`["${hexToBase64(loginHex)}"]`)
        } else if (data.toString().charAt(0) == 'a') {
          const temp = base64toHex(data.toString().split('"')[1])
          // ????????????????????????????????????????????????
          if (temp.startsWith(Monitor.COMING_SIGN_PREFIX)) {
            Monitor.ChatIDHex = getchatIdHex(temp)
            ws.send(`["${hexToBase64(monitor.generateGetActivityHex())}"]`)
          } else if (temp.includes('2261696422')) {
            // ?????????????????? "aid" ????????????????????????
            const IM_activity = parseActivityHexJSON(temp);

            // ??????????????????????????????????????????
            const web_activity = await aPromise({
              classId: IM_activity.att_chat_course.courseInfo.classid,
              courseId: IM_activity.att_chat_course.courseInfo.courseid
            }, params.uf, params._d, params._uid, params.vc3);

            // ??????
            await Sign(IM_Params.myName, params, config, web_activity);

            // // ????????????????????????????????????????????????
            // ws.send(`["${hexToBase64(monitor.generateKeepAliveHex())}"]`)
            // ?????????????????????
            ws.terminate();
            resolve();
          }
        }
      })
    })
  }
})();