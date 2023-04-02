import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { ethers } from "hardhat";

export async function deployDibs(
  deployer: SignerWithAddress,
  dibsAddress: string,
  adminAddress: string,
  setterAddress: string
) {
  let args = [dibsAddress, adminAddress, setterAddress];

  const dibsFactory = await ethers.getContractFactory("Dibs");

  //@ts-ignore
  const dibs = await dibsFactory.connect(deployer).deploy(...args);

  await dibs.deployed();

  return dibs;
}
