import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers, upgrades } from "hardhat";
import { Dibs, DibsLottery } from "../typechain-types";
import hre from "hardhat";
import { sleep } from "./helpers";

type SchnorrSignStruct = {
  signature: string | BigNumber;
  owner: string;
  nonce: string;
};

type PublicKeyStruct = {
  x: BigNumber;
  parity: number;
};

async function deployMuonInterface() {
  const muonInterfaceFactory = await ethers.getContractFactory(
    "MuonInterfaceV1"
  );
  let admin: SignerWithAddress = await ethers.getSigner(
    process.env.ADMIN_ADDRESS!
  );

  let setter: SignerWithAddress = await ethers.getSigner(
    process.env.ADMIN_ADDRESS!
  );

  // let dibs: Dibs;
  // let dibsLottery: DibsLottery;
  // dibs = await ethers.getContractAt(
  //   "Dibs",
  //   "0x664cE330511653cB2744b8eD50DbA31C6c4C08ca"
  // );

  // dibsLottery = await ethers.getContractAt(
  //   "DibsLottery",
  //   "0x287ed50e4c158dac38e1b7e16c50cd1b2551a300"
  // );

  // let gwAddress = "0x6914c3AF649c285d706d6757DD899D84B606c2dA";
  // let appId =
  //   "29503600283749605679892442018301974903747905228367523023427374612996254935333";

  // let publicKey: PublicKeyStruct;

  // publicKey = {
  //   x: BigNumber.from(
  //     "0x7d9967f214b8d6f4fca8a49c076d52213395771fe976901869ebf77b42b123a1"
  //   ),
  //   parity: 1,
  // };

  // let args = [
  //   admin.address,
  //   setter.address,
  //   dibs.address,
  //   dibsLottery.address,
  //   gwAddress,
  //   appId,
  //   publicKey,
  // ];

  // //@ts-ignore
  // let muonInterface = await upgrades.deployProxy(muonInterfaceFactory, args);
  // await muonInterface.deployed();

  // await muonInterface.deployed();
  // console.log("MuonInterface deployed to:", muonInterface.address);
  // await dibs.connect(setter).setMuonInterface(muonInterface.address);
  // await dibsLottery.connect(setter).setMuonInterface(muonInterface.address);
  // console.log("Access granted to new contract");

  // // get implementation address
  // const implementationAddress = await upgrades.erc1967.getImplementationAddress(
  //   muonInterface.address
  // );

  await hre.run("verify:verify", {
    address: "0x36F13101e0F14F02097250314931FEDff04ab7F1",
    constructorArguments: [],
  });

  // verify the muon interface through etherscan
}

deployMuonInterface()
  .then(() => {
    console.log("Done");
  })
  .catch((err) => {
    console.log(err);
  });
