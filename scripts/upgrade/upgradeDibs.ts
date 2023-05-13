import hre, { upgrades, ethers } from "hardhat";

export async function upgrade(proxyAddress: string) {
  const Dibs = await ethers.getContractFactory("Dibs");
  const dibs = await upgrades.upgradeProxy(proxyAddress, Dibs);

  await dibs.deployed();

  await dibs.deployTransaction.wait(1);

  console.log("Dibs upgraded:", dibs.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibs.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgrade("0x6cB66a0762E7Ce3c0Abc9d0241bF4cfFc67fcdA1")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
