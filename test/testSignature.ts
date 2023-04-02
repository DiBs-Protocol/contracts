import { MuonInterfaceV1 } from "../typechain-types/contracts/MuonInterface.sol";
import { ethers, upgrades } from "hardhat";
import { BigNumber } from "ethers";
import {
  testOwner,
  testAppId,
  testClaimSig,
  testRounWinnerSig,
  testGwAddress,
  testTss,
  testTss2,
  testTss3,
  testTss4,
  leaderBoardWinnersSing,
} from "./sigs";
import { expect } from "chai";
import { Dibs } from "../typechain-types";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { deployDibs } from "../scripts/deployers";
import { any } from "hardhat/internal/core/params/argumentTypes";
import { deployDibsContract } from "../scripts/deployProxyDibs";

type SchnorrSignStruct = {
  signature: string | BigNumber;
  owner: string;
  nonce: string;
};

type PublicKeyStruct = {
  x: BigNumber;
  parity: number;
};

describe("TestSignature", async () => {
  let dibs: Dibs;
  let muonInterface: MuonInterfaceV1;

  let admin: SignerWithAddress,
    setter: SignerWithAddress,
    dibsUser: SignerWithAddress;

  async function setupMuonInterface(
    publicKey: PublicKeyStruct,
    gwAddress: string,
    appId: string
  ) {
    const muonInterfaceFactory = await ethers.getContractFactory(
      "MuonInterfaceV1"
    );

    const args = [
      admin.address,
      setter.address,
      dibs.address,
      dibs.address,
      gwAddress,
      appId,
      publicKey,
    ];
    const deployer = await upgrades.deployProxy(muonInterfaceFactory, args);
    muonInterface = deployer as MuonInterfaceV1;
    await muonInterface.deployed();
    await dibs.connect(setter).setMuonInterface(muonInterface.address);
  }

  async function setupDibs() {
    [admin, setter, dibsUser] = await ethers.getSigners();
    dibs = await deployDibsContract(
      dibsUser.address,
      admin.address,
      setter.address,
      false
    );
  }

  function getRoundWinnerSignature(): SchnorrSignStruct {
    return {
      signature: testRounWinnerSig.result.signatures[0].signature,
      owner: testRounWinnerSig.result.signatures[0].owner,
      nonce: testRounWinnerSig.result.data.init.nonceAddress,
    };
  }

  function getClaimSignature(): SchnorrSignStruct {
    return {
      signature: testClaimSig.result.signatures[0].signature,
      owner: testClaimSig.result.signatures[0].owner,
      nonce: testClaimSig.result.data.init.nonceAddress,
    };
  }

  before(async () => {
    await setupDibs();
  });

  function getVerificationData(
    sig: any,
    gw: boolean = false
  ): {
    appId: string;
    publicKey: PublicKeyStruct;
    signature: SchnorrSignStruct;
    reqId: string;
    signData: string;
    gwAddress: string;
    gwSignature: string;
  } {
    const appId = sig.result.appId;

    const publicKey: PublicKeyStruct = {
      x: BigNumber.from(sig.result.signatures[0].ownerPubKey.x),
      parity: parseInt(sig.result.signatures[0].ownerPubKey.yParity),
    };
    const signature: SchnorrSignStruct = {
      signature: sig.result.signatures[0].signature,
      owner: sig.result.signatures[0].owner,
      nonce: sig.result.data.init.nonceAddress,
    };
    const reqId = sig.result.reqId;

    let paramsTypes: string[] = [];
    let paramsValues: any[] = [];

    sig.result.data.signParams.forEach(
      (param: { name: string; value: string; type: string }) => {
        if (param.name) return;
        paramsTypes.push(param.type);
        paramsValues.push(param.value);
      }
    );

    // abi.encodePacked the sign params
    const signData = ethers.utils.solidityPack(paramsTypes, paramsValues);

    let gwAddress = "";
    let gwSignature = "";

    if (gw) {
      gwAddress = sig.result.gwAddress;
      gwSignature = sig.result.gwSignature;
      if (!gwSignature) {
        gwSignature = sig.result.shieldSignature;
        gwAddress = sig.result.shieldAddress;
      }
    }

    return {
      appId,
      publicKey,
      signature,
      reqId,
      signData,
      gwAddress,
      gwSignature,
    };
  }

  it("should pass testClaim", async () => {
    let verificationData = getVerificationData(testClaimSig, true);
    await setupMuonInterface(
      verificationData.publicKey,
      verificationData.gwAddress,
      verificationData.appId
    );
    await muonInterface.verifyTSSAndGW(
      verificationData.signData,
      verificationData.reqId,
      verificationData.signature,
      verificationData.gwSignature
    );
  });

  it("should pass testWinner", async () => {
    let verificationData = getVerificationData(testRounWinnerSig, true);
    await setupMuonInterface(
      verificationData.publicKey,
      verificationData.gwAddress,
      verificationData.appId
    );
    await muonInterface.verifyTSSAndGW(
      verificationData.signData,
      verificationData.reqId,
      verificationData.signature,
      verificationData.gwSignature
    );
  });
  it("should pass test top referrer signature", async () => {
    let verificationData = getVerificationData(leaderBoardWinnersSing, true);
    await setupMuonInterface(
      verificationData.publicKey,
      verificationData.gwAddress,
      verificationData.appId
    );

    await muonInterface.setTopReferrers(
      23,
      [
        "0x4bb12cc382e36b4b6faf7bdca7708969aed258ef",
        "0x64c174d4d18be87555bc56ddcd8b71912a4c1811",
        "0x69d3158a17e11fbbdb2a0e7e8bd05ac3628e3630",
        "0x3c9ff2b8ff27c1cb882e9e350d83fb8ac6d647a3",
        "0x1de1ecbb8db25752d52c346aa4eeb9359ab5886e",
        "0x664ce330511653cb2744b8ed50dba31c6c4c08ca",
        "0x2f45724d7e384b38d5c97206e78470544304887f",
        "0x70aa309d485950c0c247be3391d0be621639a380",
      ],
      verificationData.reqId,
      verificationData.signature,
      verificationData.gwSignature
    );
  });
});
