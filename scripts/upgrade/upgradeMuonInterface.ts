import hre, { upgrades, ethers } from "hardhat";

export async function upgrade(proxyAddress: string) {
  const MuonInterface = await ethers.getContractFactory("MuonInterfaceV1");
  const muonInterface = await upgrades.upgradeProxy(
    proxyAddress,
    MuonInterface
  );

  await muonInterface.deployed();

  await muonInterface.deployTransaction.wait(1);

  console.log("Muon interface upgraded:", muonInterface.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    muonInterface.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  // verify
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgrade("0xCce676283961c4a90482cB01c9F874b5d75b0A58")
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
