/**
 * 
 * @param {number} timeout 作为等待时间
 */
function delay(timeout: number = 0) {
  return new Promise<void>(res => setTimeout(() => res(), timeout));
}

export { delay };
