import { dibsFactory } from "./dibsFactory";
import { ethers } from "hardhat";

async function deployThen() {
  const [deployer] = await ethers.getSigners();
  const admin = deployer.address;
  const setter = deployer.address;

  const firstRoundStartTime = 1682553600;
  const roundDuration = 604800;

  const wbnbChainLink = "0x0567f2323251f0aab15c8dfb1967e4e8a7d42aee";
  const lotteryWinnersCounts = 0;
  const leaderBoarWinnersCount = 0;

  await dibsFactory(
    admin,
    setter,
    firstRoundStartTime,
    roundDuration,
    wbnbChainLink,
    lotteryWinnersCounts,
    [],
    [],
    leaderBoarWinnersCount,
    [],
    []
  );
}

deployThen()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
