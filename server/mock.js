import express from 'express';
import chalk from 'chalk';
import path from 'path';

const app = express();
const port = process.env.PORT || 3333;
const __dirname = path.resolve(path.dirname(''));

function logSuccess(message) {
  console.log(chalk.green(message));
}
function logFail(message) {
  console.log(chalk.red(message));
}

app.all('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'example', req.path + '.html'), (err) => {
    if (err) {
      logFail('【fail】' + req.path);
    } else {
      logSuccess('【success】' + req.path);
    }
  });
});

app.listen(port);
logSuccess(`server listen on port ${port}`);
