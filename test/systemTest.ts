import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import {
  Dibs,
  DibsLottery,
  DibsLottery__factory,
  MockMuonInterfaceV1,
  MuonInterfaceV1,
} from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { deployDibsContract } from "../scripts/deployProxyDibs";
import { deployDibsLottery } from "../scripts/deployDibsLottery";
import {
  getActivePeriod,
  getCurrentTimeStamp,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";
import { expect } from "chai";
import { erc20 } from "../typechain-types/@openzeppelin/contracts/token";
import { RewardToken } from "../typechain-types/contracts/test";
import { BigNumber } from "ethers";

describe("SystemTest", async () => {
  let admin: SignerWithAddress;
  let setter: SignerWithAddress;
  let rewardToken: RewardToken;
  let leaderBoardToken1: RewardToken;
  let leaderBoardToken2: RewardToken;
  let leaderBoardToken3: RewardToken;
  let leaderBoardToken4: RewardToken;
  let leaderBoardToken1RewardRank: BigNumber[] = [
    ethers.utils.parseEther("10"),
    ethers.utils.parseEther("8"),
  ];

  let leaderBoardToken2RewardRank: BigNumber[] = [
    ethers.utils.parseEther("7"),
    ethers.utils.parseEther("6"),
  ];

  let leaderBoardToken3RewardRank: BigNumber[] = [
    ethers.utils.parseEther("5"),
    ethers.utils.parseEther("4"),
  ];

  let leaderBoardToken4RewardRank: BigNumber[] = [
    ethers.utils.parseEther("3"),
    ethers.utils.parseEther("2"),
  ];

  let winner1: SignerWithAddress;
  let winner2: SignerWithAddress;
  let winner3: SignerWithAddress;
  let leaderBoardWinner1: SignerWithAddress;
  let leaderBoardWinner2: SignerWithAddress;
  let leaderBoardWinner3: SignerWithAddress;
  let leaderBoardWinner4: SignerWithAddress;
  let muonInterface: MockMuonInterfaceV1;
  let dibs: Dibs;
  let dibsLottery: DibsLottery;
  let startTime: number;

  const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

  async function setupRewardTokens() {
    const RewardToken = await ethers.getContractFactory("RewardToken");
    rewardToken = await RewardToken.deploy();
    await rewardToken.deployed();

    leaderBoardToken1 = await RewardToken.deploy();
    await leaderBoardToken1.deployed();

    leaderBoardToken2 = await RewardToken.deploy();
    await leaderBoardToken2.deployed();

    leaderBoardToken3 = await RewardToken.deploy();
    await leaderBoardToken3.deployed();

    leaderBoardToken4 = await RewardToken.deploy();
    await leaderBoardToken4.deployed();
  }

  async function setupDibs() {
    dibs = await deployDibsContract(
      admin.address,
      admin.address,
      setter.address,
      false
    );
    await rewardToken
      .connect(admin)
      .transfer(dibs.address, ethers.utils.parseEther("100"));
  }

  async function setupDibsLottery() {
    dibsLottery = await deployDibsLottery(
      BigNumber.from(startTime),
      BigNumber.from(7 * 24 * 3600),
      8,
      admin,
      setter,
      false
    );

    await dibsLottery.connect(setter).setRewardTokens([rewardToken.address]);
    await dibsLottery
      .connect(setter)
      .setRewardAmount([ethers.utils.parseEther("0.1")]);

    await rewardToken
      .connect(admin)
      .transfer(dibsLottery.address, ethers.utils.parseEther("100"));

    await leaderBoardToken1
      .connect(admin)
      .transfer(dibsLottery.address, ethers.utils.parseEther("100"));

    await leaderBoardToken2
      .connect(admin)
      .transfer(dibsLottery.address, ethers.utils.parseEther("100"));

    await leaderBoardToken3
      .connect(admin)
      .transfer(dibsLottery.address, ethers.utils.parseEther("100"));

    await leaderBoardToken4
      .connect(admin)
      .transfer(dibsLottery.address, ethers.utils.parseEther("100"));
  }

  async function setupMuonInterface() {
    const MuonInterfaceV1 = await ethers.getContractFactory(
      "MockMuonInterfaceV1"
    );

    const _interface = await upgrades.deployProxy(MuonInterfaceV1, [
      admin.address,
      setter.address,
      dibs.address,
      dibsLottery.address,
    ]);

    muonInterface = (await _interface.deployed()) as MockMuonInterfaceV1;
  }

  async function setupMuonInterfaceRole() {
    await dibs.connect(setter).setMuonInterface(muonInterface.address);
    await dibsLottery.connect(setter).setMuonInterface(muonInterface.address);
  }

  before(async () => {
    [
      admin,
      setter,
      winner1,
      winner2,
      winner3,
      leaderBoardWinner1,
      leaderBoardWinner2,
      leaderBoardWinner3,
      leaderBoardWinner4,
    ] = await ethers.getSigners();
    await setTimeToNextThursdayMidnight();
    startTime = await getActivePeriod();
    await setupRewardTokens();
    await setupDibs();
    await setupDibsLottery();
    await setupMuonInterface();
    await setupMuonInterfaceRole();
  });

  describe("Dibs", async () => {
    const accumulativeBalance = ethers.utils.parseEther("10");
    const claimAmount = ethers.utils.parseEther("1");

    it("should allow winner 3 to claim", async () => {
      await muonInterface.claim(
        winner3.address,
        rewardToken.address,
        winner3.address,
        accumulativeBalance,
        claimAmount
      );
      const balance = await rewardToken.balanceOf(winner3.address);
      expect(balance).to.be.eq(claimAmount);
    });

    it("should fail to claim more than accumulative balance", async () => {
      const tx = muonInterface.claim(
        winner3.address,
        rewardToken.address,
        winner3.address,
        accumulativeBalance,
        accumulativeBalance
      );
      await expect(tx).to.be.revertedWithCustomError(dibs, "BalanceTooLow");
    });
    it("should allow winner 3 to claim the remaining", async () => {
      await muonInterface.claim(
        winner3.address,
        rewardToken.address,
        winner3.address,
        accumulativeBalance,
        accumulativeBalance.sub(claimAmount)
      );
      const balance = await rewardToken.balanceOf(winner3.address);
      expect(balance).to.be.eq(accumulativeBalance);
    });
  });

  describe("DibsLottery", async () => {
    it("should fail to set winner for round 0", async () => {
      const tx = muonInterface.setRoundWinners(0, [winner1.address]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "LotteryRoundNotOver"
      );
    });
    it("should go to next thursday", async () => {
      await setTimeToNextThursdayMidnight();
    });
    it("should be able to set winner for round 0 if the round is finished", async () => {
      await muonInterface.setRoundWinners(0, [winner1.address]);
      const winnersCount = await dibsLottery.roundWinnersCount(0);
      expect(winnersCount).to.be.eq(1);
    });
    it("should not be able to set winner for round 0 when already set", async () => {
      const tx = muonInterface.setRoundWinners(0, [winner1.address]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "LotteryRoundAlreadyOver"
      );
    });
    it("should fail to set winner for round 1", async () => {
      const tx = muonInterface.setRoundWinners(1, [winner1.address]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "LotteryRoundNotOver"
      );
    });
    it("winner 2 should not be able to claim round 0", async () => {
      const tx = await dibsLottery
        .connect(winner2)
        .claimReward(winner2.address);
      const balance = await rewardToken.balanceOf(winner1.address);
      expect(balance).to.be.eq(0);
    });
    it("winner 1 should be able to claim their reward", async () => {
      const tx = dibsLottery.connect(winner1).claimReward(winner1.address);
      await expect(tx).to.be.fulfilled;
      const balance = await rewardToken.balanceOf(winner1.address);
      expect(balance).to.be.eq(ethers.utils.parseEther("0.1"));
    });
    it("should fail if winner 1 tries to double claim their reward", async () => {
      const tx = await dibsLottery
        .connect(winner1)
        .claimReward(winner1.address);
      const balance = await rewardToken.balanceOf(winner1.address); // balance did not change
      expect(balance).to.be.eq(ethers.utils.parseEther("0.1"));
    });
  });

  describe("Dibs Top Referrers", async () => {
    it("it should get active day", async () => {
      const activeDay = await dibsLottery.getActiveDay();
      expect(activeDay).to.be.eq(7);
    });

    it("should fail to set top referrers for round 0", async () => {
      const tx = muonInterface.setTopReferrers(0, [winner1.address]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "NoLeaderBoardData"
      );
    });

    it("should fail to get index for day 0", async () => {
      const i0 = dibsLottery.findLeaderBoardIndex(0);
      await expect(i0).to.be.revertedWithCustomError(
        dibsLottery,
        "NoLeaderBoardData"
      );
    });

    it("should update leaderBoard data for day 3", async () => {
      const _rewardTokens = [
        leaderBoardToken1.address,
        leaderBoardToken2.address,
      ];
      await dibsLottery.connect(setter).updateLeaderBoardData(
        3, // day three
        2, // two winners
        _rewardTokens,
        [leaderBoardToken1RewardRank, leaderBoardToken2RewardRank]
      );
      const leaderBoardData = await dibsLottery.getLatestLeaderBoard();
      const len = await dibsLottery.getLeaderBoardsLength();
      expect(len).to.be.eq(1);
      expect(leaderBoardData.lastUpdatedDay).to.be.eq(3);
      expect(leaderBoardData.count).to.be.eq(2);
      expect(leaderBoardData.rewardTokens).to.be.deep.eq(_rewardTokens);
      expect(leaderBoardData.rankRewardAmount).to.be.deep.eq([
        leaderBoardToken1RewardRank,
        leaderBoardToken2RewardRank,
      ]);
    });

    it("should fail to set leaderBoard data for day 2", async () => {
      const _rewardTokens = [
        leaderBoardToken1.address,
        leaderBoardToken2.address,
      ];
      const tx = dibsLottery.connect(setter).updateLeaderBoardData(
        2, // day two
        2, // two winners
        _rewardTokens,
        [leaderBoardToken1RewardRank, leaderBoardToken2RewardRank]
      );
      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "DayMustBeGreaterThanLastUpdatedDay"
      );
    });

    it("should still fail to get day 0 leader board info", async () => {
      const i0 = dibsLottery.findLeaderBoardIndex(0);
      await expect(i0).to.be.revertedWithCustomError(
        dibsLottery,
        "NoLeaderBoardData"
      );
    });
    it("should get correct index for day 3", async () => {
      const i3 = await dibsLottery.findLeaderBoardIndex(3);
      expect(i3).to.be.eq(0);
    });
    it("should get correct index for day 4", async () => {
      const i4 = await dibsLottery.findLeaderBoardIndex(4);
      expect(i4).to.be.eq(0);
    });

    it("should add leader board data for day 5", async () => {
      const _rewardTokens = [
        leaderBoardToken3.address,
        leaderBoardToken4.address,
      ];
      await dibsLottery.connect(setter).updateLeaderBoardData(
        5, // day five
        2, // two winners
        _rewardTokens,
        [leaderBoardToken3RewardRank, leaderBoardToken4RewardRank]
      );
      const leaderBoardData = await dibsLottery.getLatestLeaderBoard();
      const len = await dibsLottery.getLeaderBoardsLength();
      expect(len).to.be.eq(2);
      expect(leaderBoardData.lastUpdatedDay).to.be.eq(5);
      expect(leaderBoardData.count).to.be.eq(2);
      expect(leaderBoardData.rewardTokens).to.be.deep.eq(_rewardTokens);
      expect(leaderBoardData.rankRewardAmount).to.be.deep.eq([
        leaderBoardToken3RewardRank,
        leaderBoardToken4RewardRank,
      ]);
    });
    it("should get index 0 for day 3 and 4", async () => {
      const i3 = await dibsLottery.findLeaderBoardIndex(3);
      expect(i3).to.be.eq(0);
      const i4 = await dibsLottery.findLeaderBoardIndex(4);
      expect(i4).to.be.eq(0);
    });

    it("should get index 1 for day 5 and 6 and 10", async () => {
      const i5 = await dibsLottery.findLeaderBoardIndex(5);
      expect(i5).to.be.eq(1);
      const i6 = await dibsLottery.findLeaderBoardIndex(6);
      expect(i6).to.be.eq(1);
      const i10 = await dibsLottery.findLeaderBoardIndex(10);
      expect(i10).to.be.eq(1);
    });

    it("should not be able to add top referrers for day 8", async () => {
      const tx = muonInterface.setTopReferrers(8, [
        winner1.address,
        winner2.address,
      ]);
      await expect(tx).to.be.revertedWithCustomError(dibsLottery, "DayNotOver");
    });

    it("should be able to add top referrers for day 4", async () => {
      const _rewardTokens = [
        leaderBoardToken1.address,
        leaderBoardToken2.address,
      ];

      const tx = muonInterface.setTopReferrers(4, [
        leaderBoardWinner1.address,
        leaderBoardWinner2.address,
      ]);
      await expect(tx).to.be.fulfilled;
      const topReferrers = await dibsLottery.getTopReferrers(4);
      expect(topReferrers).to.be.deep.eq([
        leaderBoardWinner1.address,
        leaderBoardWinner2.address,
      ]);

      // get token balances and they should gotten the reward
      const balance1 = await dibsLottery.getUserTokensAndBalance(
        leaderBoardWinner1.address
      );
      const balance2 = await dibsLottery.getUserTokensAndBalance(
        leaderBoardWinner2.address
      );

      expect(balance1[0]).to.be.deep.eq(_rewardTokens);
      expect(balance1[1]).to.be.deep.eq([
        leaderBoardToken1RewardRank[0], // first level winner
        leaderBoardToken2RewardRank[0], // first level winner
      ]);

      expect(balance2[0]).to.be.deep.eq(_rewardTokens);
      expect(balance2[1]).to.be.deep.eq([
        leaderBoardToken1RewardRank[1], // second level winner
        leaderBoardToken2RewardRank[1], // second level winner
      ]);

      // check winning days for winners
      const winningDays1 = await dibsLottery.getWinningDays(
        leaderBoardWinner1.address
      );
      expect(winningDays1).to.be.deep.eq([4]);
      const winningDays2 = await dibsLottery.getWinningDays(
        leaderBoardWinner2.address
      );
      expect(winningDays2).to.be.deep.eq([4]);
    });

    it("should be able to add top referrers for day 3", async () => {
      const _rewardTokens = [
        leaderBoardToken1.address,
        leaderBoardToken2.address,
      ];

      const tx = muonInterface.setTopReferrers(3, [
        leaderBoardWinner2.address,
        leaderBoardWinner1.address,
      ]);
      await expect(tx).to.be.fulfilled;
      const topReferrers = await dibsLottery.getTopReferrers(3);
      expect(topReferrers).to.be.deep.eq([
        leaderBoardWinner2.address,
        leaderBoardWinner1.address,
      ]);

      // get token balances and they should gotten the reward
      const balance1 = await dibsLottery.getUserTokensAndBalance(
        leaderBoardWinner1.address
      );
      const balance2 = await dibsLottery.getUserTokensAndBalance(
        leaderBoardWinner2.address
      );

      expect(balance1[0]).to.be.deep.eq(_rewardTokens);
      expect(balance1[1]).to.be.deep.eq([
        leaderBoardToken1RewardRank[0].add(leaderBoardToken1RewardRank[1]), // first level + second winner
        leaderBoardToken2RewardRank[0].add(leaderBoardToken2RewardRank[1]), // first level + second winner
      ]);

      expect(balance2[0]).to.be.deep.eq(_rewardTokens);
      expect(balance2[1]).to.be.deep.eq([
        leaderBoardToken1RewardRank[1].add(leaderBoardToken1RewardRank[0]), // second + first level winner
        leaderBoardToken2RewardRank[1].add(leaderBoardToken2RewardRank[0]), // second + first level winner
      ]);

      // check winning days for winners
      const winningDays1 = await dibsLottery.getWinningDays(
        leaderBoardWinner1.address
      );
      expect(winningDays1).to.be.deep.eq([4, 3]);
      const winningDays2 = await dibsLottery.getWinningDays(
        leaderBoardWinner2.address
      );
      expect(winningDays2).to.be.deep.eq([4, 3]);
    });

    it("should be able to add top referrers for day 6", async () => {
      const _rewardTokens = [
        leaderBoardToken3.address,
        leaderBoardToken4.address,
      ];

      const tx = await muonInterface.setTopReferrers(6, [
        leaderBoardWinner3.address,
        leaderBoardWinner4.address,
      ]);

      const topReferrers = await dibsLottery.getTopReferrers(6);
      expect(topReferrers).to.be.deep.eq([
        leaderBoardWinner3.address,
        leaderBoardWinner4.address,
      ]);

      // get token balances and they should gotten the reward
      const balance1 = await dibsLottery.getUserTokensAndBalance(
        leaderBoardWinner3.address
      );
      const balance2 = await dibsLottery.getUserTokensAndBalance(
        leaderBoardWinner4.address
      );

      expect(balance1[0]).to.be.deep.eq(_rewardTokens);
      expect(balance1[1]).to.be.deep.eq([
        leaderBoardToken3RewardRank[0], // first level winner
        leaderBoardToken4RewardRank[0], // first level winner
      ]);

      expect(balance2[0]).to.be.deep.eq(_rewardTokens);
      expect(balance2[1]).to.be.deep.eq([
        leaderBoardToken3RewardRank[1], // second level winner
        leaderBoardToken4RewardRank[1], // second level winner
      ]);

      // check winning days for winners
      const winningDays1 = await dibsLottery.getWinningDays(
        leaderBoardWinner3.address
      );
      expect(winningDays1).to.be.deep.eq([6]);
      const winningDays2 = await dibsLottery.getWinningDays(
        leaderBoardWinner4.address
      );
      expect(winningDays2).to.be.deep.eq([6]);
    });
  });
});
