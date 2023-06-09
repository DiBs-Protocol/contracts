import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { expect } from "chai";
import { deployMockContract, MockContract } from "ethereum-waffle";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import {
  DibsRandomSeedGenerator__factory,
  DibsRepository,
} from "../typechain-types";

import { getCurrentTimeStamp } from "./timeUtils";

describe("DibsRepository", async () => {
  let dibsRepository: DibsRepository;
  let seedGenerator: MockContract;
  let admin: SignerWithAddress;
  let setter: SignerWithAddress;

  let user1: SignerWithAddress;
  let user2: SignerWithAddress;

  let p1 = [
    1, // chainId
    "0x0000000000000000000000000000000000000001", // dibs
    "https//subgraph.com", // subgraphEndpoint
    0, // first round start time
    100, // duration
  ];

  let p2 = [
    2, // chainId
    "0x0000000000000000000000000000000000000002", // dibs
    "https//subgraph.com", // subgraphEndpoint
    0, // first round start time
    60 * 60 * 24 * 7, // duration 1 week
  ];

  beforeEach(async () => {
    [admin, user1, user2, setter] = await ethers.getSigners();
    seedGenerator = await deployMockContract(
      admin,
      DibsRandomSeedGenerator__factory.abi
    );
    const DibsRepository = await ethers.getContractFactory("DibsRepository");

    dibsRepository = (await upgrades.deployProxy(DibsRepository, [
      admin.address,
      setter.address,
      seedGenerator.address,
    ])) as DibsRepository;

    await dibsRepository.deployed();
  });

  it("should add new project", async () => {
    const chaindId = 1;
    const dibsAddress = "0x0000000000000000000000000000000000000001";
    await dibsRepository
      .connect(setter)
      .addProject(chaindId, dibsAddress, "https://subgraph.com", 0, 100);

    const prjId = await dibsRepository.getProjectId(chaindId, dibsAddress);

    const project = await dibsRepository.projects(prjId);

    expect(project.chainId).to.equal(chaindId);
    expect(project.dibs).to.equal(dibsAddress);
    expect(project.subgraphEndpoint).to.equal("https://subgraph.com");
    expect(project.firstRoundStartTime).to.equal(0);
    expect(project.roundDuration).to.equal(100);
    expect(project.exists).to.be.true;
  });

  it("should add multiple projects", async () => {
    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p1);

    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p2);

    //@ts-ignore
    const prjId1 = await dibsRepository.getProjectId(p1[0], p1[1]);

    //@ts-ignore
    const prjId2 = await dibsRepository.getProjectId(p2[0], p2[1]);

    const prj1 = await dibsRepository.projects(prjId1);
    const prj2 = await dibsRepository.projects(prjId2);

    expect(prj1.chainId).to.equal(p1[0]);
    expect(prj1.dibs).to.equal(p1[1]);
    expect(prj1.subgraphEndpoint).to.equal(p1[2]);
    expect(prj1.firstRoundStartTime).to.equal(p1[3]);
    expect(prj1.roundDuration).to.equal(p1[4]);

    expect(prj2.chainId).to.equal(p2[0]);
    expect(prj2.dibs).to.equal(p2[1]);
    expect(prj2.subgraphEndpoint).to.equal(p2[2]);
    expect(prj2.firstRoundStartTime).to.equal(p2[3]);
    expect(prj2.roundDuration).to.equal(p2[4]);

    expect(prj1.exists).to.be.true;
    expect(prj2.exists).to.be.true;
  });

  it("should be able to update subgraph endpoint after adding projects", async () => {
    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p1);

    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p2);

    //@ts-ignore
    const prjId1 = await dibsRepository.getProjectId(p1[0], p1[1]);

    //@ts-ignore
    const prjId2 = await dibsRepository.getProjectId(p2[0], p2[1]);

    await dibsRepository
      .connect(setter)
      .updateSubgraphEndpoint(prjId1, "https://subgraph2.com");

    const prj1 = await dibsRepository.projects(prjId1);
    const prj2 = await dibsRepository.projects(prjId2);

    expect(prj1.subgraphEndpoint).to.equal("https://subgraph2.com");
    expect(prj2.subgraphEndpoint).to.equal(p2[2]);
  });

  it("should add the registered project into allProjects array", async () => {
    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p1);

    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p2);

    //@ts-ignore
    const prjId1 = await dibsRepository.getProjectId(p1[0], p1[1]);

    //@ts-ignore
    const prjId2 = await dibsRepository.getProjectId(p2[0], p2[1]);

    const allProjects = await dibsRepository.getAllProjectIds();
    const len = await dibsRepository.allProjectIdsLength();

    expect(allProjects[0]).to.equal(prjId1);
    expect(allProjects[1]).to.equal(prjId2);
    expect(len).eq(2);
  });

  it("should return correct chain projects after adding projects", async () => {
    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p1);

    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p2);

    const chain1Projects = await dibsRepository.getChainProjects(p1[0]);
    const chain2Projects = await dibsRepository.getChainProjects(p2[0]);

    expect(chain1Projects[0].dibs).to.equal(p1[1]);
    expect(chain2Projects[0].dibs).to.equal(p2[1]);
  });

  it("should be able to request random seed for project 1", async () => {
    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p1);

    //@ts-ignore
    const prjId1 = await dibsRepository.getProjectId(p1[0], p1[1]);
    const round0Id = await dibsRepository._getRoundId(prjId1, 0);

    await seedGenerator.mock.requestRandomSeed.withArgs(round0Id).returns(0);
    await dibsRepository.connect(user1).requestRandomSeed(prjId1, 0);
  });

  it("should not be able to request random seed for project 2", async () => {
    const currentTimestamp = await getCurrentTimeStamp();
    p2[3] = currentTimestamp;

    //@ts-ignore
    await dibsRepository.connect(setter).addProject(...p2);

    //@ts-ignore
    const prjId2 = await dibsRepository.getProjectId(p2[0], p2[1]);
    const round0Id = await dibsRepository._getRoundId(prjId2, 0);

    await expect(
      dibsRepository.connect(user1).requestRandomSeed(prjId2, 0)
    ).to.be.revertedWithCustomError(dibsRepository, "RoundNotOver");
  });

  it("should not allow request random seed for non existing project", async () => {
    //@ts-ignore
    const prjId2 = await dibsRepository.getProjectId(p2[0], p2[1]);

    await expect(
      dibsRepository.connect(user1).requestRandomSeed(prjId2, 0)
    ).to.be.revertedWithCustomError(dibsRepository, "InvalidProject");
  });

  it("should get seed", async () => {
    //@ts-ignore
    const roundId = await dibsRepository.getRoundId(1, p1[1], 0);
    await seedGenerator.mock.getSeed
      .withArgs(roundId)
      .returns(true, BigNumber.from(123));

    const randomSeed = await dibsRepository.getSeed(roundId);

    expect(randomSeed.seed).to.equal(123);
  });
});
