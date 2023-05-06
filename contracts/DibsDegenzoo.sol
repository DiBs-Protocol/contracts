// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "./Dibs.sol";

contract DibsDegenZoo is Dibs {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    bool _internal;

    error NotInternal();

    modifier onlyInternal() {
        if (!_internal) revert NotInternal();
        _;
    }

    function register(string memory name) public {
        _internal = true;
        register(name, DIBS);
        _internal = false;
    }

    /// @notice register a new code
    /// @param name the name of the code
    /// @param parentCode the parent to set for the code
    function register(
        string memory name,
        bytes32 parentCode
    ) public override onlyInternal {
        address user = msg.sender;

        // revert if code is zero
        if (bytes(name).length == 0) {
            revert ZeroValue();
        }

        bytes32 code = getCode(name);

        // revert if code is already assigned to another address
        if (codeToAddress[code] != address(0)) {
            revert CodeAlreadyExists();
        }

        // revert if address is already assigned to a code
        if (addressToCode[user] != bytes32(0)) {
            revert CodeAlreadyExists();
        }

        address parentAddress = codeToAddress[parentCode];

        // validate if parent code exists
        if (parentAddress == address(0)) {
            revert CodeDoesNotExist();
        }

        // register the code for the user
        addressToCode[user] = code;
        codeToAddress[code] = user;
        codeToName[code] = name;
        parents[user] = parentAddress;

        emit Register(user, code, name, parents[user]);
    }
}
