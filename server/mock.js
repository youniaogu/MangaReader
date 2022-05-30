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

app.all('/update', function (req, res) {
  res.sendFile(path.join(__dirname, 'example/update.html'), (err) => {
    if (err) {
      logFail('【fail】update: ' + err.message);
    } else {
      logSuccess('【success】update');
    }
  });
});
app.all('/search', function (req, res) {
  res.sendFile(path.join(__dirname, 'example/search.html'), (err) => {
    if (err) {
      logFail('【fail】search: ' + err.message);
    } else {
      logSuccess('【success】search');
    }
  });
});
app.all('/manga', function (req, res) {
  res.sendFile(path.join(__dirname, 'example/manga.html'), (err) => {
    if (err) {
      logFail('【fail】manga: ' + err.message);
    } else {
      logSuccess('【success】manga');
    }
  });
});
app.all('/chapter', function (req, res) {
  res.sendFile(path.join(__dirname, 'example/chapter.html'), (err) => {
    if (err) {
      logFail('【fail】chapter: ' + err.message);
    } else {
      logSuccess('【success】chapter');
    }
  });
});

app.listen(port);
logSuccess(`server listen on port ${port}`);
