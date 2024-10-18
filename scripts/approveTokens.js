async function approveTokens() {
    const flashLoanArbitrageAddress = "0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE"; // FlashLoan contract address

    const flashLoanArbitrage = await ethers.getContractAt("FlashLoanArbitrage", flashLoanArbitrageAddress);

    // Call the approval function in the contract
    console.log("Approving tokens for Uniswap V3, kyberswap, and SushiSwap...");
    const tx = await flashLoanArbitrage.approveTokensForSpending();
    await tx.wait();
    console.log("Tokens approved successfully.");
}

approveTokens().catch((error) => {
    console.error(error);
    process.exit(1);
});
