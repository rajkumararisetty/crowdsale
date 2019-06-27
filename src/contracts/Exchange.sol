pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";

contract Exchange {
    using SafeMath for uint;
// TODO:
// [X] Set the fee account
// [X] Set the fee percent
// [X] Revert ether if by mistake someone send
// [X] Deposit Ether
// [X] Withdraw Ether
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

    address constant ETHER_ADDRESS = address(0);
    mapping (address => mapping(address => uint256)) public tokens;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);

    constructor(address _feeAccount, uint256 _feePercent) public {
        feeAccount = _feeAccount;
        feePercent = _feePercent;
    }

    // Fallback: revers if Ether is sent to this smart contract by mistake
    function() external {
        revert();
    }

    function depositEther() payable public {
        tokens[ETHER_ADDRESS][msg.sender] = tokens[ETHER_ADDRESS][msg.sender].add(msg.value);
        emit Deposit(ETHER_ADDRESS, msg.sender, msg.value, tokens[ETHER_ADDRESS][msg.sender]);
    }

    function withdarwEther(uint256 _amount) public {
        require(_amount <= tokens[ETHER_ADDRESS][msg.sender]);
        tokens[ETHER_ADDRESS][msg.sender] = tokens[ETHER_ADDRESS][msg.sender].sub(_amount);
        msg.sender.transfer(_amount);
        emit Withdraw(ETHER_ADDRESS, msg.sender, _amount, tokens[ETHER_ADDRESS][msg.sender]);
    }
}