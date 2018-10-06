import Web3 from 'web3';

const addrContract = '';
const rpcUrl = 'https://rinkeby.infura.io/rY2sqHMeqPbsaDQU42s6';

let web3 = new Web3();
web3.setProvider(new Web3.providers.HttpProvider(rpcUrl));

if (Web3.givenProvider) {
  let web3Internal = new Web3();
  web3Internal.setProvider(Web3.givenProvider);
  web3Internal.eth.getAccounts().then(accList => {
    console.log('account: ', accList);
  })
}

export default {
  web3
};
