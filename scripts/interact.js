const { ethers } = require("hardhat");

// Delay function to wait between each iteration (e.g., 15 seconds)
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeArbitrage() {
    // Contract address for FlashLoanArbitrage deployed on Mainnet
    const flashLoanArbitrageAddress = "0xdccF554708B72d0fe9500cBfc1595cDBE3d66e5a";  // Replace with your deployed contract address
    const flashLoanArbitrage = await ethers.getContractAt("FlashLoanArbitrage", flashLoanArbitrageAddress);

    // Set the initial amount for the flash loan in WETH (e.g., 100 WETH)
    const wethAmount = ethers.utils.parseEther("100");

    try {
        console.log("Arbitrage opportunity found offline! Requesting flash loan...");

        // Request the flash loan and perform the swaps
        const tx = await flashLoanArbitrage.requestFlashLoan(
            ethers.constants.AddressZero,  // Flash loan of WETH from Aave
            wethAmount,  // Amount of WETH to borrow (e.g., 100 WETH)
            {
                gasLimit: 3000000  // Adjust gas limit if necessary
            }
        );

        await tx.wait();  // Wait for the transaction to be confirmed
        console.log("Flash loan executed successfully.");

    } catch (error) {
        console.error("Error while executing arbitrage:", error);
    }
}

executeArbitrage().catch((error) => {
    console.error(error);
    process.exit(1);
});
