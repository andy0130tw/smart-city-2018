const parser = require('xml2json');
const request = require('request');
const fs = require('fs');
const unzip = require('unzip');
const moment = require('moment');
const db = require('./db');
const redis = require('./redis');

async function start() {
  let fileUrl = "http://opendata.cwb.gov.tw/govdownload?dataid=F-D0047-093&authorizationkey=rdec-key-123-45678-011121314";
  let output = "weather.zip";
  request({ url: fileUrl, encoding: null }, function(err, resp, body) {
    if (err) throw err;
    fs.writeFile(output, body, function(err) {
      console.log("file written!");
      fs.createReadStream('./weather.zip').pipe(unzip.Extract({ path: 'zip' }));
      fs.readFile('./zip/63_72hr_CH.xml', async function(err, data) {
        const json = JSON.parse(parser.toJson(data));
        console.log("issueTime ->", moment(json.cwbopendata.dataset.datasetInfo.issueTime).utcOffset('+0800').format('YYYY/MM/DD HH:mm:ss'));
        console.log(`地區數 ${json.cwbopendata.dataset.locations.location.length}`);
        let locations = json.cwbopendata.dataset.locations.location;
        for (let i = 0; i < locations.length; i++) {
          let weatherElement = locations[i].weatherElement;
          for (let j = 0; j < weatherElement[0].time.length; j++) {
            let locationName = locations[i].locationName;
            let data_time = moment(weatherElement[0].time[j].dataTime).utcOffset('+0800').format('YYYY/MM/DD HH:mm:ss');
            let t = weatherElement[0].time[j].elementValue.value;
            let pop = weatherElement[3].time[(j / 2) | 0].elementValue.value;
            console.log(`${locationName} ${data_time}`);
            console.log(`t element: ${j}, pop element: ${(j/2)|0}`);
            console.log(`t value ${t}, pop value ${pop}`);
            await db.query(`INSERT INTO weather (locationName, data_time, t, pop, create_date) VALUES ('${locationName}', '${data_time}', ${t}, ${pop}, '${moment().utcOffset('+0800').format("YYYY/MM/DD HH:mm:ss")}')`);

          }
        }

        
        /*
      	console.log(weatherElement[0]);
				{ elementName: 'T',
  				description: '溫度',
  				time: 
   				[ { dataTime: '2018-10-06T00:00:00+08:00',
       				elementValue: [Object] },
     				{ dataTime: '2018-10-06T03:00:00+08:00',
       				elementValue: [Object] }

       	console.log(weatherElement[3]);
				{ elementName: 'PoP6h',
  				description: '6小時降雨機率',
  				time: 
   				[ { startTime: '2018-10-06T00:00:00+08:00',
       				endTime: '2018-10-06T06:00:00+08:00',
       				elementValue: [Object] },
       			{ startTime: '2018-10-06T06:00:00+08:00',
       				endTime: '2018-10-06T12:00:00+08:00',
       				elementValue: [Object] },
      */
      });
      fs.readFile('./zip/65_72hr_CH.xml', async function(err, data) {
        const json = JSON.parse(parser.toJson(data));
        console.log("issueTime ->", moment(json.cwbopendata.dataset.datasetInfo.issueTime).utcOffset('+0800').format('YYYY/MM/DD HH:mm:ss'));
        console.log(`地區數 ${json.cwbopendata.dataset.locations.location.length}`);
        let locations = json.cwbopendata.dataset.locations.location;
        for (let i = 0; i < locations.length; i++) {
          let weatherElement = locations[i].weatherElement;
          let now = await redis.gettime();
          for (let j = 0; j < weatherElement[0].time.length; j++) {
            redis.update(moment().utcOffset('+0800').format('YYYY/MM/DD HH:mm:ss'));
            let locationName = locations[i].locationName;
            let data_time = moment(weatherElement[0].time[j].dataTime).utcOffset('+0800').format('YYYY/MM/DD HH:mm:ss');
            let t = weatherElement[0].time[j].elementValue.value;
            let pop = weatherElement[3].time[(j / 2) | 0].elementValue.value;
            console.log(locationName);
            console.log(data_time);
            console.log(`[0] ${j}, [3] ${(j/2)|0}`);
            console.log(t);
            console.log(pop);
            await db.query(`INSERT INTO weather (locationName, data_time, t, pop, create_date) VALUES ('${locationName}', '${data_time}', ${t}, ${pop}, '${moment().utcOffset('+0800').format("YYYY/MM/DD HH:mm:ss")}')`);

          }
        }
      });
    });
  });
}
start();
// 0{ elementName: 'T', description: '溫度', time: [Array] }
// 3{ elementName: 'PoP6h', description: '6小時降雨機率', time: [Array] }
// 4{ elementName: 'PoP12h', description: '12小時降雨機率', time: [Array] }