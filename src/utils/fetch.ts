import queryString from 'query-string';

export interface FetchData {
  url: string;
  method?: GET | POST;
  body?: FormData | { [key: string]: any };
  headers?: Headers;
  timeout?: number;
}

export const fetchData = ({
  url,
  method = 'GET',
  body = {},
  headers = new Headers(),
  timeout = 15000,
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
        init.headers.append('Content-Type', 'multipart/form-data');
        init.body = body;
      } else {
        init.headers?.append('Content-Type', 'application/json');
        init.body = JSON.stringify(body);
      }
    }
  }

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
        .catch((error) => {
          res({ error, data: undefined });
        })
        .finally(() => {
          clearTimeout(delay);
        });

      const delay = setTimeout(() => {
        controller.abort();
      }, timeout);
    } catch (error) {
      res({ error: error as Error, data: undefined });
    }
  });
};
