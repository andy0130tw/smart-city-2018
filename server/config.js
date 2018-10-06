require('dotenv').config();

var config = {
  db_options: {
    host: '127.0.0.1',
    user: process.env.DBUSER,
    password: process.env.DBPASSWORD,
    database: 'data'
  }
};

module.exports = config;