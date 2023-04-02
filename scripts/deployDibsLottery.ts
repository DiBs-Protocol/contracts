import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import hre, { ethers, upgrades } from "hardhat";
import { DibsLottery } from "../typechain-types";

export async function deployDibsLottery(
  firstRoundStartTime: BigNumber,
  roundDuration: BigNumber,
  winnersPerRound: number,
  admin: SignerWithAddress,
  setter: SignerWithAddress,
  verify: boolean = true
): Promise<DibsLottery> {
  const DibsLottery = await ethers.getContractFactory("DibsLottery");

  const args = [
    firstRoundStartTime,
    roundDuration,
    winnersPerRound,
    admin.address,
    setter.address,
  ];

  const dibsLottery = await upgrades.deployProxy(DibsLottery, args);
  await dibsLottery.deployed();

  if (verify) {
    console.log("DibsLottery deployed to:", dibsLottery.address);
  }
  const implementationAddress = await upgrades.erc1967.getImplementationAddress(
    dibsLottery.address
  );

  console.log("Verify", verify);

  if (verify) {
    await hre.run("verify:verify", {
      address: implementationAddress,
      constructorArguments: [],
    });
  }

  return dibsLottery as DibsLottery;
}

async function deploy() {
  const adminAddress = process.env.ADMIN_ADDRESS!;
  const setterAddress = process.env.SETTER_ADDRESS!;

  const admin = await ethers.getSigner(adminAddress);
  const setter = await ethers.getSigner(setterAddress);

  const firstRoundStartTime = BigNumber.from(1673481600);
  const roundDuration = BigNumber.from(7 * 24 * 3600);

  await deployDibsLottery(
    firstRoundStartTime,
    roundDuration,
    8,
    admin,
    setter,
    true
  );
}

// deploy()
//   .then(() => process.exit(0))
//   .catch((error) => {
//     console.error(error);
//     process.exit(1);
//   });
