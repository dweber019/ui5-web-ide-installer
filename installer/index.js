// Import agruments
const argv = require('minimist')(process.argv.slice(2));
const installationModus = argv.m;

// Import helper
const utility = require('./utility');

// Show installation modus
utility.printEmp('Modus', installationModus);

// Show OS platform
utility.printEmp('Platform', utility.getPlatform());