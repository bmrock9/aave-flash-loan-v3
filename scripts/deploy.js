// scripts/deploy.js
async function main() {
  const [deployer] = await ethers.getSigners();

  console.log("Deploying contracts with the account:", deployer.address);

  const FlashLoanArbitrage = await ethers.getContractFactory("FlashLoanArbitrage");
  const poolAddressProvider = "0x2f39d218133AFaB8F2B819B1066c7E434Ad94E9e"; // Replace with correct Aave V3 Pool Address Provider for your network
  const flashLoanArbitrage = await FlashLoanArbitrage.deploy(poolAddressProvider);

  await flashLoanArbitrage.deployed();

  console.log("FlashLoanArbitrage deployed to:", flashLoanArbitrage.address);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
