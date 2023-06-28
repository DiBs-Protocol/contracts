import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Dibs, ERC20__factory } from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";

describe("testClaim", async () => {
  let dibs: Dibs;
  let token1: MockContract;
  let token2: MockContract;
  let token3: MockContract;
  let token4: MockContract;
  let admin: SignerWithAddress;
  let setter: SignerWithAddress;
  let blacklistSetter: SignerWithAddress;
  let muonInterface: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let blockUser1: SignerWithAddress;
  let blockUser2: SignerWithAddress;
  let platform: SignerWithAddress;

  async function setupMockTokens() {
    token1 = await deployMockContract(admin, ERC20__factory.abi);
    token2 = await deployMockContract(admin, ERC20__factory.abi);
    token3 = await deployMockContract(admin, ERC20__factory.abi);
    token4 = await deployMockContract(admin, ERC20__factory.abi);
  }

  beforeEach(async () => {
    [
      admin,
      setter,
      user1,
      user2,
      blockUser1,
      blockUser2,
      muonInterface,
      blacklistSetter,
      platform,
    ] = await ethers.getSigners();
    const Dibs = await ethers.getContractFactory("Dibs");
    const args = [
      admin.address,
      setter.address,
      admin.address, // for dibs lottery param, not used
      admin.address, // for weth price param, not used
      0,
      0,
    ];

    dibs = (await upgrades.deployProxy(Dibs, args)) as Dibs;
    await dibs.connect(setter).setMuonInterface(muonInterface.address);
    await dibs
      .connect(admin)
      .grantRole(dibs.BLACKLIST_SETTER(), blacklistSetter.address);
    await setupMockTokens();
  });

  it("should be deployed", async () => {
    const dibsLottery = await dibs.dibsLottery();
    const wethPrice = await dibs.wethPriceFeed();
    const hasRoleAdmin = await dibs.hasRole(
      dibs.DEFAULT_ADMIN_ROLE(),
      admin.address
    );
    const hasRoleSetter = await dibs.hasRole(dibs.SETTER(), setter.address);

    expect(dibs.address).to.be.properAddress;
    expect(dibsLottery).to.be.eq(admin.address);
    expect(wethPrice).to.be.eq(admin.address);
    expect(hasRoleAdmin).to.be.true;
    expect(hasRoleSetter).to.be.true;
  });

  it("should transfer tokens from `from` to `to`", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance = ethers.utils.parseEther("20");

    // mock the token contract
    await token1.mock.transfer.withArgs(user2.address, amount).returns(true);

    // call the `claim` function
    await dibs
      .connect(muonInterface)
      .claim(from, token1.address, amount, to, accumulativeBalance);
  });

  it("should blacklist a user", async () => {
    // set up variables
    const user = blockUser1.address;

    // call the `blacklist` function
    await dibs.connect(blacklistSetter).setBlacklisted([user], true);

    // check if the user was blacklisted
    const isBlacklisted = await dibs.blacklisted(user);
    expect(isBlacklisted).to.be.true;
  });

  it("should revert if the user is blacklisted", async () => {
    // set up variables
    const from = blockUser1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance = ethers.utils.parseEther("20");

    // mock the token contract
    await token1.mock.transfer.withArgs(to, amount).returns(true);

    await dibs.connect(blacklistSetter).setBlacklisted([from], true);

    // call the `claim` function and expect it to revert with a custom error message
    await expect(
      dibs
        .connect(muonInterface)
        .claim(from, token1.address, amount, to, accumulativeBalance)
    ).to.be.revertedWithCustomError(dibs, "Blacklisted");
  });

  it("should blacklist multiple users", async () => {
    // set up variables
    const user1 = blockUser1.address;
    const user2 = blockUser2.address;

    // call the `blacklist` function
    await dibs.connect(blacklistSetter).setBlacklisted([user1, user2], true);

    // check if the users were blacklisted
    const isBlacklisted1 = await dibs.blacklisted(user1);
    const isBlacklisted2 = await dibs.blacklisted(user2);
    expect(isBlacklisted1).to.be.true;
    expect(isBlacklisted2).to.be.true;
  });

  it("should be able to unset a user from the blacklist", async () => {
    // set up variables
    const user = blockUser1.address;

    // call the `blacklist` function
    await dibs.connect(blacklistSetter).setBlacklisted([user], true);

    // check if the user was blacklisted
    const isBlacklisted = await dibs.blacklisted(user);
    expect(isBlacklisted).to.be.true;

    // unset the user from the blacklist
    await dibs.connect(blacklistSetter).setBlacklisted([user], false);

    // check if the user was unset from the blacklist
    const isBlacklistedAfter = await dibs.blacklisted(user);
    expect(isBlacklistedAfter).to.be.false;
  });

  it("should revert if the claimed balance is too low", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance = ethers.utils.parseEther("5");

    // mock the token contract
    await token1.mock.transfer.returns(true);

    // call the `claim` function and expect it to revert with a custom error message
    await expect(
      dibs
        .connect(muonInterface)
        .claim(from, token1.address, amount, to, accumulativeBalance)
    ).to.be.revertedWithCustomError(dibs, "BalanceTooLow");
  });

  it("should update the claimed balance after a successful transfer", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance = ethers.utils.parseEther("20");

    // mock the token contract
    await token1.mock.transfer.withArgs(user2.address, amount).returns(true);

    // call the `claim` function
    await dibs
      .connect(muonInterface)
      .claim(from, token1.address, amount, to, accumulativeBalance);

    // check if the claimed balance was updated correctly
    const claimedBalance = await dibs.claimedBalance(token1.address, from);
    expect(claimedBalance).to.be.equal(amount);
  });
  it("should revert if the balance is too low", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("30");
    const accumulativeBalance = ethers.utils.parseEther("20");

    // mock the token contract
    await token1.mock.transfer.withArgs(user2.address, amount).returns(true);

    // call the `claim` function and expect it to revert with a custom error
    await expect(
      dibs
        .connect(muonInterface)
        .claim(from, token1.address, amount, to, accumulativeBalance)
    ).to.be.revertedWithCustomError(dibs, "BalanceTooLow");
  });
  it("should revert if the sender is not the muon interface", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance = ethers.utils.parseEther("20");

    // call the `claim` function from a non-muon interface address
    await expect(
      dibs.claim(from, token1.address, amount, to, accumulativeBalance)
    ).to.be.revertedWithCustomError(dibs, "NotMuonInterface");
  });
  it("should transfer tokens for different tokens", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance = ethers.utils.parseEther("20");

    // mock the token contracts
    await token1.mock.transfer.withArgs(user2.address, amount).returns(true);
    await token2.mock.transfer.withArgs(user2.address, amount).returns(true);
    await token3.mock.transfer.withArgs(user2.address, amount).returns(true);

    // call the `claim` function for each token
    await dibs
      .connect(muonInterface)
      .claim(from, token1.address, amount, to, accumulativeBalance);

    await dibs
      .connect(muonInterface)
      .claim(from, token2.address, amount, to, accumulativeBalance);

    await dibs
      .connect(muonInterface)
      .claim(from, token3.address, amount, to, accumulativeBalance);
  });
  it("should distribute tokens among multiple users", async () => {
    // set up variables
    const token = token1.address;
    const amount = ethers.utils.parseEther("100");
    const totalUsers = 10;
    const accumulativeBalance = amount.mul(totalUsers);
    const users = await ethers.getSigners();

    // mock the token contract
    for (let i = 0; i < totalUsers; i++) {
      await token1.mock.transfer
        .withArgs(users[i].address, amount)
        .returns(true);
    }

    // register multiple users
    for (let i = 0; i < totalUsers; i++) {
      await dibs
        .connect(users[i])
        .register(`User ${i + 1}`, await dibs.DIBS(), {
          from: users[i].address,
        });
    }

    // distribute tokens among the users
    for (let i = 0; i < totalUsers; i++) {
      await dibs
        .connect(muonInterface)
        .claim(
          users[i].address,
          token,
          amount,
          users[i].address,
          accumulativeBalance
        );
    }

    // check claimed balances
    for (let i = 0; i < totalUsers; i++) {
      const claimed = await dibs.claimedBalance(token, users[i].address);
      expect(claimed).to.equal(amount);
    }
  });
  it("should transfer tokens with different accumulative balances", async () => {
    // set up variables
    const from = user1.address;
    const to = user2.address;
    const amount = ethers.utils.parseEther("10");
    const accumulativeBalance1 = ethers.utils.parseEther("20");
    const accumulativeBalance2 = ethers.utils.parseEther("30");
    const accumulativeBalance3 = ethers.utils.parseEther("40");

    // mock the token contract
    await token1.mock.transfer.withArgs(user2.address, amount).returns(true);
    await token1.mock.transfer
      .withArgs(user2.address, amount.mul(2))
      .returns(true);
    await token1.mock.transfer
      .withArgs(user2.address, amount.mul(3))
      .returns(true);

    // call the `claim` function with different accumulative balances
    await dibs
      .connect(muonInterface)
      .claim(from, token1.address, amount, to, accumulativeBalance1);
    await dibs
      .connect(muonInterface)
      .claim(from, token1.address, amount, to, accumulativeBalance2);
    await dibs
      .connect(muonInterface)
      .claim(from, token1.address, amount, to, accumulativeBalance3);

    // check that the claimed balances have been updated correctly
    expect(await dibs.claimedBalance(token1.address, from)).to.be.equal(
      amount.mul(3)
    );
  });

  it("should not be able to claim excess tokens if not muon interface", async () => {
    await token1.mock.transfer.withArgs(platform.address, 1000).returns(true);

    await expect(
      dibs
        .connect(admin)
        .claimExcessTokens(
          token1.address,
          platform.address,
          ethers.utils.parseEther("1"),
          1000
        )
    ).to.be.revertedWithCustomError(dibs, "NotMuonInterface");
  });

  it("should allow muon interface to claim excess tokens", async () => {
    await token1.mock.transfer.withArgs(platform.address, 1000).returns(true);

    const accPlatformBalance = ethers.utils.parseEther("1");

    await dibs
      .connect(muonInterface)
      .claimExcessTokens(
        token1.address,
        platform.address,
        accPlatformBalance,
        1000
      );
  });

  it("should not be able to claim more than excess tokens", async () => {
    const accPlatformBalance = ethers.utils.parseEther("1");
    await token1.mock.transfer
      .withArgs(platform.address, accPlatformBalance.add(1))
      .returns(true);

    await expect(
      dibs
        .connect(muonInterface)
        .claimExcessTokens(
          token1.address,
          platform.address,
          accPlatformBalance,
          accPlatformBalance.add(1)
        )
    ).to.be.revertedWithCustomError(dibs, "BalanceTooLow");
  });

  it("should not be able to claim more than excess tokens on multiple calls", async () => {
    const accPlatformBalance = ethers.utils.parseEther("1");
    const withdrawAmount = ethers.utils.parseEther("0.5");

    await token1.mock.transfer
      .withArgs(platform.address, withdrawAmount)
      .returns(true);

    await dibs
      .connect(muonInterface)
      .claimExcessTokens(
        token1.address,
        platform.address,
        accPlatformBalance,
        withdrawAmount
      );

    await dibs
      .connect(muonInterface)
      .claimExcessTokens(
        token1.address,
        platform.address,
        accPlatformBalance,
        withdrawAmount
      );

    await expect(
      dibs
        .connect(muonInterface)
        .claimExcessTokens(
          token1.address,
          platform.address,
          accPlatformBalance,
          1
        )
    ).to.be.revertedWithCustomError(dibs, "BalanceTooLow");
  });
});
