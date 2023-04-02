// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IDibs {
    function claim(
        address from,
        address token,
        uint256 amount,
        address to,
        uint256 accumulativeBalance
    ) external;

    function dibsLottery() external view returns (address);

    function universalId() external view returns (bytes32);
}
