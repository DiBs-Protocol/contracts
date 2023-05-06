import hre, { ethers, upgrades } from "hardhat";

async function deploy() {
  const [admin] = await ethers.getSigners();
  const setter = admin;
  const DibsRepository = await ethers.getContractFactory("DibsRepository");
  const SeedGenerator = await ethers.getContractFactory(
    "DibsRandomSeedGenerator"
  );

  const seedGeneratorArgs = [
    "0xAE975071Be8F8eE67addBC1A82488F1C24858067",
    725,
    "0xd729dc84e21ae57ffb6be0053bf2b0668aa2aaf300a2a7b2ddf7dc0bb6e875a8",
  ];

  //@ts-ignore
  const seedGenerator = await ethers.getContractAt(
    "DibsRandomSeedGenerator",
    "0x5BFb495b31D4849f668d58dcCC138b3AAf7fDB81"
  );

  await seedGenerator.deployed();

  console.log("Seed Generator Deployed to:", seedGenerator.address);

  const args = [admin.address, setter.address, seedGenerator.address];
  const dibsRepository = await upgrades.deployProxy(DibsRepository, args);

  await dibsRepository.deployed();
  console.log("DibsRepository deployed to:", dibsRepository.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsRepository.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  //verify
  await hre.run("verify:verify", {
    address: "0x5BFb495b31D4849f668d58dcCC138b3AAf7fDB81",
    constructorArguments: seedGeneratorArgs,
  });

  // 0x1370Ff0e5CC846a95f34FE50aD90daad17022797

  // verify
  await hre.run("verify:verify", {
    address: "0xb0728C5A0a026711BE2c3133EB54Ac480AF86828",
    constructorArguments: [],
  });
}

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
