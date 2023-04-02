import hre, { ethers, upgrades } from "hardhat";

async function upgradeDibsLottery() {
  const DibsLottery = await ethers.getContractFactory("DibsLottery");

  const dibsLottery = await upgrades.upgradeProxy(
    "0x287ed50e4c158dac38e1b7e16c50cd1b2551a300",
    DibsLottery
  );

  await dibsLottery.deployed();

  console.log("DibsLottery upgraded");

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsLottery.address
  );
  console.log("Implementation address", implementationAddress);
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgradeDibsLottery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
  });
