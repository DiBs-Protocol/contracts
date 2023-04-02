import { ethers } from "hardhat";
import hre from "hardhat";

async function deployDibsRandomSeedGenerator(
  adminAddress: string,
  setterAddress: string,
  dibsAddress: string,
  verify: Boolean
) {
  const vrfCoordinator = "0xc587d9053cd1118f25f645f9e08bb98c9712a4ee";
  const subscriptionId = 660;
  const keyHash =
    "0x114f3da0a805b6a67d6e9cd2ec746f7028f1b7376365af575cfea3550dd1aa04";

  const deployer = await ethers.getSigner(adminAddress);

  let args = [
    adminAddress,
    setterAddress,
    dibsAddress,
    vrfCoordinator,
    subscriptionId,
    keyHash,
  ];

  const dibsRandomSeedGeneratorFactory = await ethers.getContractFactory(
    "DibsRandomSeedGenerator"
  );

  ///@ts-ignore
  const dibsRandomSeedGenerator = await dibsRandomSeedGeneratorFactory
    .connect(deployer)
    .deploy(...args);

  await dibsRandomSeedGenerator.deployed();

  console.log(
    "DibsRandomSeedGenerator deployed to:",
    dibsRandomSeedGenerator.address
  );

  await dibsRandomSeedGenerator.deployTransaction.wait(10);

  if (verify) {
    await hre.run("verify:verify", {
      address: dibsRandomSeedGenerator.address,
      constructorArguments: args,
    });
  }
}

async function deploy() {
  const dibsAddress = "0x287ed50e4c158dac38e1b7e16c50cd1b2551a300";
  const adminAddress = process.env.ADMIN_ADDRESS!;
  const setterAddress = process.env.SETTER_ADDRESS!;

  await deployDibsRandomSeedGenerator(
    adminAddress,
    setterAddress,
    dibsAddress,
    true
  );
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
