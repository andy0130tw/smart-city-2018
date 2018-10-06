'use strict';

const ApiCLient = require('./api_client');
const config = require('./config');
const moment = require('moment');
const db = require('./db');

async function start() {
  try {
    let apiClient = new ApiCLient();
    let list = [];
    let data = await apiClient.get(`https://tcgbusfs.blob.core.windows.net/blobyoubike/YouBikeTP.gz`);
    console.log(`台北youbike length ${Object.keys(data.retVal).length}`);
    for (let i = 0; i < Object.keys(data.retVal).length; i++) {
      let sno = data.retVal[Object.keys(data.retVal)[i]].sno;
      let sbi = data.retVal[Object.keys(data.retVal)[i]].sbi;
      let mday = data.retVal[Object.keys(data.retVal)[i]].mday;
      let bemp = data.retVal[Object.keys(data.retVal)[i]].bemp;
      let act = data.retVal[Object.keys(data.retVal)[i]].act;

      await db.query(`INSERT INTO youbike (sno, sbi, mday, bemp, act, create_date) VALUES ('${sno}', ${sbi}, '${mday}', ${bemp}, ${act}, '${moment().utcOffset('+0800').format("YYYY/MM/DD HH:mm:ss")}')`);
    }
    let data2 = await apiClient.get(`http://data.ntpc.gov.tw/api/v1/rest/datastore/382000000A-000352-001`);
    console.log(`新北youbike length ${data2.result.records.length}`);
    for (let i = 0; i < data2.result.records.length; i++) {

      let sno = data2.result.records[i].sno;
      let sbi = data2.result.records[i].sbi;
      let mday = data2.result.records[i].mday;
      let bemp = data2.result.records[i].bemp;
      let act = data2.result.records[i].act;

      await db.query(`INSERT INTO youbike (sno, sbi, mday, bemp, act, create_date) VALUES ('${sno}', ${sbi}, '${mday}', ${bemp}, ${act}, '${moment().utcOffset('+0800').format("YYYY/MM/DD HH:mm:ss")}')`);
    }
  } catch(e){
  	console.error(e);
  }

}

// start();
setInterval(function main() {
  let m = moment().minute();
  let s = moment().second();
  if (m % 5 == 0 && s == 0) {
    console.log(`youbike ${moment().utcOffset('+0800').format("YYYY/MM/DD HH:mm:ss")}`);
    start();
  }
}, 1000);

process.on('unhandledRejection', (reason, p) => {
  console.error(reason);
  setTimeout(() => {
    process.exit(1);
  }, 5000);
});