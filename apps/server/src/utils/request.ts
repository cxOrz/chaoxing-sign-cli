import http, { ClientRequestArgs } from 'http';
import https from 'https';
import zlib from 'zlib';

enum RequestMethod {
  GET = 'GET',
  POST = 'POST',
  PUT = 'PUT',
  DELETE = 'DELETE',
}

type RequestMethodType = RequestMethod | string;

interface RequestOptions {
  secure?: boolean;
  headers?: ClientRequestArgs['headers'];
  method?: RequestMethodType;
  gzip?: boolean;
}

interface ResponseType {
  data: any;
  headers: http.IncomingHttpHeaders;
  statusCode?: number;
}

/**
 * @param url 接口地址
 * @param options headers, method, secure 参数配置
 * @param payload 当进行POST请求时传入数据
 * @returns
 */
const request = (url: string, options: RequestOptions, payload?: any): Promise<ResponseType> => {
  // 设置默认值
  options.method = options.method || 'GET';

  const protocol = options.secure ? https : http;

  const result = new Promise<ResponseType>((resolve, reject) => {
    let data = '';

    const req = protocol.request(url, { headers: options.headers, method: options.method }, (res) => {
      if (options.gzip) {
        // 若启用了gzip，进行转换再返回，否则乱码
        const gzip = zlib.createGunzip();
        res.pipe(gzip);
        gzip.on('data', (chunk) => {
          data += chunk;
        });
        gzip.on('end', () => {
          resolve({ data, headers: res.headers, statusCode: res.statusCode });
        });
      } else {
        // 返回内容为字符串的情况下直接拼接返回
        res.on('data', (chunk) => {
          data += chunk;
        });
        res.on('end', () => {
          resolve({ data, headers: res.headers, statusCode: res.statusCode });
        });
        res.on('error', (e) => {
          reject(e);
        });
      }
    });

    if (options.method === RequestMethod.POST) {
      if (Object.prototype.toString.call(payload) === '[object Object]') req.write(JSON.stringify(payload));
      else req.write(payload);
    }

    req.end();
  });

  return result;
};

const cookieSerialize = ({ ...args }) => {
  return `uf=${args.uf}; _d=${args._d}; UID=${args._uid || args.UID}; vc3=${args.vc3};`;
};

export { request, cookieSerialize };
