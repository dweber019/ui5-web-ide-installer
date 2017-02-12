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
  utility.showDownloadLink,
  // Download new source
  utility.downloadWebIDE,
  // Install Web IDE
  utility.installWebIDE,
  // Post actions
  utility.postActions,
  // Clean up
  utility.cleanUp
]);