// SPDX-License-Identifier: MIT

/// @title Dibs Random Seed Generator
/// @author DIBS (spsina)
/// @notice This contract generates a random seed for the lottery

pragma solidity ^0.8.13;

interface IDibsSeedGenerator {
    function requestRandomSeed(bytes32 roundId) external;

    function getSeed(bytes32 roundId) external view returns (bool, uint256);

    function acceptOwnership() external;
}
