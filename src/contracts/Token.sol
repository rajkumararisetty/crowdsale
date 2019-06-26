pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Token {
    using SafeMath for uint;

    string public name = "N Token";
    string public symbol = "N";
    uint256 public decimals = 18;
    uint256 public totalSupply;

    // Balance variables
    mapping (address => uint256) public balanceOf;
    mapping (address => mapping (address => uint256)) public allowance;

    // Events
    event Transfer(address indexed from, address indexed to, uint256 value);
    event Approve(address indexed owner, address indexed spender, uint256 value);

    constructor() public {
        totalSupply = 1000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }

    function transfer(address _to, uint256 _value) public returns(bool success) {
        require(balanceOf[msg.sender] >= _value);
        _transfer(msg.sender, _to, _value);
        return true;
    }

    function approve(address _spender, uint256 _value) public returns(bool success) {
        require(_spender != address(0));
        allowance[msg.sender][_spender] = _value;
        emit Approve(msg.sender, _spender, _value);
        return true;
    }

    function transferFrom(address _owner, address _receiver, uint256 _value) public returns(bool success) {
        require(allowance[_owner][msg.sender] >= _value);
        _transfer(_owner, _receiver, _value);
        allowance[_owner][msg.sender] = allowance[_owner][msg.sender].sub(_value);
        return true;
    }

    function _transfer(address _from, address _to, uint256 _value) internal {
        require(_from != address(0));
        balanceOf[_to] = balanceOf[_to].add(_value);
        balanceOf[_from] = balanceOf[_from].sub(_value);
        emit Transfer(_from, _to, _value);
    }
}
