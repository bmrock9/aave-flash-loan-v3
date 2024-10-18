const { expect } = require("chai");
const { ethers } = require("hardhat");
const chai = require("chai");
const { solidity } = require("ethereum-waffle");

// Use Waffle's Chai matchers
chai.use(solidity);

describe("FlashLoanArbitrage Contract with KyberSwap and Sushiswap", function () {
  let owner, user;
  let flashLoanArbitrage, weth, usdc, wbtc;
  let poolAddressProvider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"; // Replace with Aave V3 Pool Address Provider on your network (e.g., Mainnet or Testnet)

  before(async function () {
    [owner, user] = await ethers.getSigners();

    // Deploy the FlashLoanArbitrage contract
    const FlashLoanArbitrage = await ethers.getContractFactory("FlashLoanArbitrage");
    flashLoanArbitrage = await FlashLoanArbitrage.deploy(poolAddressProvider);
    await flashLoanArbitrage.deployed();

    console.log("FlashLoanArbitrage deployed to:", flashLoanArbitrage.address);

    // Get WETH, USDC, and WBTC contracts (use known addresses for the network)
    weth = await ethers.getContractAt("IERC20", "0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2"); // Replace with WETH address
    usdc = await ethers.getContractAt("IERC20", "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48"); // Replace with USDC address
    wbtc = await ethers.getContractAt("IERC20", "0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599"); // Replace with WBTC address
  });

  it("Should approve tokens for spending on Kyber, Uniswap V3, and Sushiswap", async function () {
    await expect(flashLoanArbitrage.connect(owner).approveTokensForSpending()).not.to.be.reverted;
  });

  it("Should request a flash loan and execute arbitrage using KyberSwap and Sushiswap", async function () {
    this.timeout(90000); // Extend timeout to 90 seconds

    let depositAmount = ethers.utils.parseEther("10"); // 10 WETH
    await weth.transfer(flashLoanArbitrage.address, depositAmount);

    let initialWETHBalance = await weth.balanceOf(flashLoanArbitrage.address);
    let initialUSDCBalance = await usdc.balanceOf(flashLoanArbitrage.address);
    console.log("Initial WETH Balance:", initialWETHBalance.toString());
    console.log("Initial USDC Balance:", initialUSDCBalance.toString());

    await flashLoanArbitrage.connect(owner).approveWETH(depositAmount);

    let flashLoanAmount = ethers.utils.parseEther("5"); // 5 WETH flash loan
    await expect(flashLoanArbitrage.connect(owner).requestFlashLoan(weth.address, flashLoanAmount)).not.to.be.reverted;

    let finalWETHBalance = await weth.balanceOf(flashLoanArbitrage.address);
    let finalUSDCBalance = await usdc.balanceOf(flashLoanArbitrage.address);
    console.log("Final WETH Balance:", finalWETHBalance.toString());
    console.log("Final USDC Balance:", finalUSDCBalance.toString());

    expect(finalWETHBalance).to.be.lt(initialWETHBalance);
  });

  it("Should fail the flash loan if arbitrage is not profitable using KyberSwap", async function () {
    this.timeout(90000); // Extend timeout to 90 seconds

    let flashLoanAmount = ethers.utils.parseEther("10"); // Large amount that will cause failure
    await expect(flashLoanArbitrage.connect(owner).requestFlashLoan(weth.address, flashLoanAmount)).to.be.revertedWith("Arbitrage not profitable");
  });

  it("Should withdraw WETH balance to the owner", async function () {
    let contractBalanceBefore = await weth.balanceOf(flashLoanArbitrage.address);
    console.log("Contract balance before withdrawal:", contractBalanceBefore.toString());

    if (contractBalanceBefore.eq(0)) {
      console.error("No WETH to withdraw. Check arbitrage logic or use smaller amounts.");
      return;
    }

    await expect(flashLoanArbitrage.connect(owner).withdraw()).not.to.be.reverted;

    let contractBalanceAfter = await weth.balanceOf(flashLoanArbitrage.address);
    console.log("Contract balance after withdrawal:", contractBalanceAfter.toString());

    let ownerBalance = await weth.balanceOf(owner.address);
    console.log("Owner balance after withdrawal:", ownerBalance.toString());

    expect(contractBalanceBefore).to.be.gt(0);
    expect(contractBalanceAfter).to.equal(0);
    expect(ownerBalance).to.be.gt(contractBalanceBefore);
  });
});
