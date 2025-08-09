// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/utils/cryptography/EIP712.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "@openzeppelin/contracts/utils/Counters.sol";

/**
 * @title AttestationRegistry
 * @dev Attestr Protocol - Universal attestation registry for issuing and verifying any type of attestation
 * @notice Core contract of Attestr Protocol supporting multi-domain attestations with flexible schemas
 * @author Attestr Protocol Team
 * @custom:version 2.0.0
 */
contract AttestationRegistry is AccessControl, Pausable, EIP712 {
    using ECDSA for bytes32;
    using Counters for Counters.Counter;

    // ==========================================================================
    // Type declarations
    // ==========================================================================

    // Schema definition for attestation types
    struct Schema {
        bytes32 id;              // Unique schema ID
        string name;             // Human-readable name (e.g., "Academic Degree", "Medical License")
        string description;      // Description of the schema
        string jsonSchema;       // JSON schema definition for validation
        address creator;         // Address that created this schema
        uint40 createdAt;        // Creation timestamp
        bool active;             // Whether schema is active
    }

    // Universal attestation structure - supports any domain
    struct Attestation {
        bytes32 id;              // Unique attestation ID
        bytes32 schemaId;        // Links to attestation schema/template
        address attester;        // Address of entity that issued the attestation
        address subject;         // Address of attestation subject
        bytes data;              // Flexible data structure (encoded attestation data)
        string metadataURI;      // IPFS/Arweave URI containing additional metadata
        uint40 issueDate;        // Date attestation was issued (packed timestamp)
        uint40 expiryDate;       // Optional expiry date (0 if no expiry) (packed timestamp)
        bool revoked;            // Whether the attestation has been revoked
        uint8 version;           // Schema version used
    }

    // Pagination params for retrieving attestations in batches
    struct PaginationParams {
        uint256 offset;
        uint256 limit;
    }

    // Constants for EIP-712 signature verification
    bytes32 private constant ATTESTATION_TYPEHASH = keccak256(
        "Attestation(bytes32 id,bytes32 schemaId,address subject,bytes data,uint256 expiryDate)"
    );
    
    bytes32 private constant SCHEMA_TYPEHASH = keccak256(
        "Schema(bytes32 id,string name,string description,string jsonSchema)"
    );

    // ==========================================================================
    // State variables
    // ==========================================================================

    // Roles
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant ATTESTER_ROLE = keccak256("ATTESTER_ROLE");
    bytes32 public constant REVOKER_ROLE = keccak256("REVOKER_ROLE");
    bytes32 public constant SCHEMA_CREATOR_ROLE = keccak256("SCHEMA_CREATOR_ROLE");
    
    // Counters for IDs
    Counters.Counter private _schemaIdCounter;
    Counters.Counter private _attestationIdCounter;

    // Circuit breaker state
    bool private _circuitBroken;

    // Schema storage
    mapping(bytes32 => Schema) public schemas;
    mapping(string => bytes32) public schemaNameToId; // Name lookup for schemas
    bytes32[] private _allSchemaIds;
    
    // Attestation storage
    mapping(bytes32 => Attestation) public attestations;
    
    // Mapping from address to array of attestation IDs
    mapping(address => bytes32[]) private _subjectAttestations;
    mapping(address => bytes32[]) private _attesterAttestations;
    
    // Mapping from schema to attestation IDs
    mapping(bytes32 => bytes32[]) private _schemaAttestations;

    // Counters for pagination
    mapping(address => uint256) public subjectAttestationCount;
    mapping(address => uint256) public attesterAttestationCount;
    mapping(bytes32 => uint256) public schemaAttestationCount;
    
    // Schema statistics
    uint256 public totalSchemas;
    uint256 public totalAttestations;

    // ==========================================================================
    // Events
    // ==========================================================================
    
    // Schema events
    event SchemaCreated(
        bytes32 indexed schemaId,
        string indexed name,
        address indexed creator,
        uint256 timestamp
    );
    
    event SchemaUpdated(
        bytes32 indexed schemaId,
        address indexed updater,
        uint256 timestamp
    );
    
    event SchemaDeactivated(
        bytes32 indexed schemaId,
        address indexed deactivator,
        uint256 timestamp
    );
    
    // Attestation events
    event AttestationIssued(
        bytes32 indexed id,
        bytes32 indexed schemaId,
        address indexed attester,
        address subject,
        uint256 issueDate
    );
    
    event AttestationRevoked(
        bytes32 indexed id,
        address indexed attester,
        address indexed revoker,
        uint256 revokeDate
    );
    
    event BatchAttestationsIssued(
        bytes32[] ids,
        bytes32 indexed schemaId,
        address indexed attester,
        address[] subjects,
        uint256 issueDate
    );
    
    // Role events
    event AttesterRoleGranted(address indexed attester, address indexed admin);
    event AttesterRoleRevoked(address indexed attester, address indexed admin);
    event SchemaCreatorRoleGranted(address indexed creator, address indexed admin);
    event SchemaCreatorRoleRevoked(address indexed creator, address indexed admin);
    
    // System events
    event CircuitBreaker(bool broken, address indexed admin);
    event MetadataUpdated(bytes32 indexed id, string newMetadataURI, address indexed updater);

    // ==========================================================================
    // Constructor
    // ==========================================================================
    
    /**
     * @dev Constructor sets up roles and EIP-712 domain
     */
    constructor() EIP712("AttestrProtocol", "2.0") {
        // Setup roles
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        _grantRole(ATTESTER_ROLE, msg.sender);
        _grantRole(REVOKER_ROLE, msg.sender);
        _grantRole(SCHEMA_CREATOR_ROLE, msg.sender);
        
        // Initialize counters
        totalSchemas = 0;
        totalAttestations = 0;
        
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
     * @dev Grant the attester role to an address
     * @param attesterAddress Address to grant attester role to
     */
    function grantAttesterRole(address attesterAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(ATTESTER_ROLE, attesterAddress);
        emit AttesterRoleGranted(attesterAddress, msg.sender);
    }
    
    /**
     * @dev Revoke the attester role from an address
     * @param attesterAddress Address to revoke attester role from
     */
    function revokeAttesterRole(address attesterAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _revokeRole(ATTESTER_ROLE, attesterAddress);
        emit AttesterRoleRevoked(attesterAddress, msg.sender);
    }
    
    /**
     * @dev Grant the schema creator role to an address
     * @param creatorAddress Address to grant schema creator role to
     */
    function grantSchemaCreatorRole(address creatorAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _grantRole(SCHEMA_CREATOR_ROLE, creatorAddress);
        emit SchemaCreatorRoleGranted(creatorAddress, msg.sender);
    }
    
    /**
     * @dev Revoke the schema creator role from an address
     * @param creatorAddress Address to revoke schema creator role from
     */
    function revokeSchemaCreatorRole(address creatorAddress) 
        external 
        onlyRole(ADMIN_ROLE) 
    {
        _revokeRole(SCHEMA_CREATOR_ROLE, creatorAddress);
        emit SchemaCreatorRoleRevoked(creatorAddress, msg.sender);
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
    // Schema management functions
    // ==========================================================================
    
    /**
     * @dev Create a new attestation schema
     * @param name Human-readable name for the schema
     * @param description Description of what this schema represents
     * @param jsonSchema JSON schema definition for validation
     * @return schemaId The unique ID of the created schema
     */
    function createSchema(
        string calldata name,
        string calldata description,
        string calldata jsonSchema
    )
        external
        whenNotPaused
        whenCircuitNotBroken
        onlyRole(SCHEMA_CREATOR_ROLE)
        returns (bytes32)
    {
        // Validate inputs
        require(bytes(name).length > 0, "Schema name cannot be empty");
        require(bytes(jsonSchema).length > 0, "JSON schema cannot be empty");
        require(schemaNameToId[name] == bytes32(0), "Schema name already exists");
        
        // Generate schema ID
        _schemaIdCounter.increment();
        bytes32 schemaId = keccak256(
            abi.encodePacked(
                "schema",
                msg.sender,
                name,
                block.timestamp,
                _schemaIdCounter.current()
            )
        );
        
        // Create schema
        schemas[schemaId] = Schema({
            id: schemaId,
            name: name,
            description: description,
            jsonSchema: jsonSchema,
            creator: msg.sender,
            createdAt: uint40(block.timestamp),
            active: true
        });
        
        // Update mappings
        schemaNameToId[name] = schemaId;
        _allSchemaIds.push(schemaId);
        totalSchemas++;
        
        emit SchemaCreated(schemaId, name, msg.sender, block.timestamp);
        
        return schemaId;
    }
    
    /**
     * @dev Update an existing schema (only creator or admin)
     * @param schemaId ID of the schema to update
     * @param description New description
     * @param jsonSchema New JSON schema definition
     */
    function updateSchema(
        bytes32 schemaId,
        string calldata description,
        string calldata jsonSchema
    )
        external
        whenNotPaused
        whenCircuitNotBroken
    {
        Schema storage schema = schemas[schemaId];
        require(schema.creator != address(0), "Schema does not exist");
        require(
            schema.creator == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to update this schema"
        );
        require(schema.active, "Cannot update deactivated schema");
        require(bytes(jsonSchema).length > 0, "JSON schema cannot be empty");
        
        schema.description = description;
        schema.jsonSchema = jsonSchema;
        
        emit SchemaUpdated(schemaId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Deactivate a schema (only creator or admin)
     * @param schemaId ID of the schema to deactivate
     */
    function deactivateSchema(bytes32 schemaId)
        external
        whenNotPaused
        onlyRole(ADMIN_ROLE)
    {
        Schema storage schema = schemas[schemaId];
        require(schema.creator != address(0), "Schema does not exist");
        require(schema.active, "Schema already deactivated");
        
        schema.active = false;
        
        emit SchemaDeactivated(schemaId, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Get schema details
     * @param schemaId ID of the schema
     * @return Schema data structure
     */
    function getSchema(bytes32 schemaId)
        external
        view
        returns (Schema memory)
    {
        require(schemas[schemaId].creator != address(0), "Schema does not exist");
        return schemas[schemaId];
    }
    
    /**
     * @dev Get all schema IDs
     * @return Array of all schema IDs
     */
    function getAllSchemaIds()
        external
        view
        returns (bytes32[] memory)
    {
        return _allSchemaIds;
    }
    
    // ==========================================================================
    // Attestation issuance functions
    // ==========================================================================
    
    /**
     * @dev Issue a new attestation
     * @param schemaId ID of the schema to use
     * @param subject Subject's wallet address
     * @param data Encoded attestation data according to schema
     * @param metadataURI Optional IPFS/Arweave URI for additional metadata
     * @param expiryDate Optional expiry date (0 if no expiry)
     * @return attestationId The unique ID of the issued attestation
     */
    function issueAttestation(
        bytes32 schemaId,
        address subject,
        bytes calldata data,
        string calldata metadataURI,
        uint256 expiryDate
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        onlyRole(ATTESTER_ROLE) 
        returns (bytes32) 
    {
        // Validate schema exists and is active
        Schema storage schema = schemas[schemaId];
        require(schema.creator != address(0), "Schema does not exist");
        require(schema.active, "Schema is not active");
        require(data.length > 0, "Attestation data cannot be empty");
        
        // Check expiryDate is either 0 or in the future
        if (expiryDate > 0) {
            require(expiryDate > block.timestamp, "Expiry date must be in the future");
        }
        
        // Generate unique attestation ID
        _attestationIdCounter.increment();
        bytes32 attestationId = keccak256(
            abi.encodePacked(
                "attestation",
                schemaId,
                msg.sender,
                subject,
                block.timestamp,
                _attestationIdCounter.current()
            )
        );
        
        // Ensure attestation ID doesn't already exist
        require(attestations[attestationId].attester == address(0), "Attestation ID already exists");
        
        // Convert timestamps to uint40 for better gas efficiency
        uint40 issueDate = uint40(block.timestamp);
        uint40 packedExpiryDate = expiryDate > 0 ? uint40(expiryDate) : 0;
        
        // Create and store the attestation
        attestations[attestationId] = Attestation({
            id: attestationId,
            schemaId: schemaId,
            attester: msg.sender,
            subject: subject,
            data: data,
            metadataURI: metadataURI,
            issueDate: issueDate,
            expiryDate: packedExpiryDate,
            revoked: false,
            version: 1
        });
        
        // Update mappings and counters
        _subjectAttestations[subject].push(attestationId);
        subjectAttestationCount[subject]++;
        
        _attesterAttestations[msg.sender].push(attestationId);
        attesterAttestationCount[msg.sender]++;
        
        _schemaAttestations[schemaId].push(attestationId);
        schemaAttestationCount[schemaId]++;
        
        totalAttestations++;
        
        // Emit event
        emit AttestationIssued(attestationId, schemaId, msg.sender, subject, issueDate);
        
        return attestationId;
    }
    
    /**
     * @dev Issue multiple attestations in a single transaction (gas efficient)
     * @param schemaId ID of the schema to use for all attestations
     * @param subjects Array of subject wallet addresses
     * @param dataArray Array of encoded attestation data
     * @param metadataURIs Array of optional IPFS/Arweave URIs
     * @param expiryDates Array of optional expiry dates (0 if no expiry)
     * @return attestationIds Array of unique IDs of the issued attestations
     */
    function batchIssueAttestations(
        bytes32 schemaId,
        address[] calldata subjects,
        bytes[] calldata dataArray,
        string[] calldata metadataURIs,
        uint256[] calldata expiryDates
    ) 
        external 
        whenNotPaused 
        whenCircuitNotBroken
        onlyRole(ATTESTER_ROLE) 
        returns (bytes32[] memory) 
    {
        // Validate schema exists and is active
        Schema storage schema = schemas[schemaId];
        require(schema.creator != address(0), "Schema does not exist");
        require(schema.active, "Schema is not active");
        
        // Ensure input arrays have the same length
        require(
            subjects.length == dataArray.length && 
            subjects.length == metadataURIs.length &&
            subjects.length == expiryDates.length,
            "Input arrays must have same length"
        );
        
        // Allocate array for attestation IDs
        bytes32[] memory attestationIds = new bytes32[](subjects.length);
        
        // Current timestamp used for all attestations in batch (gas optimization)
        uint40 issueDate = uint40(block.timestamp);
        
        // Issue each attestation
        for (uint256 i = 0; i < subjects.length; i++) {
            // Validate subject
            require(subjects[i] != address(0), "Invalid subject address");
            require(dataArray[i].length > 0, "Attestation data cannot be empty");
            
            // Check expiryDate
            if (expiryDates[i] > 0) {
                require(expiryDates[i] > block.timestamp, "Expiry date must be in the future");
            }
            
            // Generate attestation ID
            _attestationIdCounter.increment();
            bytes32 attestationId = keccak256(
                abi.encodePacked(
                    "attestation_batch",
                    schemaId,
                    msg.sender,
                    subjects[i],
                    block.timestamp,
                    i, // Add index to ensure uniqueness within batch
                    _attestationIdCounter.current()
                )
            );
            
            // Ensure attestation ID doesn't already exist
            require(attestations[attestationId].attester == address(0), "Attestation ID already exists");
            
            // Convert expiry to uint40
            uint40 packedExpiryDate = expiryDates[i] > 0 ? uint40(expiryDates[i]) : 0;
            
            // Create and store the attestation
            attestations[attestationId] = Attestation({
                id: attestationId,
                schemaId: schemaId,
                attester: msg.sender,
                subject: subjects[i],
                data: dataArray[i],
                metadataURI: metadataURIs[i],
                issueDate: issueDate,
                expiryDate: packedExpiryDate,
                revoked: false,
                version: 1
            });
            
            // Update mappings and counters
            _subjectAttestations[subjects[i]].push(attestationId);
            subjectAttestationCount[subjects[i]]++;
            
            _attesterAttestations[msg.sender].push(attestationId);
            attesterAttestationCount[msg.sender]++;
            
            _schemaAttestations[schemaId].push(attestationId);
            schemaAttestationCount[schemaId]++;
            
            // Store ID in return array
            attestationIds[i] = attestationId;
        }
        
        // Update global counter
        totalAttestations += subjects.length;
        
        // Emit batch event
        emit BatchAttestationsIssued(attestationIds, schemaId, msg.sender, subjects, issueDate);
        
        return attestationIds;
    }

    // ==========================================================================
    // Attestation management functions
    // ==========================================================================
    
    /**
     * @dev Revoke an attestation
     * @param attestationId ID of the attestation to revoke
     */
    function revokeAttestation(bytes32 attestationId) 
        external 
        whenNotPaused 
    {
        Attestation storage attestation = attestations[attestationId];
        
        // Check that attestation exists
        require(attestation.attester != address(0), "Attestation does not exist");
        require(!attestation.revoked, "Attestation already revoked");
        
        // Only the original attester, an address with REVOKER_ROLE, or an admin can revoke an attestation
        require(
            attestation.attester == msg.sender || 
            hasRole(REVOKER_ROLE, msg.sender) || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to revoke this attestation"
        );
        
        // Set revoked flag
        attestation.revoked = true;
        
        // Emit event
        emit AttestationRevoked(attestationId, attestation.attester, msg.sender, block.timestamp);
    }
    
    /**
     * @dev Update the metadata URI for an attestation (only by attester or admin)
     * @param attestationId ID of the attestation to update
     * @param newMetadataURI New metadata URI
     */
    function updateMetadataURI(bytes32 attestationId, string calldata newMetadataURI) 
        external 
        whenNotPaused 
        whenCircuitNotBroken 
    {
        Attestation storage attestation = attestations[attestationId];
        
        // Check that attestation exists
        require(attestation.attester != address(0), "Attestation does not exist");
        require(!attestation.revoked, "Cannot update revoked attestation");
        
        // Only the original attester or an admin can update metadata
        require(
            attestation.attester == msg.sender || hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized to update this attestation"
        );
        
        // Update metadata URI
        attestation.metadataURI = newMetadataURI;
        
        // Emit event
        emit MetadataUpdated(attestationId, newMetadataURI, msg.sender);
    }

    // ==========================================================================
    // Attestation verification functions
    // ==========================================================================
    
    /**
     * @dev Verify an attestation
     * @param attestationId ID of the attestation to verify
     * @return isValid Whether the attestation is valid (exists and not revoked)
     * @return attester Address of the attesting entity
     * @return issueDate Date when the attestation was issued
     * @return expiryDate Expiration date of the attestation (0 if no expiry)
     */
    function verifyAttestation(bytes32 attestationId)
        external
        view
        returns (
            bool isValid,
            address attester,
            uint256 issueDate,
            uint256 expiryDate
        )
    {
        Attestation storage attestation = attestations[attestationId];
        
        // Check that attestation exists
        if (attestation.attester == address(0)) {
            return (false, address(0), 0, 0);
        }
        
        // Check if attestation is revoked
        if (attestation.revoked) {
            return (false, attestation.attester, attestation.issueDate, attestation.expiryDate);
        }
        
        // Check if attestation is expired (if it has an expiry date)
        if (attestation.expiryDate > 0 && uint256(attestation.expiryDate) < block.timestamp) {
            return (false, attestation.attester, attestation.issueDate, attestation.expiryDate);
        }
        
        // Attestation is valid
        return (true, attestation.attester, attestation.issueDate, attestation.expiryDate);
    }
    
    /**
     * @dev Get attestation details
     * @param attestationId ID of the attestation
     * @return Attestation data structure
     */
    function getAttestation(bytes32 attestationId)
        external
        view
        returns (Attestation memory)
    {
        require(attestations[attestationId].attester != address(0), "Attestation does not exist");
        return attestations[attestationId];
    }
    
    /**
     * @dev Get attestations for a subject with pagination
     * @param subject Address of the attestation subject
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return attestationIds Array of attestation IDs
     * @return totalCount Total number of attestations for this subject
     */
    function getAttestationsForSubject(
        address subject,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory attestationIds, uint256 totalCount)
    {
        totalCount = subjectAttestationCount[subject];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        attestationIds = new bytes32[](actualLimit);
        
        // Fill array with attestation IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            attestationIds[i] = _subjectAttestations[subject][offset + i];
        }
        
        return (attestationIds, totalCount);
    }
    
    /**
     * @dev Get attestations issued by an attester with pagination
     * @param attester Address of the attesting entity
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return attestationIds Array of attestation IDs
     * @return totalCount Total number of attestations for this attester
     */
    function getAttestationsForAttester(
        address attester,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory attestationIds, uint256 totalCount)
    {
        totalCount = attesterAttestationCount[attester];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        attestationIds = new bytes32[](actualLimit);
        
        // Fill array with attestation IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            attestationIds[i] = _attesterAttestations[attester][offset + i];
        }
        
        return (attestationIds, totalCount);
    }
    
    /**
     * @dev Get attestations for a schema with pagination
     * @param schemaId ID of the schema
     * @param offset Pagination offset
     * @param limit Maximum number of items to return (0 for no limit)
     * @return attestationIds Array of attestation IDs
     * @return totalCount Total number of attestations for this schema
     */
    function getAttestationsForSchema(
        bytes32 schemaId,
        uint256 offset,
        uint256 limit
    )
        external
        view
        returns (bytes32[] memory attestationIds, uint256 totalCount)
    {
        totalCount = schemaAttestationCount[schemaId];
        
        // Handle empty case
        if (totalCount == 0 || offset >= totalCount) {
            return (new bytes32[](0), totalCount);
        }
        
        // Calculate actual limit based on available items
        uint256 availableItems = totalCount - offset;
        uint256 actualLimit = (limit == 0 || limit > availableItems) ? availableItems : limit;
        
        // Create result array
        attestationIds = new bytes32[](actualLimit);
        
        // Fill array with attestation IDs within range
        for (uint256 i = 0; i < actualLimit; i++) {
            attestationIds[i] = _schemaAttestations[schemaId][offset + i];
        }
        
        return (attestationIds, totalCount);
    }

    // ==========================================================================
    // Batch attestation verification functions
    // ==========================================================================
    
    /**
     * @dev Verify multiple attestations in a single call
     * @param attestationIds Array of attestation IDs to verify
     * @return results Array of verification results (isValid)
     */
    function batchVerifyAttestations(bytes32[] calldata attestationIds)
        external
        view
        returns (bool[] memory results)
    {
        results = new bool[](attestationIds.length);
        
        for (uint256 i = 0; i < attestationIds.length; i++) {
            Attestation storage attestation = attestations[attestationIds[i]];
            
            // Attestation is valid if it exists, is not revoked, and is not expired
            results[i] = (
                attestation.attester != address(0) &&
                !attestation.revoked &&
                (attestation.expiryDate == 0 || uint256(attestation.expiryDate) >= block.timestamp)
            );
        }
        
        return results;
    }

    // ==========================================================================
    // Helper functions
    // ==========================================================================
    
    /**
     * @dev Check if an address is an authorized attester
     * @param attesterAddress Address to check
     * @return Whether the address is an authorized attester
     */
    function isAuthorizedAttester(address attesterAddress)
        external
        view
        returns (bool)
    {
        return hasRole(ATTESTER_ROLE, attesterAddress);
    }
    
    /**
     * @dev Check if an address can create schemas
     * @param creatorAddress Address to check
     * @return Whether the address can create schemas
     */
    function canCreateSchema(address creatorAddress)
        external
        view
        returns (bool)
    {
        return hasRole(SCHEMA_CREATOR_ROLE, creatorAddress);
    }
    
    /**
     * @dev Get schema ID by name
     * @param name Schema name
     * @return schemaId Schema ID (bytes32(0) if not found)
     */
    function getSchemaIdByName(string calldata name)
        external
        view
        returns (bytes32)
    {
        return schemaNameToId[name];
    }
    
    /**
     * @dev Get contract statistics
     * @return totalSchemas_ Total number of schemas created
     * @return totalAttestations_ Total number of attestations issued
     * @return activeSchemas Number of active schemas
     */
    function getStatistics()
        external
        view
        returns (uint256 totalSchemas_, uint256 totalAttestations_, uint256 activeSchemas)
    {
        totalSchemas_ = totalSchemas;
        totalAttestations_ = totalAttestations;
        
        // Count active schemas
        activeSchemas = 0;
        for (uint256 i = 0; i < _allSchemaIds.length; i++) {
            if (schemas[_allSchemaIds[i]].active) {
                activeSchemas++;
            }
        }
    }
}