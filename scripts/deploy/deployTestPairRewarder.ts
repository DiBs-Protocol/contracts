import hre, { ethers, upgrades } from "hardhat";
import { PairRewarder } from "../../typechain-types";

async function fill() {
  const admin = await ethers.getSigner(
    "0x1cbA1fCf5aBf59dC4F6335A13Fd5771334B1803A"
  );

  const pairRewarder: PairRewarder = (await ethers.getContractAt(
    "PairRewarder",
    "0x6cB66a0762E7Ce3c0Abc9d0241bF4cfFc67fcdA1"
  )) as PairRewarder;

  const winners = [
    "0x2408e836ebfcf135731df4cf357c10a7b65193bf",
    "0x7f96ce96b4e7e1f8accdffff1919513599a15b6e",
    "0x0ab34241eab01e853f0b587a3ede7667e7f8310a",
    "0x7f46a9dc0cbbb246c96c2b97acd1e47893dfc628",
  ];

  //   let tx = await pairRewarder.connect(admin).setTopReferrers(5, [winners[0]]);

  //   await tx.wait(1);

  //   console.log("Top referrers set - day 5");

  //   tx = await pairRewarder
  //     .connect(admin)
  //     .setTopReferrers(7, [winners[1], winners[2]]);
  //   await tx.wait(1);

  //   console.log("Top referrers set - day 7");

  //   const usdc = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";

  //   tx = await pairRewarder
  //     .connect(admin)
  //     .setLeaderBoard(3, [usdc], [[70000000000, 6000000000, 3000000000]]);

  //   await tx.wait(1);

  //   console.log("Leaderboard set");

  let tx = await pairRewarder
    .connect(admin)
    .setTopReferrers(10, [winners[1], winners[2], winners[3]]);

  await tx.wait(1);

  console.log("Top referrers set - day 10");
}

async function deploy() {
  const admin = await ethers.getSigner(
    "0x1cbA1fCf5aBf59dC4F6335A13Fd5771334B1803A"
  );

  console.log("Admin address: ", admin.address);

  const dibsFactory = await ethers.getContractFactory("MockDibs");
  const mockDibs = await dibsFactory.deploy(admin.address);

  console.log("MockDibsFactory deployed to:", mockDibs.address);

  const PairRewarder = await ethers.getContractFactory("PairRewarder");

  const usdc = "0x07865c6E87B9F70255377e024ace6630C1Eaa37F";
  const dai = "0x822397d9a55d0fefd20F5c4bCaB33C5F65bd28Eb";

  const args = [
    mockDibs.address,
    "0xA56053670B7Ffa8D2A374F8DCEDeD096125d0D86",
    admin.address,
    admin.address,
  ];

  const pairRewarder: PairRewarder = (await upgrades.deployProxy(
    PairRewarder,
    args
  )) as PairRewarder;

  await pairRewarder.deployed();

  console.log("PairRewarder deployed to:", pairRewarder.address);

  // get implementation address
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    pairRewarder.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  const tx = await pairRewarder.connect(admin).setLeaderBoard(
    3,
    [usdc, dai],
    [
      [10000000000, 5000000000, 1000000000],
      [20000000000, 10000000000, 5000000000],
    ]
  );

  await tx.wait(1);

  console.log("Leaderboard set");

  // verify contracts if not on "hardhat"

  if (hre.network.name !== "hardhat") {
    await hre.run("verify:verify", {
      address: mockDibs.address,
      constructorArguments: [admin.address],
    });

    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
  }

  console.log("Verified");
}

fill()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
