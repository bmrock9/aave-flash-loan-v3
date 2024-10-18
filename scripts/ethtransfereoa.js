async function fundImpersonatedAccounts() {
    const [funder] = await ethers.getSigners();  // Use a funded Hardhat account

    // Define the addresses of the impersonated accounts
    const wethHolder = "0x894D55bE079E7e19fe526Ac22B0786b7afE18E7e";
    const wbtcHolder = "0xbE6d2444a717767544a8b0Ba77833AA6519D81cD";
    const usdcHolder = "0xD6153F5af5679a75cC85D8974463545181f48772";

    // Send 1 ETH to each impersonated account for gas fees
    const tx1 = await funder.sendTransaction({
        to: wethHolder,
        value: ethers.utils.parseEther("1.0"),  // Send 1 ETH
    });

    const tx2 = await funder.sendTransaction({
        to: wbtcHolder,
        value: ethers.utils.parseEther("1.0"),
    });

    const tx3 = await funder.sendTransaction({
        to: usdcHolder,
        value: ethers.utils.parseEther("1.0"),
    });

    await Promise.all([tx1.wait(), tx2.wait(), tx3.wait()]);

    console.log("Impersonated accounts funded with ETH.");
}

fundImpersonatedAccounts().catch((error) => {
    console.error(error);
    process.exit(1);
});