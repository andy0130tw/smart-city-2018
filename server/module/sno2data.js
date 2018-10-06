const method = {
  redis: require('./redis'),
  db: require('./db')
};

const moment = require('moment');
const format = 'HH:mm:ss';

module.exports = async function sno2data(sno, start = 0) {
  let sbi = await method.redis.hget(`youbike:${sno}:sbi`);
  let bemp = await method.redis.hget(`youbike:${sno}:bemp`);
  let act = await method.redis.hget(`youbike:${sno}:act`);
  let location = await method.redis.hget(`location:${sno}`);
  let now_day = moment().utcOffset('+0800').date();
  let now_hr = moment().utcOffset('+0800').hour();
  let db_data = await method.db.query(`select data_time, t, pop, create_date from weather where locationName = '${location}'`);

  let result = {};
  let rate = 0;
  console.log(`id: ${sno}`);
  console.log(`可借車位 ${sbi} 可還車位 ${bemp}`);
  console.log(`站狀態 ${act}`);
  console.log(`區域 ${location}`);
  
  result.sno = sno;
  result.sbi = parseInt(sbi);
  result.bemp = parseInt(bemp);
  result.act = act;
  result.location = location;
  result.t = 23;
  result.pop = 10;
  for (let i = 0; i < db_data.length; i++) {
    
    if (moment(db_data[i].data_time).date() == now_day && moment(db_data[i].data_time).hour() <= now_hr) {
      result.t = db_data[i].t;
      result.pop = db_data[i].pop;
    } else {
        break;
    }
  }

  console.log(`溫度 ${result.t}`);
  console.log(`降雨機率% ${result.pop}`);

  //get full rate
  const fullrate = Math.floor(result.sbi / (result.sbi + result.bemp) * 100);
  console.log(`start ${start}  full ${fullrate}`);

  if(result.pop > 70){
    console.log('rain');
    result.rate = rate;
    return result;
  }

  if(start){

    if(result.t > 27){
      rate += (result.t - 27) * 0.5;
    }

    if(fullrate > 90){
      rate += fullrate - 90;
    }

    const now = moment().utcOffset('+0800').format('HH:mm:ss'); //.utcOffset('+0800')
    console.log(`now ${now}`);
    const time = moment(now, format);

    if (time.isBetween(moment('07:30:00', format), moment('09:00:00', format))) {
      console.log('is between 0730 - 0900');
      rate += 1;
    } else if (time.isBetween(moment('17:30:00', format), moment('19:30:00', format))) {
      console.log('is between 1730 - 1930');
      rate += 2;
    } else if (time.isBetween(moment('02:00:00', format), moment('05:00:00', format))) {
      console.log('is between 0200 - 0500');
      rate += 0.5;
    }

  } else {

    if(fullrate < 20){
      rate += 20 - fullrate;
    }

  }

  console.log(`------`)
  result.rate = rate;
  return result;
}

