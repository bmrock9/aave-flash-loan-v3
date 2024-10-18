# Aave Flash Loan V3 Arbitrage Project

This repository contains an implementation of flash loans using Aave V3, along with arbitrage strategies involving Uniswap and Sushiswap. The project demonstrates how to use flash loans to profit from price differences between different decentralized exchanges.

## Features
- **Flash Loan Execution**: Borrow assets from Aave without collateral.
- **Arbitrage Opportunities**: Automatically detect and exploit price differences between Uniswap V2, Uniswap V3, and Sushiswap.
- **Automation Scripts**: Includes various scripts for monitoring prices, deploying contracts, and interacting with the blockchain.
- **Written in Solidity**: The core logic is written in Solidity, leveraging smart contracts for decentralized arbitrage.

## How to Use
1. Clone this repository.
2. Install the dependencies with `yarn install`.
3. Deploy the contracts using Hardhat or any compatible framework.
4. Execute arbitrage strategies by running the included scripts.

## Prerequisites
- Node.js
- Yarn
- Hardhat or Truffle
- Aave V3 Testnet API Keys
- Uniswap and Sushiswap API/SDK

## Setup
1. Clone the repository:

   ```bash
   git clone https://github.com/bmrock9/aave-flash-loan-v3.git
Install the dependencies:

bash
Copy code
yarn install
Compile the contracts:

bash
Copy code
yarn compile
Deploy the contracts:

bash
Copy code
yarn hardhat run scripts/deploy.js --network sepolia
Execute Arbitrage:

bash
Copy code
yarn hardhat run scripts/executeArbitrage.js --network sepolia

Buy Me a Coffee ☕
If you find this project useful or learned something new, please consider buying me a coffee to support future development!
https://buymeacoffee.com/bmrock9
