// SPDX-License-Identifier: MIT

pragma solidity ^0.8.19;

contract FortressPayment {

    // Access Control

    mapping(address => bool) public admins;

    mapping(address => bool) public users;

    mapping(address => bool) public auditors;

    struct Transaction {

        uint256 id;

        address sender;

        address receiver;

        uint256 amount;

        bytes32 encryptedMetadata;

        uint256 timestamp;

        bool isFlagged;

        string status;

    }


    Transaction[] public allTransactions;
    mapping(address => uint256[]) public userTransactions;
    
    // Events for Audit Trail

    event TransactionCreated(uint256 indexed txId, address indexed sender, address indexed receiver, uint256 amount, uint256 timestamp);

    event TransactionFlagged(uint256 indexed txId, string reason);

    event AdminAdded(address indexed admin);

    event AuditorAdded(address indexed auditor);

    event UserRegistered(address indexed user);

    event ContractPaused(address indexed by, uint256 timestamp);

    event ContractUnpaused(address indexed by, uint256 timestamp);

    

    bool public paused = false;

    

    constructor() {

        admins[msg.sender] = true;

        users[msg.sender] = true;

        emit AdminAdded(msg.sender);

    }

    

    modifier onlyAdmin() {

        require(admins[msg.sender], "Admin only");

        _;

    }

    modifier onlyAuditor() {

        require(auditors[msg.sender] || admins[msg.sender], "Auditor only");

        _;

    }


    modifier whenNotPaused() {

        require(!paused, "Contract paused");

        _;

    }

    
    // User Registration

    function registerUser() public {

        require(!users[msg.sender], "Already registered");

        users[msg.sender] = true;

        emit UserRegistered(msg.sender);

    }

    

    // Create Secure Transaction

    function createTransaction(address _receiver, string memory _metadata) 

        public 

        payable 

        whenNotPaused 

    {

        require(msg.value > 0, "Amount required");

        require(_receiver != address(0), "Invalid receiver");

        require(users[msg.sender], "Register first");

        

        bytes32 encrypted = keccak256(abi.encodePacked(_metadata, msg.sender, block.timestamp));

        

        uint256 txId = allTransactions.length;

        

        allTransactions.push(Transaction({

            id: txId,

            sender: msg.sender,

            receiver: _receiver,

            amount: msg.value,

            encryptedMetadata: encrypted,

            timestamp: block.timestamp,

            isFlagged: false,

            status: "completed"

        }));

        

        userTransactions[msg.sender].push(txId);

        userTransactions[_receiver].push(txId);
        
        payable(_receiver).transfer(msg.value);
        emit TransactionCreated(txId, msg.sender, _receiver, msg.value, block.timestamp);
    }
    // Admin Functions

    function addAdmin(address _admin) public onlyAdmin {
        admins[_admin] = true;
        users[_admin] = true;
        emit AdminAdded(_admin);
    }

    function addAuditor(address _auditor) public onlyAdmin {
        auditors[_auditor] = true;
        emit AuditorAdded(_auditor);
    }

    function flagTransaction(uint256 _txId, string memory _reason) public onlyAdmin {

        require(_txId < allTransactions.length, "Invalid ID");

        allTransactions[_txId].isFlagged = true;

        allTransactions[_txId].status = "flagged";

        emit TransactionFlagged(_txId, _reason);

    }

    function pauseContract() public onlyAdmin {
        paused = true;
        emit ContractPaused(msg.sender, block.timestamp);
    }

    function unpauseContract() public onlyAdmin {
        paused = false;
        emit ContractUnpaused(msg.sender, block.timestamp);
    }
    
    // View Functions
    function getTransaction(uint256 _txId) public view returns (Transaction memory) {

        require(_txId < allTransactions.length, "Invalid ID");

        return allTransactions[_txId];

    }

    

    function getUserTransactions(address _user) public view returns (uint256[] memory) {

        return userTransactions[_user];

    }

    

    function getTotalTransactions() public view returns (uint256) {

        return allTransactions.length;

    }

    

    function getRecentTransactions(uint256 _count) public view returns (Transaction[] memory) {

        uint256 total = allTransactions.length;

        if (total == 0) {

            return new Transaction[](0);

        }

        

        uint256 count = _count > total ? total : _count;

        Transaction[] memory recent = new Transaction[](count);

        

        for (uint256 i = 0; i < count; i++) {

            recent[i] = allTransactions[total - count + i];

        }

        

        return recent;

    }

    

    function checkTransactionAnomaly(address _sender) public view returns (bool isAnomaly, string memory reason) {

        uint256[] memory txIds = userTransactions[_sender];

        

        if (txIds.length == 0) return (false, "No transactions");

        

        uint256 recentCount = 0;

        uint256 fiveMinAgo = block.timestamp - 300;

        

        for (uint256 i = 0; i < txIds.length; i++) {

            if (allTransactions[txIds[i]].timestamp > fiveMinAgo) {

                recentCount++;

            }

        }

        if (recentCount > 3) return (true, "Rapid transactions");
        

        for (uint256 i = 0; i < txIds.length; i++) {

            if (allTransactions[txIds[i]].amount > 1 ether) {

                return (true, "High value transaction");

            }

        }

        return (false, "No anomalies");

    }

    // Auditor Functions
    function getFlaggedTransactions() public view onlyAuditor returns (Transaction[] memory) {
        uint256 flaggedCount = 0;
        
        for (uint256 i = 0; i < allTransactions.length; i++) {
            if (allTransactions[i].isFlagged) {
                flaggedCount++;
            }
        }
        
        Transaction[] memory flagged = new Transaction[](flaggedCount);
        uint256 index = 0;
        
        for (uint256 i = 0; i < allTransactions.length; i++) {
            if (allTransactions[i].isFlagged) {
                flagged[index] = allTransactions[i];
                index++;
            }
        }
        
        return flagged;
    }

}