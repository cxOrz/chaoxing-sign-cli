import { blue, red } from 'kolorist';
import prompts from 'prompts';
import { getPPTActiveInfo, preSign, traverseCourseActivity } from './functions/activity';
import { GeneralSign } from './functions/general';
import { LocationSign } from './functions/location';
import { getObjectIdFromcxPan, PhotoSign } from './functions/photo';
import { QRCodeSign } from './functions/qrcode';
import { getAccountInfo, getCourses, getLocalUsers, userLogin } from './functions/user';
import { getJsonObject, storeUser } from './utils/file';

const PromptsOptions = {
  onCancel: () => {
    console.log(red('✖') + ' 操作取消');
    process.exit(0);
  },
};

!(async function () {
  let params: UserCookieType | string;
  // 本地与登录之间的抉择
  {
    // 打印本地用户列表，并返回用户数量
    const userItem = (
      await prompts(
        {
          type: 'select',
          name: 'userItem',
          message: '选择用户',
          choices: getLocalUsers(),
          initial: 0,
        },
        PromptsOptions
      )
    ).userItem;
    // 使用新用户登录
    if (userItem === -1) {
      const phone = (await prompts({ type: 'text', name: 'phone', message: '手机号' }, PromptsOptions)).phone;
      const password = (await prompts({ type: 'password', name: 'password', message: '密码' }, PromptsOptions)).password;
      // 登录获取各参数
      params = await userLogin(phone, password);
      if (typeof params === 'string') process.exit(0);
      else storeUser(phone, { phone, params }); // 储存到本地
    } else {
      // 使用本地储存的参数
      params = getJsonObject('configs/storage.json').users[userItem].params;
    }
    if (typeof params === 'string') return; // 消除TS类型错误提示
  }

  // 获取用户名
  const name = await getAccountInfo(params);
  console.log(blue(`你好，${name}`));

  // 获取所有课程
  const courses = await getCourses(params._uid, params._d, params.vc3);
  if (typeof courses === 'string') process.exit(0);
  // 获取进行中的签到活动
  const activity = await traverseCourseActivity({ courses, ...params });
  if (typeof activity === 'string') process.exit(0);
  else await preSign({ ...activity, ...params });

  // 处理签到，先进行预签
  switch (activity.otherId) {
    case 2: {
      // 二维码签到
      const enc = (await prompts({ type: 'text', name: 'enc', message: 'enc(微信或其他识别二维码，可得enc参数)' }, PromptsOptions))
        .enc;
      await QRCodeSign({ ...params, activeId: activity.activeId, enc, name });
      break;
    }
    case 4: {
      // 位置签到
      console.log('[获取经纬度]https://api.map.baidu.com/lbsapi/getpoint/index.html');
      const lnglat = (
        await prompts({ type: 'text', name: 'lnglat', message: '经纬度', initial: '113.516288,34.817038' }, PromptsOptions)
      ).lnglat;
      const address = (await prompts({ type: 'text', name: 'address', message: '详细地址' })).address;
      const lat = lnglat.substring(lnglat.indexOf(',') + 1, lnglat.length);
      const lon = lnglat.substring(0, lnglat.indexOf(','));
      await LocationSign({
        ...activity,
        ...params,
        address,
        lat,
        lon,
        name,
      });
      break;
    }
    case 3: {
      // 手势签到
      await GeneralSign({ ...activity, ...params, name });
      break;
    }
    case 5: {
      // 签到码签到
      await GeneralSign({ ...activity, ...params, name });
      break;
    }
    case 0: {
      const photo = await getPPTActiveInfo({ activeId: activity.activeId, ...params });
      if (photo.ifphoto === 1) {
        // 拍照签到
        console.log('访问 https://pan-yz.chaoxing.com 并在根目录上传你想要提交的照片，格式为jpg或png，命名为 0.jpg 或 0.png');
        await prompts({ name: 'complete', type: 'confirm', message: '已上传完毕?' });
        // 获取照片objectId
        const objectId = await getObjectIdFromcxPan(params);
        if (objectId === null) return null;
        await PhotoSign({ ...params, activeId: activity.activeId, objectId, name });
      } else {
        // 普通签到
        await GeneralSign({ ...params, activeId: activity.activeId, name });
      }
    }
  }
})();
