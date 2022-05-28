const Router = require('@koa/router')
const Koa = require('koa')
const bodyparser = require('koa-bodyparser')
const multiparty = require('multiparty')
const { userLogin, getAccountInfo, getCourses, getPanToken } = require('./functions/user')
const { getSignActivity, preSign } = require("./functions/activity");
const { QRCodeSign } = require('./functions/QRCode');
const { LocationSign } = require('./functions/location');
const { GeneralSign } = require('./functions/general');
const { PhotoSign, uploadPhoto } = require('./functions/photo')
const { QrCodeScan } = require('./functions/tencent/QrCodeOCR')

const app = new Koa()
const router = new Router()

router.get('/', async (ctx) => {
  ctx.body = `<h1 style="text-align: center">Welcome, chaoxing-sign-cli API service is running.</h1>`
})

router.post('/login', async (ctx) => {
  let params = await userLogin(ctx.request.body.phone, ctx.request.body.password)
  // 登陆失败
  if (params === 'AuthFailed') {
    ctx.body = 'AuthFailed'
    return
  }
  params.name = await getAccountInfo(params.uf, params._d, params._uid, params.vc3)

  ctx.body = params
})

router.post('/activity', async (ctx) => {
  let courses = await getCourses(ctx.request.body.uid, ctx.request.body._d, ctx.request.body.vc3)
  // 身份凭证过期
  if (courses === 'AuthRequired') {
    ctx.body = 'AuthRequired'
    return
  }
  let activity = await getSignActivity(courses, ctx.request.body.uf, ctx.request.body._d, ctx.request.body.uid, ctx.request.body.vc3)
  // 无活动
  if (activity === 'NoActivity') {
    ctx.body = 'NoActivity'
    return
  }
  // 对活动进行预签
  await preSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, activity.aid, activity.classId, activity.courseId, ctx.request.body.uid)
  ctx.body = activity
})

router.post('/qrcode', async (ctx) => {
  let res = await QRCodeSign(ctx.request.body.enc, ctx.request.body.name, ctx.request.body.fid, ctx.request.body.uid, ctx.request.body.aid, ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/location', async (ctx) => {
  let res = await LocationSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.address, ctx.request.body.aid, ctx.request.body.uid, ctx.request.body.lat, ctx.request.body.lon, ctx.request.body.fid)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/general', async (ctx) => {
  let res = await GeneralSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.aid, ctx.request.body.uid, ctx.request.body.fid)
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
  let fields = {}
  let data = []

  let result = await new Promise((resolve) => {
    // 解析到part时，判断是否为文件
    form.on('part', (part) => {
      if (part.filename !== undefined) {
        // 存入data数组
        part.on('data', (chunk) => {
          data.push(chunk)
        })
        // 存完继续
        part.on('close', () => {
          part.resume()
        })
      }
    })
    // 解析遇到文本时
    form.on('field', (name, str) => {
      fields[name] = str
    })
    // 解析完成后
    form.on('close', async () => {
      let buffer = Buffer.concat(data)
      let res = await uploadPhoto(fields['uf'], fields['_d'], fields['_uid'], fields['vc3'], ctx.query._token, buffer)
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
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

router.post('/qrocr', async (ctx) => {
  let form = new multiparty.Form()
  let data = []
  let result = await new Promise((resolve) => {
    form.on('part', (part) => {
      if (part.filename !== undefined) {
        part.on('data', (chunk) => {
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
      let res
      try {
        res = await QrCodeScan(base64str)
        resolve(res.CodeResults[0].Url.split('=').pop())
        console.log(res)
      } catch (error) {
        resolve('识别失败')
      }
    })
    form.parse(ctx.req)
  })
  ctx.body = result
})

app.use(bodyparser())
app.use(async (ctx, next) => {
  ctx.set("Access-Control-Allow-Origin", "*")
  ctx.set("Access-Control-Allow-Headers", "Content-Type")
  await next()
})
app.use(async (ctx, next) => {
  if (ctx.method === 'OPTIONS') {
    ctx.body = ''
  }
  await next()
});
app.use(router.routes())


app.listen(5000, () => {
  console.log("API Server: http://localhost:5000")
})