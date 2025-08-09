// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";

/**
 * @title AttestationRegistry
 * @dev Attestr Protocol - Universal attestation registry for issuing and verifying any type of attestation
 * @notice Core contract of Attestr Protocol with gas efficiency, security, and multi-domain functionality
 */
contract AttestationRegistry is AccessControl, Pausable, EIP712 {
    using ECDSA for bytes32;

    // ==========================================================================
    // Type declarations
    // ==========================================================================

    // Attestation data structure - optimized for gas with packed storage
    struct Attestation {
        bytes32 id;              // Unique attestation ID
        address attester;        // Address of entity that issued the attestation
        address subject;         // Address of attestation subject
        string metadataURI;      // IPFS/Arweave URI containing attestation metadata
        uint40 issueDate;        // Date attestation was issued (packed timestamp)
        uint40 expiryDate;       // Optional expiry date (0 if no expiry) (packed timestamp)
        bool revoked;            // Whether the attestation has been revoked
    }

    // Pagination params for retrieving attestations in batches
    struct PaginationParams {
        uint256 offset;
        uint256 limit;
    }

    // Constants for EIP-712 signature verification
    bytes32 private constant ATTESTATION_TYPEHASH = keccak256(
        "Attestation(bytes32 id,address subject,string metadataURI,uint256 expiryDate)"
    );

    // ==========================================================================
    // State variables
    // ==========================================================================

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ATTESTER_ROLE = keccak256("ATTESTER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");

    // Circuit breaker state
    bool private _circuitBroken;

    // Mapping from attestation ID to Attestation
    mapping(bytes32 => Attestation) public attestations;
    
    // Mapping from address to array of attestation IDs
    mapping(address => bytes32[]) private _subjectAttestations;
    mapping(address => bytes32[]) private _attesterAttestations;

    // Total count of attestations for each user (for pagination)
    mapping(address => uint256) public subjectAttestationCount;
    mapping(address => uint256) public attesterAttestationCount;

    // ==========================================================================
    // Events
    // ==========================================================================
    
    event CertificateIssued(
        bytes32 indexed id,
        address indexed issuer,
        address indexed recipient,
        uint256 issueDate
    );
    
    event CertificateRevoked(
        bytes32 indexed id,
        address indexed issuer,
        address indexed revoker,
        uint256 revokeDate
    );
    
    event IssuerRoleGranted(address indexed issuer, address indexed admin);
    event IssuerRoleRevoked(address indexed issuer, address indexed admin);
    
    event CircuitBreaker(bool broken, address indexed admin);
    event MetadataUpdated(bytes32 indexed id, string newMetadataURI, address indexed updater);
    
    event BatchCertificatesIssued(
        bytes32[] ids,
        address indexed issuer,
        address[] recipients,
        uint256 issueDate
    );

    // ==========================================================================
    // Constructor
    // ==========================================================================
    
    /**
     * @dev Constructor sets up roles and EIP-712 domain
     */
    constructor() EIP712("AttestrProtocol", "2.0") {
        // Setup roles
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _setupRole(ADMIN_ROLE, msg.sender);
        _setupRole(ATTESTER_ROLE, msg.sender);
        _setupRole(REVOKER_ROLE, msg.sender);
        
        // Contract starts unpaused and circuit unbroken
        _circuitBroken = false;
    }

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
    // Admin functions
    // ==========================================================================
    
    /**
     * @dev Grant the issuer role to an address
     * @param issuerAddress Address to grant issuer role to
     */
    function grantIssuerRole(address issuerAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        grantRole(ISSUER_ROLE, issuerAddress);
        emit IssuerRoleGranted(issuerAddress, msg.sender);
    }
    
    /**
     * @dev Revoke the issuer role from an address
     * @param issuerAddress Address to revoke issuer role from
     */
    function revokeIssuerRole(address issuerAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        revokeRole(ISSUER_ROLE, issuerAddress);
        emit IssuerRoleRevoked(issuerAddress, msg.sender);
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
    // Certificate issuance functions
    // ==========================================================================
    
    /**
     * @dev Issue a new certificate
     * @param recipient Recipient's wallet address
     * @param metadataURI Arweave/IPFS URI containing certificate metadata
     * @param expiryDate Optional expiry date (0 if no expiry)
     * @return certificateId The unique ID of the issued certificate
     */
    function issueCertificate(
        address recipient,
        string calldata metadataURI,
        uint256 expiryDate
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        onlyRole(ISSUER_ROLE) 
        returns (bytes32) 
    {
        // Generate a unique certificate ID based on issuer, recipient, and current timestamp
        bytes32 certificateId = keccak256(
            abi.encodePacked(
                msg.sender,
                recipient,
                metadataURI,
                block.timestamp
            )
        );
        
        // Ensure certificate ID doesn't already exist
        require(certificates[certificateId].issuer == address(0), "Certificate ID already exists");
        
        // Check expiryDate is either 0 or in the future
        if (expiryDate > 0) {
            require(expiryDate > block.timestamp, "Expiry date must be in the future");
        }
        
        // Convert timestamps to uint40 for better gas efficiency
        uint40 issueDate = uint40(block.timestamp);
        uint40 packedExpiryDate = expiryDate > 0 ? uint40(expiryDate) : 0;
        
        // Create and store the certificate
        certificates[certificateId] = Certificate({
            id: certificateId,
            issuer: msg.sender,
            recipient: recipient,
            metadataURI: metadataURI,
            issueDate: issueDate,
            expiryDate: packedExpiryDate,
            revoked: false
        });
        
        // Add to recipient's certificates
        _recipientCertificates[recipient].push(certificateId);
        recipientCertificateCount[recipient]++;
        
        // Add to issuer's certificates
        _issuerCertificates[msg.sender].push(certificateId);
        issuerCertificateCount[msg.sender]++;
        
        // Emit event
        emit CertificateIssued(certificateId, msg.sender, recipient, issueDate);
        
        return certificateId;
    }
    
    /**
     * @dev Issue multiple certificates in a single transaction (gas efficient)
     * @param recipients Array of recipient wallet addresses
     * @param metadataURIs Array of Arweave/IPFS URIs containing certificate metadata
     * @param expiryDates Array of optional expiry dates (0 if no expiry)
     * @return certificateIds Array of unique IDs of the issued certificates
     */
    function batchIssueCertificates(
        address[] calldata recipients,
        string[] calldata metadataURIs,
        uint256[] calldata expiryDates
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        onlyRole(ISSUER_ROLE) 
        returns (bytes32[] memory) 
    {
        // Ensure input arrays have the same length
        require(
            recipients.length == metadataURIs.length && 
            recipients.length == expiryDates.length,
            "Input arrays must have same length"
        );
        
        // Allocate array for certificate IDs
        bytes32[] memory certificateIds = new bytes32[](recipients.length);
        
        // Current timestamp used for all certificates in batch (gas optimization)
        uint40 issueDate = uint40(block.timestamp);
        
        // Issue each certificate
        for (uint256 i = 0; i < recipients.length; i++) {
            // Validate recipient
            require(recipients[i] != address(0), "Invalid recipient address");
            
            // Check expiryDate
            if (expiryDates[i] > 0) {
                require(expiryDates[i] > block.timestamp, "Expiry date must be in the future");
            }
            
            // Generate certificate ID
            bytes32 certificateId = keccak256(
                abi.encodePacked(
                    msg.sender,
                    recipients[i],
                    metadataURIs[i],
                    block.timestamp,
                    i // Add index to ensure uniqueness within batch
                )
            );
            
            // Ensure certificate ID doesn't already exist
            require(certificates[certificateId].issuer == address(0), "Certificate ID already exists");
            
            // Convert expiry to uint40
            uint40 packedExpiryDate = expiryDates[i] > 0 ? uint40(expiryDates[i]) : 0;
            
            // Create and store the certificate
            certificates[certificateId] = Certificate({
                id: certificateId,
                issuer: msg.sender,
                recipient: recipients[i],
                metadataURI: metadataURIs[i],
                issueDate: issueDate,
                expiryDate: packedExpiryDate,
                revoked: false
            });
            
            // Add to recipient's certificates
            _recipientCertificates[recipients[i]].push(certificateId);
            recipientCertificateCount[recipients[i]]++;
            
            // Add to issuer's certificates
            _issuerCertificates[msg.sender].push(certificateId);
            issuerCertificateCount[msg.sender]++;
            
            // Store ID in return array
            certificateIds[i] = certificateId;
        }
        
        // Emit batch event
        emit BatchCertificatesIssued(certificateIds, msg.sender, recipients, issueDate);
        
        return certificateIds;
    }
    
    /**
     * @dev Issue a certificate with an EIP-712 signature from an authorized issuer
     * @param signature Signature of the certificate data
     * @param recipient Recipient's wallet address
     * @param metadataURI Arweave/IPFS URI containing certificate metadata
     * @param expiryDate Optional expiry date (0 if no expiry)
     * @return certificateId The unique ID of the issued certificate
     */
    function issueCertificateWithSignature(
        bytes calldata signature,
        address recipient,
        string calldata metadataURI,
        uint256 expiryDate
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        returns (bytes32) 
    {
        // Pre-compute the certificate ID
        bytes32 certificateId = keccak256(
            abi.encodePacked(
                recipient,
                metadataURI,
                expiryDate,
                block.timestamp
            )
        );
        
        // Create EIP-712 hash for the certificate data
        bytes32 structHash = keccak256(abi.encode(
            CERTIFICATE_TYPEHASH,
            certificateId,
            recipient,
            keccak256(bytes(metadataURI)),
            expiryDate
        ));
        
        bytes32 hash = _hashTypedDataV4(structHash);
        
        // Recover signer from signature
        address signer = hash.recover(signature);
        
        // Ensure signer is an authorized issuer
        require(hasRole(ISSUER_ROLE, signer), "Signer is not an authorized issuer");
        
        // Ensure certificate ID doesn't already exist
        require(certificates[certificateId].issuer == address(0), "Certificate ID already exists");
        
        // Check expiryDate is either 0 or in the future
        if (expiryDate > 0) {
            require(expiryDate > block.timestamp, "Expiry date must be in the future");
        }
        
        // Convert timestamps to uint40 for better gas efficiency
        uint40 issueDate = uint40(block.timestamp);
        uint40 packedExpiryDate = expiryDate > 0 ? uint40(expiryDate) : 0;
        
        // Create and store the certificate
        certificates[certificateId] = Certificate({
            id: certificateId,
            issuer: signer,
            recipient: recipient,
            metadataURI: metadataURI,
            issueDate: issueDate,
            expiryDate: packedExpiryDate,
            revoked: false
        });
        
        // Add to recipient's certificates
        _recipientCertificates[recipient].push(certificateId);
        recipientCertificateCount[recipient]++;
        
        // Add to issuer's certificates
        _issuerCertificates[signer].push(certificateId);
        issuerCertificateCount[signer]++;
        
        // Emit event
        emit CertificateIssued(certificateId, signer, recipient, issueDate);
        
        return certificateId;
    }

    // ==========================================================================
    // Certificate management functions
    // ==========================================================================
    
    /**
     * @dev Revoke a certificate
     * @param certificateId ID of the certificate to revoke
     */
    function revokeCertificate(bytes32 certificateId) 
        external 
        whenNotPaused 
    {
        Certificate storage cert = certificates[certificateId];
        
        // Check that certificate exists
        require(cert.issuer != address(0), "Certificate does not exist");
        require(!cert.revoked, "Certificate already revoked");
        
        // Only the original issuer, an address with REVOKER_ROLE, or an admin can revoke a certificate
        require(
            cert.issuer == msg.sender || 
            hasRole(REVOKER_ROLE, msg.sender) || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to revoke this certificate"
        );
        
        // Set revoked flag
        cert.revoked = true;
        
        // Emit event
        emit CertificateRevoked(certificateId, cert.issuer, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update the metadata URI for a certificate (only by issuer or admin)
     * @param certificateId ID of the certificate to update
     * @param newMetadataURI New metadata URI
     */
    function updateMetadataURI(bytes32 certificateId, string calldata newMetadataURI) 
        external 
        whenNotPaused 
        whenCircuitNotBroken 
    {
        Certificate storage cert = certificates[certificateId];
        
        // Check that certificate exists
        require(cert.issuer != address(0), "Certificate does not exist");
        require(!cert.revoked, "Cannot update revoked certificate");
        
        // Only the original issuer or an admin can update metadata
        require(
            cert.issuer == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to update this certificate"
        );
        
        // Update metadata URI
        cert.metadataURI = newMetadataURI;
        
        // Emit event
        emit MetadataUpdated(certificateId, newMetadataURI, msg.sender);
    }

    // ==========================================================================
    // Certificate verification functions
    // ==========================================================================
    
    /**
     * @dev Verify a certificate
     * @param certificateId ID of the certificate to verify
     * @return isValid Whether the certificate is valid (exists and not revoked)
     * @return issuer Address of the issuing institution
     * @return issueDate Date when the certificate was issued
     * @return expiryDate Expiration date of the certificate (0 if no expiry)
     */
    function verifyCertificate(bytes32 certificateId)
        external
        view
        returns (
            bool isValid,
            address issuer,
            uint256 issueDate,
            uint256 expiryDate
        )
    {
        Certificate storage cert = certificates[certificateId];
        
        // Check that certificate exists
        if (cert.issuer == address(0)) {
            return (false, address(0), 0, 0);
        }
        
        // Check if certificate is revoked
        if (cert.revoked) {
            return (false, cert.issuer, cert.issueDate, cert.expiryDate);
        }
        
        // Check if certificate is expired (if it has an expiry date)
        if (cert.expiryDate > 0 && uint256(cert.expiryDate) < block.timestamp) {
            return (false, cert.issuer, cert.issueDate, cert.expiryDate);
        }
        
        // Certificate is valid
        return (true, cert.issuer, cert.issueDate, cert.expiryDate);
    }
    
    /**
     * @dev Get certificate details
     * @param certificateId ID of the certificate
     * @return issuer Address of the issuing institution
     * @return recipient Address of the certificate recipient
     * @return metadataURI Arweave/IPFS URI containing certificate metadata
     * @return issueDate Date when the certificate was issued
     * @return expiryDate Expiration date of the certificate (0 if no expiry)
     * @return revoked Whether the certificate has been revoked
     */
    function getCertificate(bytes32 certificateId)
        external
        view
        returns (
            address issuer,
            address recipient,
            string memory metadataURI,
            uint256 issueDate,
            uint256 expiryDate,
            bool revoked
        )
    {
        Certificate storage cert = certificates[certificateId];
        
        // Check that certificate exists
        require(cert.issuer != address(0), "Certificate does not exist");
        
        return (
            cert.issuer,
            cert.recipient,
            cert.metadataURI,
            cert.issueDate,
            cert.expiryDate,
            cert.revoked
        );
    }
    
    /**
     * @dev Get certificates for a recipient with pagination
     * @param recipient Address of the certificate recipient
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return certificateIds Array of certificate IDs
     * @return totalCount Total number of certificates for this recipient
     */
    function getCertificatesForRecipient(
        address recipient,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory certificateIds, uint256 totalCount)
    {
        totalCount = recipientCertificateCount[recipient];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        certificateIds = new bytes32[](actualLimit);
        
        // Fill array with certificate IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            certificateIds[i] = _recipientCertificates[recipient][offset + i];
        }
        
        return (certificateIds, totalCount);
    }
    
    /**
     * @dev Get certificates issued by an institution with pagination
     * @param issuer Address of the issuing institution
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return certificateIds Array of certificate IDs
     * @return totalCount Total number of certificates for this issuer
     */
    function getCertificatesForIssuer(
        address issuer,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory certificateIds, uint256 totalCount)
    {
        totalCount = issuerCertificateCount[issuer];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        certificateIds = new bytes32[](actualLimit);
        
        // Fill array with certificate IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            certificateIds[i] = _issuerCertificates[issuer][offset + i];
        }
        
        return (certificateIds, totalCount);
    }

    // ==========================================================================
    // Batch certificate verification functions
    // ==========================================================================
    
    /**
     * @dev Verify multiple certificates in a single call
     * @param certificateIds Array of certificate IDs to verify
     * @return results Array of verification results (isValid)
     */
    function batchVerifyCertificates(bytes32[] calldata certificateIds)
        external
        view
        returns (bool[] memory results)
    {
        results = new bool[](certificateIds.length);
        
        for (uint256 i = 0; i < certificateIds.length; i++) {
            Certificate storage cert = certificates[certificateIds[i]];
            
            // Certificate is valid if it exists, is not revoked, and is not expired
            results[i] = (
                cert.issuer != address(0) &&
                !cert.revoked &&
                (cert.expiryDate == 0 || uint256(cert.expiryDate) >= block.timestamp)
            );
        }
        
        return results;
    }

    // ==========================================================================
    // Helper functions
    // ==========================================================================
    
    /**
     * @dev Get all certificates for a recipient (legacy method without pagination)
     * @param recipient Address of the certificate recipient
     * @return Array of certificate IDs
     */
    function getAllCertificatesForRecipient(address recipient)
        external
        view
        returns (bytes32[] memory)
    {
        return _recipientCertificates[recipient];
    }
    
    /**
     * @dev Get all certificates issued by an institution (legacy method without pagination)
     * @param issuer Address of the issuing institution
     * @return Array of certificate IDs
     */
    function getAllCertificatesForIssuer(address issuer)
        external
        view
        returns (bytes32[] memory)
    {
        return _issuerCertificates[issuer];
    }
    
    /**
     * @dev Check if an address is an authorized issuer
     * @param issuerAddress Address to check
     * @return Whether the address is an authorized issuer
     */
    function isAuthorizedIssuer(address issuerAddress)
        external
        view
        returns (bool)
    {
        return hasRole(ISSUER_ROLE, issuerAddress);
    }
}