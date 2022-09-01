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
