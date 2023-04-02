import { ethers } from 'hardhat'
import { SignerWithAddress } from '@nomiclabs/hardhat-ethers/signers'
import { Dibs, IERC20__factory } from '../typechain-types'
import { deployMockContract, MockContract } from 'ethereum-waffle'
import { expect } from 'chai'
import { BigNumber } from 'ethers'
import { parseBytes32String } from 'ethers/lib/utils'

describe('DIBS', async () => {
  let dibsContract: Dibs
  let tokenA: MockContract
  let tokenB: MockContract

  let admin: SignerWithAddress
  let setter: SignerWithAddress
  let user: SignerWithAddress
  let user2: SignerWithAddress
  let user3: SignerWithAddress
  let user4: SignerWithAddress

  let swapper: SignerWithAddress

  let userCodeName = 'user'
  let user2CodeName = 'user2'
  let user3CodeName = 'user3'
  let user4CodeName = 'user4'

  let bytes32Zero = ethers.utils.formatBytes32String('0')

  let tier0Percentage = 1e5
  let tier1Percentage = 2e5

  let tier0Tickets = 10
  let tier1Tickets = 20

  before(async () => {
    ;[
      admin,
      setter,
      user,
      user2,
      user3,
      user4,
      swapper,
    ] = await ethers.getSigners()
  })

  async function deployContract() {
    const Dibs = await ethers.getContractFactory('Dibs')
    dibsContract = await Dibs.deploy(
      admin.address,
      admin.address,
      setter.address,
    )
    await dibsContract.deployed()
  }

  describe('Register', async () => {
    before(async () => {
      await deployContract()
    })
    it('user should be able to register code name', async () => {
      await dibsContract.connect(user).register(user.address, userCodeName)
      let codeName = await dibsContract.connect(user).getCodeName(user.address)
      expect(codeName).equal(userCodeName)
    })

    it('should be able to register with existing code name', async () => {
      let tx = dibsContract.connect(user2).register(user2.address, userCodeName)
      await expect(tx).to.be.revertedWithCustomError(
        dibsContract,
        'CodeAlreadyExists',
      )
    })

    it('should not be able to register for two codes', async () => {
      let tx = dibsContract.connect(user).register(user.address, user2CodeName)
      await expect(tx).to.be.revertedWithCustomError(
        dibsContract,
        'CodeAlreadyExists',
      )
    })
    it('user2 should be able to register', async () => {
      await dibsContract.connect(user2).register(user2.address, user2CodeName)
      let codeName = await dibsContract
        .connect(user2)
        .getCodeName(user2.address)
      expect(codeName).equal(user2CodeName)
    })
  })

  describe('Reward', async () => {
    beforeEach(async () => {
      await deployContract()
      await dibsContract.connect(user).register(user.address, userCodeName)
      await dibsContract.connect(user2).register(user2.address, user2CodeName)
      tokenA = await deployMockContract(admin, IERC20__factory.abi)
      tokenB = await deployMockContract(admin, IERC20__factory.abi)

      await dibsContract.connect(setter).setTierToPercentage(0, tier0Percentage) // 10 %
      await dibsContract.connect(setter).setTierToPercentage(1, tier1Percentage) // 20 %

      await dibsContract.connect(setter).setTierToTickets(0, tier0Tickets) // 10
      await dibsContract.connect(setter).setTierToTickets(1, tier1Tickets) // 20
    })
    it('user3 should get reward without any referrer', async () => {
      let totalFees = BigNumber.from(1000)
      let volume = BigNumber.from(10000)

      // no referrer => dibs is the parent and grand parent
      // dibs is tier 0 now => 10% of total fees is reward
      let totalReward = totalFees.mul(tier0Percentage).div(1e6)

      await tokenA.mock.transferFrom
        .withArgs(swapper.address, dibsContract.address, totalReward)
        .returns(true)

      await dibsContract
        .connect(swapper)
        .reward(user3.address, bytes32Zero, totalFees, volume, tokenA.address)

      let grandparentPercentage = await dibsContract.grandparentPercentage()
      let dibsPercentage = await dibsContract.dibsPercentage()

      let grandparentCut = totalReward.mul(grandparentPercentage).div(1e6)
      let dibsCut = totalReward.mul(dibsPercentage).div(1e6)

      // parent, grandparent are dibs => dibs gets all the reward
      let dibsBalance = await dibsContract.accBalance(
        tokenA.address,
        dibsContract.address,
      )
      expect(dibsBalance).equal(totalReward)

      // total referred volume
      let totalReferredVolumeParent = await dibsContract.totalReferredVolumeParent(
        tokenA.address,
        dibsContract.address,
      )

      // total referred volume grandparent
      let totalReferredVolumeGrandparent = await dibsContract.totalReferredVolumeGrandparent(
        tokenA.address,
        dibsContract.address,
      )

      // total user generated volume
      let totalUserGeneratedVolume = await dibsContract.totalGeneratedVolume(
        tokenA.address,
        user3.address,
      )

      // all volumes should be the same as the volume
      expect(totalReferredVolumeParent).equal(volume)
      expect(totalReferredVolumeGrandparent).equal(volume)
      expect(totalUserGeneratedVolume).equal(volume)

      // user3 is tier 0 => gets 10 tickets in this round
      let round = await dibsContract.getActiveLotteryRound()
      let user3LotteryCounts = await dibsContract.getUserLotteryRoundsCount(
        user3.address,
      )
      let firstRound = await dibsContract.userLotteryRounds(user3.address, 0)
      let totalTickets = await dibsContract.userLotteryTickets(
        round,
        user3.address,
      )
      expect(user3LotteryCounts).equal(1)
      expect(firstRound).equal(round)
      expect(totalTickets).equal(tier0Tickets)

      // get lottery duration
      let lotteryDuration = await dibsContract.roundDuration()

      // increase time by lottery duration
      await ethers.provider.send('evm_increaseTime', [lotteryDuration])

      // pick winner
      await dibsContract.pickWinner(round)

      // user3 should be the winner
      let winner = await dibsContract.lotteryWinners(round)
      expect(winner).equal(user3.address)
    })

    it('user 4 should get reward with referrer', async () => {
      // set parent of user2 to user
      // if user4 trades with user2 as referrer => user2 is the parent and user is the grandparent
      await dibsContract.connect(setter).setParent(user2.address, user.address)

      // set referrer tier of user2 to 1
      await dibsContract.connect(setter).setReferrerTier(user2.address, 1) // 20%

      // set user tier of user4 to 1
      await dibsContract.connect(setter).setUserTier(user4.address, 1) // 20 tickets

      let totalFees = BigNumber.from(1000)
      let volume = BigNumber.from(10000)

      // user2 is tier 1 now => 20% of total fees is reward
      let totalReward = totalFees.mul(tier1Percentage).div(1e6)

      // user2 code
      let user2Code = await dibsContract.addressToCode(user2.address)

      // mock the reward transfer
      await tokenB.mock.transferFrom
        .withArgs(swapper.address, dibsContract.address, totalReward)
        .returns(true)

      // reward user4 with user2 as referrer
      await dibsContract
        .connect(swapper)
        .reward(user4.address, user2Code, totalFees, volume, tokenB.address)

      // grandparent's cut
      let grandparentPercentage = await dibsContract.grandparentPercentage()
      let grandparentCut = totalReward.mul(grandparentPercentage).div(1e6)

      // dibs cut
      let dibsPercentage = await dibsContract.dibsPercentage()
      let dibsCut = totalReward.mul(dibsPercentage).div(1e6)

      // parent's cut
      let parentsCut = totalReward.sub(grandparentCut).sub(dibsCut)

      // get volumes
      let totalReferredVolumeParent = await dibsContract.totalReferredVolumeParent(
        tokenB.address,
        user2.address,
      )
      let totalReferredVolumeGrandparent = await dibsContract.totalReferredVolumeGrandparent(
        tokenB.address,
        user.address,
      )
      let totalUserGeneratedVolume = await dibsContract.totalGeneratedVolume(
        tokenB.address,
        user4.address,
      )

      /**
       * parent: user2
       * grandparent: user
       */

      // user2 acc balance (parent)
      let user2Balance = await dibsContract.accBalance(
        tokenB.address,
        user2.address,
      )

      // user acc balance (grandparent)
      let userBalance = await dibsContract.accBalance(
        tokenB.address,
        user.address,
      )

      // dibs acc balance
      let dibsBalance = await dibsContract.accBalance(
        tokenB.address,
        dibsContract.address,
      )

      // check balances
      expect(user2Balance).equal(parentsCut)
      expect(userBalance).equal(grandparentCut)
      expect(dibsBalance).equal(dibsCut)

      // check volumes
      expect(totalReferredVolumeParent).equal(volume)
      expect(totalReferredVolumeGrandparent).equal(volume)
      expect(totalUserGeneratedVolume).equal(volume)

      // get user4 parent
      let user4Parent = await dibsContract.parents(user4.address)

      // user4 parent should be user2
      expect(user4Parent).equal(user2.address)

      // get current round
      let round = await dibsContract.getActiveLotteryRound()

      // user4 lottery counts
      let user4LotteryCounts = await dibsContract.getUserLotteryRoundsCount(
        user4.address,
      )

      // user4 first round
      let firstRound = await dibsContract.userLotteryRounds(user4.address, 0)

      // user4 total tickets
      let totalTickets = await dibsContract.userLotteryTickets(
        round,
        user4.address,
      )

      // user4 should have 1 round and 20 tickets
      expect(user4LotteryCounts).equal(1)
      expect(firstRound).equal(round)
      expect(totalTickets).equal(tier1Tickets)

      // user 2 should be able to claim their cut
      await tokenB.mock.transfer
        .withArgs(user2.address, parentsCut)
        .returns(true)

      await dibsContract
        .connect(user2)
        .claim(tokenB.address, parentsCut, user2.address)

      // user 2 remaining balance should be 0
      let accUser2Balance = await dibsContract.accBalance(
        tokenB.address,
        user2.address,
      )
      let claimedUser2Balance = await dibsContract.claimedBalance(
        tokenB.address,
        user2.address,
      )

      let remaining = accUser2Balance.sub(claimedUser2Balance)

      expect(remaining).eq(0)

      // grandparent should have tokenB in their tokens array
      let tokenBAddress = await dibsContract.userTokens(user.address, 0)
      expect(tokenBAddress).equal(tokenB.address)

      // dibs should be able to claim their cut
      await tokenB.mock.transfer.withArgs(admin.address, dibsCut).returns(true)

      await dibsContract
        .connect(admin)
        .claimDIBS(tokenB.address, dibsCut, admin.address)
    })
  })
})
