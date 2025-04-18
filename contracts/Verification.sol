// SPDX-License-Identifier: MIT
pragma solidity ^0.8.17;

import "./CertificateIssuance.sol";

/**
 * @title Verification
 * @dev Smart contract for third-party verification of certificates
 */
contract Verification {
    // Reference to the CertificateIssuance contract
    CertificateIssuance public certificateContract;
    
    // Verification record
    struct VerificationRecord {
        bytes32 certificateId;
        address verifier;
        uint256 timestamp;
        bool isValid;
    }
    
    // Mapping from verification ID to verification record
    mapping(bytes32 => VerificationRecord) public verifications;
    
    // Event emitted when a verification is performed
    event CertificateVerified(
        bytes32 indexed verificationId,
        bytes32 indexed certificateId,
        address indexed verifier,
        bool isValid,
        uint256 timestamp
    );
    
    /**
     * @dev Constructor sets the address of the CertificateIssuance contract
     * @param _certificateContract Address of the CertificateIssuance contract
     */
    constructor(address _certificateContract) {
        certificateContract = CertificateIssuance(_certificateContract);
    }
    
    /**
     * @dev Verify a certificate and record the verification
     * @param certificateId ID of the certificate to verify
     * @return verificationId Unique ID of this verification record
     * @return isValid Whether the certificate is valid
     */
    function verifyCertificate(bytes32 certificateId) 
        external 
        returns (bytes32 verificationId, bool isValid) 
    {
        // Get verification result from the certificate contract
        (bool _isValid, address issuer, uint256 issueDate, uint256 expiryDate) = 
            certificateContract.verifyCertificate(certificateId);
        
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
            timestamp: block.timestamp,
            isValid: _isValid
        });
        
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
}