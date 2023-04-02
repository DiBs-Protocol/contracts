import hre, { ethers, upgrades } from "hardhat";
import { Dibs } from "../typechain-types";

// async function that sleeps for the given seconds
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function deployDibsContract(
  dibsAddress: string,
  adminAddress: string,
  setterAddress: string,
  verify: boolean = true
): Promise<Dibs> {
  let args = [dibsAddress, adminAddress, setterAddress];

  const Dibs = await ethers.getContractFactory("Dibs");
  const dibs = await upgrades.deployProxy(Dibs, args);
  await dibs.deployed();

  if (verify) {
    console.log("Dibs deployed to:", dibs.address);
  }

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibs.address
  );

  if (verify) {
    await sleep(10000);
    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
  }

  return dibs as Dibs;
}
