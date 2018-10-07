const method = require('../module');
const moment = require('moment');
const ethUtil = require('ethereumjs-util');
const Web3 = require('web3');
const BN = require('bn.js');

const format = 'HH:mm:ss';

const sno2data = method.sno2data;

function distanceOf(latlng1, latlng2) {
		var rad = Math.PI / 180,
		    lat1 = latlng1.lat * rad,
		    lat2 = latlng2.lat * rad,
		    sinDLat = Math.sin((latlng2.lat - latlng1.lat) * rad / 2),
		    sinDLon = Math.sin((latlng2.lng - latlng1.lng) * rad / 2),
		    a = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLon * sinDLon,
		    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return 6371000 * c;
}

module.exports = async(req, res) => {
  if (!req.body.address || 
      !req.body.address.match(/^0x[0-9a-fA-F]{40}$/)) {
    res.json({ result: false, msg: 'invalid address' });
    return;
  }

  let address = req.body.address.toLowerCase();

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

    rate += result[0].rate + result[1].rate;

    let latlng1 = await method.redis.hget(`latlng:${start_sno}`);
    let latlng2 = await method.redis.hget(`latlng:${end_sno}`);
    
    let [lat1, lng1] = latlng1.split(',');
    let [lat2, lng2] = latlng2.split(',');

    let pos1 = { lat: lat1, lng: lng1 };
    let pos2 = { lat: lat2, lng: lng2 };

    let giving_token_amount = Math.floor(rate * distanceOf(pos1, pos2) * 1e16).toString(10);

    console.log(`token_amount=${giving_token_amount}`);

    let db_try_insert = await method.db.query(`INSERT IGNORE INTO bookkeeping (address, amount) VALUES ("${address}", "0")`);

    let db_query = await method.db.query(`SELECT amount, nonce FROM bookkeeping WHERE address = "${address}" FOR UPDATE;`);
    let new_amount = new BN(db_query[0].amount).add(new BN(giving_token_amount));
    let nonce = db_query[0].nonce;
    console.log('amount: ', db_query[0].amount, '->', new_amount.toString());
    console.log('nonce: ', nonce);

    let db_modify = await method.db.query(`UPDATE bookkeeping SET amount = "${new_amount.toString()}" WHERE address = "${address}"`);

    console.log('db modify', db_modify);

    let db_commit = await method.db.query(`COMMIT`);

    console.log('db commit', db_commit);

    let newHash = Web3.utils.soliditySha3(
      address,
      process.env.ADDRCONTRACT,
      nonce,
      new_amount.toString()
    );

    let vrs = ethUtil.ecsign(ethUtil.toBuffer(newHash), Buffer.from(process.env.ETHPRIVATEKEY, 'hex'));
    let retSign = `0x${vrs.r.toString('hex')}${vrs.s.toString('hex')}${vrs.v.toString(16)}`;

    res.json({
      result: result,
      new_amount: new_amount.toString(),
      signature: retSign,
      nonce: nonce
    });

  } catch (e) {
    res.json({ result: false });
    console.log(`sno2data false: ${e}`);
  }
}

