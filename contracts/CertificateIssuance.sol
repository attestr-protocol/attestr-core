// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

/**
 * @title CertificateIssuance
 * @dev Smart contract for issuing and verifying academic and professional credentials on the blockchain
 */
contract CertificateIssuance {
    // Certificate data structure
    struct Certificate {
        bytes32 id;              // Unique certificate ID
        address issuer;          // Address of institution that issued the certificate
        address recipient;       // Address of certificate recipient
        string metadataURI;      // IPFS URI containing certificate metadata (name, credential, etc.)
        uint256 issueDate;       // Date certificate was issued
        uint256 expiryDate;      // Optional expiry date (0 if no expiry)
        bool revoked;            // Whether the certificate has been revoked
    }
    
    // Mapping from certificate ID to Certificate
    mapping(bytes32 => Certificate) public certificates;
    
    // Mapping from address to array of certificate IDs
    mapping(address => bytes32[]) public recipientCertificates;
    
    // Mapping from address to array of certificate IDs (for issuers)
    mapping(address => bytes32[]) public issuerCertificates;
    
    // Mapping for verified issuers (institutions)
    mapping(address => bool) public verifiedIssuers;
    
    // Contract owner
    address public owner;
    
    // Events
    event CertificateIssued(
        bytes32 indexed id,
        address indexed issuer,
        address indexed recipient,
        uint256 issueDate
    );
    
    event CertificateRevoked(
        bytes32 indexed id,
        address indexed issuer,
        uint256 revokeDate
    );
    
    event IssuerVerified(address indexed issuer);
    event IssuerRevoked(address indexed issuer);
    
    // Modifiers
    modifier onlyOwner() {
        require(msg.sender == owner, "Only owner can perform this action");
        _;
    }
    
    modifier onlyVerifiedIssuer() {
        require(verifiedIssuers[msg.sender], "Only verified issuers can perform this action");
        _;
    }
    
    /**
     * @dev Constructor sets the contract owner
     */
    constructor() {
        owner = msg.sender;
    }
    
    /**
     * @dev Verify an institution as a certificate issuer
     * @param issuerAddress Address of the institution to verify
     */
    function verifyIssuer(address issuerAddress) external onlyOwner {
        verifiedIssuers[issuerAddress] = true;
        emit IssuerVerified(issuerAddress);
    }
    
    /**
     * @dev Revoke an institution's verified status
     * @param issuerAddress Address of the institution to revoke
     */
    function revokeIssuer(address issuerAddress) external onlyOwner {
        verifiedIssuers[issuerAddress] = false;
        emit IssuerRevoked(issuerAddress);
    }
    
    /**
     * @dev Issue a new certificate
     * @param recipient Recipient's wallet address
     * @param metadataURI IPFS URI containing certificate metadata
     * @param expiryDate Optional expiry date (0 if no expiry)
     * @return certificateId The unique ID of the issued certificate
     */
    function issueCertificate(
        address recipient,
        string calldata metadataURI,
        uint256 expiryDate
    ) external onlyVerifiedIssuer returns (bytes32) {
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
        
        // Create and store the certificate
        certificates[certificateId] = Certificate({
            id: certificateId,
            issuer: msg.sender,
            recipient: recipient,
            metadataURI: metadataURI,
            issueDate: block.timestamp,
            expiryDate: expiryDate,
            revoked: false
        });
        
        // Add to recipient's certificates
        recipientCertificates[recipient].push(certificateId);
        
        // Add to issuer's certificates
        issuerCertificates[msg.sender].push(certificateId);
        
        // Emit event
        emit CertificateIssued(certificateId, msg.sender, recipient, block.timestamp);
        
        return certificateId;
    }
    
    /**
     * @dev Revoke a certificate
     * @param certificateId ID of the certificate to revoke
     */
    function revokeCertificate(bytes32 certificateId) external {
        Certificate storage cert = certificates[certificateId];
        
        // Check that certificate exists
        require(cert.issuer != address(0), "Certificate does not exist");
        
        // Only the original issuer or the contract owner can revoke a certificate
        require(
            cert.issuer == msg.sender || msg.sender == owner,
            "Only the issuer or contract owner can revoke certificates"
        );
        
        // Set revoked flag
        cert.revoked = true;
        
        // Emit event
        emit CertificateRevoked(certificateId, cert.issuer, block.timestamp);
    }
    
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
        if (cert.expiryDate > 0 && block.timestamp > cert.expiryDate) {
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
     * @return metadataURI IPFS URI containing certificate metadata
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
     * @dev Get all certificates for a recipient
     * @param recipient Address of the certificate recipient
     * @return Array of certificate IDs
     */
    function getCertificatesForRecipient(address recipient)
        external
        view
        returns (bytes32[] memory)
    {
        return recipientCertificates[recipient];
    }
    
    /**
     * @dev Get all certificates issued by an institution
     * @param issuer Address of the issuing institution
     * @return Array of certificate IDs
     */
    function getCertificatesForIssuer(address issuer)
        external
        view
        returns (bytes32[] memory)
    {
        return issuerCertificates[issuer];
    }
    
    /**
     * @dev Transfer ownership of the contract
     * @param newOwner Address of the new owner
     */
    function transferOwnership(address newOwner) external onlyOwner {
        require(newOwner != address(0), "New owner cannot be zero address");
        owner = newOwner;
    }
}