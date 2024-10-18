// scripts/executeArbitrage.js
const { ethers } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();

  // Ensure you have the correct deployed contract address here
  const flashLoanArbitrageAddress = "0xdccF554708B72d0fe9500cBfc1595cDBE3d66e5a"; // Replace with your deployed contract address

  // Log the deployer's address
  console.log("Executing with deployer address:", deployer.address);

  try {
    // Get the FlashLoanArbitrage contract instance
    const FlashLoanArbitrage = await ethers.getContractAt("FlashLoanArbitrage", flashLoanArbitrageAddress);
    console.log("FlashLoanArbitrage contract instance created successfully.");

    // Verify the contract instance
    console.log("FlashLoanArbitrage deployed at:", FlashLoanArbitrage.address);

    // Define the WETH token address for the flash loan
    const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"; // Replace with the correct WETH address on your network

    // Amount to borrow for flash loan
    const flashLoanAmount = ethers.utils.parseEther("1"); // Example: 1 WETH

    // Request the flash loan and execute arbitrage
    console.log("Requesting flash loan and performing arbitrage...");
    await FlashLoanArbitrage.connect(deployer).requestFlashLoan(wethAddress, flashLoanAmount);

    console.log("Arbitrage executed successfully.");
  } catch (error) {
    console.error("Error executing arbitrage:", error);
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
