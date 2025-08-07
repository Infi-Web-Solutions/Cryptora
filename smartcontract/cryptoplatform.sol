// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

contract CryptoPlatform {
    address public admin;
    address[] private userList;

    struct Transaction {
        string txType; // Buy, Sell, Approved, Repay
        string symbol;
        uint256 amount;
        uint256 timestamp;
    }

    struct User {
        address wallet;
        uint256 usdBalance;
        uint256 borrowedAmount;
        string[] watchlist;
        string[] portfolio;
        Transaction[] transactions;
        mapping(string => bool) isInWatchlist;
        mapping(string => bool) hasCoin;
        mapping(string => uint256) holdings;
    }

    mapping(address => User) private users;
    mapping(address => bool) public registered;
    mapping(address => uint256) public pendingRequests;
    mapping(address => Transaction[]) private userTransactions;

    address[] public registeredUsers;

    // ======= Events =======
    event FundsRejected(address user);
    event Registered(address user);
    event RequestFunds(address user, uint256 amount);
    event FundsApproved(address user, uint256 amount);
    event CoinBought(address indexed user, string symbol, uint256 quantity, uint256 totalCost);
    event CoinSold(address user, string symbol, uint256 quantity);
    event WatchlistUpdated(address user, string symbol, bool added);
    event Repaid(address user, uint256 amount);
    event AdminUpdated(address oldAdmin, address newAdmin);

    // ======= Modifiers =======
    modifier onlyAdmin() {
        require(msg.sender == admin, "Only admin allowed");
        _;
    }

    modifier onlyRegistered() {
        require(registered[msg.sender], "You are not registered");
        _;
    }

    constructor() {
        admin = msg.sender;
    }

    // ======= Admin =======
    function updateAdmin(address newAdmin) external onlyAdmin {
        require(newAdmin != address(0), "Invalid new admin");
        emit AdminUpdated(admin, newAdmin);
        admin = newAdmin;
    }

    // ======= Registration =======
    function register() external {
        require(!registered[msg.sender], "Already registered");
        _registerUser(msg.sender);
    }

    function adminRegister(address user) external onlyAdmin {
        require(user != address(0), "Invalid address");
        require(!registered[user], "Already registered");
        _registerUser(user);
    }

    function _registerUser(address user) internal {
        users[user].wallet = user;
        registered[user] = true;
        registeredUsers.push(user);
        userList.push(user);
        emit Registered(user);
    }

    // ======= Borrow / Repay =======
    function requestVirtualUSD(uint256 amount) external onlyRegistered {
        pendingRequests[msg.sender] = amount;
        emit RequestFunds(msg.sender, amount);
    }

    function requestVirtualUSDFor(address user, uint256 amount) external onlyAdmin {
        pendingRequests[user] = amount;
        emit RequestFunds(user, amount);
    }

    function approveFunds(address user) external onlyAdmin {
        uint256 amount = pendingRequests[user];
        require(amount > 0, "No pending request");

        users[user].usdBalance += amount;
        users[user].borrowedAmount += amount;
        pendingRequests[user] = 0;

        userTransactions[user].push(Transaction("Approved", "USD", amount, block.timestamp));
        emit FundsApproved(user, amount);
    }

    function repayBorrowedAmount(uint256 amount) external onlyRegistered {
        require(users[msg.sender].usdBalance >= amount, "Insufficient balance");
        require(users[msg.sender].borrowedAmount >= amount, "Nothing to repay");

        users[msg.sender].usdBalance -= amount;
        users[msg.sender].borrowedAmount -= amount;

        userTransactions[msg.sender].push(Transaction("Repay", "USD", amount, block.timestamp));
        emit Repaid(msg.sender, amount);
    }

    // ======= Coin Trading =======
    function buyCoinFor(address userAddr, string memory symbol, uint256 price, uint256 quantity) external onlyAdmin {
    User storage user = users[userAddr];
    uint256 totalCost = price * quantity;

    require(user.usdBalance >= totalCost, "Insufficient USD balance");

    // Deduct balance and update holdings
    user.usdBalance -= totalCost;
    user.holdings[symbol] += quantity;

    // Track if it's a new coin added to portfolio
    
    if (!user.hasCoin[symbol]) {
        user.hasCoin[symbol] = true;
        user.portfolio.push(symbol);
    }

    // Record transaction
    user.transactions.push(Transaction({
        txType: "Buy",
        symbol: symbol,
        amount: quantity,
        timestamp: block.timestamp
    }));

    emit CoinBought(userAddr, symbol, quantity, totalCost);
}


    function sellCoinFor(address userAddr, string memory symbol, uint256 price, uint256 quantity) external onlyAdmin {
    User storage user = users[userAddr];
    require(user.holdings[symbol] >= quantity, "Not enough coin to sell");

    // Decrease holdings and increase USD balance
    user.holdings[symbol] -= quantity;
    user.usdBalance += price * quantity;

    // If user sold all coins, remove from portfolio
    if (user.holdings[symbol] == 0 && user.hasCoin[symbol]) {
        user.hasCoin[symbol] = False;
        // Remove symbol from portfolio array
        for (uint i = 0; i < user.portfolio.length; i++) {
            if (keccak256(bytes(user.portfolio[i])) == keccak256(bytes(symbol))) {
                user.portfolio[i] = user.portfolio[user.portfolio.length - 1];
                user.portfolio.pop();
                break;
            }
        }
    }

    // Record transaction
    user.transactions.push(Transaction({
        txType: "Sell",
        symbol: symbol,
        amount: quantity,
        timestamp: block.timestamp
    }));

    emit CoinSold(userAddr, symbol, quantity);
}
    // ======= View =======
    function getUSDBalance(address user) external view returns (uint256) {
        return users[user].usdBalance;
    }

    function getBorrowedAmount(address user) external view returns (uint256) {
        return users[user].borrowedAmount;
    }

    function getCoinBalance(address user, string memory symbol) external view returns (uint256) {
        return users[user].holdings[symbol];
    }

    function getUserHoldings(address user) external view returns (string[] memory, uint256[] memory) {
    User storage u = users[user];
    uint256 len = u.portfolio.length;

    string[] memory coins = new string[](len);
    uint256[] memory balances = new uint256[](len);

    for (uint256 i = 0; i < len; i++) {
        string memory coin = u.portfolio[i];
        coins[i] = coin;
        balances[i] = u.holdings[coin];
    }

    return (coins, balances);
}

    function getTransactionHistory() external view onlyRegistered returns (Transaction[] memory) {
return userTransactions[msg.sender];
}

    function getRegisteredUsers() external view onlyAdmin returns (address[] memory) {
        return userList;
    }

    function getAllPendingRequests() external view onlyAdmin returns (address[] memory, uint256[] memory) {
        uint256 count = 0;
        for (uint i = 0; i < userList.length; i++) {
            if (pendingRequests[userList[i]] > 0) count++;
        }

        address[] memory pendingUsers = new address[](count);
        uint256[] memory amounts = new uint256[](count);
        uint256 index = 0;

        for (uint i = 0; i < userList.length; i++) {
            address user = userList[i];
            uint256 amount = pendingRequests[user];
            if (amount > 0) {
                pendingUsers[index] = user;
                amounts[index] = amount;
                index++;
            }
        }

        return (pendingUsers, amounts);
    }

    // ======= Reject Funds =======
    function rejectFunds(address user) external onlyAdmin {
        require(pendingRequests[user] > 0, "No pending request");
        pendingRequests[user] = 0;
        emit FundsRejected(user);
    }

    // ======= Watchlist =======
    function addToWatchlist(string memory symbol) external onlyRegistered {
        User storage user = users[msg.sender];
        if (!user.isInWatchlist[symbol]) {
            user.watchlist.push(symbol);
            user.isInWatchlist[symbol] = true;
            emit WatchlistUpdated(msg.sender, symbol, true);
        }
    }

    function removeFromWatchlist(string memory symbol) external onlyRegistered {
        User storage user = users[msg.sender];
        require(user.isInWatchlist[symbol], "Not in watchlist");

        uint256 len = user.watchlist.length;
        for (uint256 i = 0; i < len; i++) {
            if (keccak256(bytes(user.watchlist[i])) == keccak256(bytes(symbol))) {
                user.watchlist[i] = user.watchlist[len - 1];
                user.watchlist.pop();
                break;
            }
        }

        user.isInWatchlist[symbol] = False;
        emit WatchlistUpdated(msg.sender, symbol, False);
    }
}
