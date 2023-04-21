import { dibsFactory } from "./dibsFactory";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

async function deployThen() {
  const [deployer] = await ethers.getSigners();
  const admin = deployer.address;
  const setter = deployer.address;

  const firstRoundStartTime = 1673481600;
  const roundDuration = 604800;

  const wbnbChainLink = "0x9ef1B8c0E4F7dc8bF5719Ea496883DC6401d5b2e";
  const lotteryTokens = ["0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"];
  const lotteryTokenAmounts = [BigNumber.from("250000000000000000000")];
  const lotteryWinnersCounts = 8;
  const leaderBoarWinnersCount = 8;
  const leaderBoardRewardTokens = [
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56",
  ];
  const leaderBoardRewardAmounts = [
    [
      BigNumber.from("214285714285714276352"),
      BigNumber.from("171428571428571414528"),
      BigNumber.from("142857142857142861824"),
      BigNumber.from("114285714285714292736"),
      BigNumber.from("85714285714285707264"),
      BigNumber.from("57142857142857146368"),
      BigNumber.from("28571428571428573184"),
      BigNumber.from("14285714285714286592"),
    ],
  ];

  await dibsFactory(
    admin,
    setter,
    firstRoundStartTime,
    roundDuration,
    wbnbChainLink,
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
