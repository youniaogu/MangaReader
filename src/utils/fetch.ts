import queryString from 'query-string';

export const fetchData = ({
  url,
  method = 'GET',
  body = {},
  headers = new Headers(),
  timeout = 10000,
}: FetchData) => {
  const controller = new AbortController();
  const init: RequestInit & { headers: Headers } = {
    method: method.toUpperCase(),
    headers,
    signal: controller.signal,
    redirect: 'follow',
    credentials: 'include',
  };

  if (Object.keys(body).length > 0) {
    if (init.method === 'GET') {
      url += '?' + queryString.stringify(body);
    }
    if (init.method === 'POST') {
      if (body instanceof FormData) {
        if (!init.headers.has('Content-Type')) {
          init.headers.set('Content-Type', 'multipart/form-data');
        }
        init.body = body;
      } else {
        if (!init.headers.has('Content-Type')) {
          init.headers?.set('Content-Type', 'application/json');
        }
        init.body = JSON.stringify(body);
      }
    }
  }

  const delay = setTimeout(() => {
    controller.abort();
  }, timeout);

  return new Promise<{ error: Error; data: undefined } | { error: undefined; data: any }>((res) => {
    try {
      fetch(url, init)
        .then((response) => {
          const contentType = response.headers.get('content-type') || '';
          if (contentType.includes('application/json')) {
            return response.json();
          } else {
            return response.text();
          }
        })
        .then((data) => {
          res({ error: undefined, data });
        })
        .catch(() => {
          res({ error: new Error('网络错误，请稍后重试'), data: undefined });
        })
        .finally(() => {
          clearTimeout(delay);
        });
    } catch (error) {
      clearTimeout(delay);
      res({ error: error as Error, data: undefined });
    }
  });
};
