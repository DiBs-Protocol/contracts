# DiBs Integration Guide

## Parameters that you need to decide on

Here is a list of parameters to decide on when integrating DiBs:

- `firstRoundStartTime: number`: Unix timestamp indicating when the first round of the will start. For example: `1687996800`.

- `roundDuration: number`: Duration of each round in seconds. For example: `604800` (equivalent to one week).

- `wethPriceFeed: string`: Ethereum address of the Wrapped Ether (WETH) price feed contract (it should have a chainLink compatible interface). For example: `"0x639Fe6ab55C921f74e7fac1ee960C0B6293ba612"`.

- `lotteryWinnersCounts: number`: Number of winners in each lottery round. For example: `10`.

- `lotteryRewardTokens: string[]`: Array of Ethereum addresses representing the tokens given as rewards in the lottery. For example: `["0xFF970A61A04b1cA14834A43f5dE4533eBDDB5CC8"]`.

- `lotteryRewardAmounts: BigNumber[]`: Array of BigNumber objects indicating the amount of each token given to the lottery winners. The order should match `lotteryRewardTokens`. For example: `[BigNumber.from("150000000")]`.

- `leaderBoardWinnersCount: number`: Number of winners on the leaderboard. For example: `8`.

- `leaderBoardRewardTokens: string[]`: Array of Ethereum addresses representing the tokens given as rewards to the leaderboard winners. For example: `["0x15b2fb8f08e4ac1ce019eadae02ee92aedf06851"]`.

- `leaderBoardRewardAmounts: BigNumber[][]`: 2D array of BigNumber objects indicating the amount of each token given to the leaderboard winners at each position. The outer array's length should match `leaderBoardRewardTokens`, and the inner arrays should contain amounts for each position, matching `leaderBoardWinnersCount`. For example:

  ```javascript
  [
    [
      ethers.utils.parseEther("150"),
      ethers.utils.parseEther("100"),
      ethers.utils.parseEther("80"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
      ethers.utils.parseEther("50"),
    ],
  ];
  ```

# Contract Changes Needed

This document describes the modifications needed for integrating DiBs into your DEX.

## Summary

The integration process is as simple as transferring a static percentage of fees generated to the DiBs contract - a simple ERC20 transfer. The changes are small, and they don't depend on the DiBs contract in any way. Hence, it does not introduce a risk that could cause your pairs to dysfunction should something go wrong with the DiBs contract (for example, a bad upgrade).

You need to modify two contracts:

1. PairFactory
2. Pair

### PairFactory

In the PairFactory contract, add the following views:

- `DiBs`: Address of the DiBs contract, which is unique to your project.
- `MaxReferralFee`: The percentage of fees that will be transferred to the DiBs contract. The scale is 10000.

### Pair

In the Pair contract, refactor the `_update0`, and `_update1` functions as follows:

Add these lines at the beginning of these functions (assuming the pair has access to its factory through `factory` field and the interface is available as `PairFactory`:

```solidity
function _update0(amount) internal{
// get referral fee
address _DiBs = PairFactory(factory).DiBs();
uint256 _maxRef = PairFactory(factory).MaxReferralFee();
uint256 _referralFee = amount * _maxRef / 10000;
_safeTransfer(token0, _DiBs, _referralFee); // transfer the fees out to PairFees
amount -= _referralFee;
...
}

```
