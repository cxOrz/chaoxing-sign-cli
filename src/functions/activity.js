const https = require('https')
const { ACTIVELIST, PRESIGN } = require("../configs/api")

// 返回签到活动
exports.getSignActivity = (courses, uf, _d, UID, vc3) => {
  console.log('正在查询有效签到活动，等待时间视网络情况而定...')
  let i = 0, tasks = []
  return new Promise(async (resolve) => {
    if (courses.length === 1) {
      try {
        resolve(await aPromise(courses[0], uf, _d, UID, vc3))
      } catch (err) {
        i++
      }
    } else {
      try {
        tasks.push(aPromise(courses[0], uf, _d, UID, vc3))
      } catch (err) { }
      for (i++; i < courses.length; i++) {
        if (i % 5 === 0 || i === courses.length - 1) {
          // console.log(await this.promiseAny(tasks))
          try { resolve(await this.promiseAny(tasks)) } catch (error) { }
          tasks = []
        } else {
          try { tasks.push(aPromise(courses[i], uf, _d, UID, vc3)) } catch (err) { }
        }
      }
    }
    // 若等于length说明遍历了全部，都没有获得活动
    if (i === courses.length) {
      console.log('未检测到有效签到活动！')
      resolve('NoActivity')
      return
    }
  })
}

exports.promiseAny = (tasks) => {
  let length = tasks.length
  return new Promise((resolve, reject) => {
    if (length === 0) {
      reject(new Error('All promises were rejected'))
      return
    }
    tasks.forEach(promise => {
      promise.then(res => {
        resolve(res)
        return
      }, reason => {
        length--
        if (length === 0) {
          reject(new Error('All promises were rejected'))
          return
        }
      })
    })
  })
}

function aPromise(course, uf, _d, UID, vc3) {
  return new Promise((resolve, reject) => {
    let data = ''
    https.get(ACTIVELIST.URL + `?fid=0&courseId=${course.courseId}&classId=${course.classId}&_=${new Date().getTime()}`, {
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
          if ((otherId >= 0 && otherId <= 5) && data.data.activeList[0].status == 1) {
            // 活动开始超过一小时则忽略
            if ((new Date().getTime() - data.data.activeList[0].startTime) / 1000 < 7200) {
              console.log(`检测到活动：${data.data.activeList[0].nameOne}`)
              resolve({
                aid: data.data.activeList[0].id,
                name: data.data.activeList[0].nameOne,
                courseId: course.courseId,
                classId: course.classId,
                otherId
              })
              return
            }
          }
        }
        reject('Not Available')
      })
    })
  })
}

exports.preSign = async (uf, _d, vc3, activeId, classId, courseId, uid) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PRESIGN.URL + `?courseId=${courseId}&classId=${classId}&activePrimaryId=${activeId}&general=1&sys=1&ls=1&appType=15&&tid=&uid=${uid}&ut=s`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        console.log(`[预签]已请求`)
        resolve()
      })
    })
  })
}