/**
 * @param {Promise<any>[]} tasks 接收一个 Promise 任务数组
 * @returns 任务数组中有一个成功则resolve其值；若全部失败，则reject一个异常。
 */
const promiseAny = (tasks: Promise<any>[]): Promise<any> => {
  // 记录失败次数
  let length = tasks.length;
  return new Promise((resolve, reject) => {
    if (length === 0) {
      reject(new Error('All promises were rejected'));
      return;
    }
    // 遍历Promise数组，任意一个成功则resolve其值；全部失败，则reject一个异常。
    tasks.forEach((promise) => {
      promise.then(
        (res) => {
          resolve(res);
          return;
        },
        () => {
          length--;
          if (length === 0) {
            reject(new Error('All promises were rejected'));
            return;
          }
        }
      );
    });
  });
};

/**
 * @param {number} timeout 作为等待时间，单位是秒
 */
const delay = async (timeout = 0) => {
  await new Promise<void>((res) => setTimeout(() => res(), timeout * 1000));
};

export { delay, promiseAny };
