// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/token/ERC20/IERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC20/utils/SafeERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";

import "./interfaces/IDibs.sol";
import "./interfaces/IPairRewarder.sol";

contract PairRewarder is IPairRewarder, AccessControlUpgradeable {
    using SafeERC20Upgradeable for IERC20Upgradeable;

    address public dibs;
    address public pair;

    LeaderBoardInfo _leaderBoardInfo;
    mapping(uint256 => LeaderBoardWinners) _leaderBoardWinners; // day => winners
    mapping(address => uint256[]) public userLeaderBoardWins; // user => days
    mapping(address => mapping(uint256 => bool)) public userLeaderBoardWonOnDay; // user => day => won
    mapping(address => mapping(uint256 => bool))
        public userLeaderBoardClaimedForDay; // user => day => claimed

    bytes32 public constant SETTER_ROLE = keccak256("SETTER_ROLE");

    function initialize(
        address dibs_,
        address pair_,
        address admin_,
        address setter_
    ) public initializer {
        __AccessControl_init();
        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setupRole(SETTER_ROLE, setter_);
        _PairRewarder_init(dibs_, pair_);
    }

    function _PairRewarder_init(
        address dibs_,
        address pair_
    ) internal onlyInitializing {
        dibs = dibs_;
        pair = pair_;
    }

    function leaderBoardInfo() external view returns (LeaderBoardInfo memory) {
        return _leaderBoardInfo;
    }

    function leaderBoardWinners(
        uint256 day_
    ) external view override returns (LeaderBoardWinners memory) {
        return _leaderBoardWinners[day_];
    }

    function getUserLeaderBoardWins(
        address user_
    ) external view override returns (uint256[] memory) {
        return userLeaderBoardWins[user_];
    }

    function activeDay() public view returns (uint256) {
        return
            uint32(
                (block.timestamp - IDibs(dibs).firstRoundStartTime()) / 1 days
            );
    }

    function claimLeaderBoardReward(uint256 day, address to) external {
        if (!userLeaderBoardWonOnDay[msg.sender][day]) {
            revert NotWinner();
        }

        if (userLeaderBoardClaimedForDay[msg.sender][day]) {
            revert AlreadyClaimed();
        }

        userLeaderBoardClaimedForDay[msg.sender][day] = true;

        LeaderBoardWinners memory winnersInfo = _leaderBoardWinners[day];

        for (uint256 i = 0; i < winnersInfo.winners.length; i++) {
            if (winnersInfo.winners[i] == msg.sender) {
                for (
                    uint256 j = 0;
                    j < winnersInfo.info.rewardTokens.length;
                    j++
                ) {
                    IERC20Upgradeable(winnersInfo.info.rewardTokens[j])
                        .safeTransfer(to, winnersInfo.info.rewardAmounts[j][i]);
                }
                break;
            }
        }

        emit ClaimedLeaderBoardReward(msg.sender, day, to);
    }

    function setTopReferrers(
        uint256 day,
        address[] memory winners
    ) external onlyMuonInterface {
        if (day >= activeDay()) {
            revert DayNotOver();
        }

        if (winners.length > _leaderBoardInfo.winnersCount) {
            revert TooManyWinners();
        }

        if (_leaderBoardWinners[day].winners.length > 0) {
            revert AlreadySet();
        }

        _leaderBoardWinners[day].winners = winners;
        _leaderBoardWinners[day].info = _leaderBoardInfo;

        for (uint256 i = 0; i < winners.length; i++) {
            userLeaderBoardWins[winners[i]].push(day);
            userLeaderBoardWonOnDay[winners[i]][day] = true;
        }

        emit TopReferrersSet(day, winners);
    }

    function setLeaderBoard(
        uint256 winnersCount_,
        address[] memory rewardTokens_,
        uint256[][] memory rewardAmounts_
    ) external onlyRole(SETTER_ROLE) {
        if (rewardTokens_.length != rewardAmounts_.length) {
            revert InvalidInput();
        }

        for (uint256 i = 0; i < rewardTokens_.length; i++) {
            if (
                rewardTokens_[i] == address(0) ||
                rewardAmounts_[i].length != winnersCount_
            ) {
                revert InvalidInput();
            }
        }

        _leaderBoardInfo.winnersCount = winnersCount_;
        _leaderBoardInfo.rewardTokens = rewardTokens_;
        _leaderBoardInfo.rewardAmounts = rewardAmounts_;

        emit LeaderBoardSet(winnersCount_, rewardTokens_, rewardAmounts_);
    }

    modifier onlyMuonInterface() {
        if (msg.sender != IDibs(dibs).muonInterface())
            revert OnlyMuonInterface();
        _;
    }
}
