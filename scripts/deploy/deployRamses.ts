import { dibsFactory } from "./dibsFactory";
import { ethers } from "hardhat";
import { BigNumber } from "ethers";

async function deploy() {
  const [deployer] = await ethers.getSigners();
  const admin = deployer.address;
  const setter = deployer.address;

  const firstRoundStartTime = 1689206400;
  const roundDuration = 604800;

  const wethChainlink = "0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612";
  const lotteryTokens = [
    "0xaaa6c1e32c55a7bfa8066a6fae9b42650f262418",
    "0xaaa1ee8dc1864ae49185c368e8c64dd780a50fb7",
  ];
  const lotteryTokenAmounts = [BigNumber.from("0"), BigNumber.from("0")];
  const lotteryWinnersCounts = 10;
  const leaderBoarWinnersCount = 10;
  const leaderBoardRewardTokens = [
    "0xaaa6c1e32c55a7bfa8066a6fae9b42650f262418",
    "0xaaa1ee8dc1864ae49185c368e8c64dd780a50fb7",
  ];
  const leaderBoardRewardAmounts = [
    [
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
    ],
    [
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
      BigNumber.from("0"),
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

deploy()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
