import Router from '@koa/router';
import { ChildProcess, fork } from 'child_process';
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import multiparty from 'multiparty';
import serverless from 'serverless-http';
import { preSign, traverseCourseActivity } from './functions/activity';
import { GeneralSign } from './functions/general';
import { LocationSign } from './functions/location';
import { PhotoSign, uploadPhoto } from './functions/photo';
import { QRCodeSign } from './functions/qrcode';
import { QrCodeScan } from './functions/tencent.qrcode';
import { getAccountInfo, getCourses, getPanToken, userLogin } from './functions/user';
import { getJsonObject } from './utils/file';
const ENVJSON = getJsonObject('env.json');

const app = new Koa();
const router = new Router();
const processMap = new Map<string, ChildProcess>();

router.get('/', async (ctx) => {
  ctx.body = `<h1 style="text-align: center">Welcome, chaoxing-sign-cli API service is running.</h1>`;
});

router.post('/login', async (ctx) => {
  let params = await userLogin(ctx.request.body.phone, ctx.request.body.password);
  // 登陆失败
  if (typeof params === 'string') {
    ctx.body = params;
    return;
  }
  params.name = (await getAccountInfo(params)) || '获取失败';
  console.log(ctx.request.body);
  ctx.body = params;
});

router.post('/activity', async (ctx) => {
  let courses = await getCourses(ctx.request.body.uid, ctx.request.body._d, ctx.request.body.vc3);
  // 身份凭证过期
  if (typeof courses === 'string') {
    ctx.body = courses;
    return;
  }
  let activity = await traverseCourseActivity({
    courses,
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    _uid: ctx.request.body.uid,
    vc3: ctx.request.body.vc3,
  });
  // 无活动
  if (typeof activity === 'string') {
    ctx.body = activity;
    return;
  }
  // 对活动进行预签
  await preSign({
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    vc3: ctx.request.body.vc3,
    _uid: ctx.request.body.uid,
    ...activity,
  });
  console.log(ctx.request.body.uid);
  ctx.body = activity;
});

router.post('/qrcode', async (ctx) => {
  let res = await QRCodeSign({
    enc: ctx.request.body.enc,
    name: ctx.request.body.name,
    fid: ctx.request.body.fid,
    _uid: ctx.request.body.uid,
    activeId: ctx.request.body.aid,
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    vc3: ctx.request.body.vc3,
  });
  console.log(ctx.request.body.name, ctx.request.body.uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/location', async (ctx) => {
  let res = await LocationSign({
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    vc3: ctx.request.body.vc3,
    name: ctx.request.body.name,
    address: ctx.request.body.address,
    activeId: ctx.request.body.aid,
    _uid: ctx.request.body.uid,
    lat: ctx.request.body.lat,
    lon: ctx.request.body.lon,
    fid: ctx.request.body.fid,
  });
  console.log(ctx.request.body.name, ctx.request.body.uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/general', async (ctx) => {
  let res = await GeneralSign({
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    vc3: ctx.request.body.vc3,
    name: ctx.request.body.name,
    activeId: ctx.request.body.aid,
    _uid: ctx.request.body.uid,
    fid: ctx.request.body.fid,
  });
  console.log(ctx.request.body.name, ctx.request.body.uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/uvtoken', async (ctx) => {
  let res = await getPanToken({
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    _uid: ctx.request.body.uid,
    vc3: ctx.request.body.vc3,
  });
  ctx.body = res;
});

router.post('/upload', async (ctx) => {
  let form = new multiparty.Form();
  let fields: any = {};
  let data: any[] = [];

  let result = await new Promise((resolve) => {
    // 解析到part时，判断是否为文件
    form.on('part', (part: any) => {
      if (part.filename !== undefined) {
        // 存入data数组
        part.on('data', (chunk: any) => {
          data.push(chunk);
        });
        // 存完继续
        part.on('close', () => {
          part.resume();
        });
      }
    });
    // 解析遇到文本时
    form.on('field', (name: string, str: string) => {
      fields[name] = str;
    });
    // 解析完成后
    form.on('close', async () => {
      let buffer = Buffer.concat(data);
      let res = await uploadPhoto({
        uf: fields['uf'],
        _d: fields['_d'],
        _uid: fields['_uid'],
        vc3: fields['vc3'],
        token: ctx.query._token as string,
        buffer,
      });
      resolve(res);
      console.log(res);
    });
    // 解析请求表单
    form.parse(ctx.req);
  });
  ctx.body = result;
});

router.post('/photo', async (ctx) => {
  let res = await PhotoSign({
    uf: ctx.request.body.uf,
    _d: ctx.request.body._d,
    vc3: ctx.request.body.vc3,
    name: ctx.request.body.name,
    activeId: ctx.request.body.aid,
    _uid: ctx.request.body.uid,
    fid: ctx.request.body.fid,
    objectId: ctx.request.body.objectId,
  });
  console.log(ctx.request.body.name, ctx.request.body.uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/qrocr', async (ctx) => {
  let form = new multiparty.Form();
  let data: any[] = [];
  let result = await new Promise((resolve) => {
    form.on('part', (part: any) => {
      if (part.filename !== undefined) {
        part.on('data', (chunk: any) => {
          data.push(chunk);
        });
        part.on('close', () => {
          part.resume();
        });
      }
    });
    form.on('close', async () => {
      let buffer = Buffer.concat(data);
      let base64str = buffer.toString('base64');
      let res: any;
      try {
        res = await QrCodeScan(base64str);
        const url = res.CodeResults[0].Url;
        const enc_start = url.indexOf('enc=') + 4;
        const result = url.substring(enc_start, url.indexOf('&', enc_start));
        resolve(result);
      } catch (error) {
        resolve('识别失败');
      }
    });
    form.parse(ctx.req);
  });
  ctx.body = result;
});

// 200:监听中，201:未监听，202:登录失败
router.post('/monitor/status', (ctx) => {
  // 状态为正在监听
  if (processMap.get(ctx.request.body.phone)) {
    ctx.body = '{"code":200,"msg":"Monitoring"}';
  } else {
    ctx.body = '{"code":201,"msg":"Suspended"}';
  }
});

router.post('/monitor/stop', (ctx) => {
  const process_monitor = processMap.get(ctx.request.body.phone);
  if (process_monitor !== undefined) {
    process_monitor.kill('SIGKILL');
    processMap.delete(ctx.request.body.phone);
  }
  ctx.body = '{"code":201,"msg":"Suspended"}';
});

router.post('/monitor/start', async (ctx) => {
  if (processMap.get(ctx.request.body.phone) !== undefined) {
    ctx.body = '{"code":200,"msg":"Already started"}';
    return;
  }
  const process_monitor = fork(
    ENVJSON.env.dev ? 'monitor.ts' : 'monitor.js',
    [
      '--auth',
      ctx.request.body.uf,
      ctx.request.body._d,
      ctx.request.body.vc3,
      ctx.request.body.uid,
      ctx.request.body.lv,
      ctx.request.body.fid,
      ctx.request.body.phone,
    ],
    {
      cwd: __dirname,
      detached: false,
      stdio: [null, null, null, 'ipc'],
    }
  );
  const response = await new Promise((resolve) => {
    process_monitor.on('message', (msg) => {
      switch (msg) {
        case 'success': {
          processMap.set(ctx.request.body.phone, process_monitor);
          resolve('{"code":200,"msg":"Started Successfully"}');
          break;
        }
        case 'authfail': {
          resolve('{"code":202,"msg":"Authencation Failed"}');
          break;
        }
        case 'notconfigured': {
          resolve('{"code":203,"msg":"Not Configured"}');
          break;
        }
      }
    });
  });
  ctx.body = response;
});

app.use(bodyparser());
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Allow-Origin', '*');
  ctx.set('Access-Control-Allow-Headers', 'Content-Type');
  await next();
});
app.use(async (ctx, next) => {
  ctx.set('Access-Control-Max-Age', '300');
  if (ctx.method === 'OPTIONS') {
    ctx.body = '';
  }
  await next();
});
app.use(router.routes());

process.on('exit', () => {
  processMap.forEach((pcs) => {
    pcs.kill('SIGKILL');
  });
});

// 若在服务器，直接运行
if (!ENVJSON.env.SERVERLESS)
  app.listen(5000, () => {
    console.log('API Server: http://localhost:5000');
  });

// 导出云函数
export const main = serverless(app);
export const handler = main;
export const main_handler = main;
