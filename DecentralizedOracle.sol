pragma solidity ^0.4.24;

contract Ownable {
    address public owner;

    constructor() public {
        owner = msg.sender;
    }

    modifier onlyOwner() {
        require(msg.sender == owner);
        _;
    }

    function transferOwnership(address newOwner) onlyOwner public {
        if (newOwner != address(0)) {
            owner = newOwner;
        }
    }

}


contract Feed is Ownable{
    uint256 public data;
    uint256 public lastUpdateTime;
    function read() public view returns(uint256 _value, uint256 _timestamp){
        return(data,lastUpdateTime);
    }
    function write(uint256 _data)public onlyOwner{
        data = _data;
        lastUpdateTime = now;
    }
}

contract Medianizer is Ownable{

    mapping(address => bool) isOracle;
    Feed[] oracles;

    uint256 count;
    uint256 threshold;
    uint256 expireTime;

    uint256 median;
    uint256 lastUpdateTime;

    constructor (uint256 _threshold, uint256 _expireTime) public{
        threshold =_threshold;
        expireTime =_expireTime;
    }

    function generateFeed(address _who) public onlyOwner{
        Feed newFeed = new Feed();
        newFeed.transferOwnership(_who);
        isOracle[address(newFeed)] = true;
        count += 1;
        oracles.push(newFeed);
    }

    function setThreshold(uint256 _threshold) public onlyOwner{
        threshold = _threshold;
    }

    function read() public view returns(uint256 _value, uint256 _timestamp){
        return(median,lastUpdateTime);
    }

    function tick()public {
        uint256 m;
        bool v;
        (m,v) = compute();
        if(v){
            median = m;
            lastUpdateTime = now;
        }
    }

    function compute() public view returns(uint256 _median,bool valid){
        uint256[] memory dataSet = new uint256[](count) ;
        uint256 _data;
        uint256 _lastUpdateTime;
        address cur;
        uint256 val;
        for(uint256 i = 0; i<count; i++){
            cur = address(oracles[i]);
            (_data,_lastUpdateTime) = oracles[i].read();

            if(_lastUpdateTime + expireTime >= now){
                if (val == 0 || _data >= dataSet[val - 1]) {
                        dataSet[val] = _data;
                    } else {
                        uint256 j = 0;
                        while (_data >= dataSet[j]) {
                            j++;
                        }
                        for (uint256 k = val; k > j; k--) {
                            dataSet[k] = dataSet[k - 1];
                        }
                        dataSet[j] = _data;
                    }
                    val++;
            }

        }

        if(val < threshold) return(median, false);

        if(val%2 == 0){
            uint256 average = (dataSet[(val) / 2] + dataSet[(val) / 2 - 1]) / 2;
            return(average, true);
        }
        else{
            return(dataSet[(val - 1) / 2], true);
        }

    }


}
