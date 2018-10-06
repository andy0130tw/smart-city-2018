import Web3 from 'web3';
import ABI from '../../abi.json';

const addrContract = '0xc37c19360c617d2f425dc2b1191eca5662aed525';
const rpcUrl = 'https://rinkeby.infura.io/rY2sqHMeqPbsaDQU42s6';

let web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider(rpcUrl));

if (Web3.givenProvider) {
  let web3Internal = new Web3();
  web3Internal.setProvider(Web3.givenProvider);
  web3Internal.eth.getAccounts().then(accList => {
    console.log('account: ', accList);
  });
}

if (localStorage.youbike_wallet) {
  web3.eth.defaultAccount = JSON.parse(localStorage.youbike_wallet)[0];
  console.log(`set default account to ${localStorage.youbike_wallet}`);
}


let contract = new web3.eth.Contract(ABI, addrContract);

contract.methods.balances(web3.eth.defaultAccount).call().then(bal => {
    console.log(bal);
});



export default {
  web3
};