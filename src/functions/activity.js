const { getCourses } = require("./user")
const https = require('https')
const { ACTIVELIST } = require("../configs/api")

// 返回签到活动
exports.getSignActivity = async (courses, uf, _d, UID, vc3) => {
  console.log('正在查询有效签到活动，等待时间视网络情况而定...')
  return new Promise(async (resolve_) => {
    let i = null, aid
    for (i = 0; i < courses.length; i++) {
      await new Promise((resolve) => {
        let data = ''
        https.get(ACTIVELIST.URL + `?fid=0&courseId=${courses[i].courseId}&classId=${courses[i].classId}&_=${new Date().getTime()}`, {
          headers: {
            'Cookie': `uf=${uf}; _d=${_d}; UID=${UID}; vc3=${vc3};`,
          }
        }, (res) => {
          res.on('data', (chunk) => { data += chunk })
          res.on('end', () => {
            // console.log(data)
            data = JSON.parse(data)
            if (data.data.activeList.length != 0) {
              let otherId = Number(data.data.activeList[0].otherId)
              // 判断是否有效签到活动
              if ((otherId >= 0 && otherId <= 4) && data.data.activeList[0].status == 1) {
                // 活动开始超过一小时则忽略
                if ((new Date().getTime() - data.data.activeList[0].startTime) / 1000 < 3600) {
                  console.log(`检测到活动：${data.data.activeList[0].nameOne}`)
                  aid = data.data.activeList[0].id
                  i = 999 // 设置flag结束循环，设为非length值，说明是获取到了活动而结束循环，设置完最后还会自增一次。
                  resolve()
                  resolve_(data.data.activeList[0].id) // 传出活动id
                }
              }
            }
            resolve()
          })
        })
      })
    }
    // 若等于length说明是遍历了全部，都没有获得活动
    if (i == courses.length) {
      console.log('未检测到有效签到活动！')
      process.exit(0)
    }
  })
}