// SPDX-License-Identifier: MIT
pragma solidity 0.8.10;

import {FlashLoanSimpleReceiverBase} from "@aave/core-v3/contracts/flashloan/base/FlashLoanSimpleReceiverBase.sol";
import {IPoolAddressesProvider} from "@aave/core-v3/contracts/interfaces/IPoolAddressesProvider.sol";
import {IERC20} from "@aave/core-v3/contracts/dependencies/openzeppelin/contracts/IERC20.sol";
import {ISwapRouter} from "@uniswap/v3-periphery/contracts/interfaces/ISwapRouter.sol";
import {IUniswapV2Router02} from "@uniswap/v2-periphery/contracts/interfaces/IUniswapV2Router02.sol";
import "hardhat/console.sol";  // Import console for debugging

interface IKyberNetworkProxy {
    function getExpectedRate(IERC20 src, IERC20 dest, uint srcQty) external view returns (uint expectedRate, uint slippageRate);
    function swapTokenToToken(IERC20 src, uint srcAmount, IERC20 dest, uint minConversionRate) external returns (uint destAmount);
}

contract FlashLoanArbitrage is FlashLoanSimpleReceiverBase {
    address payable owner;
    IERC20 private wbtc;
    IERC20 private usdc;
    IERC20 private weth;
    ISwapRouter private uniswapV3Router;
    IKyberNetworkProxy private kyberNetworkProxy;
    IUniswapV2Router02 private sushiSwapRouter;

    // Token addresses
    address private immutable wbtcAddress = 0x2260FAC5E5542a773Aa44fBCfeDf7C193bc2C599;
    address private immutable usdcAddress = 0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48;
    address private immutable wethAddress = 0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2;

    // Router addresses
    address private immutable uniswapV3RouterAddress = 0xE592427A0AEce92De3Edee1F18E0157C05861564;
    address private immutable kyberNetworkProxyAddress = 0x818E6FECD516Ecc3849DAf6845e3EC868087B755;
    address private immutable sushiSwapRouterAddress = 0xd9e1cE17f2641f24aE83637ab66a2cca9C378B9F; // SushiSwap Router

    // Events
    event FlashLoanRequested(address indexed requester, uint256 amount);
    event TokensSwapped(string platform, uint256 amountIn, uint256 amountOut);
    event FlashLoanRepaid(uint256 totalDebt);

    constructor(address _addressProvider) FlashLoanSimpleReceiverBase(IPoolAddressesProvider(_addressProvider)) {
        owner = payable(msg.sender);
        wbtc = IERC20(wbtcAddress);
        usdc = IERC20(usdcAddress);
        weth = IERC20(wethAddress);
        uniswapV3Router = ISwapRouter(uniswapV3RouterAddress);
        kyberNetworkProxy = IKyberNetworkProxy(kyberNetworkProxyAddress);
        sushiSwapRouter = IUniswapV2Router02(sushiSwapRouterAddress);
    }

    // Function to request a flash loan
    function requestFlashLoan(address _token, uint256 _amount) public {
        require(msg.sender == owner, "Only owner can request a flash loan");

        address receiverAddress = address(this);  // The contract itself is the receiver
        address asset = _token;  // The token to be borrowed (e.g., WETH)
        uint256 amount = _amount;  // The amount of the asset to borrow
        bytes memory params = "";  // Arbitrary data (can be empty)
        uint16 referralCode = 0;  // Optional referral code

        console.log("Flash loan requested by:", msg.sender);
        console.log("Amount requested:", _amount);

        // Request the flash loan from Aave
        POOL.flashLoanSimple(
            receiverAddress,
            asset,
            amount,
            params,
            referralCode
        );
    }

    // This function is called by Aave after the flash loan is approved
    function executeOperation(
        address asset,
        uint256 amount,
        uint256 premium,
        address initiator,
        bytes calldata params
    ) external override returns (bool) {
        console.log("Flash loan received for asset:", asset);
        console.log("Amount received:", amount);

        // Approve the necessary tokens for swapping
        weth.approve(address(uniswapV3Router), amount);
        wbtc.approve(address(kyberNetworkProxy), type(uint256).max);
        usdc.approve(address(sushiSwapRouter), type(uint256).max);

        // Step 1: Swap WETH to WBTC on Uniswap V3
        console.log("Starting Uniswap V3 swap...");
        uint256 wbtcAmount = swapOnUniswapV3(amount);
        console.log("Uniswap V3 swap successful, WBTC received:", wbtcAmount);
        emit TokensSwapped("Uniswap V3", amount, wbtcAmount);

        // Step 2: Swap WBTC to USDC on Kyber Network
        console.log("Starting Kyber Network swap...");
        uint256 usdcAmount = swapOnKyber(wbtcAmount, wbtc, usdc);
        console.log("Kyber Network swap successful, USDC received:", usdcAmount);
        emit TokensSwapped("Kyber Network", wbtcAmount, usdcAmount);

        // Step 3: Swap USDC back to WETH on Sushiswap
        console.log("Starting Sushiswap swap...");
        uint256 wethAmount = swapOnSushiSwap(usdcAmount);
        console.log("Sushiswap swap successful, WETH received:", wethAmount);
        emit TokensSwapped("Sushiswap", usdcAmount, wethAmount);

        // Step 4: Repay flash loan (WETH + premium)
        uint256 totalDebt = amount + premium;
        console.log("Total debt:", totalDebt);
        require(wethAmount >= totalDebt, "Arbitrage not profitable");

        // Repay the loan
        weth.approve(address(POOL), totalDebt);
        console.log("Flash loan repaid successfully");
        emit FlashLoanRepaid(totalDebt);

        return true;
    }

    // Step 1: Swap WETH to WBTC on Uniswap V3
    function swapOnUniswapV3(uint256 amountIn) internal returns (uint256) {
        ISwapRouter.ExactInputSingleParams memory params = ISwapRouter.ExactInputSingleParams({
            tokenIn: wethAddress,
            tokenOut: wbtcAddress,
            fee: 3000,
            recipient: address(this),
            deadline: block.timestamp,
            amountIn: amountIn,
            amountOutMinimum: 0,  // Accept any amount of WBTC
            sqrtPriceLimitX96: 0
        });

        uint256 amountOut = uniswapV3Router.exactInputSingle(params);
        console.log("Uniswap V3 swap: %s WETH to %s WBTC", amountIn, amountOut);
        return amountOut;
    }

    // Step 3: Swap USDC back to WETH on Sushiswap
    function swapOnSushiSwap(uint256 amountIn) internal returns (uint256) {
        address[] memory path = new address[](2);
        path[0] = usdcAddress;
        path[1] = wethAddress;

        uint256[] memory amounts = sushiSwapRouter.swapExactTokensForTokens(
            amountIn,
            0,  // Accept any amount of WETH
            path,
            address(this),
            block.timestamp
        );

        console.log("SushiSwap swap: %s USDC to %s WETH", amountIn, amounts[1]);
        return amounts[1];
    }

    // Step 2: Swap WBTC to USDC on Kyber Network
    function swapOnKyber(uint256 amountIn, IERC20 srcToken, IERC20 destToken) internal returns (uint256) {
        // Get expected rate from Kyber
        (uint expectedRate, ) = kyberNetworkProxy.getExpectedRate(srcToken, destToken, amountIn);

        // Perform the swap on Kyber
        uint256 amountOut = kyberNetworkProxy.swapTokenToToken(srcToken, amountIn, destToken, expectedRate);
        console.log("Kyber Network swap: %s srcToken to %s destToken", amountIn, amountOut);
        return amountOut;
    }

    // Function to withdraw WETH to owner
    function withdraw() external {
        require(msg.sender == owner, "Only owner can withdraw");
        uint256 balance = weth.balanceOf(address(this));
        console.log("Withdrawing WETH:", balance);
        weth.transfer(owner, balance);
    }

    // Receive WETH
    receive() external payable {}

    // Approve WETH for transfer
    function approveWETH(uint256 amount) public {
        weth.approve(address(POOL), amount);
    }

    // Approve tokens for swapping on Uniswap V3, Kyber, and Sushiswap
    function approveTokensForSpending() external {
        require(msg.sender == owner, "Only owner can approve tokens");

        // Approve WETH for Uniswap V3
        weth.approve(uniswapV3RouterAddress, type(uint256).max);

        // Approve WBTC for Kyber Network
        wbtc.approve(kyberNetworkProxyAddress, type(uint256).max);

        // Approve USDC for Sushiswap
        usdc.approve(sushiSwapRouterAddress, type(uint256).max);
    }
}