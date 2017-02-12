/**
 * This is the utility script
 */
const chalk = require('chalk');
const log = console.log;
const os = require('os');
const cheerio = require('cheerio')
const argv = require('minimist')(process.argv.slice(2));
const installationModus = argv.m;
const https = require('https');
const configuration = require('./congiuration.json');
const fs = require('fs');
const request = require('request');
const progress = require('request-progress');
const pretty = require('prettysize');

let platform;
let downloadLink;

function initialize() {
  const tempPlatform = os.platform();
  if (tempPlatform === 'win32') {
    if (process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
      tempPlatform = 'win64';
    }
  }
  platform = tempPlatform;
}

function showModus(cb) {
  log(chalk.yellow.bold('Modus: ') + installationModus);
  cb(null);
}

function showPlatform(cb) {
  log(chalk.yellow.bold('Platform: ') + getPlatform());
  cb(null);
}

function getPlatform() {
  return platform;
}

function showDownloadLink(cb) {
  getDownloadLink(function (link) {

    log(chalk.yellow.bold('Download link: ') + link);
    cb(null);
  });
}

function getDownloadLink(cb) {
  if (downloadLink) {
    cb(downloadLink);
  }

  https.get(configuration.downloadSite, function (response) {
    let body = '';
    response.on('data', function (d) {
      body += d;
    });
    response.on('end', function () {
      cb(praseDownloadLink(body));
    });
  });
}

function praseDownloadLink(body) {
  let $ = cheerio.load(body)
  // find all links
  let allLinks = [];

  $('a').each(function (i) {
    allLinks[i] = $(this).attr('href');
  });

  allLinks = allLinks.filter(function (v) { return v.indexOf(configuration.linkIdentifier) !== -1; });
  allLinks = allLinks.filter(function (v) { return v.indexOf('prod') !== -1; });

  let platformDownloadLink = allLinks.filter(function (v) { return v.indexOf(configuration.platformIdentifier[getPlatform()]) !== -1; })[0];

  downloadLink = configuration.downloadSite + '/' + platformDownloadLink;

  return downloadLink;
}

function downloadWebIDE(cb) {
  log(chalk.yellow.bold('Start downloading new Web IDE'));
  progress(request({url: downloadLink, headers: {Cookie: 'eula_3.1_agreed=tools.hana.ondemand.com/developer-license-3.1.txt'}}), {
    throttle: 2000
  })
    .on('progress', function (state) {
      log(
        chalk.yellow('Progress: ') + round(state.percent * 100, 1) + '%' +
        '\t\t' +
        chalk.yellow('Transfer: ') + (prettifyByte(state.size.transferred)) + '/' + (prettifyByte(state.size.total)) +
        '\t\t' +
        chalk.yellow('Speed: ') + (prettifyByte(state.speed))
      );
    })
    .on('error', function (err) {
      log(chalk.red.bold('An error occured') + err);
      process.exit(1);
    })
    .on('end', function () {
      log(chalk.green.bold('New Web IDE downloaded'));
      cb();
    })
    .pipe(fs.createWriteStream('webide.zip'));
}

function prettifyByte(byte) {
  return pretty(byte, true);
}

function round(value, precision) {
  let multiplier = Math.pow(10, precision || 0);
  return Math.round(value * multiplier) / multiplier;
}

// Export functionality
module.exports.default = initialize();
module.exports.showModus = showModus;
module.exports.showPlatform = showPlatform;
module.exports.showDownloadLink = showDownloadLink;
module.exports.downloadWebIDE = downloadWebIDE;