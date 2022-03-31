import { SocksProxyAgent } from 'socks-proxy-agent';
import express from 'express';
import fetch from 'node-fetch';
import chalk from 'chalk';
import url from 'url';

const proxy = process.env.proxy || 'socks://127.0.0.1:2333';
const port = process.env.port || 3333;
const agent = new SocksProxyAgent(proxy);
const app = express();

function logSuccess(message) {
  console.log(chalk.green(message));
}
function logFail(message) {
  console.log(chalk.red(message));
}

const handleProxy = (req, res) => {
  const { method } = req;
  const { target } = url.parse(req.url, true).query;

  fetch(target, { method, agent })
    .then((response) => response.text())
    .then((data) => {
      res.send(data);
      logSuccess(`【success】${target}`);
    })
    .catch((e) => {
      res.send(e);
      logFail(`【fail】${target}`);
    });
};

app.get('/', handleProxy);
app.post('/', handleProxy);

app.listen(port);
logSuccess(`server listen on port ${port}`);
