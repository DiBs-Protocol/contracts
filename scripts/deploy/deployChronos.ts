import { dibsFactory } from "./dibsFactory";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

async function deployThen() {
  const [deployer] = await ethers.getSigners();
  const admin = deployer.address;
  const setter = deployer.address;

  const firstRoundStartTime = 1682553600;
  const roundDuration = 604800;

  const wethChainlink = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";
  const lotteryTokens = ["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"];
  const lotteryTokenAmounts = [BigNumber.from("150000000")];
  const lotteryWinnersCounts = 10;
  const leaderBoarWinnersCount = 8;
  const leaderBoardRewardTokens = [
    "0x15b2fb8f08e4ac1ce019eadae02ee92aedf06851",
  ];
  const leaderBoardRewardAmounts = [
    [
      ethers.utils.parseEther("150"),
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("80"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
    ],
  ];

  await dibsFactory(
    admin,
    setter,
    firstRoundStartTime,
    roundDuration,
    wethChainlink,
    lotteryWinnersCounts,
    lotteryTokens,
    lotteryTokenAmounts,
    leaderBoarWinnersCount,
    leaderBoardRewardTokens,
    leaderBoardRewardAmounts
  );
}

deployThen()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
