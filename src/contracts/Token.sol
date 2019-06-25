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

    constructor() public {
        totalSupply = 1000 * (10 ** decimals);
        balanceOf[msg.sender] = totalSupply;
    }
}
