import hre, { upgrades, ethers } from "hardhat";

async function upgrade(proxyAddress: string) {
  const DibsRepository = await ethers.getContractFactory("DibsRepository");
  const dibsRepository = await upgrades.upgradeProxy(
    proxyAddress,
    DibsRepository
  );

  await dibsRepository.deployed();

  await dibsRepository.deployTransaction.wait(1);

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

upgrade("0x1370Ff0e5CC846a95f34FE50aD90daad17022797")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
