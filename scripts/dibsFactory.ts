import { ethers } from "hardhat";

async function deploy(admin: string, setter: string, wethPriceFeed: string) {
  // deploy dibs

  const DibsFactory = await ethers.getContractFactory("Dibs");
  const dibsArgs = [];
}
