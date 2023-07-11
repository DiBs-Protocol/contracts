// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

contract PairRewarder is AccessControlUpgradeable {
    address public dibs;
    address public pair;

    function initialize(address _dibs, address _pair) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _PairRewarder_init(_dibs, _pair);
    }

    function _PairRewarder_init(
        address _dibs,
        address _pair
    ) internal onlyInitializing {
        dibs = _dibs;
        pair = _pair;
    }
}
