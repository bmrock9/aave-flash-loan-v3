// scripts/monitorPrices.js
const { ethers } = require("hardhat");
const IQuoterABI = require("@uniswap/v3-periphery/artifacts/contracts/interfaces/IQuoter.sol/IQuoter.json").abi;

async function main() {
  const uniswapV3QuoterAddress = "0xb27308f9F90D607463bb33eA1BeBb41C27CE5AB6"; // Uniswap V3 Quoter
  const kyberNetworkProxyAddress = "0x818E6FECD516Ecc3849DAf6845e3EC868087B755"; // Kyber Proxy
  const sushiswapRouterAddress = "0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F"; // SushiSwap Router

  const wethAddress = "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2";
  const wbtcAddress = "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599";
  const usdcAddress = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"; // Ensure this is defined and accessible

  // Define the amount for simulation
  const amountInWETH = ethers.utils.parseEther("1"); // 1 WETH

  try {
    // Fetch prices from Uniswap V3, Kyber, and Sushiswap
    const [wbtcFromUniswap, usdcFromKyber, wethFromSushiswap] = await Promise.all([
      getAmountOutUniswapV3(amountInWETH, wethAddress, wbtcAddress, uniswapV3QuoterAddress),
      getAmountOutKyber(amountInWETH, wbtcAddress, usdcAddress, kyberNetworkProxyAddress),
      getAmountOutSushiswap(amountInWETH, wethAddress, usdcAddress, wethAddress, sushiswapRouterAddress) // Correct parameters
    ]);

    console.log("1 WETH can be swapped for:");
    console.log(`- Uniswap V3 (WETH -> WBTC): ${ethers.utils.formatUnits(wbtcFromUniswap, 8)} WBTC`);
    console.log(`- Kyber (WBTC -> USDC): ${ethers.utils.formatUnits(usdcFromKyber, 6)} USDC`);
    console.log(`- Sushiswap (USDC -> WETH): ${ethers.utils.formatEther(wethFromSushiswap)} WETH`);

    // Calculate expected profit
    const profit = wethFromSushiswap.sub(amountInWETH);
    console.log(`Expected Profit: ${ethers.utils.formatEther(profit)} WETH`);

    // If the profit is greater than a certain threshold, execute the arbitrage
    const profitThreshold = ethers.utils.parseEther("0.01"); // 0.01 WETH
    if (profit.gt(profitThreshold)) {
      console.log("Arbitrage opportunity found! Executing trade...");
      // Call the execution script here or trigger the smart contract to execute the arbitrage
    } else {
      console.log("No profitable arbitrage opportunity found.");
    }
  } catch (error) {
    console.error("Error fetching prices or calculating arbitrage:", error);
  }
}

// Updated function with IQuoter ABI
async function getAmountOutUniswapV3(amountIn, tokenIn, tokenOut, quoterAddress) {
  const quoter = new ethers.Contract(quoterAddress, IQuoterABI, ethers.provider);
  const amountOut = await quoter.callStatic.quoteExactInputSingle(
    tokenIn,
    tokenOut,
    3000, // Fee tier (0.3%)
    amountIn,
    0
  );
  console.log(`Uniswap V3 (WETH -> WBTC) amount out: ${amountOut.toString()}`);
  return amountOut;
}

// Corrected Kyber Function with Proper Rate Handling
async function getAmountOutKyber(amountIn, tokenIn, tokenOut, proxyAddress) {
  const kyberProxy = await ethers.getContractAt("IKyberNetworkProxy", proxyAddress);
  const { expectedRate } = await kyberProxy.getExpectedRate(tokenIn, tokenOut, amountIn);

  console.log(`Kyber expected rate (raw): ${expectedRate.toString()}`);
  console.log(`AmountIn (WBTC in smallest unit): ${amountIn.toString()}`);

  // Corrected rate handling: Divide expectedRate by 10^18
  const normalizedRate = expectedRate.div(ethers.BigNumber.from(10).pow(18));
  console.log(`Normalized rate (expectedRate / 10^18): ${normalizedRate.toString()}`);

  const amountOut = amountIn.mul(normalizedRate);
  console.log(`Kyber (WBTC -> USDC) amount out after correcting: ${amountOut.toString()}`);

  return amountOut;
}

// Corrected Sushiswap Function with Proper Decimal Handling
async function getAmountOutSushiswap(amountIn, tokenIn, usdcToken, tokenOut, routerAddress) {
  const sushiRouter = await ethers.getContractAt("IUniswapV2Router02", routerAddress);

  // Convert WETH amount to USDC using WETH -> USDC rate
  const wethToUSDC = await sushiRouter.getAmountsOut(amountIn, [tokenIn, usdcToken]);
  const amountInUSDC = wethToUSDC[1]; // Amount in USDC from WETH conversion

  console.log(`Sushiswap swap input amount (USDC): ${ethers.utils.formatUnits(amountInUSDC, 6)}`);
  console.log(`Tokens: ${tokenIn} -> ${tokenOut}`);

  // Now perform USDC -> WETH swap
  const amountsOut = await sushiRouter.getAmountsOut(amountInUSDC, [usdcToken, tokenOut]);
  console.log(`Sushiswap (USDC -> WETH) amounts out: ${amountsOut[1].toString()}`);
  console.log(`Formatted WETH output: ${ethers.utils.formatEther(amountsOut[1])} WETH`);

  return amountsOut[1]; // Return the amount of WETH received
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error("Error in main execution:", error);
    process.exit(1);
  });
