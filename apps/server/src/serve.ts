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
  ctx.body = '<h1 style="text-align: center">Welcome, chaoxing-sign-cli API service is running.</h1>';
});

router.post('/login', async (ctx) => {
  const { phone, password } = ctx.request.body as any;
  const params = await userLogin(phone, password);
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
  const { uid, _d, vc3, uf } = ctx.request.body as any;
  const courses = await getCourses(uid, _d, vc3);
  // 身份凭证过期
  if (typeof courses === 'string') {
    ctx.body = courses;
    return;
  }
  const activity = await traverseCourseActivity({
    courses,
    uf: uf,
    _d: _d,
    _uid: uid,
    vc3: vc3,
  });
  // 无活动
  if (typeof activity === 'string') {
    ctx.body = activity;
    return;
  }
  // 对活动进行预签
  await preSign({
    uf,
    _d,
    vc3,
    _uid: uid,
    ...activity,
  });
  console.log(uid);
  ctx.body = activity;
});

router.post('/qrcode', async (ctx) => {
  const { name, fid, uid, activeId, uf, _d, vc3, enc } = ctx.request.body as any;
  const res = await QRCodeSign({
    enc,
    name,
    fid,
    _uid: uid,
    activeId,
    uf,
    _d,
    vc3,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/location', async (ctx) => {
  const { uf, _d, vc3, name, uid, lat, lon, fid, address, activeId } = ctx.request.body as any;
  const res = await LocationSign({
    uf,
    _d,
    vc3,
    name,
    address,
    activeId,
    _uid: uid,
    lat,
    lon,
    fid,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/general', async (ctx) => {
  const { uf, _d, vc3, name, activeId, uid, fid } = ctx.request.body as any;
  const res = await GeneralSign({
    uf,
    _d,
    vc3,
    name,
    activeId,
    _uid: uid,
    fid,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/uvtoken', async (ctx) => {
  const { uf, _d, uid, vc3 } = ctx.request.body as any;
  const res = await getPanToken({
    uf,
    _d,
    _uid: uid,
    vc3,
  });
  ctx.body = res;
});

router.post('/upload', async (ctx) => {
  const form = new multiparty.Form();
  const fields: any = {};
  const data: any[] = [];

  const result = await new Promise((resolve) => {
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
      const buffer = Buffer.concat(data);
      const res = await uploadPhoto({
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
  const { uf, _d, uid, vc3, name, activeId, fid, objectId } = ctx.request.body as any;
  const res = await PhotoSign({
    uf,
    _d,
    vc3,
    name,
    activeId,
    _uid: uid,
    fid,
    objectId,
  });
  console.log(name, uid);
  if (res === 'success') {
    ctx.body = 'success';
    return;
  } else {
    ctx.body = res;
  }
});

router.post('/qrocr', async (ctx) => {
  const form = new multiparty.Form();
  const data: any[] = [];
  const result = await new Promise((resolve) => {
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
      const buffer = Buffer.concat(data);
      const base64str = buffer.toString('base64');
      let res: any;
      try {
        res = await QrCodeScan(base64str, 'base64');
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
  const { phone } = ctx.request.body as any;
  // 状态为正在监听
  if (processMap.get(phone)) {
    ctx.body = '{"code":200,"msg":"Monitoring"}';
  } else {
    ctx.body = '{"code":201,"msg":"Suspended"}';
  }
});

router.post('/monitor/stop/:phone', (ctx) => {
  const phone = ctx.params.phone;
  const process_monitor = processMap.get(phone);
  if (process_monitor !== undefined) {
    process_monitor.kill('SIGKILL');
    processMap.delete(phone);
  }
  ctx.body = '{"code":201,"msg":"Suspended"}';
});

// base64字串需包含 credentials, monitor, mailing, cqserver 内容
router.post('/monitor/start/:phone', async (ctx) => {
  if (processMap.get(ctx.params.phone) !== undefined) {
    ctx.body = '{"code":200,"msg":"Already started"}';
    return;
  }
  const process_monitor = fork(process.argv[1].endsWith('ts') ? 'monitor.ts' : 'monitor.js',
    ['--auth', ctx.params.phone, ctx.request.rawBody],
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
          processMap.set(ctx.params.phone, process_monitor);
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

app.use(bodyparser({ enableTypes: ['json', 'form', 'text'] }));
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
