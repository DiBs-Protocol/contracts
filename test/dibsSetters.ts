import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Dibs, ERC20__factory } from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumberish } from "ethers";

describe("DibsSetters", async () => {
  let dibs: Dibs;

  let admin: SignerWithAddress;
  let setter: SignerWithAddress;

  beforeEach(async () => {
    [admin, setter] = await ethers.getSigners();
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
  });

  it("should be deployed", async () => {
    const dibsLottery = await dibs.dibsLottery();
    const wethPrice = await dibs.wethPriceFeed();
    const refereePercentage = await dibs.refereePercentage();
    const referrerPercentage = await dibs.referrerPercentage();
    const grandparentPercentage = await dibs.grandparentPercentage();
    const dibsPercentage = await dibs.dibsPercentage();

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
    expect(refereePercentage).to.be.eq(0);
    expect(referrerPercentage).to.be.eq(700000);
    expect(grandparentPercentage).to.be.eq(250000);
    expect(dibsPercentage).to.be.eq(50000);
  });

  it("should not be able to set percentages more than 100%", async () => {
    await expect(
      dibs.connect(setter).setPercentages(1000001, 0, 0, 0)
    ).to.be.revertedWithCustomError(dibs, "InvalidPercentages");

    await expect(
      dibs.connect(setter).setPercentages(1000000, 1, 0, 0)
    ).to.be.revertedWithCustomError(dibs, "InvalidPercentages");

    await expect(
      dibs.connect(setter).setPercentages(999998, 1, 2, 0)
    ).to.be.revertedWithCustomError(dibs, "InvalidPercentages");

    await expect(
      dibs.connect(setter).setPercentages(999995, 1, 2, 3)
    ).to.be.revertedWithCustomError(dibs, "InvalidPercentages");
  });

  async function getAndExpectPercentages(
    referee: BigNumberish,
    referrer: BigNumberish,
    grandparent: BigNumberish,
    _dibs: BigNumberish
  ) {
    const refereePercentage = await dibs.refereePercentage();
    const referrerPercentage = await dibs.referrerPercentage();
    const grandparentPercentage = await dibs.grandparentPercentage();
    const dibsPercentage = await dibs.dibsPercentage();

    expect(refereePercentage).to.be.eq(referee);
    expect(referrerPercentage).to.be.eq(referrer);
    expect(grandparentPercentage).to.be.eq(grandparent);
    expect(dibsPercentage).to.be.eq(_dibs);
  }

  it("should be able to set percentages", async () => {
    await dibs.connect(setter).setPercentages(1000000, 0, 0, 0);
    await getAndExpectPercentages(1000000, 0, 0, 0);

    await dibs.connect(setter).setPercentages(0, 1000000, 0, 0);
    await getAndExpectPercentages(0, 1000000, 0, 0);

    await dibs.connect(setter).setPercentages(0, 0, 1000000, 0);
    await getAndExpectPercentages(0, 0, 1000000, 0);

    await dibs.connect(setter).setPercentages(0, 0, 0, 1000000);
    await getAndExpectPercentages(0, 0, 0, 1000000);

    await dibs.connect(setter).setPercentages(100000, 200000, 300000, 400000);
    await getAndExpectPercentages(100000, 200000, 300000, 400000);
  });
});
