// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./AttestationRegistry.sol";

/**
 * @title AttestationVerifier
 * @dev Smart contract for third-party verification of attestations with reputation tracking
 * @notice Enhanced verification system with advanced features for the Attestr Protocol
 * @author Attestr Protocol Team
 * @custom:version 2.0.0
 */
contract AttestationVerifier is AccessControl, Pausable {
    // ==========================================================================
    // Type declarations
    // ==========================================================================

    // Verification record structure - packed for gas efficiency
    struct VerificationRecord {
        bytes32 attestationId;     // ID of the verified attestation
        address verifier;          // Address that performed the verification
        uint40 timestamp;          // When the verification was performed (packed)
        bool isValid;              // Result of the verification
        uint8 confidence;          // Confidence level (0-100)
        string notes;              // Optional verification notes
    }

    // Verifier reputation data
    struct VerifierReputation {
        uint256 totalVerifications;
        uint256 correctVerifications;
        uint256 incorrectVerifications;
        uint256 reputationScore; // Scale of 0-1000
        bool isActive;
    }

    // Attestation reputation data
    struct AttestationReputation {
        uint256 totalVerifications;
        uint256 positiveVerifications;
        uint256 negativeVerifications;
        uint256 averageConfidence;
        bool hasConsensus; // True if majority agree on validity
    }

    // ==========================================================================
    // State variables
    // ==========================================================================
    
    // Reference to the AttestationRegistry contract
    AttestationRegistry public attestationRegistry;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    bytes32 public constant REPUTATION_MANAGER_ROLE = keccak256("REPUTATION_MANAGER_ROLE");
    
    // Mapping from verification ID to verification record
    mapping(bytes32 => VerificationRecord) public verifications;
    
    // Mapping from attestation ID to array of verification IDs
    mapping(bytes32 => bytes32[]) private _attestationVerifications;
    
    // Mapping from verifier address to array of verification IDs
    mapping(address => bytes32[]) private _verifierHistory;
    
    // Reputation tracking
    mapping(address => VerifierReputation) public verifierReputations;
    mapping(bytes32 => AttestationReputation) public attestationReputations;
    
    // Counter for verifications per attestation and verifier (for pagination)
    mapping(bytes32 => uint256) public attestationVerificationCount;
    mapping(address => uint256) public verifierVerificationCount;
    
    // Circuit breaker state
    bool private _circuitBroken;
    
    // Global statistics
    uint256 public totalVerifications;
    uint256 public totalVerifiers;
    
    // Configuration
    uint256 public minVerificationsForConsensus = 3;
    uint256 public consensusThreshold = 67; // 67% agreement needed
    uint256 public reputationDecayRate = 1; // Reputation decay per month

    // ==========================================================================
    // Events
    // ==========================================================================
    
    // Event emitted when a verification is performed
    event AttestationVerified(
        bytes32 indexed verificationId,
        bytes32 indexed attestationId,
        address indexed verifier,
        bool isValid,
        uint8 confidence,
        uint256 timestamp
    );
    
    // Event for attestation registry contract updates
    event AttestationRegistryUpdated(
        address indexed oldRegistry,
        address indexed newRegistry,
        address indexed updater
    );
    
    // Event for circuit breaker
    event CircuitBreaker(bool broken, address indexed admin);
    
    // Event for batch verifications
    event BatchAttestationsVerified(
        bytes32[] verificationIds,
        bytes32[] attestationIds,
        address indexed verifier,
        bool[] results,
        uint256 timestamp
    );
    
    // Event for verification updates
    event VerificationUpdated(
        bytes32 indexed verificationId,
        address indexed updater,
        string notes,
        uint256 timestamp
    );
    
    // Reputation events
    event ReputationUpdated(
        address indexed verifier,
        uint256 oldScore,
        uint256 newScore,
        uint256 timestamp
    );
    
    event ConsensusReached(
        bytes32 indexed attestationId,
        bool isValid,
        uint256 confidence,
        uint256 verificationCount
    );

    // ==========================================================================
    // Modifiers
    // ==========================================================================
    
    /**
     * @dev Circuit breaker pattern - stops execution in emergency
     */
    modifier whenCircuitNotBroken() {
        require(!_circuitBroken, "Circuit broken: contract in emergency mode");
        _;
    }
    
    // ==========================================================================
    // Constructor
    // ==========================================================================
    
    /**
     * @dev Constructor sets the address of the AttestationRegistry contract
     * @param _attestationRegistry Address of the AttestationRegistry contract
     */
    constructor(address _attestationRegistry) {
        require(_attestationRegistry != address(0), "Registry contract cannot be zero address");
        
        // Set the attestation registry contract
        attestationRegistry = AttestationRegistry(_attestationRegistry);
        
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(VERIFIER_ROLE, msg.sender);
        _grantRole(REPUTATION_MANAGER_ROLE, msg.sender);
        
        // Initialize statistics
        totalVerifications = 0;
        totalVerifiers = 0;
        
        // Initialize circuit breaker as unbroken
        _circuitBroken = false;
    }
    
    // ==========================================================================
    // Admin functions
    // ==========================================================================
    
    /**
     * @dev Update the attestation registry contract address
     * @param newAttestationRegistry New address for the attestation registry contract
     */
    function updateAttestationRegistry(address newAttestationRegistry) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newAttestationRegistry != address(0), "Registry contract cannot be zero address");
        
        address oldRegistry = address(attestationRegistry);
        attestationRegistry = AttestationRegistry(newAttestationRegistry);
        
        emit AttestationRegistryUpdated(oldRegistry, newAttestationRegistry, msg.sender);
    }
    
    /**
     * @dev Grant verifier role to an address
     * @param verifierAddress Address to grant verifier role to
     */
    function grantVerifierRole(address verifierAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (!hasRole(VERIFIER_ROLE, verifierAddress)) {
            _grantRole(VERIFIER_ROLE, verifierAddress);
            
            // Initialize reputation for new verifier
            verifierReputations[verifierAddress] = VerifierReputation({
                totalVerifications: 0,
                correctVerifications: 0,
                incorrectVerifications: 0,
                reputationScore: 500, // Start with neutral reputation
                isActive: true
            });
            
            totalVerifiers++;
        }
    }
    
    /**
     * @dev Revoke verifier role from an address
     * @param verifierAddress Address to revoke verifier role from
     */
    function revokeVerifierRole(address verifierAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (hasRole(VERIFIER_ROLE, verifierAddress)) {
            _revokeRole(VERIFIER_ROLE, verifierAddress);
            verifierReputations[verifierAddress].isActive = false;
        }
    }
    
    /**
     * @dev Pause/unpause the contract (emergency stop)
     * @param paused Whether to pause the contract
     */
    function setPaused(bool paused) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        if (paused) {
            _pause();
        } else {
            _unpause();
        }
    }
    
    /**
     * @dev Break/fix the circuit (more severe than pause - only for critical issues)
     * @param broken Whether to break the circuit
     */
    function setCircuitBreaker(bool broken) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _circuitBroken = broken;
        emit CircuitBreaker(broken, msg.sender);
    }
    
    /**
     * @dev Update consensus parameters
     * @param _minVerifications Minimum verifications needed for consensus
     * @param _consensusThreshold Percentage agreement needed (0-100)
     */
    function updateConsensusParameters(
        uint256 _minVerifications,
        uint256 _consensusThreshold
    )
        external
        onlyRole(ADMIN_ROLE)
    {
        require(_minVerifications >= 2, "Minimum verifications must be at least 2");
        require(_consensusThreshold >= 51 && _consensusThreshold <= 100, "Threshold must be 51-100");
        
        minVerificationsForConsensus = _minVerifications;
        consensusThreshold = _consensusThreshold;
    }
    
    // ==========================================================================
    // Verification functions
    // ==========================================================================
    
    /**
     * @dev Verify an attestation and record the verification
     * @param attestationId ID of the attestation to verify
     * @param confidence Confidence level (0-100)
     * @param notes Optional verification notes
     * @return verificationId Unique ID of this verification record
     * @return isValid Whether the attestation is valid
     */
    function verifyAttestation(
        bytes32 attestationId, 
        uint8 confidence,
        string calldata notes
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        onlyRole(VERIFIER_ROLE)
        returns (bytes32 verificationId, bool isValid) 
    {
        require(confidence <= 100, "Confidence must be 0-100");
        require(verifierReputations[msg.sender].isActive, "Verifier is not active");
        
        // Get verification result from the attestation registry
        (bool _isValid, , , ) = attestationRegistry.verifyAttestation(attestationId);
        
        // Generate a unique verification ID
        verificationId = keccak256(
            abi.encodePacked(
                attestationId,
                msg.sender,
                block.timestamp,
                totalVerifications
            )
        );
        
        // Store the verification record
        verifications[verificationId] = VerificationRecord({
            attestationId: attestationId,
            verifier: msg.sender,
            timestamp: uint40(block.timestamp),
            isValid: _isValid,
            confidence: confidence,
            notes: notes
        });
        
        // Add to verification history
        _attestationVerifications[attestationId].push(verificationId);
        attestationVerificationCount[attestationId]++;
        
        _verifierHistory[msg.sender].push(verificationId);
        verifierVerificationCount[msg.sender]++;
        
        // Update verifier reputation
        _updateVerifierReputation(msg.sender, _isValid);
        
        // Update attestation reputation
        _updateAttestationReputation(attestationId, _isValid, confidence);
        
        // Update global statistics
        totalVerifications++;
        
        // Emit verification event
        emit AttestationVerified(
            verificationId,
            attestationId,
            msg.sender,
            _isValid,
            confidence,
            block.timestamp
        );
        
        return (verificationId, _isValid);
    }
    
    /**
     * @dev Verify multiple attestations in a single transaction
     * @param attestationIds Array of attestation IDs to verify
     * @param confidences Array of confidence levels
     * @param notesArray Array of verification notes
     * @return verificationIds Array of verification IDs
     * @return results Array of verification results
     */
    function batchVerifyAttestations(
        bytes32[] calldata attestationIds,
        uint8[] calldata confidences,
        string[] calldata notesArray
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        onlyRole(VERIFIER_ROLE)
        returns (bytes32[] memory verificationIds, bool[] memory results) 
    {
        require(
            attestationIds.length == confidences.length && 
            attestationIds.length == notesArray.length,
            "Input arrays must have same length"
        );
        require(verifierReputations[msg.sender].isActive, "Verifier is not active");
        
        uint256 count = attestationIds.length;
        verificationIds = new bytes32[](count);
        results = new bool[](count);
        
        // Process each attestation
        for (uint256 i = 0; i < count; i++) {
            require(confidences[i] <= 100, "Confidence must be 0-100");
            
            // Get verification result from the attestation registry
            (bool _isValid, , , ) = attestationRegistry.verifyAttestation(attestationIds[i]);
            
            // Generate verification ID
            bytes32 verificationId = keccak256(
                abi.encodePacked(
                    attestationIds[i],
                    msg.sender,
                    block.timestamp,
                    totalVerifications + i
                )
            );
            
            // Store the verification record
            verifications[verificationId] = VerificationRecord({
                attestationId: attestationIds[i],
                verifier: msg.sender,
                timestamp: uint40(block.timestamp),
                isValid: _isValid,
                confidence: confidences[i],
                notes: notesArray[i]
            });
            
            // Add to verification history
            _attestationVerifications[attestationIds[i]].push(verificationId);
            attestationVerificationCount[attestationIds[i]]++;
            
            _verifierHistory[msg.sender].push(verificationId);
            verifierVerificationCount[msg.sender]++;
            
            // Update reputations
            _updateVerifierReputation(msg.sender, _isValid);
            _updateAttestationReputation(attestationIds[i], _isValid, confidences[i]);
            
            // Store in return arrays
            verificationIds[i] = verificationId;
            results[i] = _isValid;
        }
        
        // Update global statistics
        totalVerifications += count;
        
        // Emit batch verification event
        emit BatchAttestationsVerified(
            verificationIds,
            attestationIds,
            msg.sender,
            results,
            block.timestamp
        );
        
        return (verificationIds, results);
    }
    
    /**
     * @dev Update verification notes (only the verifier or admin)
     * @param verificationId ID of the verification to update
     * @param newNotes New verification notes
     */
    function updateVerificationNotes(
        bytes32 verificationId,
        string calldata newNotes
    ) 
        external 
        whenNotPaused 
    {
        VerificationRecord storage record = verifications[verificationId];
        
        // Ensure verification record exists
        require(record.verifier != address(0), "Verification record does not exist");
        
        // Only the original verifier or an admin can update notes
        require(
            record.verifier == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to update this verification"
        );
        
        // Update the notes
        record.notes = newNotes;
        
        // Emit event
        emit VerificationUpdated(verificationId, msg.sender, newNotes, block.timestamp);
    }
    
    // ==========================================================================
    // Query functions
    // ==========================================================================
    
    /**
     * @dev Get details of a verification record
     * @param verificationId ID of the verification record
     * @return VerificationRecord structure
     */
    function getVerification(bytes32 verificationId)
        external
        view
        returns (VerificationRecord memory)
    {
        require(verifications[verificationId].verifier != address(0), "Verification record does not exist");
        return verifications[verificationId];
    }
    
    /**
     * @dev Get verifications for an attestation with pagination
     * @param attestationId Attestation ID
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return verificationIds Array of verification IDs
     * @return totalCount Total count of verifications for this attestation
     */
    function getVerificationsForAttestation(
        bytes32 attestationId,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory verificationIds, uint256 totalCount)
    {
        totalCount = attestationVerificationCount[attestationId];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        verificationIds = new bytes32[](actualLimit);
        
        // Fill array with verification IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            verificationIds[i] = _attestationVerifications[attestationId][offset + i];
        }
        
        return (verificationIds, totalCount);
    }
    
    /**
     * @dev Get verification history for a verifier with pagination
     * @param verifier Verifier address
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return verificationIds Array of verification IDs
     * @return totalCount Total count of verifications by this verifier
     */
    function getVerifierHistory(
        address verifier,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory verificationIds, uint256 totalCount)
    {
        totalCount = verifierVerificationCount[verifier];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        verificationIds = new bytes32[](actualLimit);
        
        // Fill array with verification IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            verificationIds[i] = _verifierHistory[verifier][offset + i];
        }
        
        return (verificationIds, totalCount);
    }
    
    // ==========================================================================
    // Reputation functions
    // ==========================================================================
    
    /**
     * @dev Get verifier reputation
     * @param verifier Verifier address
     * @return VerifierReputation structure
     */
    function getVerifierReputation(address verifier)
        external
        view
        returns (VerifierReputation memory)
    {
        return verifierReputations[verifier];
    }
    
    /**
     * @dev Get attestation reputation
     * @param attestationId Attestation ID
     * @return AttestationReputation structure
     */
    function getAttestationReputation(bytes32 attestationId)
        external
        view
        returns (AttestationReputation memory)
    {
        return attestationReputations[attestationId];
    }
    
    /**
     * @dev Get consensus status for an attestation
     * @param attestationId Attestation ID
     * @return hasConsensus Whether consensus has been reached
     * @return consensusResult The consensus result (if consensus reached)
     * @return verificationCount Number of verifications
     */
    function getConsensusStatus(bytes32 attestationId)
        external
        view
        returns (bool hasConsensus, bool consensusResult, uint256 verificationCount)
    {
        AttestationReputation storage reputation = attestationReputations[attestationId];
        verificationCount = reputation.totalVerifications;
        
        if (verificationCount < minVerificationsForConsensus) {
            return (false, false, verificationCount);
        }
        
        hasConsensus = reputation.hasConsensus;
        consensusResult = reputation.positiveVerifications > reputation.negativeVerifications;
        
        return (hasConsensus, consensusResult, verificationCount);
    }
    
    // ==========================================================================
    // Internal functions
    // ==========================================================================
    
    /**
     * @dev Update verifier reputation based on verification result
     * @param verifier Verifier address
     * @param wasCorrect Whether the verification was correct
     */
    function _updateVerifierReputation(address verifier, bool wasCorrect) internal {
        VerifierReputation storage reputation = verifierReputations[verifier];
        
        uint256 oldScore = reputation.reputationScore;
        
        reputation.totalVerifications++;
        
        if (wasCorrect) {
            reputation.correctVerifications++;
            // Increase reputation (max 1000)
            reputation.reputationScore = reputation.reputationScore + 10 > 1000 
                ? 1000 
                : reputation.reputationScore + 10;
        } else {
            reputation.incorrectVerifications++;
            // Decrease reputation (min 0)
            reputation.reputationScore = reputation.reputationScore > 20 
                ? reputation.reputationScore - 20 
                : 0;
        }
        
        if (oldScore != reputation.reputationScore) {
            emit ReputationUpdated(verifier, oldScore, reputation.reputationScore, block.timestamp);
        }
    }
    
    /**
     * @dev Update attestation reputation based on verification
     * @param attestationId Attestation ID
     * @param isValid Verification result
     * @param confidence Confidence level
     */
    function _updateAttestationReputation(
        bytes32 attestationId, 
        bool isValid, 
        uint8 confidence
    ) internal {
        AttestationReputation storage reputation = attestationReputations[attestationId];
        
        reputation.totalVerifications++;
        
        if (isValid) {
            reputation.positiveVerifications++;
        } else {
            reputation.negativeVerifications++;
        }
        
        // Update average confidence
        reputation.averageConfidence = (
            (reputation.averageConfidence * (reputation.totalVerifications - 1)) + confidence
        ) / reputation.totalVerifications;
        
        // Check for consensus
        if (reputation.totalVerifications >= minVerificationsForConsensus) {
            uint256 majority = (reputation.totalVerifications * consensusThreshold) / 100;
            bool positiveConsensus = reputation.positiveVerifications >= majority;
            bool negativeConsensus = reputation.negativeVerifications >= majority;
            
            if (positiveConsensus || negativeConsensus) {
                reputation.hasConsensus = true;
                
                emit ConsensusReached(
                    attestationId,
                    positiveConsensus,
                    reputation.averageConfidence,
                    reputation.totalVerifications
                );
            }
        }
    }
    
    // ==========================================================================
    // Statistics functions
    // ==========================================================================
    
    /**
     * @dev Get global statistics
     * @return totalVerifications_ Total verifications performed
     * @return totalVerifiers_ Total number of verifiers
     * @return averageReputationScore Average reputation score of all verifiers
     */
    function getGlobalStatistics()
        external
        view
        returns (
            uint256 totalVerifications_,
            uint256 totalVerifiers_,
            uint256 averageReputationScore
        )
    {
        totalVerifications_ = totalVerifications;
        totalVerifiers_ = totalVerifiers;
        
        // Calculate average reputation (simplified - would need to iterate through all verifiers for exact)
        averageReputationScore = 500; // Placeholder - could be calculated more precisely
        
        return (totalVerifications_, totalVerifiers_, averageReputationScore);
    }
}