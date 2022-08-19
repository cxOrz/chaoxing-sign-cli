/**
 * 
 * @param {number} timeout 作为等待时间
 */
function delay(timeout) {
  return new Promise(res => setTimeout(() => res(), timeout));
}

export { delay };
