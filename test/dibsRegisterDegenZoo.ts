import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { DibsDegenZoo } from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

describe("testRegisterDegenZoo", async () => {
  let dibs: DibsDegenZoo;
  const DIBS_CODE_NAME = "DIBS"; // this is used if we have no parent for register
  let admin: SignerWithAddress;
  let setter: SignerWithAddress;
  let p1: SignerWithAddress;
  let p2: SignerWithAddress;
  let user1: SignerWithAddress;
  let user2: SignerWithAddress;
  let user3: SignerWithAddress;
  let user4: SignerWithAddress;

  async function assertDibsCode(
    address: string,
    codeName: string,
    parentCodeName: string
  ) {
    const addressToCodeName = await dibs.getCodeName(address);
    const _parentCodeName = await dibs.getCodeName(await dibs.parents(address));
    expect(addressToCodeName).to.be.eq(codeName);
    expect(_parentCodeName).to.be.eq(parentCodeName);
  }

  beforeEach(async () => {
    [admin, setter, user1, user2, user3, user4, p1, p2] =
      await ethers.getSigners();
    const Dibs = await ethers.getContractFactory("DibsDegenZoo");
    const args = [
      admin.address,
      setter.address,
      admin.address, // for dibs lottery param, not used
      admin.address, // for weth price param, not used
      0,
      0,
    ];

    dibs = (await upgrades.deployProxy(Dibs, args)) as DibsDegenZoo;
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

    await assertDibsCode(dibs.address, DIBS_CODE_NAME, "");
  });

  it("should register a new code with a valid name and parent code", async () => {
    const user = user1.address;
    const parent = dibs.address;
    const name = "TestCode";

    await dibs.connect(user1)["register(string)"](name);

    await assertDibsCode(user, name, DIBS_CODE_NAME);
    expect(await dibs.parents(user)).to.be.eq(parent);
  });

  it("should not be able to call two argument register", async () => {
    const name = "TestCode";

    await expect(
      dibs.connect(user1)["register(string,bytes32)"](name, await dibs.DIBS())
    ).to.be.revertedWithCustomError(dibs, "NotInternal");
  });
});
