const method = require('../module');
const ethUtil = require('ethereumjs-util');
const Web3 = require('web3');
const BN = require('bn.js');

const web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider(process.env.RPCURL));

let accountObj = web3.eth.accounts.privateKeyToAccount(`0x${process.env.ETHPRIVATEKEY}`);
let contractOwner = accountObj.address;
web3.eth.accounts.wallet.add(accountObj);

const contract = new web3.eth.Contract(require('../../abi.json'), process.env.ADDRCONTRACT);

module.exports = async(req, res) => {
  if (!req.body.address ||
      !req.body.address.match(/^0x[0-9a-fA-F]{40}$/)) {
    res.json({ result: false, msg: 'invalid address' });
    return;
  }

  if (!req.body.signature || 
      !req.body.signature.match(/^0x[0-9a-fA-F]{130}$/)) {
    res.json({ result: false, msg: 'invalid signature' });
    return;
  }

  if (!req.body.amount ||
      !req.body.amount.match(/^\d+$/)) {
    res.json({ result: false, msg: 'invalid amount' });
    return;
  }

  let address = req.body.address.toLowerCase();
  let signature = req.body.signature;

  let db_query_addr = await method.db.query(`SELECT amount, nonce FROM bookkeeping WHERE address = "${address}"`);

  if (db_query_addr.length == 0) {
    res.json({ result: false, msg: 'this address does not exist' });
    return; 
  } 

  if (db_query_addr[0].amount != req.body.amount) {
    console.log(`amount mismatch (db:req, ${db_query_addr[0].amount} != ${req.body.amount})`);
    res.json({ result: false, msg: 'amount mismatch'});
    return;
  }

  let hash = Web3.utils.soliditySha3(
    address,
    process.env.ADDRCONTRACT,
    db_query_addr[0].nonce,
    db_query_addr[0].amount
  );

  console.log('hash', hash);
  
  let _v, _r, _s;

  let recoveredPubKey = ethUtil.ecrecover(
    ethUtil.toBuffer(hash),
    _v = parseInt(signature.substr(130, 2), 16),
    Buffer.from(_r = signature.substr(2, 64), 'hex'),
    Buffer.from(_s = signature.substr(66, 64), 'hex')
  );

  let recoveredPubAddr = ethUtil.bufferToHex(ethUtil.pubToAddress(recoveredPubKey));
 
  console.log('ecrecover', recoveredPubAddr, address);

  if (recoveredPubAddr != address) {
    res.json({ result: false, msg: 'signature mismatch' });
    return;
  }

  let db_flush = await method.db.query(`UPDATE bookkeeping SET amount = 0, nonce = ${db_query_addr[0].nonce + 1} WHERE address = "${address}"`);

  console.log('vrs', _v, _r, _s);
  console.log('db data', db_query_addr);

  contract.methods.redeemByAdmin(
    address,
    db_query_addr[0].amount,
    db_query_addr[0].nonce,
    _v, '0x' + _r, '0x' + _s
  ).send({ from: contractOwner, gasPrice: Web3.utils.toWei('41', 'gwei'), gas: 133337 })
    .on('transactionHash', hash => {
      console.log('tx hash: ', hash);
      res.json({ result: true, txhash: hash });
    });

}

