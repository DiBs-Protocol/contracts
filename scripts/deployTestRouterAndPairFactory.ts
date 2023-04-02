import hre, { ethers } from "hardhat";
import { sleep } from "./helpers";

async function deployTestRouterAndPairFactory() {
  const adminAddress = process.env.ADMIN_ADDRESS!;
  const deployer = await ethers.getSigner(adminAddress);

  const routerFactory = await ethers.getContractFactory("TestRouter");
  const router = await routerFactory.connect(deployer).deploy();
  await router.deployed();
  console.log("TestRouter deployed to:", router.address);

  const pairFactory = await ethers.getContractFactory("TestPairFactory");
  const pair = await pairFactory.connect(deployer).deploy();
  await pair.deployed();
  console.log("TestPairFactory deployed to:", pair.address);

  await sleep(10000);

  await hre.run("verify:verify", {
    address: router.address,
    constructorArguments: [],
  });

  await hre.run("verify:verify", {
    address: pair.address,
    constructorArguments: [],
  });

  // router = 0x5D1eC97F6b58575CF859334F0e3679adD7a76872
  // pair = 0xa7F1BCa1F071923Cd27535ba40C2E8D44f157420
}

deployTestRouterAndPairFactory()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
