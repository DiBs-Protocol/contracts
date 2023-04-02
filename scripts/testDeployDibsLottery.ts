import { ethers } from "hardhat";
import { deployDibsLottery } from "./deployDibsLottery";
async function deployTestDibsLottery() {
  const [admin, setter, muonInterface, rewardToken] = await ethers.getSigners();
  const rewardAmount = ethers.utils.parseEther("0.000001");

  await deployDibsLottery(admin, setter, rewardToken.address, rewardAmount);
}

deployTestDibsLottery()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
