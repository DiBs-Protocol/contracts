import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { Dibs } from "../typechain-types";
import { ethers, upgrades } from "hardhat";
import { expect } from "chai";

describe("testRegister", async () => {
  let dibs: Dibs;
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
    const Dibs = await ethers.getContractFactory("Dibs");
    const args = [
      admin.address,
      admin.address,
      setter.address,
      admin.address, // for dibs lottery param, not used
      admin.address, // for weth price param, not used
    ];

    dibs = (await upgrades.deployProxy(Dibs, args)) as Dibs;
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

    await assertDibsCode(dibs.address, DIBS_CODE_NAME, "");
  });

  it("should register a new code with a valid name and parent code", async () => {
    const user = user1.address;
    const parent = dibs.address;
    const name = "TestCode";

    await dibs.connect(user1).register(name, dibs.DIBS());

    await assertDibsCode(user, name, DIBS_CODE_NAME);
    expect(await dibs.parents(user)).to.be.eq(parent);
  });

  it("should revert when attempting to register a new code with a zero-length name", async () => {
    const parentCode = await dibs.getCode(DIBS_CODE_NAME);
    const name = "";

    await expect(
      dibs.connect(user1).register(name, parentCode)
    ).to.be.revertedWithCustomError(dibs, "ZeroValue");
  });
  it("should revert when attempting to register a new code with a name that is already assigned to another address", async () => {
    const parentCode = await dibs.getCode(DIBS_CODE_NAME);
    const name = "MyCode";

    // Register code with name "MyCode" to user1
    await dibs.connect(user1).register(name, parentCode);

    // Attempt to register code with same name to user2
    await expect(
      dibs.connect(user2).register(name, parentCode)
    ).to.be.revertedWithCustomError(dibs, "CodeAlreadyExists");
  });

  it("should revert when attempting to register a new code from an address that is already assigned to a code", async () => {
    const parentCode = await dibs.getCode(DIBS_CODE_NAME);
    const name1 = "MyCode1";
    const name2 = "MyCode2";

    // Register code with name "MyCode1" to user1
    await dibs.connect(user1).register(name1, parentCode);

    // Attempt to register code with name "MyCode2" to user1
    await expect(
      dibs.connect(user1).register(name2, parentCode)
    ).to.be.revertedWithCustomError(dibs, "CodeAlreadyExists");
  });
  it("should revert when attempting to register a new code with a parent code that does not exist", async () => {
    const nonExistentParentCode = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes("NonExistentParentCode")
    );
    const name = "MyCode";

    // Attempt to register code with name "MyCode" and non-existent parent code to user1
    await expect(
      dibs.connect(user1).register(name, nonExistentParentCode)
    ).to.be.revertedWithCustomError(dibs, "CodeDoesNotExist");
  });
  it("should register multiple codes with different names and parent codes and verify that all codes are correctly registered", async () => {
    const parent1Name = "ParentCode1";
    const parent2Name = "ParentCode2";
    const code1Name = "Code1";
    const code2Name = "Code2";
    const code3Name = "Code3";
    const code4Name = "Code4";
    const parent1 = await dibs.getCode(parent1Name);
    const parent2 = await dibs.getCode(parent2Name);

    // register parents
    await dibs.connect(p1).register(parent1Name, dibs.getCode("DIBS"));
    await dibs.connect(p2).register(parent2Name, dibs.getCode("DIBS"));

    // Register new codes with different names and parent codes to user1
    await dibs.connect(user1).register(code1Name, dibs.getCode("DIBS"));
    await dibs.connect(user2).register(code2Name, parent1);
    await dibs.connect(user3).register(code3Name, parent2);
    await dibs.connect(user4).register(code4Name, dibs.getCode("DIBS"));

    // Verify that all codes are correctly registered
    await assertDibsCode(user1.address, code1Name, "DIBS");
    await assertDibsCode(user2.address, code2Name, parent1Name);
    await assertDibsCode(user3.address, code3Name, parent2Name);
    await assertDibsCode(user4.address, code4Name, "DIBS");
  });
  it("should register multiple codes with different names and parent codes", async () => {
    const parent1Name = "ParentCode1";
    const parent2Name = "ParentCode2";

    // register parent codes
    await dibs.connect(p1).register(parent1Name, dibs.getCode("DIBS"));
    await dibs.connect(p2).register(parent2Name, dibs.getCode("DIBS"));

    const parent1Code = await dibs.getCode(parent1Name);
    const parent2Code = await dibs.getCode(parent2Name);

    await dibs.connect(user1).register("Code1", parent1Code);
    await dibs.connect(user2).register("Code2", parent2Code);
    await dibs.connect(user3).register("Code3", parent1Code);
    await dibs.connect(user4).register("Code4", parent2Code);

    await assertDibsCode(user1.address, "Code1", parent1Name);
    await assertDibsCode(user2.address, "Code2", parent2Name);
    await assertDibsCode(user3.address, "Code3", parent1Name);
    await assertDibsCode(user4.address, "Code4", parent2Name);
  });
  it("should register a new code with a parent code that is already assigned to another address", async () => {
    // register parent codes
    await dibs
      .connect(p1)
      .register("ParentCode1", dibs.getCode(DIBS_CODE_NAME));
    await dibs
      .connect(p2)
      .register("ParentCode2", dibs.getCode(DIBS_CODE_NAME));

    // register a code with parent as "ParentCode1"
    await dibs.connect(user1).register("Code1", dibs.getCode("ParentCode1"));

    // register a code with parent as "ParentCode2"
    await dibs.connect(user3).register("Code3", dibs.getCode("ParentCode2"));

    // verify that all codes are correctly registered
    await assertDibsCode(user1.address, "Code1", "ParentCode1");
    await assertDibsCode(user3.address, "Code3", "ParentCode2");
  });
});
