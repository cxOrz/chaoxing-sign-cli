type FetchType = (url: string, params?: FetchParams) => Promise<any>;
type FetchParams = {
  headers?: {
    [index: string]: any;
  };
  method?: 'POST' | 'GET';
  body?: any;
  type?: 'json' | 'text';
};

export const fetch: FetchType = (url, params = {}) => {
  !params.type && (params.type = 'json');
  !params.method && (params.method = 'GET');
  !params.headers && (params.headers = {});

  if (!params.headers['Content-Type'] && Object.prototype.toString.call(params.body) === '[object Object]') {
    params.headers['Content-Type'] = 'application/json';
    params.body = JSON.stringify(params.body);
  }

  return new Promise((resolve) => {
    globalThis.fetch(url, { ...params }).then(res => {
      switch (res.headers.get('Content-Type')) {
        case 'text/plain; charset=utf-8': return res.text();
        case 'application/json; charset=utf-8': return res.json();
      }
    }).then(val => {
      resolve(val);
    });
  });
};