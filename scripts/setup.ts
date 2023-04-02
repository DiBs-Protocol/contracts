import { ethers } from "hardhat";

export async function setupDibs(dibsAddress: string) {
  // load contract from address
  const dibs = await ethers.getContractAt("Dibs", dibsAddress);

  // load setter signer
  const setterAddress = process.env.SETTER_ADDRESS!;
  const setter = await ethers.getSigner(setterAddress);

  // set referrer tiers

  // console.log("setting referrer tiers");

  // await dibs
  //   .connect(setter)
  //   .multiSetTierPercentage([0, 1, 2, 3, 4], [5e4, 65e3, 8e4, 1e5, 12e4])

  // console.log('setting ticket tiers')
  // // set ticket tiers
  // await dibs.connect(setter).multiSetTierToTickets([0, 1, 2], [5, 10, 15])
}
