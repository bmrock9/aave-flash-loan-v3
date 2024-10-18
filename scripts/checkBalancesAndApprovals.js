const { ethers } = require("hardhat");

async function checkBalances(contractAddress) {
    // Token addresses on Ethereum
    const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    // Fetch contract instances
    const weth = await ethers.getContractAt("IERC20", wethAddress);
    const wbtc = await ethers.getContractAt("IERC20", wbtcAddress);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress);

    // Fetch token balances
    const wethBalance = await weth.balanceOf(contractAddress);
    const wbtcBalance = await wbtc.balanceOf(contractAddress);
    const usdcBalance = await usdc.balanceOf(contractAddress);

    console.log("WETH Balance:", ethers.utils.formatEther(wethBalance));
    console.log("WBTC Balance:", ethers.utils.formatUnits(wbtcBalance, 8)); // WBTC has 8 decimals
    console.log("USDC Balance:", ethers.utils.formatUnits(usdcBalance, 6)); // USDC has 6 decimals
}

async function checkApprovals(contractAddress) {
    const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
    const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
    const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

    const uniswapV3RouterAddress = "0xE592427A0AEce92De3Edee1F18E0157C05861564"; // Uniswap V3
    const kyberRouterAddress = "0x1c87257F5e8609940Bc751a07BB085Bb7f8cDBE6"; // kyberswap Router
    const sushiSwapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"; // SushiSwap Router

    // Fetch contract instances
    const weth = await ethers.getContractAt("IERC20", wethAddress);
    const wbtc = await ethers.getContractAt("IERC20", wbtcAddress);
    const usdc = await ethers.getContractAt("IERC20", usdcAddress);

    // Check token allowances for each router
    const wethAllowance = await weth.allowance(contractAddress, uniswapV3RouterAddress);
    const wbtcAllowance = await wbtc.allowance(contractAddress, kyberRouterAddress);
    const usdcAllowance = await usdc.allowance(contractAddress, sushiSwapRouterAddress);

    console.log("WETH Allowance for Uniswap V3:", ethers.utils.formatEther(wethAllowance));
    console.log("WBTC Allowance for kyberswap:", ethers.utils.formatUnits(wbtcAllowance, 8));
    console.log("USDC Allowance for SushiSwap:", ethers.utils.formatUnits(usdcAllowance, 6));
}

async function main() {
    const flashLoanArbitrageAddress = "0xfaA7b3a4b5c3f54a934a2e33D34C7bC099f96CCE";

    console.log("Checking token balances...");
    await checkBalances(flashLoanArbitrageAddress);

    console.log("Checking token approvals...");
    await checkApprovals(flashLoanArbitrageAddress);
}

main().catch((error) => {
    console.error(error);
    process.exit(1);
});
