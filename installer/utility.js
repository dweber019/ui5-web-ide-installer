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
const path = require('path');
const unzipper = require('unzipper');
const exec = require('child_process').exec;

let platform;
let downloadLink;
let installationPath;

function initialize() {
  // Get platform
  const tempPlatform = os.platform();
  if (tempPlatform === 'win32') {
    if (process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
      tempPlatform = 'win64';
    }
  }
  platform = tempPlatform;

  // Set installation path
  if (platform === 'darwin') {
    installationPath = path.resolve('/Applications/SAPWebIDE');
  } else {
    installationPath = path.resolve('/SAPWebIDE');
  }
}

function showModus(cb) {
  log(chalk.yellow.bold('Modus: ') + installationModus);

  if (installationModus === 'install'
    && (
      fs.existsSync(path.resolve(installationPath, 'eclipse/artifacts.xml'))
      || fs.existsSync(path.resolve(installationPath, 'eclipse/artifacts.xml'))
    )
  ) {
    log(chalk.red.bold('There is already a installation of Web IDE, probably you like to update with \'npm run update:ide\'?'));
    process.exit(1);
  }

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
  progress(request({ url: downloadLink, headers: { Cookie: 'eula_3.1_agreed=tools.hana.ondemand.com/developer-license-3.1.txt' } }), {
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
      log(chalk.red.bold('An error occured while downloading') + err);
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

function installWebIDE(cb) {
  log(chalk.yellow.bold('Start unzipping of Web IDE'));
  fs.createReadStream('webide.zip')
    .on('end', () => {
      log(chalk.green.bold('Web IDE installed to'), installationPath);
      cb();
    })
    .pipe(unzipper.Extract({ path: installationPath }));
}

function postActions(cb) {
  if (getPlatform() === 'darwin') {
    exec('xattr -r -c *', { cwd: path.resolve(installationPath, 'eclipse') }, function (error, stdout, stderr) {
      if (error !== null) {
        log(chalk.red.bold('An error occured while executing post actions') + error);
        process.exit(1);
      }
      log(chalk.yellow.bold('Post actions run for darwin'));
      cb();
    });
  } else {
    cb();
  }
}

function cleanUp(cb) {
  fs.unlinkSync(path.resolve('webide.zip'));
  cb();
}

// Export functionality
module.exports.default = initialize();
module.exports.showModus = showModus;
module.exports.showPlatform = showPlatform;
module.exports.showDownloadLink = showDownloadLink;
module.exports.downloadWebIDE = downloadWebIDE;
module.exports.installWebIDE = installWebIDE;
module.exports.postActions = postActions;
module.exports.cleanUp = cleanUp;