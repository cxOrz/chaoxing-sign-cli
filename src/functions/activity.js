import https from 'https';
import { ACTIVELIST, PRESIGN } from "../configs/api.js";

/**
 * 返回一个签到信息对象 {aid, name, courseId, classId, otherId}
 * @param {{courseId:string, classId:string}[]} courses 
 * @param {string} uf 
 * @param {string} _d 
 * @param {string} UID 
 * @param {string} vc3 
 */
export const getSignActivity = (courses, uf, _d, UID, vc3) => {
  console.log('正在查询有效签到活动，等待时间视网络情况而定...')
  let i = 0, tasks = []
  return new Promise(async (resolve) => {
    if (courses.length === 1) {
      try {
        resolve(await aPromise(courses[0], uf, _d, UID, vc3));
      } catch (err) {
        i++
      }
    } else {
      tasks.push(aPromise(courses[0], uf, _d, UID, vc3))
      // 一次请求五个，全部reject或有一个成功则进行下一次请求
      for (i++; i < courses.length; i++) {
        // 课程请求加入任务数组
        tasks.push(aPromise(courses[i], uf, _d, UID, vc3))
        // 一轮提交5个，若处于最后一个且此轮还不够5个，提交此轮全部
        if (i % 5 === 0 || i === courses.length - 1) {
          try {
            // 任务数组中任意一个成功，则resolve；否则，抛出异常
            const result = await promiseAny(tasks)
            resolve(result)
            return
          } catch (error) { }
          // 每轮请求任务组之后，清空任务数组供下轮使用
          tasks = []
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

/**
 * 
 * @param {Promise<any>[]} tasks 接收一个 Promise 任务数组
 * @returns 任务数组中有一个成功则resolve其值；若全部失败，则reject一个异常。
 */
export const promiseAny = (tasks) => {
  // 记录失败次数
  let length = tasks.length
  return new Promise((resolve, reject) => {
    if (length === 0) {
      reject(new Error('All promises were rejected'))
      return
    }
    // 遍历Promise数组，任意一个成功则resolve其值；全部失败，则reject一个异常。
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

/**
 * @param {{courseId, classId}} course
 * 
 * @returns 返回一个活动请求 Promise 对象
 */
export function aPromise(course, uf, _d, UID, vc3) {
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
        // 判断是否请求成功
        if (data.data !== null) {
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
        } else {
          console.log('请求频繁，请待会再试!');
          resolve("TooMany");
        }
        reject('Not Available')
      })
    })
  })
}

// 预检请求
export const preSign = async (uf, _d, vc3, activeId, classId, courseId, uid) => {
  let data = ''
  return new Promise((resolve) => {
    https.get(PRESIGN.URL + `?courseId=${courseId}&classId=${classId}&activePrimaryId=${activeId}&general=1&sys=1&ls=1&appType=15&&tid=&uid=${uid}&ut=s`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[预签]已请求`)
        resolve()
      })
    })
  })
}