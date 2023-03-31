import cryptojs from 'crypto-js';
import { blue } from 'kolorist';
import { ACCOUNTMANAGE, COURSELIST, LOGIN, PANTOKEN, WEBIM } from '../configs/api';
import { getJsonObject } from '../utils/file';
import { cookieSerialize, request } from '../utils/request';

const DefaultParams: UserCookieType = {
  fid: '-1',
  pid: '-1',
  refer: 'http%3A%2F%2Fi.chaoxing.com',
  _blank: '1',
  t: true,
  vc3: '',
  _uid: '',
  _d: '',
  uf: '',
  lv: '',
};

export const userLogin = async (uname: string, password: string): Promise<string | UserCookieType> => {
  // 密码加密
  const wordArray = cryptojs.enc.Utf8.parse('u2oh6Vu^HWe40fj');
  const encryptedPassword = cryptojs.DES.encrypt(password, wordArray, {
    mode: cryptojs.mode.ECB,
    padding: cryptojs.pad.Pkcs7,
  });
  password = encryptedPassword.ciphertext.toString();

  const formdata = `uname=${uname}&password=${password}&fid=-1&t=true&refer=https%253A%252F%252Fi.chaoxing.com&forbidotherlogin=0&validate=`;

  // 发送请求
  const result = await request(
    LOGIN.URL,
    {
      method: LOGIN.METHOD,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'X-Requested-With': 'XMLHttpRequest',
      },
    },
    formdata
  );

  // 获取结果
  if (JSON.parse(result.data).status) {
    const cookies = result.headers['set-cookie'];
    let c_equal, c_semi, itemName, itemValue;

    // 将每一项 cookie 以键值对形式存入 Map，再转为对象，合并到默认参数中
    const map = new Map();
    for (let i = 0; i < cookies!.length; i++) {
      c_equal = cookies![i].indexOf('=');
      c_semi = cookies![i].indexOf(';');
      itemName = cookies![i].substring(0, c_equal);
      itemValue = cookies![i].substring(c_equal + 1, c_semi);
      map.set(itemName, itemValue);
    }
    const rt_cookies = Object.fromEntries(map.entries());

    console.log('登陆成功');
    const loginResult = Object.assign({ ...DefaultParams }, rt_cookies);
    return loginResult;
  }

  console.log('登陆失败');
  return 'AuthFailed';
};

// 返回全部课程
export const getCourses = async (_uid: string, _d: string, vc3: string): Promise<CourseType[] | string> => {
  const formdata = 'courseType=1&courseFolderId=0&courseFolderSize=0';
  const result = await request(
    COURSELIST.URL,
    {
      gzip: true,
      method: COURSELIST.METHOD,
      headers: {
        Accept: 'text/html, */*; q=0.01',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8,en-GB;q=0.7,en-US;q=0.6',
        'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8;',
        Cookie: `_uid=${_uid}; _d=${_d}; vc3=${vc3}`,
      },
    },
    formdata
  );

  if (result.statusCode === 302) {
    console.log('身份过期，程序将关闭，请你使用手动填写用户名密码的方式登录！手动登录后身份信息刷新，之后可继续使用本地凭证！\n');
    return 'AuthFailed';
  }

  // 从 HTMl 页面内容，解析出所有 courseId 和 classId，填充到数组返回
  const data = result.data;
  const arr: CourseType[] = [];
  let end_of_courseid;
  for (let i = 1; ; i++) {
    i = data.indexOf('course_', i);
    if (i === -1) break;
    end_of_courseid = data.indexOf('_', i + 7);
    arr.push({
      courseId: data.slice(i + 7, end_of_courseid),
      classId: data.slice(end_of_courseid + 1, data.indexOf('"', i + 1)),
    });
  }

  if (arr.length === 0) {
    console.log(`${blue('[提示]')}无课程可查.`);
    return 'NoCourse';
  }

  return arr;
};

// 获取用户名
export const getAccountInfo = async (cookies: BasicCookie): Promise<string> => {
  const result = await request(ACCOUNTMANAGE.URL, {
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  const data = result.data;
  const end_of_messageName = data.indexOf('messageName') + 20;
  const name = data.slice(end_of_messageName, data.indexOf('"', end_of_messageName));
  return name;
};

// 获取用户鉴权token
export const getPanToken = async (cookies: BasicCookie) => {
  const result = await request(PANTOKEN.URL, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  return result.data;
};

/**
 * 返回用户列表
 * @returns [ { title: '手机号码', value: 索引 } , ...]
 */
export const getLocalUsers = () => {
  const data = getJsonObject('configs/storage.json');
  const arr = [];
  for (let i = 0; i < data.users.length; i++) {
    arr.push({
      title: data.users[i].phone,
      value: i,
    });
  }
  arr.push({ title: '手动登录', value: -1 });
  return [...arr];
};

/**
 * @returns \{ myName, myToken, myTuid, myPuid \}
 */
export const getIMParams = async (cookies: BasicCookie): Promise<IMParamsType | 'AuthFailed'> => {
  const params = {
    myName: '',
    myToken: '',
    myTuid: '',
    myPuid: '',
  };
  const result = await request(WEBIM.URL, {
    secure: true,
    headers: {
      Cookie: cookieSerialize(cookies),
    },
  });
  const data = result.data;
  if (data === '') {
    console.log('身份凭证似乎过期，请手动登录');
    return 'AuthFailed';
  }
  let index = data.indexOf('id="myName"');
  params.myName = data.slice(index + 35, data.indexOf('<', index + 35));
  index = data.indexOf('id="myToken"');
  params.myToken = data.slice(index + 36, data.indexOf('<', index + 36));
  index = data.indexOf('id="myTuid"');
  params.myTuid = data.slice(index + 35, data.indexOf('<', index + 35));
  params.myPuid = cookies._uid;

  return { ...params };
};
