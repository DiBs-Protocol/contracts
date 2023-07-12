// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

interface IPairRewarder {
    struct LeaderBoardInfo {
        uint256 winnersCount;
        address[] rewardTokens;
        uint256[][] rewardAmounts;
    }

    struct LeaderBoardWinners {
        LeaderBoardInfo info;
        address[] winners;
    }

    function leaderBoardInfo() external view returns (LeaderBoardInfo memory);

    function leaderBoardWinners(
        uint256 day
    ) external view returns (LeaderBoardWinners memory);

    function getUserLeaderBoardWins(
        address user
    ) external view returns (uint256[] memory);

    event LeaderBoardSet(
        uint256 winnersCount,
        address[] rewardTokens,
        uint256[][] rewardAmounts
    );

    event ClaimedLeaderBoardReward(
        address indexed user,
        uint256 day,
        address to
    );

    event TopReferrersSet(uint256 day, address[] winners);

    error InvalidInput();
    error OnlyMuonInterface();
    error DayNotOver();
    error TooManyWinners();
    error AlreadySet();
    error NotWinner();
    error AlreadyClaimed();
}
