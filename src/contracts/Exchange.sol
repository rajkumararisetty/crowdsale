pragma solidity ^0.5.0;

import "openzeppelin-solidity/contracts/math/SafeMath.sol";
import "./Token.sol";

contract Exchange {
    using SafeMath for uint;
// TODO:
// [X] Set the fee account
// [X] Set the fee percent
// [X] Revert ether if by mistake someone send
// [X] Deposit Ether
// [X] Withdraw Ether
// [X] Deposit Tokens
// [X] Withdraw Tokens
// [X] Check Balances
// [] Make Order
// [] Cancel Order
// [] Fill Order
// [] Charge Fees

    // Variables
    address public feeAccount;
    uint256 public feePercent;

    // Order variables
    uint256 public orderCount;
    struct _Order {
        uint256 id;
        address user;
        address tokenGet;
        uint256 amountGet;
        address tokenGive;
        uint256 amountGive;
        uint256 timestamp;
    }
    mapping(uint256 => _Order) public orders;
    mapping(uint256 => bool) public filledOrders;
    mapping(uint256 => bool) public cancelledOrders;

    address constant ETHER_ADDRESS = address(0);
    mapping (address => mapping(address => uint256)) public tokens;

    // Events
    event Deposit(address token, address user, uint256 amount, uint256 balance);
    event Withdraw(address token, address user, uint256 amount, uint256 balance);
    // Order Events
    event Order(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    event orderCancel(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        uint256 timestamp
    );

    event Trade(
        uint256 id,
        address user,
        address tokenGet,
        uint256 amountGet,
        address tokenGive,
        uint256 amountGive,
        address userFill,
        uint256 timestamp
    );

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

    function depositTokens(address _token, uint256 _amount) public {
        require(_token != address(0));
        require(Token(_token).transferFrom(msg.sender, address(this), _amount));
        tokens[_token][msg.sender] = tokens[_token][msg.sender].add(_amount);
        emit Deposit(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function withdrawTokens(address _token, uint256 _amount) public {
        require(_token != ETHER_ADDRESS);
        require(tokens[_token][msg.sender] >= _amount);
        tokens[_token][msg.sender] = tokens[_token][msg.sender].sub(_amount);
        require(Token(_token).transfer(msg.sender, _amount));
        emit Withdraw(_token, msg.sender, _amount, tokens[_token][msg.sender]);
    }

    function balanceOf(address _token) public view returns(uint256) {
        return tokens[_token][msg.sender];
    }

    function makeOrder(address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) public {
        orderCount = orderCount.add(1);
        uint256 orderTime = now;
        orders[orderCount] = _Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, orderTime);
        emit Order(orderCount, msg.sender, _tokenGet, _amountGet, _tokenGive, _amountGive, orderTime);
    }

    function cancelOrder(uint256 _id) public {
        require(!filledOrders[_id]);
        _Order storage _order = orders[_id];
        require(address(_order.user) == msg.sender);
        cancelledOrders[_id] = true;
        emit orderCancel(_order.id, msg.sender, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive, now);
    }

    function fillOrder(uint256 _id) public {
        require(_id > 0 && _id <= orderCount);
        require(!cancelledOrders[_id]);
        require(!filledOrders[_id]);
        _Order storage _order = orders[_id];
        _trade(_order.id, _order.user, _order.tokenGet, _order.amountGet, _order.tokenGive, _order.amountGive);
        filledOrders[_id] = true;
    }

    function _trade(uint256 _id, address _user, address _tokenGet, uint256 _amountGet, address _tokenGive, uint256 _amountGive) internal {
        // Fee paid by the user who filled the order
        // Fee is deducted from the _amountGive
        uint256 _feeAmount = _amountGive.mul(feePercent).div(100);

        // Execute Trade
        tokens[_tokenGet][msg.sender] = tokens[_tokenGet][msg.sender].sub(_amountGet.add(_feeAmount));
        tokens[_tokenGet][_user] = tokens[_tokenGet][_user].add(_amountGet);
        tokens[_tokenGet][feeAccount] = tokens[_tokenGet][feeAccount].add(_feeAmount);

        tokens[_tokenGive][_user] = tokens[_tokenGive][_user].sub(_amountGive);
        tokens[_tokenGive][msg.sender] = tokens[_tokenGive][msg.sender].add(_amountGive);
        emit Trade(_id, _user, _tokenGet, _amountGet, _tokenGive, _amountGive, msg.sender, now);
    }
}