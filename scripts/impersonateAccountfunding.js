async function impersonateAndFund() {
    const [owner] = await ethers.getSigners();
    const contractAddress = "0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE";

    // Addresses of accounts with sufficient token balances on mainnet
    const wethHolder = "0x894D55bE079E7e19fe526Ac22B0786b7afE18E7e";  // Example WETH holder
    const wbtcHolder = "0xbE6d2444a717767544a8b0Ba77833AA6519D81cD";  // Example WBTC holder
    const usdcHolder = "0xD6153F5af5679a75cC85D8974463545181f48772";  // Example USDC holder

    // Token addresses
    const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    // Fetch contract instances
    const weth = await ethers.getContractAt("IERC20", wethAddress);
    const wbtc = await ethers.getContractAt("IERC20", wbtcAddress);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress);

    // Impersonate accounts and send tokens to your contract
    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [wethHolder],
    });
    const wethSigner = await ethers.getSigner(wethHolder);
    await weth.connect(wethSigner).transfer(contractAddress, ethers.utils.parseEther("100"));  // Transfer 100 WETH

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [wbtcHolder],
    });
    const wbtcSigner = await ethers.getSigner(wbtcHolder);
    await wbtc.connect(wbtcSigner).transfer(contractAddress, ethers.utils.parseUnits("10", 8));  // Transfer 10 WBTC

    await hre.network.provider.request({
        method: "hardhat_impersonateAccount",
        params: [usdcHolder],
    });
    const usdcSigner = await ethers.getSigner(usdcHolder);
    await usdc.connect(usdcSigner).transfer(contractAddress, ethers.utils.parseUnits("1000000", 6));  // Transfer 1,000,000 USDC

    console.log("Funding completed.");
}

impersonateAndFund().catch((error) => {
    console.error(error);
    process.exit(1);
});
