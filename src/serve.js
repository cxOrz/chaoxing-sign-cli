const Router = require('@koa/router')
const Koa = require('koa')
const bodyparser = require('koa-bodyparser')
const { userLogin, getAccountInfo, getCourses } = require('./functions/user')
const { getSignActivity } = require("./functions/activity");
const { QRCodeSign } = require('./functions/QRCode');
const { LocationSign } = require('./functions/location');
const { GeneralSign } = require('./functions/general');
const { PhotoSign, getObjectIdFromcxPan } = require('./functions/photo')

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
  params.name = await getAccountInfo(params.uf, params._d, params.uid, params.vc3)
  ctx.cookies.set('fid', params.fid)
  ctx.cookies.set('uid', params.uid)
  ctx.cookies.set('uf', params.uf)
  ctx.cookies.set('_d', params._d)
  ctx.cookies.set('vc3', params.vc3)
  ctx.cookies.set('name', encodeURI(params.name))

  ctx.body = 'success'
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
  let res = await LocationSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.address, ctx.request.body.activeId, ctx.request.body.uid, ctx.request.body.lat, ctx.request.body.lon, ctx.request.body.fid)
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

router.post('/photo', async (ctx) => {
  let objectId = await getObjectIdFromcxPan(params.uf, params._d, params.vc3, params.uid)
  let res = await PhotoSign(ctx.request.body.uf, ctx.request.body._d, ctx.request.body.vc3, ctx.request.body.name, ctx.request.body.aid, ctx.request.body.uid, ctx.request.body.fid, objectId)
  if (res === 'success') {
    ctx.body = 'success'
    return
  } else {
    ctx.body = res
  }
})

app.use(bodyparser())
app.use(router.routes())

app.listen(3000, () => {
  console.log("API Server: http://localhost:3000")
})