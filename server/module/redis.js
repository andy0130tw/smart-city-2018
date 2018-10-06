'use strict';

const moment = require('moment');
const asyncRedis = require("async-redis");
const client = asyncRedis.createClient();

//update currnet price data
const hget = async(key) => {
  return await client.hget(key, 'data');
}

module.exports = {
  hget: hget,

};