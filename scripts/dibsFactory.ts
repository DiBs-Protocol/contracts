import { ethers } from "hardhat";

async function deploy(admin: string, setter: string, wethPriceFeed: string) {
  // performs all the operations using local accounts
  // and adjusts the roles after all is finished

  const [deployer] = await ethers.getSigners();

  // deploy dibs lottery first, does not have any dependencies on other contracts

  const DibsLotteryFactory = await ethers.getContractFactory("DibsLottery");

  // deploy dibs

  const DibsFactory = await ethers.getContractFactory("Dibs");
  const dibsArgs = [];
}
