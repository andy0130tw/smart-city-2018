const logger = require('morgan');
const moment = require('moment');
const fs = require('fs');
const path = require('path');

logger.token('realclfdate', function(req, res) {
  return moment().utcOffset('+0800').format('YYYY/MM/DD HH:mm:ss');
});
logger.format('custom', '[:realclfdate] :method :url :status :response-time ms');

// create a write stream (in append mode)
const accessLogStream = fs.createWriteStream(path.join(path.resolve('./')+'/logs/', moment().utcOffset('+0800').format('YYYYMMDD') + '-'), { flags: 'a' });

module.exports = {
  logStream: logger('custom', { stream: accessLogStream }),
  dev: logger('dev')
};