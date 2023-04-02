import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { BigNumber } from "ethers";
import { ethers } from "hardhat";
import { IERC20, SwapRouter } from "../typechain-types";

async function fundAccounts(
  admin: SignerWithAddress,
  accounts: SignerWithAddress[]
) {
  for (let i = 0; i < accounts.length; i++) {
    let tx = await admin.sendTransaction({
      to: accounts[i].address,
      value: ethers.utils.parseEther("0.008"),
    });
    await tx.wait(1);
    console.log("funded account: ", accounts[i].address);
  }
}

async function register(
  dibs: any,
  admin: SignerWithAddress,
  gp: SignerWithAddress,
  parent1and2: SignerWithAddress,
  parent3and4: SignerWithAddress,
  user1: SignerWithAddress,
  user2: SignerWithAddress,
  user3: SignerWithAddress,
  user4: SignerWithAddress
) {
  //   register gp in dibs
  let tx = await dibs
    .connect(admin)
    .register(gp.address, "test_gp", await dibs.DIBS());
  await tx.wait(1);
  console.log("registered gp");

  tx = await dibs
    .connect(admin)
    .register(
      parent1and2.address,
      "test_parent_1_2",
      await dibs.addressToCode(gp.address)
    );
  await tx.wait(1);

  console.log("parent 1 2 registered");

  tx = await dibs
    .connect(admin)
    .register(
      parent3and4.address,
      "test_parent_3_4",
      await dibs.addressToCode(gp.address)
    );
  await tx.wait(1);

  console.log("parent 3 4 registered");

  tx = await dibs
    .connect(admin)
    .register(
      user1.address,
      "test_user_1",
      await dibs.addressToCode(parent1and2.address)
    );
  await tx.wait(2);

  console.log("user 1 registered");

  tx = await dibs
    .connect(admin)
    .register(
      user2.address,
      "test_user_2",
      await dibs.addressToCode(parent1and2.address)
    );
  await tx.wait(2);

  console.log("user 2 registered");

  tx = await dibs
    .connect(admin)
    .register(
      user3.address,
      "test_user_3",
      await dibs.addressToCode(parent3and4.address)
    );
  await tx.wait(2);

  console.log("user 3 registered");

  tx = await dibs
    .connect(admin)
    .register(
      user4.address,
      "test_user_4",
      await dibs.addressToCode(parent3and4.address)
    );
  await tx.wait(2);

  console.log("user 4 registered");
}

async function fundBUSD(
  BUSD: any,
  admin: SignerWithAddress,
  accounts: SignerWithAddress[]
) {
  for (let i = 0; i < accounts.length; i++) {
    let tx = await BUSD.connect(admin).transfer(
      accounts[i].address,
      ethers.utils.parseEther("0.000001")
    );
    await tx.wait(1);
    console.log("funded account: ", accounts[i].address);
  }
}

async function approveAndSwap(
  BUSD: IERC20,
  BSC_USD: IERC20,
  router: SwapRouter,
  user: SignerWithAddress
) {
  // approve router to spend BUSD
  let tx = await BUSD.connect(user).approve(
    router.address,
    BigNumber.from("10000000000")
  );
  await tx.wait(1);

  console.log("approved ", user.address);

  // swap BUSD for BSC-USD through router

  tx = await router
    .connect(user)
    .swapExactTokensForTokensSimple(
      BigNumber.from("10000000000"),
      BigNumber.from("8000000000"),
      BUSD.address,
      BSC_USD.address,
      true,
      user.address,
      1970418853
    );
  await tx.wait(1);

  console.log("swapped ", user.address);
}

async function makeSwaps(
  BUSD: IERC20,
  BSC_USD: IERC20,
  router: SwapRouter,
  accounts: SignerWithAddress[]
) {
  //  approve and swap for each account
  for (let i = 0; i < accounts.length; i++) {
    await approveAndSwap(BUSD, BSC_USD, router, accounts[i]);
  }
}

async function testSwaps() {
  const dibs = await ethers.getContractAt(
    "Dibs",
    "0x664cE330511653cB2744b8eD50DbA31C6c4C08ca"
  );

  const BUSD = await ethers.getContractAt(
    "IERC20",
    "0xe9e7CEA3DedcA5984780Bafc599bD69ADd087D56"
  );

  const BSC_USD = await ethers.getContractAt(
    "IERC20",
    "0x55d398326f99059fF775485246999027B3197955"
  );

  const router = await ethers.getContractAt(
    "SwapRouter",
    "0xd4ae6eCA985340Dd434D38F470aCCce4DC78D109"
  );

  let admin = await ethers.getSigner(process.env.ADMIN_ADDRESS!);
  let gp = await ethers.getSigner(process.env.GP_ADDRESS!);
  let parent1and2 = await ethers.getSigner(process.env.PARENT_1_2_ADDRESS!);
  let parent3and4 = await ethers.getSigner(process.env.PARENT_3_4_ADDRESS!);
  let user1 = await ethers.getSigner(process.env.USER_1_ADDRESS!);
  let user2 = await ethers.getSigner(process.env.USER_2_ADDRESS!);
  let user3 = await ethers.getSigner(process.env.USER_3_ADDRESS!);
  let user4 = await ethers.getSigner(process.env.USER_4_ADDRESS!);

  await approveAndSwap(BUSD, BSC_USD, router, parent1and2);
}

testSwaps()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
