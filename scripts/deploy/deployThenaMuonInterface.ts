import { ethers } from "hardhat";
import { deployMuonInterface } from "./deployMuonInterface";

async function deploy() {
  const [admin] = await ethers.getSigners();
  const dibs = "0x3fBA73Fc55dd7cb286F963793F5301E92cC07B57";
  const muonInterface = await deployMuonInterface(dibs);

  const dibsContract = await ethers.getContractAt("Dibs", dibs);

  await dibsContract.setMuonInterface(muonInterface.address);
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
