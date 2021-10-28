const { getCourses } = require("./user")
const https = require('https')
const { ACTIVELIST } = require("../configs/api")

// 返回签到活动
exports.getSignActivity = async (courses, uf, _d, UID, vc3) => {
  return new Promise(async(resolve_) => {
    for (let i = 0; i < courses.length; i++) {
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
            if (data.data.activeList[0].status == 1 && data.data.activeList[0].nameOne.includes('签到')) {
              console.log(`检测到活动：${data.data.activeList[0].nameOne}`)
              // 传出签到活动 aid
              resolve(i = 1000)
              resolve_(data.data.activeList[0].id)
            } else resolve(null)
          })
        })
      })
    }
  })
}