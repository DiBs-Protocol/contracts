import { ethers } from "hardhat";
import { deployMuonInterface } from "./deployMuonInterface";

async function deploy() {
  const [admin] = await ethers.getSigners();
  const dibs = "0x6cB66a0762E7Ce3c0Abc9d0241bF4cfFc67fcdA1";
  const muonInterface = await deployMuonInterface(dibs);

  const dibsContract = await ethers.getContractAt("Dibs", dibs);

  await dibsContract.connect(admin).setMuonInterface(muonInterface.address);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
