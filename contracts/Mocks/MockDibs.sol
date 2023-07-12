// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

contract MockDibs {
    uint256 public firstRoundStartTime = 1673481600;

    address public muonInterface;

    constructor(address _muonInterface) {
        muonInterface = _muonInterface;
    }

    function setMuonInterface(address _muonInterface) external {
        muonInterface = _muonInterface;
    }
}
