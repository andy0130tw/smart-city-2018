'use strict';

const config = require('../config');
const mysql = require('promise-mysql');

module.exports.query = (string) => {
  return new Promise((resolve, reject) => {
    mysql.createConnection(config.db_options).then(function(conn) {
      var result = conn.query(string);
      conn.end();
      return result;
    }).then(function(rows) {
      resolve(rows);
    }).catch((err) => {
      return reject(err);
    });
  });
}