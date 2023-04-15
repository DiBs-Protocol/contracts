import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployMockContract, MockContract } from "ethereum-waffle";
import {
  DibsLottery,
  DibsLottery__factory,
  Dibs__factory,
  ERC20__factory,
  IDibs__factory,
} from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import {
  getCurrentTimeStamp,
  setTimeToNextThursdayMidnight,
} from "./timeUtils";
import { BigNumber, BigNumberish } from "ethers";
import { expect } from "chai";

describe("DibsLottery", async () => {
  let dibs: MockContract;
  let dibsLottery: DibsLottery;

  const winnersPerRound = 3;
  const leaderBoardSize = 2;

  let admin: SignerWithAddress;
  let setter: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;
  let muonInterface: SignerWithAddress;

  let firstRoundStartTime: BigNumberish;
  let roundDuration: BigNumberish = BigNumber.from(60 * 60 * 24 * 7); // 1 week

  let lotteryToken1: MockContract;
  let lotteryToken2: MockContract;
  let lotteryToken3: MockContract;
  let leaderBoardToken1: MockContract;
  let leaderBoardToken2: MockContract;
  let leaderBoardToken3: MockContract;

  const lotteryRewardAmount1 = ethers.utils.parseEther("10");
  const lotteryRewardAmount2 = ethers.utils.parseEther("20");
  const lotteryRewardAmount3 = ethers.utils.parseEther("30");

  const leaderBoardRewardAmount1 = [
    ethers.utils.parseEther("40"),
    ethers.utils.parseEther("30"),
  ]; // 40 for 1st place, 30 for 2nd place
  const leaderBoardRewardAmount2 = [
    ethers.utils.parseEther("50"),
    ethers.utils.parseEther("40"),
  ]; // 50 for 1st place, 40 for 2nd place
  const leaderBoardRewardAmount3 = [
    ethers.utils.parseEther("60"),
    ethers.utils.parseEther("50"),
  ]; // 60 for 1st place, 50 for 2nd place

  async function setupMocks() {
    lotteryToken1 = await deployMockContract(admin, ERC20__factory.abi);
    lotteryToken2 = await deployMockContract(admin, ERC20__factory.abi);
    lotteryToken3 = await deployMockContract(admin, ERC20__factory.abi);

    leaderBoardToken1 = await deployMockContract(admin, ERC20__factory.abi);
    leaderBoardToken2 = await deployMockContract(admin, ERC20__factory.abi);
    leaderBoardToken3 = await deployMockContract(admin, ERC20__factory.abi);

    dibs = await deployMockContract(admin, IDibs__factory.abi);
    await dibs.mock.muonInterface.returns(muonInterface.address);
    await setTimeToNextThursdayMidnight();
    firstRoundStartTime = await getCurrentTimeStamp();
    await dibs.mock.firstRoundStartTime.returns(firstRoundStartTime);
    await dibs.mock.roundDuration.returns(roundDuration);
  }

  async function deployDibsLottery() {
    const DibsLottery = await ethers.getContractFactory("DibsLottery");
    const args = [dibs.address, winnersPerRound, admin.address, setter.address];
    dibsLottery = (await upgrades.deployProxy(
      DibsLottery,
      args
    )) as DibsLottery;
  }

  async function setupDibsLottery() {
    await dibsLottery
      .connect(setter)
      .setRewardTokens([lotteryToken1.address, lotteryToken2.address]);
    await dibsLottery
      .connect(setter)
      .setRewardAmount([lotteryRewardAmount1, lotteryRewardAmount2]);

    await dibsLottery.connect(setter).updateLeaderBoardData(
      3, // use this data from day 0
      leaderBoardSize, // number of winners in leader board
      [leaderBoardToken1.address, leaderBoardToken1.address], // tokens that will be rewarded to each winner
      [leaderBoardRewardAmount1, leaderBoardRewardAmount1] // amount of tokens for each position (1st, 2nd, 3rd, etc.)
    );
  }

  beforeEach(async () => {
    [admin, setter, user1, user2, user3, user4, muonInterface] =
      await ethers.getSigners();

    await setupMocks();
    await deployDibsLottery();
    await setupDibsLottery();
  });

  describe("Lottery winners", async () => {
    it("should fail to set lottery winners if round not over", async () => {
      const tx = dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user1.address]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "LotteryRoundNotOver"
      );
    });

    it("should fail to set lottery winners if more than winnersPerRound winners", async () => {
      await setTimeToNextThursdayMidnight();
      const tx = dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [
          user1.address,
          user2.address,
          user3.address,
          user4.address,
        ]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "TooManyWinners"
      );
    });

    it("should be able to set lottery winners", async () => {
      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user1.address, user2.address]);

      const winners = await dibsLottery.getRoundWinners(0);
      expect(winners).to.deep.equal([user1.address, user2.address]);

      // check that the lottery tokens were deposited to the winners balance
      const user1Balances = await dibsLottery.getUserTokensAndBalance(
        user1.address
      );

      expect(user1Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);
      expect(user1Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user2Balances = await dibsLottery.getUserTokensAndBalance(
        user2.address
      );

      expect(user2Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user2Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);
    });

    it("should be able to set lottery winners for multiple rounds", async () => {
      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user1.address, user2.address]);

      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(1, [user3.address, user4.address]);

      const winners = await dibsLottery.getRoundWinners(0);
      expect(winners).to.deep.equal([user1.address, user2.address]);

      const winners2 = await dibsLottery.getRoundWinners(1);
      expect(winners2).to.deep.equal([user3.address, user4.address]);

      // check that the lottery tokens were deposited to the winners balance
      const user1Balances = await dibsLottery.getUserTokensAndBalance(
        user1.address
      );

      expect(user1Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);
      expect(user1Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user2Balances = await dibsLottery.getUserTokensAndBalance(
        user2.address
      );

      expect(user2Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user2Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user3Balances = await dibsLottery.getUserTokensAndBalance(
        user3.address
      );

      expect(user3Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user3Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user4Balances = await dibsLottery.getUserTokensAndBalance(
        user4.address
      );

      expect(user4Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user4Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);
    });

    it("should be able to set lottery winners for multiple rounds, where some winners are the same", async () => {
      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user1.address, user2.address]);

      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(1, [user1.address, user3.address]);

      const winners = await dibsLottery.getRoundWinners(0);
      expect(winners).to.deep.equal([user1.address, user2.address]);

      const winners2 = await dibsLottery.getRoundWinners(1);
      expect(winners2).to.deep.equal([user1.address, user3.address]);

      // check that the lottery tokens were deposited to the winners balance
      const user1Balances = await dibsLottery.getUserTokensAndBalance(
        user1.address
      );

      expect(user1Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);
      expect(user1Balances[1]).to.deep.equal([
        lotteryRewardAmount1.mul(2),
        lotteryRewardAmount2.mul(2),
      ]);

      const user2Balances = await dibsLottery.getUserTokensAndBalance(
        user2.address
      );

      expect(user2Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user2Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user3Balances = await dibsLottery.getUserTokensAndBalance(
        user3.address
      );

      expect(user3Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user3Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);
    });

    it("should be able to set lottery winners for multiple rounds, where some winners are the same, and some are not", async () => {
      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user1.address, user2.address]);

      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(1, [user1.address, user3.address]);

      await setTimeToNextThursdayMidnight();
      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(2, [user1.address, user4.address]);

      const winners = await dibsLottery.getRoundWinners(0);
      expect(winners).to.deep.equal([user1.address, user2.address]);

      const winners2 = await dibsLottery.getRoundWinners(1);
      expect(winners2).to.deep.equal([user1.address, user3.address]);

      const winners3 = await dibsLottery.getRoundWinners(2);
      expect(winners3).to.deep.equal([user1.address, user4.address]);

      // check that the lottery tokens were deposited to the winners balance
      const user1Balances = await dibsLottery.getUserTokensAndBalance(
        user1.address
      );

      expect(user1Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);
      expect(user1Balances[1]).to.deep.equal([
        lotteryRewardAmount1.mul(3),
        lotteryRewardAmount2.mul(3),
      ]);

      const user2Balances = await dibsLottery.getUserTokensAndBalance(
        user2.address
      );

      expect(user2Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user2Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user3Balances = await dibsLottery.getUserTokensAndBalance(
        user3.address
      );

      expect(user3Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user3Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);

      const user4Balances = await dibsLottery.getUserTokensAndBalance(
        user4.address
      );

      expect(user4Balances[0]).to.deep.equal([
        lotteryToken1.address,
        lotteryToken2.address,
      ]);

      expect(user4Balances[1]).to.deep.equal([
        lotteryRewardAmount1,
        lotteryRewardAmount2,
      ]);
    });

    it("should be able to set lottery winners if already set", async () => {
      await setTimeToNextThursdayMidnight();

      await dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user1.address]);

      const tx = dibsLottery
        .connect(muonInterface)
        .setRoundWinners(0, [user2.address]);

      await expect(tx).to.be.revertedWithCustomError(
        dibsLottery,
        "LotteryRoundAlreadyOver"
      );
    });
  });

  describe("LeaderBoard", async () => {});
});
