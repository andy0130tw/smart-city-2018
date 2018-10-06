const method = require('../module');
const moment = require('moment');
async function sno2data(sno){
		let sbi = await method.redis.hget(`youbike:${sno}:sbi`);
    let bemp = await method.redis.hget(`youbike:${sno}:bemp`);
    let act = await method.redis.hget(`youbike:${sno}:act`);
    let location = await method.redis.hget(`location:${sno}`);
    let now_day = moment().utcOffset('+0800').date();
    let now_hr = moment().utcOffset('+0800').hour();
    let db_data = await method.db.query(`select data_time, t, pop, create_date from weather where locationName = '${location}'`);

    let result = {};
    // console.log(`date ${now_hr}/${now_day}`);
    console.log(`id: ${sno}`);
    console.log(`可借車位 ${sbi} 可還車位 ${bemp}`);
    console.log(`站狀態 ${act}`);
    console.log(`區域 ${location}`);
    console.log(db_data.length);
    result.sno = sno;
    result.sbi = parseInt(sbi);
    result.bemp = parseInt(bemp);
    result.act = act;
    result.location = location;

    for (let i = 0; i < db_data.length; i++) {
    	// console.log(`db date ${db_data[i].data_time}`);
    	// console.log(`[${i}] ${moment(db_data[i].data_time).hour()}, now ${now_hr} t: ${db_data[i].t} pop: ${db_data[i].pop}`);
    	if(moment(db_data[i].data_time).date() == now_day && moment(db_data[i].data_time).hour() > now_hr){
    		result.t = db_data[i-1].t;
    		result.pop = db_data[i-1].pop;
    		console.log(`溫度 ${db_data[i-1].t}`);
    		console.log(`降雨機率% ${db_data[i-1].pop}`);
    		break;
    	}
    }
    return result;
}
module.exports = async(req, res) => {
  try {
    let start_sno = req.body.start;
    let end_sno = req.body.end;
    let result = [];
   	result.push(await sno2data(start_sno));
   	result.push(await sno2data(end_sno));
    console.log(result);


    res.json({ result: result });

  } catch (e) {
    res.json({ result: false });
    console.log(`sno2data false: ${e}`);
  }
}