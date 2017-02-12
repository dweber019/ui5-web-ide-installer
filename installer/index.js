// Import agruments
// Import helper
const utility = require('./utility');

// Import async
const async = require('async');

// Start programm
async.waterfall([
  // Show installation modus
  utility.showModus,
  // Show OS platform
  utility.showPlatform,
  // Show Download link
  utility.showDownloadLink
]);