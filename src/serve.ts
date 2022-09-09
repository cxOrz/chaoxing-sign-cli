import { extendGlobalThis } from './utils/helper';
extendGlobalThis(globalThis)
import Router from '@koa/router';
import Koa from 'koa';
import bodyparser from 'koa-bodyparser';
import multiparty from 'multiparty';
import { userLogin, getAccountInfo, getCourses, getPanToken } from './functions/user';
import { getSignActivity, preSign } from "./functions/activity";
import { QRCodeSign } from './functions/QRCode';
import { LocationSign } from './functions/location';
import { GeneralSign } from './functions/general';
import { PhotoSign, uploadPhoto } from './functions/photo';
import { QrCodeScan } from './functions/tencent/QrCodeOCR';
import { getJsonObject } from './utils/file';
import { fork } from 'child_process';
import serverless from 'serverless-http';
const ENVJSON = getJsonObject('env.json');

const app = new Koa()
const router = new Router()
const processMap = new Map()

router.get('/', async (ctx) => {
  ctx.body = `<h1 style="text-align: center">Welcome, chaoxing-sign-cli API service is running.</h1>`
})

router.post('/login', async (ctx) => {
  let params = await userLogin(ctx.request.body.phone, ctx.request.body.password)
  // 登陆失败
  if (typeof params === 'string') {
    ctx.body = params
    return
  }
  params.name = (params.uf && params._d && params._uid && params.vc3) ?
    await getAccountInfo(params.uf, params._d, params._uid, params.vc3) : '获取失败'
  console.log(ctx.request.body)

  ctx.body = params
})

router.post('/activity', async (ctx) => {
  let courses = await getCourses(ctx.request.body.uid, ctx.request.body._d, ctx.request.body.vc3)
  // 身份凭证过期
  if (typeof courses === 'string') {
    ctx.body = courses;
    return;
  }
  let activity = await getSignActivity(courses, ctx.request.body.uf, ctx.request.body._d, ctx.request.body.uid, ctx.request.body.vc3);
  // 无活动
  if (typeof activity === 'string') {
    ctx.body = activity;
    return;
  }
  // 对活动进行预签
  await preSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, activity.aid, activity.classId, activity.courseId, ctx.request.body.uid);
  console.log(ctx.request.body.uid);
  ctx.body = activity;
})

router.post('/qrcode', async (ctx) => {
  let res = await QRCodeSign(ctx.request.body.enc, ctx.request.body.name, ctx.request.body.fid, ctx.request.body.uid, ctx.request.body.aid, ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3)
  console.log(ctx.request.body.name, ctx.request.body.uid)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/location', async (ctx) => {
  let res = await LocationSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.address, ctx.request.body.aid, ctx.request.body.uid, ctx.request.body.lat, ctx.request.body.lon, ctx.request.body.fid)
  console.log(ctx.request.body.name, ctx.request.body.uid)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/general', async (ctx) => {
  let res = await GeneralSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.aid, ctx.request.body.uid, ctx.request.body.fid)
  console.log(ctx.request.body.name, ctx.request.body.uid)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/uvtoken', async (ctx) => {
  let res = await getPanToken(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.uid, ctx.request.body.vc3)
  ctx.body = res
})

router.post('/upload', async (ctx) => {
  let form = new multiparty.Form()
  let fields: any = {}
  let data: any[] = []

  let result = await new Promise((resolve) => {
    // 解析到part时，判断是否为文件
    form.on('part', (part: any) => {
      if (part.filename !== undefined) {
        // 存入data数组
        part.on('data', (chunk: any) => {
          data.push(chunk)
        })
        // 存完继续
        part.on('close', () => {
          part.resume()
        })
      }
    })
    // 解析遇到文本时
    form.on('field', (name: string, str: string) => {
      fields[name] = str
    })
    // 解析完成后
    form.on('close', async () => {
      let buffer = Buffer.concat(data)
      let res = await uploadPhoto(fields['uf'], fields['_d'], fields['_uid'], fields['vc3'], ctx.query._token as string, buffer)
      resolve(res)
      console.log(res)
    })
    // 解析请求表单
    form.parse(ctx.req)
  })
  ctx.body = result
})

router.post('/photo', async (ctx) => {
  let res = await PhotoSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.aid, ctx.request.body.uid, ctx.request.body.fid, ctx.request.body.objectId)
  console.log(ctx.request.body.name, ctx.request.body.uid)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/qrocr', async (ctx) => {
  let form = new multiparty.Form()
  let data: any[] = []
  let result = await new Promise((resolve) => {
    form.on('part', (part: any) => {
      if (part.filename !== undefined) {
        part.on('data', (chunk: any) => {
          data.push(chunk)
        })
        part.on('close', () => {
          part.resume()
        })
      }
    })
    form.on('close', async () => {
      let buffer = Buffer.concat(data)
      let base64str = buffer.toString('base64')
      let res: any
      try {
        res = await QrCodeScan(base64str)
        resolve(res.CodeResults[0].Url.split('=').pop())
      } catch (error) {
        resolve('识别失败')
      }
    })
    form.parse(ctx.req)
  })
  ctx.body = result
})

// 200:监听中，201:未监听，202:登录失败
router.post('/monitor/status', (ctx) => {
  // 状态为正在监听
  if (processMap.get(ctx.request.body.phone)) {
    ctx.body = '{"code":200,"msg":"Monitoring"}';
  } else {
    ctx.body = '{"code":201,"msg":"Suspended"}';
  }
})

router.post('/monitor/stop', (ctx) => {
  const process_monitor = processMap.get(ctx.request.body.phone);
  if (process_monitor !== undefined) {
    process_monitor.kill('SIGKILL');
    processMap.delete(ctx.request.body.phone);
  }
  ctx.body = '{"code":201,"msg":"Suspended"}';
})

router.post('/monitor/start', async (ctx) => {
  if (processMap.get(ctx.request.body.phone) !== undefined) {
    ctx.body = '{"code":200,"msg":"Already started"}';
    return;
  }
  const process_monitor = fork(ENVJSON.env.dev ? 'monitor.ts' : 'monitor.js', ['--auth',
    ctx.request.body.uf, ctx.request.body._d,
    ctx.request.body.vc3, ctx.request.body.uid,
    ctx.request.body.lv, ctx.request.body.fid], {
    cwd: __dirname,
    stdio: [null, null, null, 'ipc']
  });
  const response = await new Promise((resolve) => {
    process_monitor.on('message', (msg) => {
      switch (msg) {
        case 'success': {
          processMap.set(ctx.request.body.phone, process_monitor);
          resolve('{"code":200,"msg":"Started Successfully"}');
          break;
        }
        case 'authfail': {
          process_monitor.kill();
          resolve('{"code":202,"msg":"Authencation Failed"}');
          break;
        }
      }
    });
  });
  ctx.body = response;
})

app.use(bodyparser())
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*")
  ctx.set("Access-Control-Allow-Headers", "Content-Type")
  await next()
})
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Max-Age", "300")
  if (ctx.method === 'OPTIONS') {
    ctx.body = ''
  }
  await next()
});
app.use(router.routes())

// 若在服务器，直接运行
if (!ENVJSON.env.SERVERLESS) app.listen(5000, () => { console.log("API Server: http://localhost:5000") })

// 导出云函数
export const main = serverless(app)
export const handler = main
export const main_handler = main