import { ethers } from "hardhat";
import hre from "hardhat";
import { setupDibs } from "./setup";
import { deployDibsContract } from "./deployProxyDibs";

// async function that sleeps for the given seconds
function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function deployDibs(verify: Boolean) {
  const dibsAddress = process.env.DIBS_ADDRESS!;
  const adminAddress = process.env.ADMIN_ADDRESS!;
  const setterAddress = process.env.SETTER_ADDRESS!;

  const deployer = await ethers.getSigner(adminAddress);

  const dibs = await ethers.getContractAt(
    "Dibs",
    "0x664cE330511653cB2744b8eD50DbA31C6c4C08ca"
  );

  console.log("Dibs deployed to:", dibs.address);

  await sleep(10000);

  if (verify) {
    await hre.run("verify:verify", {
      address: dibs.address,
      constructorArguments: [],
    });
  }
}

deployDibs(true)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
