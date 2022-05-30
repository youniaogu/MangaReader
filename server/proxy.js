import { SocksProxyAgent } from 'socks-proxy-agent';
import fetch, { FormData } from 'node-fetch';
import express from 'express';
import multer from 'multer';
import chalk from 'chalk';
import url from 'url';

const proxy = process.env.proxy || 'socks://127.0.0.1:2333';
const port = process.env.port || 3333;
const agent = new SocksProxyAgent(proxy);
const upload = multer();
const app = express();

function logSuccess(message) {
  console.log(chalk.green(message));
}
function logFail(message) {
  console.log(chalk.red(message));
}
function objectToFormdata(obj) {
  const formdata = new FormData();
  for (const key in obj) {
    formdata.append(key, obj[key]);
  }

  return formdata;
}

const handleProxy = (req, res) => {
  const init = {
    method: req.method,
    agent,
  };
  const { target } = url.parse(req.url, true).query;
  const requestContentType = req.get('Content-Type') || '';

  if (init.method === 'POST') {
    init.headers = { contentType: requestContentType };
    if (requestContentType.includes('multipart/form-data;')) {
      init.body = objectToFormdata(req.body);
    } else if (requestContentType.includes('application/json')) {
      init.body = JSON.stringify(req.body);
    }
  }

  fetch(target, init)
    .then((response) => {
      const responseContentType = response.headers.get('content-type') || '';
      if (responseContentType.includes('application/json')) {
        return response.json();
      } else {
        return response.text();
      }
    })
    .then((data) => {
      res.send(data);
      logSuccess(`【success】${target}`);
    })
    .catch((e) => {
      res.send(e);
      logFail(`【fail】${target}`);
    });
};

app.use(express.json());
app.use(upload.none());

app.all('*', handleProxy);

app.listen(port);
logSuccess(`server listen on port ${port}`);
