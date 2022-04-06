import queryString from 'query-string';

export const fetchData = ({
  url,
  method = 'GET',
  body = {},
  headers = new Headers(),
}: {
  url: string;
  method?: FetchMethod;
  body?: FormData | { [key: string]: any };
  headers?: Headers;
}) => {
  const init: RequestInit & { headers: Headers } = { method: method.toUpperCase(), headers };

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

  if (process.env.NODE_ENV === 'development') {
    url = process.env.PROXY + '?target=' + encodeURIComponent(url);
  }

  return new Promise((res, rej) => {
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
          rej({ error, data: undefined });
        });
    } catch (error) {
      rej({ error, data: undefined });
    }
  });
};
