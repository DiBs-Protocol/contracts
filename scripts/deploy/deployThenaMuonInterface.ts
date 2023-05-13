import { ethers } from "hardhat";
import { deployMuonInterface } from "./deployMuonInterface";

async function deploy() {
  const [admin] = await ethers.getSigners();
  const dibs = "0x16D18eDE8b965109C035C481562f96D6708Ab463";
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
