/**
 * 
 * @param {Promise<any>[]} tasks 接收一个 Promise 任务数组
 * @returns 任务数组中有一个成功则resolve其值；若全部失败，则reject一个异常。
 */
 export const promiseAny = (tasks: Promise<any>[]): Promise<any> => {
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
 * 
 * @param {number} timeout 作为等待时间
 */
function delay(timeout: number = 0) {
  return new Promise<void>(res => setTimeout(() => res(), timeout));
}

function parseJSON(text: string): any {
  try {
    return JSON.parse(text);
  } catch (err) {
    if (err instanceof Error) {
      console.error(err);
      console.log('\nInvalid JSON: ' + text)
    }
  }
}

globalThis.JSON.parseJSON = parseJSON

function extendGlobalThis(gl: any) {
  gl.JSON.parseJSON = parseJSON;
}

export { delay, extendGlobalThis };
