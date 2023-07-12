import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  Dibs__factory,
  ERC20__factory,
  PairRewarder,
} from "../typechain-types";
import { MockContract, deployMockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { getCurrentTimeStamp } from "./timeUtils";
import { BigNumber } from "ethers";

describe("PairRewarder", () => {
  let pairRewarder: PairRewarder;
  let dibs: MockContract;
  let pair: MockContract;
  let rt1: MockContract; // reward token 1
  let rt2: MockContract; // reward token 2
  let admin: SignerWithAddress;
  let setter: SignerWithAddress;
  let winner1: SignerWithAddress;
  let winner2: SignerWithAddress;
  let winner3: SignerWithAddress;
  let muonInterface: SignerWithAddress;

  beforeEach(async () => {
    [admin, setter, winner1, winner2, winner3, muonInterface] =
      await ethers.getSigners();
    pair = await deployMockContract(admin, ERC20__factory.abi);
    rt1 = await deployMockContract(admin, ERC20__factory.abi);
    rt2 = await deployMockContract(admin, ERC20__factory.abi);
    dibs = await deployMockContract(admin, Dibs__factory.abi);

    const PairRewarderFactory = await ethers.getContractFactory("PairRewarder");
    const args = [dibs.address, pair.address, admin.address, setter.address];
    pairRewarder = (await upgrades.deployProxy(
      PairRewarderFactory,
      args
    )) as PairRewarder;
    await pairRewarder.deployed();

    await dibs.mock.muonInterface.returns(muonInterface.address);
  });

  it("should have the correct pair and dibs address and roles", async () => {
    expect(await pairRewarder.pair()).to.equal(pair.address);
    expect(await pairRewarder.dibs()).to.equal(dibs.address);

    const isAdmin = await pairRewarder.hasRole(
      await pairRewarder.DEFAULT_ADMIN_ROLE(),
      admin.address
    );
    const isSetter = await pairRewarder.hasRole(
      await pairRewarder.SETTER_ROLE(),
      setter.address
    );
  });

  it("should not be able to set reward tokens if not setter", async () => {
    const tx = pairRewarder
      .connect(admin)
      .setLeaderBoard(1, [rt1.address], [[10]]);

    await expect(tx).to.be.reverted;
  });

  it("should be able to set reward tokens if setter", async () => {
    const tx = pairRewarder
      .connect(setter)
      .setLeaderBoard(1, [rt1.address], [[10]]);
    await expect(tx).to.not.be.reverted;
  });

  it("should fail to set invalid reward tokens and amounts", async () => {
    // invalid reward tokens and amounts count

    const tx = pairRewarder
      .connect(setter)
      .setLeaderBoard(1, [rt1.address, rt2.address], [[10]]);

    await expect(tx).to.be.revertedWithCustomError(
      pairRewarder,
      "InvalidInput"
    );

    // invalid reward tokens and winners count

    const tx2 = pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10]]);
    await expect(tx2).to.be.revertedWithCustomError(
      pairRewarder,
      "InvalidInput"
    );
  });

  it("should set reward tokens correctly", async () => {
    await pairRewarder.connect(setter).setLeaderBoard(1, [rt1.address], [[10]]);

    const leaderBoardInfo = await pairRewarder.leaderBoardInfo();

    expect(leaderBoardInfo.winnersCount).to.equal(1);
    expect(leaderBoardInfo.rewardTokens).to.deep.equal([rt1.address]);
    expect(leaderBoardInfo.rewardAmounts).to.deep.equal([[10]]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );
    const leaderBoardInfo2 = await pairRewarder.leaderBoardInfo();

    expect(leaderBoardInfo2.winnersCount).to.equal(2);
    expect(leaderBoardInfo2.rewardTokens).to.deep.equal([
      rt1.address,
      rt2.address,
    ]);
    expect(leaderBoardInfo2.rewardAmounts).to.deep.equal([
      [10, 5],
      [20, 10],
    ]);
  });

  it("should not be able to set top referrers if not muon interface", async () => {
    const tx = pairRewarder.setTopReferrers(0, [winner1.address]);

    await expect(tx).to.be.revertedWithCustomError(
      pairRewarder,
      "OnlyMuonInterface"
    );
  });

  it("should fail to set top referrers if day not over", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    const tx = pairRewarder
      .connect(muonInterface)
      .setTopReferrers(BigNumber.from(5), [winner1.address]);

    await expect(tx).to.be.revertedWithCustomError(pairRewarder, "DayNotOver");
  });

  it("should revert if top referrers count is more than winners count", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10, 5]]);

    const tx = pairRewarder
      .connect(muonInterface)
      .setTopReferrers(BigNumber.from(0), [
        winner1.address,
        winner2.address,
        winner3.address,
      ]);

    await expect(tx).to.be.revertedWithCustomError(
      pairRewarder,
      "TooManyWinners"
    );
  });

  it("should set top referrers correctly", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10, 5]]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    const day0winners = await pairRewarder.leaderBoardWinners(0);
    const winner1wins = await pairRewarder.getUserLeaderBoardWins(
      winner1.address
    );
    const winner2wins = await pairRewarder.getUserLeaderBoardWins(
      winner2.address
    );

    expect(day0winners.winners).to.deep.equal([
      winner1.address,
      winner2.address,
    ]);

    expect(day0winners.info.winnersCount).to.equal(2);
    expect(day0winners.info.rewardTokens).to.deep.equal([rt1.address]);
    expect(day0winners.info.rewardAmounts).to.deep.equal([[10, 5]]);
    expect(winner1wins).to.deep.equal([0]);
    expect(winner2wins).to.deep.equal([0]);
  });

  it("should revert if top referrers already set", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10, 5]]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    const tx = pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    await expect(tx).to.be.revertedWithCustomError(pairRewarder, "AlreadySet");
  });

  it("should correctly set winner on multiple days", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10, 5]]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(1, [winner2.address, winner3.address]);

    const day0winners = await pairRewarder.leaderBoardWinners(0);
    const day1winners = await pairRewarder.leaderBoardWinners(1);

    const winner1wins = await pairRewarder.getUserLeaderBoardWins(
      winner1.address
    );
    const winner2wins = await pairRewarder.getUserLeaderBoardWins(
      winner2.address
    );
    const winner3wins = await pairRewarder.getUserLeaderBoardWins(
      winner3.address
    );

    expect(day0winners.winners).to.deep.equal([
      winner1.address,
      winner2.address,
    ]);
    expect(day1winners.winners).to.deep.equal([
      winner2.address,
      winner3.address,
    ]);

    expect(day0winners.info.winnersCount).to.equal(2);
    expect(day0winners.info.rewardTokens).to.deep.equal([rt1.address]);
    expect(day0winners.info.rewardAmounts).to.deep.equal([[10, 5]]);
    expect(day1winners.info.winnersCount).to.equal(
      2,
      "day 1 winners count should be 2"
    );
    expect(day1winners.info.rewardTokens).to.deep.equal([rt1.address]);
    expect(day1winners.info.rewardAmounts).to.deep.equal([[10, 5]]);
    expect(winner1wins).to.deep.equal([0]);
    expect(winner2wins).to.deep.equal([0, 1]);
    expect(winner3wins).to.deep.equal([1]);
  });

  it("should set correct winner on multiple days with multiple reward tokens", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(1, [winner2.address, winner3.address]);

    const day0winners = await pairRewarder.leaderBoardWinners(0);
    const day1winners = await pairRewarder.leaderBoardWinners(1);

    const winner1wins = await pairRewarder.getUserLeaderBoardWins(
      winner1.address
    );
    const winner2wins = await pairRewarder.getUserLeaderBoardWins(
      winner2.address
    );
    const winner3wins = await pairRewarder.getUserLeaderBoardWins(
      winner3.address
    );

    expect(day0winners.winners).to.deep.equal([
      winner1.address,
      winner2.address,
    ]);

    expect(day1winners.winners).to.deep.equal([
      winner2.address,
      winner3.address,
    ]);

    expect(day0winners.info.winnersCount).to.equal(2);
    expect(day0winners.info.rewardTokens).to.deep.equal([
      rt1.address,
      rt2.address,
    ]);
    expect(day0winners.info.rewardAmounts).to.deep.equal([
      [10, 5],
      [20, 10],
    ]);

    expect(day1winners.info.winnersCount).to.equal(2);
    expect(day1winners.info.rewardTokens).to.deep.equal([
      rt1.address,
      rt2.address,
    ]);
    expect(day1winners.info.rewardAmounts).to.deep.equal([
      [10, 5],
      [20, 10],
    ]);

    expect(winner1wins).to.deep.equal([0]);
    expect(winner2wins).to.deep.equal([0, 1]);
    expect(winner3wins).to.deep.equal([1]);
  });

  it("should set correct winner on multiple days where rewards are different", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10, 5]]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(1, [winner2.address, winner3.address]);

    const day0winners = await pairRewarder.leaderBoardWinners(0);
    const day1winners = await pairRewarder.leaderBoardWinners(1);

    const winner1wins = await pairRewarder.getUserLeaderBoardWins(
      winner1.address
    );
    const winner2wins = await pairRewarder.getUserLeaderBoardWins(
      winner2.address
    );
    const winner3wins = await pairRewarder.getUserLeaderBoardWins(
      winner3.address
    );

    expect(day0winners.winners).to.deep.equal([
      winner1.address,
      winner2.address,
    ]);
    expect(day1winners.winners).to.deep.equal([
      winner2.address,
      winner3.address,
    ]);
    expect(day0winners.info.winnersCount).to.equal(2);
    expect(day0winners.info.rewardTokens).to.deep.equal([
      rt1.address,
      rt2.address,
    ]);
    expect(day0winners.info.rewardAmounts).to.deep.equal([
      [10, 5],
      [20, 10],
    ]);
    expect(day1winners.info.winnersCount).to.equal(2);
    expect(day1winners.info.rewardTokens).to.deep.equal([rt1.address]);
    expect(day1winners.info.rewardAmounts).to.deep.equal([[10, 5]]);
    expect(winner1wins).to.deep.equal([0]);
    expect(winner2wins).to.deep.equal([0, 1]);
    expect(winner3wins).to.deep.equal([1]);
  });

  it("should fail to claim if user not won on day", async () => {
    const tx = pairRewarder.claimLeaderBoardReward(0, winner1.address);
    await expect(tx).to.be.revertedWithCustomError(pairRewarder, "NotWinner");
  });

  it("user should be able to claim rewards after winning", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    await rt1.mock.transfer.withArgs(winner1.address, 10).returns(true);
    await rt2.mock.transfer.withArgs(winner1.address, 20).returns(true);

    await rt1.mock.transfer.withArgs(winner2.address, 5).returns(true);
    await rt2.mock.transfer.withArgs(winner2.address, 10).returns(true);

    await pairRewarder
      .connect(winner1)
      .claimLeaderBoardReward(0, winner1.address);

    await pairRewarder
      .connect(winner2)
      .claimLeaderBoardReward(0, winner2.address);
  });

  it("user should not be able to claim rewards twice", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    await rt1.mock.transfer.withArgs(winner1.address, 10).returns(true);
    await rt2.mock.transfer.withArgs(winner1.address, 20).returns(true);

    await rt1.mock.transfer.withArgs(winner2.address, 5).returns(true);
    await rt2.mock.transfer.withArgs(winner2.address, 10).returns(true);

    await pairRewarder
      .connect(winner1)
      .claimLeaderBoardReward(0, winner1.address);

    const tx = pairRewarder
      .connect(winner1)
      .claimLeaderBoardReward(0, winner1.address);

    await expect(tx).to.be.revertedWithCustomError(
      pairRewarder,
      "AlreadyClaimed"
    );
  });

  it("should be able to claim rewards on multiple days", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    await rt1.mock.transfer.withArgs(winner1.address, 10).returns(true);
    await rt2.mock.transfer.withArgs(winner1.address, 20).returns(true);

    await rt1.mock.transfer.withArgs(winner2.address, 5).returns(true);
    await rt2.mock.transfer.withArgs(winner2.address, 10).returns(true);

    await pairRewarder
      .connect(winner1)
      .claimLeaderBoardReward(0, winner1.address);

    await pairRewarder
      .connect(winner2)
      .claimLeaderBoardReward(0, winner2.address);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(1, [winner2.address, winner3.address]);

    await rt1.mock.transfer.withArgs(winner2.address, 10).returns(true);
    await rt2.mock.transfer.withArgs(winner2.address, 20).returns(true);

    await rt1.mock.transfer.withArgs(winner3.address, 5).returns(true);
    await rt2.mock.transfer.withArgs(winner3.address, 10).returns(true);

    await pairRewarder
      .connect(winner2)
      .claimLeaderBoardReward(1, winner2.address);

    await pairRewarder
      .connect(winner3)
      .claimLeaderBoardReward(1, winner3.address);

    const winner1wins = await pairRewarder.getUserLeaderBoardWins(
      winner1.address
    );

    const winner2wins = await pairRewarder.getUserLeaderBoardWins(
      winner2.address
    );

    const winner3wins = await pairRewarder.getUserLeaderBoardWins(
      winner3.address
    );

    expect(winner1wins).to.deep.equal([0]);
    expect(winner2wins).to.deep.equal([0, 1]);
    expect(winner3wins).to.deep.equal([1]);
  });

  it("should be able to win and claim on multiple days where the rewards are different", async () => {
    const now = await getCurrentTimeStamp();

    await dibs.mock.firstRoundStartTime.returns(now);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    // day 0
    await pairRewarder.connect(setter).setLeaderBoard(
      2,
      [rt1.address, rt2.address],
      [
        [10, 5],
        [20, 10],
      ]
    );

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(0, [winner1.address, winner2.address]);

    await rt1.mock.transfer.withArgs(winner1.address, 10).returns(true);
    await rt2.mock.transfer.withArgs(winner1.address, 20).returns(true);

    await rt1.mock.transfer.withArgs(winner2.address, 5).returns(true);
    await rt2.mock.transfer.withArgs(winner2.address, 10).returns(true);

    await pairRewarder
      .connect(winner1)
      .claimLeaderBoardReward(0, winner1.address);

    await pairRewarder
      .connect(winner2)
      .claimLeaderBoardReward(0, winner2.address);

    // move time to next day
    await ethers.provider.send("evm_increaseTime", [86400]);

    // day 1
    await pairRewarder
      .connect(setter)
      .setLeaderBoard(2, [rt1.address], [[10, 5]]);

    await pairRewarder
      .connect(muonInterface)
      .setTopReferrers(1, [winner2.address, winner3.address]);

    await rt1.mock.transfer.withArgs(winner2.address, 10).returns(true);

    await rt1.mock.transfer.withArgs(winner3.address, 5).returns(true);

    await pairRewarder
      .connect(winner2)
      .claimLeaderBoardReward(1, winner2.address);

    await pairRewarder
      .connect(winner3)
      .claimLeaderBoardReward(1, winner3.address);

    const winner1wins = await pairRewarder.getUserLeaderBoardWins(
      winner1.address
    );

    const winner2wins = await pairRewarder.getUserLeaderBoardWins(
      winner2.address
    );

    const winner3wins = await pairRewarder.getUserLeaderBoardWins(
      winner3.address
    );

    expect(winner1wins).to.deep.equal([0]);
    expect(winner2wins).to.deep.equal([0, 1]);
    expect(winner3wins).to.deep.equal([1]);

    const day0winners = await pairRewarder.leaderBoardWinners(0);
    const day1winners = await pairRewarder.leaderBoardWinners(1);

    expect(day0winners.winners).to.deep.equal([
      winner1.address,
      winner2.address,
    ]);
    expect(day1winners.winners).to.deep.equal([
      winner2.address,
      winner3.address,
    ]);

    expect(day0winners.info.winnersCount).to.equal(2);
    expect(day0winners.info.rewardTokens).to.deep.equal([
      rt1.address,
      rt2.address,
    ]);

    expect(day0winners.info.rewardAmounts).to.deep.equal([
      [10, 5],
      [20, 10],
    ]);

    expect(day1winners.info.winnersCount).to.equal(2);
    expect(day1winners.info.rewardTokens).to.deep.equal([rt1.address]);
    expect(day1winners.info.rewardAmounts).to.deep.equal([[10, 5]]);
  });
});
