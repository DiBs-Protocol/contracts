// SPDX-License-Identifier: MIT

/// @title Muon Interface
/// @author DIBS (spsina)
/// @notice This contract is used to interact with the Muon protocol and DIBS contract

pragma solidity ^0.8.13;
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "../interfaces/IDibs.sol";
import "../interfaces/IDibsLottery.sol";

contract MockMuonInterfaceV1 is AccessControlUpgradeable {
    using ECDSA for bytes32;
    bytes32 public constant SETTER = keccak256("SETTER");

    // ======== STATE VARIABLES ========

    address public dibs;
    address public dibsLottery;

    // ======== CONSTRUCTOR ========

    function initialize(
        address admin_,
        address setter_,
        address dibs_,
        address dibsLottery_
    ) public initializer {
        __AccessControl_init();
        __MuonInterface_init(admin_, setter_, dibs_, dibsLottery_);
    }

    function __MuonInterface_init(
        address admin_,
        address setter_,
        address dibs_,
        address dibsLottery_
    ) public onlyInitializing {
        dibs = dibs_;
        dibsLottery = dibsLottery_;

        _grantRole(DEFAULT_ADMIN_ROLE, admin_);
        _grantRole(SETTER, setter_);
    }

    // ======== PUBLIC FUNCTIONS ========

    event Claimed(address indexed user, address indexed token, uint256 amount);

    /// @notice withdraws tokens from Dibs contract on behalf of a user
    /// @param user user address
    /// @param token token address
    /// @param to address to send the tokens to
    /// @param accumulativeBalance accumulative balance of the user
    /// @param amount amount of tokens to withdraw
    function claim(
        address user,
        address token,
        address to,
        uint256 accumulativeBalance,
        uint256 amount
    ) external {
        IDibs(dibs).claim(user, token, amount, to, accumulativeBalance);
        emit Claimed(user, token, amount);
    }

    event RoundWinnerSet(uint32 indexed round, address[] winner);

    /// @notice sets the winner of a round
    /// @param round round number
    /// @param winners winner addresses
    function setRoundWinners(uint32 round, address[] memory winners) external {
        IDibsLottery(dibsLottery).setRoundWinners(round, winners);
        emit RoundWinnerSet(round, winners);
    }

    event TopReferrersSet(uint256 indexed day, address[] topReferrers);

    function setTopReferrers(uint32 day, address[] memory topReferrers)
        external
    {
        IDibsLottery(dibsLottery).setTopReferrers(day, topReferrers);
        emit TopReferrersSet(day, topReferrers);
    }

    // ======== RESTRICTED FUNCTIONS ========

    event SetDibs(address _old, address _new);

    /// @notice sets the Dibs contract address
    /// @param dibs_ Dibs contract address
    function setDibs(address dibs_) external onlyRole(SETTER) {
        emit SetDibs(dibs, dibs_);
        dibs = dibs_;
    }

    event SetDibsLottery(address _old, address _new);

    /// @notice sets the Dibs Lottery contract address
    /// @param dibsLottery_ Dibs Lottery contract address
    function setDibsLottery(address dibsLottery_) external onlyRole(SETTER) {
        emit SetDibsLottery(dibsLottery, dibsLottery_);
        dibsLottery = dibsLottery_;
    }
}
