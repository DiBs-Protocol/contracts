import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { assert } from "chai";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Dibs, DibsLottery } from "../typechain-types";

async function deployDibsLottery(
  admin: string,
  setter: string
): Promise<DibsLottery> {
  const DibsLottery = await ethers.getContractFactory("DibsLottery");
  const dibsLotteryArgs = [admin, setter];
  const dibsLottery = await upgrades.deployProxy(DibsLottery, dibsLotteryArgs);
  await dibsLottery.deployed();
  console.log("DibsLottery deployed to:", dibsLottery.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsLottery.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  return dibsLottery as DibsLottery;
}

async function setupDibsLottery(
  dibsLottery: DibsLottery,
  lotteryWinnersCounts: number,
  lotteryRewardTokens: string[],
  lotteryRewardAmounts: BigNumber[],
  leaderBoardWinnersCount: number,
  leaderBoardRewardTokens: string[],
  leaderBoardRewardAmounts: BigNumber[][]
) {
  // perform some checks
  assert(lotteryRewardTokens.length == lotteryRewardAmounts.length);
  assert(leaderBoardRewardTokens.length == leaderBoardRewardAmounts.length);
  leaderBoardRewardAmounts.forEach((amounts) => {
    assert(amounts.length == leaderBoardWinnersCount);
  });

  await dibsLottery.setWinnersPerRound(lotteryWinnersCounts);
  console.log("winner per round set");

  await dibsLottery.setLotteryRewards(
    lotteryRewardTokens,
    lotteryRewardAmounts
  );

  console.log("lottery rewards set");

  await dibsLottery.updateLeaderBoardData(
    0,
    leaderBoardWinnersCount,
    leaderBoardRewardTokens,
    leaderBoardRewardAmounts
  );

  console.log("leaderboard data set");
}

async function deployDibs(
  admin: string,
  setter: string,
  dibsLottery: string,
  wethPriceFeed: string
) {
  const DibsFactory = await ethers.getContractFactory("Dibs");
  const args = [admin, setter, dibsLottery, wethPriceFeed];
  const dibs = await upgrades.deployProxy(DibsFactory, args);
  await dibs.deployed();

  console.log("Dibs deployed to:", dibs.address);

  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibs.address
  );

  console.log("Implementation deployed to:", implementationAddress);

  return dibs as Dibs;
}

async function adjustRoles(
  dibs: Dibs,
  dibsLottery: DibsLottery,
  deployer: SignerWithAddress,
  admin: string,
  setter: string
) {
  // grant roles
  await dibsLottery.grantRole(await dibsLottery.DEFAULT_ADMIN_ROLE(), admin);

  console.log("dibsLottery admin role granted to", admin);

  await dibsLottery.grantRole(await dibsLottery.SETTER(), setter);

  console.log("dibsLottery setter role granted to", setter);

  await dibs.grantRole(await dibs.DEFAULT_ADMIN_ROLE(), admin);

  console.log("dibs admin role granted to", admin);

  await dibs.grantRole(await dibs.SETTER(), setter);

  console.log("dibs setter role granted to", setter);

  // renounce roles
  if (deployer.address != admin) {
    await dibsLottery.renounceRole(
      await dibsLottery.DEFAULT_ADMIN_ROLE(),
      deployer.address
    );

    console.log("dibsLottery admin role renounced from", deployer.address);

    await dibs.renounceRole(await dibs.DEFAULT_ADMIN_ROLE(), deployer.address);

    console.log("dibs admin role renounced from", deployer.address);
  }

  if (deployer.address != setter) {
    await dibsLottery.renounceRole(
      await dibsLottery.SETTER(),
      deployer.address
    );

    console.log("dibsLottery setter role renounced from", deployer.address);

    await dibs.renounceRole(await dibs.SETTER(), deployer.address);

    console.log("dibs setter role renounced from", deployer.address);
  }
}

export async function dibsFactory(
  admin: string,
  setter: string,
  wethPriceFeed: string,
  lotteryWinnersCounts: number,
  lotteryRewardTokens: string[],
  lotteryRewardAmounts: BigNumber[],
  leaderBoardWinnersCount: number,
  leaderBoardRewardTokens: string[],
  leaderBoardRewardAmounts: BigNumber[][] // [token][leaderBoard position]
) {
  // performs all the operations using a single deployer account
  // and adjusts the roles after all is finished

  const [deployer] = await ethers.getSigners();

  // deploy and setup the dibs lottery first, since it has no dependencies
  const dibsLottery = await deployDibsLottery(
    deployer.address, // admin - will be transferred to admin
    deployer.address // setter - will be transferred to setter
  );

  await setupDibsLottery(
    dibsLottery,
    lotteryWinnersCounts,
    lotteryRewardTokens,
    lotteryRewardAmounts,
    leaderBoardWinnersCount,
    leaderBoardRewardTokens,
    leaderBoardRewardAmounts
  );

  // deploy dibs

  const dibs = await deployDibs(
    deployer.address, // admin - will be transferred to admin
    deployer.address, // setter - will be transferred to setter
    dibsLottery.address,
    wethPriceFeed
  );

  await adjustRoles(dibs, dibsLottery, deployer, admin, setter);
  return { dibs, dibsLottery };
}
