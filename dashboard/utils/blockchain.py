# utils/blockchain.py

from web3 import Web3
from django.conf import settings

# Web3 setup
web3 = Web3(Web3.HTTPProvider(settings.WEB3_PROVIDER))

# 🧠 Manually paste your ABI here
contract_abi = [
    {
        "inputs": [],
        "name": "register",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "uint256", "name": "amount", "type": "uint256"}
        ],
        "name": "requestVirtualUSD",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [
            {"internalType": "address", "name": "user", "type": "address"}
        ],
        "name": "approveFunds",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getWatchlist",
        "outputs": [{"internalType": "string[]", "name": "", "type": "string[]"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "symbol", "type": "string"}],
        "name": "addToWatchlist",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"internalType": "string", "name": "symbol", "type": "string"}],
        "name": "removeFromWatchlist",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "getUSDBalance",
        "outputs": [{"internalType": "uint256", "name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]

# 🔗 Setup the contract
contract = web3.eth.contract(
    address=Web3.to_checksum_address(settings.CONTRACT_ADDRESS),
    abi=contract_abi
)
