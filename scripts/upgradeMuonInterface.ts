import hre, { ethers, upgrades } from "hardhat";
async function upgradeMuonInterface() {
  const MuonInterfaceV1 = await ethers.getContractFactory("MuonInterfaceV1");
  const muonInterface = await upgrades.upgradeProxy(
    "0xBa079Ad36E48e75b8b37f17aF1Fc285bceB84391",
    MuonInterfaceV1
  );
  await muonInterface.deployed();
  console.log("MuonInterface upgraded");
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    muonInterface.address
  );

  console.log("Implementation address", implementationAddress);
  await hre.run("verify:verify", {
    address: implementationAddress,
    constructorArguments: [],
  });
}

upgradeMuonInterface()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
