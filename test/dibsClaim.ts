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
  let muonInterface: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  async function setupMockTokens() {
    token1 = await deployMockContract(admin, ERC20__factory.abi);
    token2 = await deployMockContract(admin, ERC20__factory.abi);
    token3 = await deployMockContract(admin, ERC20__factory.abi);
    token4 = await deployMockContract(admin, ERC20__factory.abi);
  }

  beforeEach(async () => {
    [admin, setter, user1, user2, user3, user4, muonInterface] =
      await ethers.getSigners();
    const Dibs = await ethers.getContractFactory("Dibs");
    const args = [
      admin.address,
      admin.address,
      setter.address,
      admin.address, // for dibs lottery param, not used
      admin.address, // for weth price param, not used
    ];

    dibs = (await upgrades.deployProxy(Dibs, args)) as Dibs;
    await dibs.connect(setter).setMuonInterface(muonInterface.address);

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
    const hasRoleDibs = await dibs.hasRole(dibs.DIBS(), admin.address);

    expect(dibs.address).to.be.properAddress;
    expect(dibsLottery).to.be.eq(admin.address);
    expect(wethPrice).to.be.eq(admin.address);
    expect(hasRoleAdmin).to.be.true;
    expect(hasRoleSetter).to.be.true;
    expect(hasRoleDibs).to.be.true;
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
});
