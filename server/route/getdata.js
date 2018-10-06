const method = require('../module');
const moment = require('moment');
const format = 'HH:mm:ss';

const sno2data = method.sno2data;

module.exports = async(req, res) => {
  try {
    console.log(`req.body.start: ${req.body.start}`);
    console.log(`req.body.end: ${req.body.end}`);
    let start_sno = req.body.start.replace(/[^a-zA-Z0-9]/g, "") ? req.body.start.replace(/[^a-zA-Z0-9 ]/g, ""):'0067';
    let end_sno = req.body.end.replace(/[^a-zA-Z0-9]/g, "") ? req.body.end.replace(/[^a-zA-Z0-9 ]/g, ""):'1200';
    let result = [];
    let rate = 1;
    result.push(await sno2data(start_sno,1));
    result.push(await sno2data(end_sno));
    result.push(rate+result[0].rate+result[1].rate);
    console.log(result);


    res.json({ result: result });

  } catch (e) {
    res.json({ result: false });
    console.log(`sno2data false: ${e}`);
  }
}

