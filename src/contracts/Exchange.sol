pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange {
// TODO:
// [X] Set the fee account
// [X] Set the fee percent
// [X] Revert ether if by mistake someone send
// [] Deposit Ether
// [] Withdraw Ether
// [] Deposit Tokens
// [] Withdraw Tokens
// [] Check Balances
// [] Make Order
// [] Cancel Order
// [] Fill Order
// [] Charge Fees

    // Variables
    address public feeAccount;
    uint256 public feePercent;

    address constant ETHER_ADD = address(0);
    mapping (address => mapping(address => uint256)) public tokens;

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: revers if Ether is sent to this smart contract by mistake
    function() external {
        revert();
    }
}