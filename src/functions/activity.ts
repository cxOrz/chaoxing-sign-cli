import https from 'https';
import { ACTIVELIST, CHAT_GROUP, PPTACTIVEINFO, PRESIGN } from "../configs/api"
import { promiseAny } from '../utils/helper';
import { CourseType } from './user';

export interface Activity {
  aid: number,
  name?: string,
  courseId: string,
  classId: string,
  otherId: number
}

/**
 * 返回一个签到信息对象 {aid, name, courseId, classId, otherId}
 * @param {{courseId:string, classId:string}[]} courses 
 */
export const getSignActivity = (courses: CourseType[],
  uf: string, _d: string, UID: string, vc3: string): Promise<string | Activity> => {
  console.log('正在查询有效签到活动，等待时间视网络情况而定...')
  let i = 0, tasks: Promise<any>[] = []
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
 * @param {{courseId, classId}} course
 * @returns 返回一个活动请求 Promise 对象
 */
export function aPromise(course: any, uf: string, _d: string, UID: string, vc3: string): Promise<string | Activity> {
  return new Promise((resolve, reject) => {
    let data: any = ''
    https.get(ACTIVELIST.URL + `?fid=0&courseId=${course.courseId}&classId=${course.classId}&_=${new Date().getTime()}`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${UID}; vc3=${vc3};`,
      }
    }, (res) => {
      res.on('data', (chunk) => { data += chunk })
      res.on('end', () => {
        // console.log(data)
        data = JSON.parseJSON(data)
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
          console.log('请求似乎有些频繁，获取数据为空!');
          resolve("Too Frequent");
        }
        // 此课程最新活动并非有效签到
        reject('Not Available')
      })
    })
  })
}

/**
 * 根据 activeId 请求获得 otherId
 */
export function getPPTActiveInfo(activeId: string, uf: string, _d: string, UID: string, vc3: string) {
  let data = ''
  return new Promise<number>((resolve) => {
    https.get(PPTACTIVEINFO.URL + `?activeId=` + activeId, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${UID}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve(JSON.parseJSON(data).data.otherId)
      })
    })
  })
}

// 预签到请求
export const preSign = async (uf: string, _d: string, vc3: string, activeId: string | number, classId: string, courseId: string, uid: string) => {
  let data = ''
  return new Promise<void>((resolve) => {
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

export const preSign2 = (uf: string, _d: string, vc3: string, activeId: string | number, chatId: string, uid: string, tuid: string) => {
  let data = ''
  return new Promise<string>((resolve) => {
    https.get(CHAT_GROUP.PRESTUSIGN.URL + `?activeId=${activeId}&code=&uid=${uid}&courseId=null&classId=0&general=0&chatId=${chatId}&appType=0&tid=${tuid}&atype=null&sys=0`, {
      headers: {
        'Cookie': `uf=${uf}; _d=${_d}; UID=${uid}; vc3=${vc3};`
      }
    }, (res) => {
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`[预签]已请求`)
        resolve(data)
      })
    })
  })
}

/**
 * 推测签到类型
 */
export const speculateType = (text: string) => {
  //位置
  if (text.includes('位置')) {
    return 'location';
  } else if (text.includes('二维码')) {
    // 二维码
    return 'qr';
  }
  // 普通、拍照、手势
  return 'general';
}