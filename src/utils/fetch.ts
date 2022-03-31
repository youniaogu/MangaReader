import queryString from 'query-string';

export const fetchData = ({ url, method = 'GET', body = {}, header = {} }) => {
  const init = { header };

  if (method.toUpperCase() === 'GET') {
    init.method = 'GET';
    url += '?' + queryString.stringify(body);
  }
  if (method.toUpperCase() === 'POST') {
    init.method = 'POST';
    init.headers['Content-Type'] = 'application/json';
    if (Object.keys(body).length > 0) {
      init.body = queryString.stringify(body);
    }
  }

  if (process.env.NODE_ENV === 'development') {
    url = process.env.PROXY + '?target=' + encodeURIComponent(url);
  }

  return new Promise((res, rej) => {
    try {
      fetch(url, init)
        .then((response) => {
          const contentType = response.headers.get('content-type');
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
