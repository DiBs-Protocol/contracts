import hre, { upgrades, ethers } from "hardhat";

async function upgrade(proxyAddress: string) {
  const DibsRepository = await ethers.getContractFactory("DibsRepository");
  const dibsRepository = await upgrades.upgradeProxy(
    proxyAddress,
    DibsRepository
  );
  console.log("DibsRepository upgraded:", dibsRepository.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsRepository.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgrade()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
