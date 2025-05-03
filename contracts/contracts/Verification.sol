// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./CertificateIssuance.sol";

/**
 * @title Verification
 * @dev Smart contract for third-party verification of certificates
 * @notice Improved version with better gas efficiency, security, and functionality
 */
contract Verification is AccessControl, Pausable {
    // ==========================================================================
    // Type declarations
    // ==========================================================================

    // Verification record structure - packed for gas efficiency
    struct VerificationRecord {
        bytes32 certificateId;     // ID of the verified certificate
        address verifier;          // Address that performed the verification
        uint40 timestamp;          // When the verification was performed (packed)
        bool isValid;              // Result of the verification
    }

    // Pagination params for retrieving verifications in batches
    struct PaginationParams {
        uint256 offset;
        uint256 limit;
    }

    // ==========================================================================
    // State variables
    // ==========================================================================
    
    // Reference to the CertificateIssuance contract
    CertificateIssuance public certificateContract;
    
    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant VERIFIER_ROLE = keccak256("VERIFIER_ROLE");
    
    // Mapping from verification ID to verification record
    mapping(bytes32 => VerificationRecord) public verifications;
    
    // Mapping from certificate ID to array of verification IDs
    mapping(bytes32 => bytes32[]) private _certificateVerifications;
    
    // Mapping from verifier address to array of verification IDs
    mapping(address => bytes32[]) private _verifierHistory;
    
    // Counter for verifications per certificate and verifier (for pagination)
    mapping(bytes32 => uint256) public certificateVerificationCount;
    mapping(address => uint256) public verifierVerificationCount;
    
    // Circuit breaker state
    bool private _circuitBroken;
    
    // ==========================================================================
    // Events
    // ==========================================================================
    
    // Event emitted when a verification is performed
    event CertificateVerified(
        bytes32 indexed verificationId,
        bytes32 indexed certificateId,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );
    
    // Event for certificate contract updates
    event CertificateContractUpdated(
        address indexed oldContract,
        address indexed newContract,
        address indexed updater
    );
    
    // Event for circuit breaker
    event CircuitBreaker(bool broken, address indexed admin);
    
    // Event for batch verifications
    event BatchCertificatesVerified(
        bytes32[] verificationIds,
        bytes32[] certificateIds,
        address indexed verifier,
        bool[] results,
        uint256 timestamp
    );
    
    // Event for verification revocation
    event VerificationRevoked(
        bytes32 indexed verificationId,
        address indexed revoker,
        uint256 timestamp
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
     * @dev Constructor sets the address of the CertificateIssuance contract
     * @param _certificateContract Address of the CertificateIssuance contract
     */
    constructor(address _certificateContract) {
        require(_certificateContract != address(0), "Certificate contract cannot be zero address");
        
        // Set the certificate contract
        certificateContract = CertificateIssuance(_certificateContract);
        
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        
        // Grant verifier role to deployer
        _setupRole(VERIFIER_ROLE, msg.sender);
        
        // Initialize circuit breaker as unbroken
        _circuitBroken = false;
    }
    
    // ==========================================================================
    // Admin functions
    // ==========================================================================
    
    /**
     * @dev Update the certificate contract address
     * @param newCertificateContract New address for the certificate contract
     */
    function updateCertificateContract(address newCertificateContract) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        require(newCertificateContract != address(0), "Certificate contract cannot be zero address");
        
        address oldContract = address(certificateContract);
        certificateContract = CertificateIssuance(newCertificateContract);
        
        emit CertificateContractUpdated(oldContract, newCertificateContract, msg.sender);
    }
    
    /**
     * @dev Grant verifier role to an address
     * @param verifierAddress Address to grant verifier role to
     */
    function grantVerifierRole(address verifierAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        grantRole(VERIFIER_ROLE, verifierAddress);
    }
    
    /**
     * @dev Revoke verifier role from an address
     * @param verifierAddress Address to revoke verifier role from
     */
    function revokeVerifierRole(address verifierAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        revokeRole(VERIFIER_ROLE, verifierAddress);
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
    
    // ==========================================================================
    // Verification functions
    // ==========================================================================
    
    /**
     * @dev Verify a certificate and record the verification
     * @param certificateId ID of the certificate to verify
     * @return verificationId Unique ID of this verification record
     * @return isValid Whether the certificate is valid
     */
    function verifyCertificate(bytes32 certificateId) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        returns (bytes32 verificationId, bool isValid) 
    {
        // Get verification result from the certificate contract
        (bool _isValid, , , ) = certificateContract.verifyCertificate(certificateId);
        
        // Generate a unique verification ID
        verificationId = keccak256(
            abi.encodePacked(
                certificateId,
                msg.sender,
                block.timestamp
            )
        );
        
        // Store the verification record
        verifications[verificationId] = VerificationRecord({
            certificateId: certificateId,
            verifier: msg.sender,
            timestamp: uint40(block.timestamp),
            isValid: _isValid
        });
        
        // Add to verification history for the certificate
        _certificateVerifications[certificateId].push(verificationId);
        certificateVerificationCount[certificateId]++;
        
        // Add to verifier's history
        _verifierHistory[msg.sender].push(verificationId);
        verifierVerificationCount[msg.sender]++;
        
        // Emit verification event
        emit CertificateVerified(
            verificationId,
            certificateId,
            msg.sender,
            _isValid,
            block.timestamp
        );
        
        return (verificationId, _isValid);
    }
    
    /**
     * @dev Verify multiple certificates in a single transaction
     * @param certificateIds Array of certificate IDs to verify
     * @return verificationIds Array of verification IDs
     * @return results Array of verification results
     */
    function batchVerifyCertificates(bytes32[] calldata certificateIds) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        returns (bytes32[] memory verificationIds, bool[] memory results) 
    {
        uint256 count = certificateIds.length;
        verificationIds = new bytes32[](count);
        results = new bool[](count);
        
        // Process each certificate
        for (uint256 i = 0; i < count; i++) {
            // Get verification result from the certificate contract
            (bool _isValid, , , ) = certificateContract.verifyCertificate(certificateIds[i]);
            
            // Generate verification ID
            bytes32 verificationId = keccak256(
                abi.encodePacked(
                    certificateIds[i],
                    msg.sender,
                    block.timestamp,
                    i // Add index to ensure uniqueness in batch
                )
            );
            
            // Store the verification record
            verifications[verificationId] = VerificationRecord({
                certificateId: certificateIds[i],
                verifier: msg.sender,
                timestamp: uint40(block.timestamp),
                isValid: _isValid
            });
            
            // Add to verification history for the certificate
            _certificateVerifications[certificateIds[i]].push(verificationId);
            certificateVerificationCount[certificateIds[i]]++;
            
            // Add to verifier's history
            _verifierHistory[msg.sender].push(verificationId);
            verifierVerificationCount[msg.sender]++;
            
            // Store in return arrays
            verificationIds[i] = verificationId;
            results[i] = _isValid;
        }
        
        // Emit batch verification event
        emit BatchCertificatesVerified(
            verificationIds,
            certificateIds,
            msg.sender,
            results,
            block.timestamp
        );
        
        return (verificationIds, results);
    }
    
    /**
     * @dev Revoke a previously recorded verification (only the verifier or admin)
     * @param verificationId ID of the verification to revoke
     */
    function revokeVerification(bytes32 verificationId) 
        external 
        whenNotPaused 
    {
        VerificationRecord storage record = verifications[verificationId];
        
        // Ensure verification record exists
        require(record.verifier != address(0), "Verification record does not exist");
        
        // Only the original verifier or an admin can revoke a verification
        require(
            record.verifier == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to revoke this verification"
        );
        
        // Update the record
        record.isValid = false;
        
        // Emit event
        emit VerificationRevoked(verificationId, msg.sender, block.timestamp);
    }
    
    // ==========================================================================
    // Query functions
    // ==========================================================================
    
    /**
     * @dev Get details of a verification record
     * @param verificationId ID of the verification record
     * @return certificateId The certificate that was verified
     * @return verifier Address that performed the verification
     * @return timestamp When the verification was performed
     * @return isValid Result of the verification
     */
    function getVerification(bytes32 verificationId)
        external
        view
        returns (
            bytes32 certificateId,
            address verifier,
            uint256 timestamp,
            bool isValid
        )
    {
        VerificationRecord storage record = verifications[verificationId];
        
        // Ensure verification record exists
        require(record.verifier != address(0), "Verification record does not exist");
        
        return (
            record.certificateId,
            record.verifier,
            record.timestamp,
            record.isValid
        );
    }
    
    /**
     * @dev Get verifications for a certificate with pagination
     * @param certificateId Certificate ID
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return verificationIds Array of verification IDs
     * @return totalCount Total count of verifications for this certificate
     */
    function getVerificationsForCertificate(
        bytes32 certificateId,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory verificationIds, uint256 totalCount)
    {
        totalCount = certificateVerificationCount[certificateId];
        
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
            verificationIds[i] = _certificateVerifications[certificateId][offset + i];
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
    // Helper functions
    // ==========================================================================
    
    /**
     * @dev Check if an address has performed a verification for a certificate
     * @param verifier Verifier address
     * @param certificateId Certificate ID
     * @return hasVerified Whether the verifier has verified this certificate
     * @return isValid Latest verification result (if verified)
     */
    function hasVerifiedCertificate(address verifier, bytes32 certificateId)
        external
        view
        returns (bool hasVerified, bool isValid)
    {
        // Get all verification IDs for this certificate
        bytes32[] memory vIds = _certificateVerifications[certificateId];
        
        // Start with not verified
        hasVerified = false;
        isValid = false;
        
        // Find the most recent verification by this verifier
        uint256 mostRecentTimestamp = 0;
        
        for (uint256 i = 0; i < vIds.length; i++) {
            VerificationRecord storage record = verifications[vIds[i]];
            
            // Skip if not by the specified verifier
            if (record.verifier != verifier) {
                continue;
            }
            
            // Mark as verified
            hasVerified = true;
            
            // Update most recent if this is newer
            if (uint256(record.timestamp) > mostRecentTimestamp) {
                mostRecentTimestamp = uint256(record.timestamp);
                isValid = record.isValid;
            }
        }
        
        return (hasVerified, isValid);
    }
    
    /**
     * @dev Get all verifications for a certificate (legacy method without pagination)
     * @param certificateId Certificate ID
     * @return Array of verification IDs
     */
    function getAllVerificationsForCertificate(bytes32 certificateId)
        external
        view
        returns (bytes32[] memory)
    {
        return _certificateVerifications[certificateId];
    }
    
    /**
     * @dev Get all verifications by a verifier (legacy method without pagination)
     * @param verifier Verifier address
     * @return Array of verification IDs
     */
    function getAllVerifierHistory(address verifier)
        external
        view
        returns (bytes32[] memory)
    {
        return _verifierHistory[verifier];
    }
}