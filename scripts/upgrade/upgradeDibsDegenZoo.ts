import hre, { upgrades, ethers } from "hardhat";

async function upgrade(proxyAddress: string) {
  const DibsDegenZoo = await ethers.getContractFactory("DibsDegenZoo");
  const dibsDegenZoo = await upgrades.upgradeProxy(proxyAddress, DibsDegenZoo);

  await dibsDegenZoo.deployed();

  await dibsDegenZoo.deployTransaction.wait(1);

  console.log("DibsDegenZoo upgraded:", dibsDegenZoo.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsDegenZoo.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgrade("0x3fBA73Fc55dd7cb286F963793F5301E92cC07B57")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
