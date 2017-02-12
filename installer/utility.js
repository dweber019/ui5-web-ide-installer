/**
 * This is the utility script
 */
const chalk = require('chalk');
const log = console.log;
const os = require('os');

let platform;

function initialize() {
  const tempPlatform = os.platform();
  if (tempPlatform === 'win32') {
    if (process.arch === 'x64' || process.env.hasOwnProperty('PROCESSOR_ARCHITEW6432')) {
      tempPlatform = 'win64';
    }
  }
  platform = tempPlatform;
}

function printEmp(title, text) {
  log(chalk.yellow.bold(title) + ': ' + text);
}

function getPlatform() {
  return platform;
}

// Export functionality
module.exports.default = initialize();
module.exports.printEmp = printEmp;
module.exports.getPlatform = getPlatform;