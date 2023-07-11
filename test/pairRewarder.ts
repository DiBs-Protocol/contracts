import { expect } from "chai";
import { ethers, upgrades } from "hardhat";
import {
  Dibs__factory,
  ERC20__factory,
  PairRewarder,
} from "../typechain-types";
import { MockContract, deployMockContract } from "ethereum-waffle";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";

describe("PairRewarder", () => {
  let pairRewarder: PairRewarder;
  let dibs: MockContract;
  let pair: MockContract;
  let rt1: MockContract; // reward token 1
  let rt2: MockContract; // reward token 2
  let admin: SignerWithAddress;

  async function setupPairRewarder() {
    const PairRewarderFactory = await ethers.getContractFactory("PairRewarder");
    pairRewarder = (await PairRewarderFactory.deploy()) as PairRewarder;
    await pairRewarder.deployed();
  }

  beforeEach(async () => {
    [admin] = await ethers.getSigners();
    pair = await deployMockContract(admin, ERC20__factory.abi);
    rt1 = await deployMockContract(admin, ERC20__factory.abi);
    rt2 = await deployMockContract(admin, ERC20__factory.abi);
    dibs = await deployMockContract(admin, Dibs__factory.abi);

    const PairRewarderFactory = await ethers.getContractFactory("PairRewarder");
    const args = [dibs.address, pair.address];
    pairRewarder = (await upgrades.deployProxy(
      PairRewarderFactory,
      args
    )) as PairRewarder;
    await pairRewarder.deployed();
  });

  it("should have the correct pair and dibs address", async () => {
    expect(await pairRewarder.pair()).to.equal(pair.address);
    expect(await pairRewarder.dibs()).to.equal(dibs.address);
  });
});
