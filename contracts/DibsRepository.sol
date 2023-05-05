// SPDX-License-Identifier: MIT

pragma solidity ^0.8.13;

import "@openzeppelin/contracts-upgradeable/access/AccessControlUpgradeable.sol";
import "./interfaces/IDibsSeedGenerator.sol";

struct Project {
    uint256 chainId;
    address dibs;
    string subgraphEndpoint;
    uint32 firstRoundStartTime; // should not be changed after its set
    uint32 roundDuration; // should not be changed after its set
    bool exists;
}

library ProjectUtils {
    function getActiveLotteryRound(
        Project memory prj
    ) internal view returns (uint32) {
        return
            uint32(
                (block.timestamp - prj.firstRoundStartTime) / prj.roundDuration
            );
    }

    function getActiveDay(Project memory prj) internal view returns (uint32) {
        return uint32((block.timestamp - prj.firstRoundStartTime) / 1 days);
    }
}

contract DibsRepository is AccessControlUpgradeable {
    using ProjectUtils for Project;

    address public seedGenerator;

    mapping(bytes32 => Project) public projects; // projectId => Project

    bytes32 public constant SETTER = keccak256("SETTER");

    bytes32[] public allProjects;

    error DuplicateProject();
    error InvalidProject();
    error RoundNotOver();

    event ProjectAdded(bytes32 indexed projectId, Project prj);
    event SubgraphEndpointUpdated(
        bytes32 indexed projectId,
        string subgraphEndpoint
    );
    event SeedRequested(bytes32 projectId, bytes32 roundId, uint32 round);
    event SetSeedGenerator(address old_, address new_);

    // initializer
    function initialize(
        address admin_,
        address setter_,
        address seedGenerator_
    ) public initializer {
        __AccessControl_init();
        __DibsRepository_init(admin_, setter_, seedGenerator_);
    }

    function __DibsRepository_init(
        address admin_,
        address setter_,
        address seedGenerator_
    ) internal onlyInitializing {
        _setupRole(DEFAULT_ADMIN_ROLE, admin_);
        _setupRole(SETTER, setter_);

        seedGenerator = seedGenerator_;
    }

    /// Generates a unique projectId from the chainId and dibs contract address
    /// @param chainId Chain ID of the contract
    /// @param dibsContractAddress Address of the dibs contract
    /// @return Unique projectId
    function getProjectId(
        uint256 chainId,
        address dibsContractAddress
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(chainId, dibsContractAddress));
    }

    /// Generates a unique roundId from the chainId, dibs contract address and round number
    /// @param chainId Chain ID of the contract
    /// @param dibsContractAddress Address of the dibs contract
    /// @param round Round number
    function getRoundId(
        uint256 chainId,
        address dibsContractAddress,
        uint32 round
    ) public pure returns (bytes32) {
        return _getRoundId(getProjectId(chainId, dibsContractAddress), round);
    }

    /// Generates a unique roundId from the projectId and round number
    /// @param projectId Unique projectId for a project
    /// @param round Round number
    /// @return Unique roundId for a project and round number
    function _getRoundId(
        bytes32 projectId,
        uint32 round
    ) public pure returns (bytes32) {
        return keccak256(abi.encodePacked(projectId, round));
    }

    function getAllProjects() external view returns (bytes32[] memory) {
        return allProjects;
    }

    /// @notice add a project - *you can only update the subgraph endpoint later*
    /// @param chainId chain id of the contract
    /// @param dibs dibs contract address
    /// @param subgraphEndpoint subgraph endpoint
    /// @param firstRoundStartTime first lottery round start time
    /// @param roundDuration duration of each round
    function addProject(
        uint256 chainId,
        address dibs,
        string memory subgraphEndpoint,
        uint32 firstRoundStartTime,
        uint32 roundDuration
    ) external onlyRole(SETTER) {
        bytes32 projectId = getProjectId(chainId, dibs);

        if (projects[projectId].exists) revert DuplicateProject();

        projects[projectId] = Project(
            chainId,
            dibs,
            subgraphEndpoint,
            firstRoundStartTime,
            roundDuration,
            true
        );

        allProjects.push(projectId);

        emit ProjectAdded(projectId, projects[projectId]);
    }

    /// @notice updates the subgraph endpoint
    /// @param projectId project id
    /// @param subgraphEndpoint new subgraph endpoint
    function updateSubgraphEndpoint(
        bytes32 projectId,
        string memory subgraphEndpoint
    ) external onlyRole(SETTER) {
        if (!projects[projectId].exists) revert InvalidProject();
        projects[projectId].subgraphEndpoint = subgraphEndpoint;
        emit SubgraphEndpointUpdated(projectId, subgraphEndpoint);
    }

    /// @notice request a random seed for the specified round of the given project
    /// @dev round must be over. also reverts if already requested
    /// @param projectId project Id
    /// @param round round
    function requestRandomSeed(bytes32 projectId, uint32 round) external {
        if (!projects[projectId].exists) revert InvalidProject();

        if (projects[projectId].getActiveLotteryRound() <= round)
            revert RoundNotOver();

        bytes32 roundId = _getRoundId(projectId, round);

        IDibsSeedGenerator(seedGenerator).requestRandomSeed(roundId); // reverts if already requested

        emit SeedRequested(projectId, roundId, round);
    }

    /// Returns the fulfillment status and the seed for the given roundId
    /// @param roundId Unique roundId for a project and round number
    /// returns A tuple containing the fulfillment status (true if fulfilled, false otherwise) and the seed for the given roundId
    function getSeed(
        bytes32 roundId
    ) external view returns (bool fulfilled, uint256 seed) {
        return IDibsSeedGenerator(seedGenerator).getSeed(roundId);
    }

    function removeProject(bytes32 projectId) external onlyRole(SETTER) {
        if (!projects[projectId].exists) revert InvalidProject();
        projects[projectId].exists = false;
    }

    /// @notice this is used to add existing project ids
    /// that have been added before the upgrade
    /// to the allProjects array
    /// @param projectId projectId
    function addProjectId(bytes32 projectId) external onlyRole(SETTER) {
        if (!projects[projectId].exists) revert InvalidProject();
        allProjects.push(projectId);
    }

    /// @notice set the seed generator
    /// @param seedGenerator_ new seed generator
    function setSeedGenerator(
        address seedGenerator_
    ) external onlyRole(SETTER) {
        emit SetSeedGenerator(seedGenerator_, seedGenerator);
        seedGenerator = seedGenerator_;
        IDibsSeedGenerator(seedGenerator).acceptOwnership();
    }
}
