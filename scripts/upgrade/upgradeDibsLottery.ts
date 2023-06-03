import hre, { upgrades, ethers } from "hardhat";

export async function upgrade(proxyAddress: string) {
  const DibsLottery = await ethers.getContractFactory("DibsLottery");
  const dibsLottery = await upgrades.upgradeProxy(proxyAddress, DibsLottery);

  await dibsLottery.deployed();

  await dibsLottery.deployTransaction.wait(1);

  console.log("DibsLottery upgraded:", dibsLottery.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsLottery.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgrade("0x7AA64eB76100DD214716154DbB105c4d626EA159")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
