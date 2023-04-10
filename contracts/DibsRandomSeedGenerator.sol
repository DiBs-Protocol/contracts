// SPDX-License-Identifier: MIT

/// @title Dibs Random Seed Generator
/// @author DIBS (spsina)
/// @notice This contract generates a random seed for the lottery

pragma solidity ^0.8.13;

import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "./interfaces/IDibsLottery.sol";

contract DibsRandomSeedGenerator is VRFConsumerBaseV2, ConfirmedOwner {
    // =================== STATE VARIABLES =================== //

    VRFCoordinatorV2Interface public COORDINATOR;
    uint64 public subscriptionId;

    bytes32 public keyHash;
    uint32 public callbackGasLimit = 100000;
    uint16 public requestConfirmations = 3;

    struct SeedRequestStatus {
        bool fulfilled; // whether the request has been successfully fulfilled
        bool exists; // whether a requestId exists
        bytes32 roundId; // the roundId that a seed is being requested for
        uint256 requestId; // the requestId
        uint256 seed; // the seed value
    }

    mapping(uint256 => SeedRequestStatus) public seedRequests; // requestId => SeedRequestStatus
    mapping(bytes32 => uint256) public roundToRequestId; // roundId => requestId
    mapping(bytes32 => uint256) public roundToSeed; // roundId => seed

    // =================== ERRORS =================== //

    error SeedExists();
    error RequestIdNotExists();

    // =================== CONSTRUCTOR =================== //
    constructor(
        address VRFCoordinator_,
        uint64 subscriptionId_,
        bytes32 keyHash_
    ) VRFConsumerBaseV2(VRFCoordinator_) ConfirmedOwner(msg.sender) {
        COORDINATOR = VRFCoordinatorV2Interface(VRFCoordinator_);
        subscriptionId = subscriptionId_;
        keyHash = keyHash_;
    }

    // =================== PUBLIC VIEWS =================== //

    /// @notice query the status of a seed request
    /// @param requestId_ The requestId for which the seed is requested
    function getRequestStatus(
        uint256 requestId_
    ) public view returns (bool fulfilled, uint256 seed) {
        if (!seedRequests[requestId_].exists) revert RequestIdNotExists();
        SeedRequestStatus memory request = seedRequests[requestId_];
        fulfilled = request.fulfilled;
        seed = request.seed;
    }

    /// @notice query the status of a seed request
    /// @param roundId_ The roundId for which the seed is requested
    function getSeed(
        bytes32 roundId_
    ) external view returns (bool fulfilled, uint256 seed) {
        (fulfilled, seed) = getRequestStatus(roundToRequestId[roundId_]);
    }

    // =================== PUBLIC FUNCTIONS =================== //

    event SeedRequested(bytes32 roundId, uint256 requestId);

    /// @notice Requests a random seed from ChainLink VRF
    /// @param roundId The roundId for which the seed is requested
    /// @return requestId The requestId of the request
    function requestRandomSeed(
        bytes32 roundId
    ) external onlyOwner returns (uint256 requestId) {
        // if request for current roundId already exists, revert
        if (seedRequests[roundToRequestId[roundId]].exists) {
            revert SeedExists();
        }

        // Will revert if subscription is not set and funded.
        requestId = COORDINATOR.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        seedRequests[requestId] = SeedRequestStatus({
            fulfilled: false,
            exists: true,
            roundId: roundId,
            requestId: requestId,
            seed: 0
        });

        roundToRequestId[roundId] = requestId;

        emit SeedRequested(roundId, requestId);
        return requestId;
    }

    // =================== INTERNAL FUNCTIONS =================== //

    event SeedFulfilled(bytes32 roundId, uint256 seed);

    /// @notice Fulfill the random seed request
    /// @param requestId_ The requestId of the request
    /// @param randomWords_ The randomness returned by ChainLink VRF
    function fulfillRandomWords(
        uint256 requestId_,
        uint256[] memory randomWords_
    ) internal override {
        if (!seedRequests[requestId_].exists) revert RequestIdNotExists();
        seedRequests[requestId_].fulfilled = true;
        seedRequests[requestId_].seed = randomWords_[0];
        emit SeedFulfilled(
            seedRequests[requestId_].roundId,
            seedRequests[requestId_].seed
        );
    }

    // =================== SETTERS =================== //

    event SetSubscriptionId(uint64 _old, uint64 _new);

    /// @notice Set the subscriptionId
    /// @param subscriptionId_ The subscriptionId
    function setSubscriptionId(uint64 subscriptionId_) external onlyOwner {
        emit SetSubscriptionId(subscriptionId, subscriptionId_);
        subscriptionId = subscriptionId_;
    }

    event SetKeyHash(bytes32 _old, bytes32 _new);

    /// @notice Set the keyHash
    /// @param keyHash_ The keyHash
    function setKeyHash(bytes32 keyHash_) external onlyOwner {
        emit SetKeyHash(keyHash, keyHash_);
        keyHash = keyHash_;
    }

    event SetCallbackGasLimit(uint32 _old, uint32 _new);

    /// @notice Set the callbackGasLimit
    /// @param callbackGasLimit_ The callbackGasLimit
    function setCallbackGasLimit(uint32 callbackGasLimit_) external onlyOwner {
        emit SetCallbackGasLimit(callbackGasLimit, callbackGasLimit_);
        callbackGasLimit = callbackGasLimit_;
    }

    event SetRequestConfirmations(uint16 _old, uint16 _new);

    /// @notice Set the requestConfirmations
    /// @param requestConfirmations_ The requestConfirmations
    function setRequestConfirmations(
        uint16 requestConfirmations_
    ) external onlyOwner {
        emit SetRequestConfirmations(
            requestConfirmations,
            requestConfirmations_
        );
        requestConfirmations = requestConfirmations_;
    }
}
