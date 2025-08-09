// test/certificate-test.js
const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Attestr Protocol", function () {
    let certificateIssuance;
    let verification;
    let owner, admin, issuer1, issuer2, recipient1, recipient2, verifier;
    let ISSUER_ROLE, REVOKER_ROLE, ADMIN_ROLE;

    beforeEach(async function () {
        // Get signers
        [owner, admin, issuer1, issuer2, recipient1, recipient2, verifier] = await ethers.getSigners();

        // Deploy the CertificateIssuance contract
        const CertificateIssuance = await ethers.getContractFactory("CertificateIssuance");
        certificateIssuance = await CertificateIssuance.deploy();
        await certificateIssuance.deployed();

        // Deploy the Verification contract
        const Verification = await ethers.getContractFactory("Verification");
        verification = await Verification.deploy(certificateIssuance.address);
        await verification.deployed();

        // Get role hashes
        ADMIN_ROLE = await certificateIssuance.ADMIN_ROLE();
        ISSUER_ROLE = await certificateIssuance.ISSUER_ROLE();
        REVOKER_ROLE = await certificateIssuance.REVOKER_ROLE();

        // Grant admin role to the admin account
        await certificateIssuance.grantRole(ADMIN_ROLE, admin.address);

        // Grant issuer roles
        await certificateIssuance.grantIssuerRole(issuer1.address);
        await certificateIssuance.grantIssuerRole(issuer2.address);

        // Grant verifier role in Verification contract
        await verification.grantVerifierRole(verifier.address);
    });

    describe("Certificate Issuance", function () {
        it("Should allow an authorized issuer to issue a certificate", async function () {
            const metadataURI = "ar://arweave-hash-example";
            const expiryDate = 0; // No expiry

            // Connect as issuer1 and issue a certificate
            const issuerContract = certificateIssuance.connect(issuer1);
            const tx = await issuerContract.issueCertificate(
                recipient1.address,
                metadataURI,
                expiryDate
            );

            const receipt = await tx.wait();

            // Find the certificate ID from the emitted event
            const event = receipt.events.find(e => e.event === 'CertificateIssued');
            expect(event).to.not.be.undefined;

            const certificateId = event.args.id;
            expect(certificateId).to.not.be.null;

            // Verify the certificate
            const [isValid, issuer, issueDate, expiryResponse] = await certificateIssuance.verifyCertificate(certificateId);
            expect(isValid).to.be.true;
            expect(issuer).to.equal(issuer1.address);
            expect(expiryResponse.toNumber()).to.equal(expiryDate);

            // Get certificate details
            const certDetails = await certificateIssuance.getCertificate(certificateId);
            expect(certDetails.issuer).to.equal(issuer1.address);
            expect(certDetails.recipient).to.equal(recipient1.address);
            expect(certDetails.metadataURI).to.equal(metadataURI);
            expect(certDetails.revoked).to.be.false;
        });

        it("Should not allow unauthorized addresses to issue certificates", async function () {
            const metadataURI = "ar://unauthorized-test";
            const expiryDate = 0;

            // Try to issue a certificate as a non-issuer
            const nonIssuerContract = certificateIssuance.connect(recipient1);

            await expect(
                nonIssuerContract.issueCertificate(
                    recipient2.address,
                    metadataURI,
                    expiryDate
                )
            ).to.be.revertedWith(/AccessControl/); // Should revert with AccessControl error
        });

        it("Should allow batch issuance of certificates", async function () {
            const metadataURIs = [
                "ar://batch-test-1",
                "ar://batch-test-2",
                "ar://batch-test-3"
            ];
            const recipients = [
                recipient1.address,
                recipient2.address,
                recipient1.address // Same recipient can receive multiple certificates
            ];
            const expiryDates = [0, 0, 0]; // No expiry for all

            // Issue batch of certificates
            const issuerContract = certificateIssuance.connect(issuer1);
            const tx = await issuerContract.batchIssueCertificates(
                recipients,
                metadataURIs,
                expiryDates
            );

            const receipt = await tx.wait();

            // Check for BatchCertificatesIssued event
            const batchEvent = receipt.events.find(e => e.event === 'BatchCertificatesIssued');
            expect(batchEvent).to.not.be.undefined;

            // Verify all certificates in the batch
            const certificateIds = batchEvent.args.ids;
            expect(certificateIds.length).to.equal(3);

            // Use batch verification to check all certificates
            const results = await certificateIssuance.batchVerifyCertificates(certificateIds);
            expect(results.length).to.equal(3);
            expect(results.every(r => r === true)).to.be.true;

            // Check recipient certificates using pagination
            const [recipientCerts, totalCount] = await certificateIssuance.getCertificatesForRecipient(
                recipient1.address,
                0, // offset
                10 // limit
            );

            expect(totalCount.toNumber()).to.be.at.least(2); // Should have at least 2 certificates
            expect(recipientCerts.length).to.be.at.least(2);
        });
    });

    describe("Certificate Verification", function () {
        let certificateId;

        beforeEach(async function () {
            // Create a certificate to test with
            const metadataURI = "ar://verification-test";
            const issuerContract = certificateIssuance.connect(issuer1);
            const tx = await issuerContract.issueCertificate(
                recipient1.address,
                metadataURI,
                0 // No expiry
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CertificateIssued');
            certificateId = event.args.id;
        });

        it("Should allow recording third-party verifications", async function () {
            // Record a verification as verifier
            const verifierContract = verification.connect(verifier);
            const verifyTx = await verifierContract.verifyCertificate(certificateId);
            const verifyReceipt = await verifyTx.wait();

            // Check for CertificateVerified event
            const verifyEvent = verifyReceipt.events.find(e => e.event === 'CertificateVerified');
            expect(verifyEvent).to.not.be.undefined;

            const verificationId = verifyEvent.args.verificationId;
            const isValid = verifyEvent.args.isValid;

            expect(verificationId).to.not.be.null;
            expect(isValid).to.be.true;

            // Get verification details
            const verificationDetails = await verification.getVerification(verificationId);
            expect(verificationDetails.certificateId).to.equal(certificateId);
            expect(verificationDetails.verifier).to.equal(verifier.address);
            expect(verificationDetails.isValid).to.be.true;
        });

        it("Should allow batch verification recording", async function () {
            // Create a few more certificates
            const metadataURIs = [
                "ar://batch-verify-1",
                "ar://batch-verify-2"
            ];
            const recipients = [
                recipient1.address,
                recipient2.address
            ];
            const expiryDates = [0, 0]; // No expiry

            const issuerContract = certificateIssuance.connect(issuer1);
            const tx = await issuerContract.batchIssueCertificates(
                recipients, metadataURIs, expiryDates
            );

            const receipt = await tx.wait();
            const batchEvent = receipt.events.find(e => e.event === 'BatchCertificatesIssued');
            const certificateIds = [
                certificateId, // Use the previously created certificate
                ...batchEvent.args.ids // Add the newly created certificates
            ];

            // Perform batch verification
            const verifierContract = verification.connect(verifier);
            const batchVerifyTx = await verifierContract.batchVerifyCertificates(certificateIds);
            const batchVerifyReceipt = await batchVerifyTx.wait();

            // Check for BatchCertificatesVerified event
            const batchVerifyEvent = batchVerifyReceipt.events.find(
                e => e.event === 'BatchCertificatesVerified'
            );
            expect(batchVerifyEvent).to.not.be.undefined;

            const verificationIds = batchVerifyEvent.args.verificationIds;
            const results = batchVerifyEvent.args.results;

            expect(verificationIds.length).to.equal(certificateIds.length);
            expect(results.length).to.equal(certificateIds.length);
            expect(results.every(r => r === true)).to.be.true;

            // Check verifier history
            const [verifierHistory, totalVerifications] = await verification.getVerifierHistory(
                verifier.address,
                0, // offset
                10 // limit
            );

            expect(totalVerifications.toNumber()).to.be.at.least(certificateIds.length);
            expect(verifierHistory.length).to.be.at.least(certificateIds.length);
        });
    });

    describe("Certificate Revocation", function () {
        let certificateId;

        beforeEach(async function () {
            // Create a certificate to test with
            const metadataURI = "ar://revocation-test";
            const issuerContract = certificateIssuance.connect(issuer1);
            const tx = await issuerContract.issueCertificate(
                recipient1.address,
                metadataURI,
                0 // No expiry
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CertificateIssued');
            certificateId = event.args.id;
        });

        it("Should allow the issuer to revoke a certificate", async function () {
            // Revoke certificate as issuer
            const issuerContract = certificateIssuance.connect(issuer1);
            const revokeTx = await issuerContract.revokeCertificate(certificateId);
            const revokeReceipt = await revokeTx.wait();

            // Check for CertificateRevoked event
            const revokeEvent = revokeReceipt.events.find(e => e.event === 'CertificateRevoked');
            expect(revokeEvent).to.not.be.undefined;

            // Verify certificate is now invalid
            const [isValid] = await certificateIssuance.verifyCertificate(certificateId);
            expect(isValid).to.be.false;

            // Get certificate details to confirm revoked state
            const certDetails = await certificateIssuance.getCertificate(certificateId);
            expect(certDetails.revoked).to.be.true;
        });

        it("Should allow an admin to revoke any certificate", async function () {
            // Revoke certificate as admin
            const adminContract = certificateIssuance.connect(admin);
            const revokeTx = await adminContract.revokeCertificate(certificateId);
            const revokeReceipt = await revokeTx.wait();

            // Check for CertificateRevoked event
            const revokeEvent = revokeReceipt.events.find(e => e.event === 'CertificateRevoked');
            expect(revokeEvent).to.not.be.undefined;

            // Verify certificate is now invalid
            const [isValid] = await certificateIssuance.verifyCertificate(certificateId);
            expect(isValid).to.be.false;
        });

        it("Should not allow unauthorized addresses to revoke certificates", async function () {
            // Try to revoke as non-issuer/non-admin
            const nonAuthorizedContract = certificateIssuance.connect(recipient2);

            await expect(
                nonAuthorizedContract.revokeCertificate(certificateId)
            ).to.be.revertedWith("Not authorized to revoke this certificate");
        });
    });

    describe("Pagination", function () {
        it("Should correctly paginate through recipient certificates", async function () {
            // Issue multiple certificates to the same recipient
            const issuerContract = certificateIssuance.connect(issuer1);
            const metadataBase = "ar://pagination-test-";
            const totalCerts = 5;

            // Issue certificates one by one
            for (let i = 0; i < totalCerts; i++) {
                await issuerContract.issueCertificate(
                    recipient1.address,
                    `${metadataBase}${i}`,
                    0 // No expiry
                );
            }

            // Test pagination with different parameters
            // First page (2 items)
            const [page1, total1] = await certificateIssuance.getCertificatesForRecipient(
                recipient1.address,
                0, // offset
                2  // limit
            );

            expect(total1.toNumber()).to.be.at.least(totalCerts);
            expect(page1.length).to.equal(2);

            // Second page (2 items)
            const [page2, total2] = await certificateIssuance.getCertificatesForRecipient(
                recipient1.address,
                2, // offset
                2  // limit
            );

            expect(total2.toNumber()).to.equal(total1.toNumber());
            expect(page2.length).to.equal(2);

            // Third page (remaining items, should be at least 1)
            const [page3, total3] = await certificateIssuance.getCertificatesForRecipient(
                recipient1.address,
                4, // offset
                2  // limit
            );

            expect(total3.toNumber()).to.equal(total1.toNumber());
            expect(page3.length).to.be.at.least(1);

            // The IDs on different pages should be different
            const allIds = [...page1, ...page2, ...page3];
            const uniqueIds = [...new Set(allIds.map(id => id.toString()))];
            expect(uniqueIds.length).to.equal(allIds.length);
        });
    });

    describe("Emergency Controls", function () {
        it("Should allow pausing and unpausing the contract", async function () {
            // Pause the contract as admin
            const adminContract = certificateIssuance.connect(admin);
            await adminContract.setPaused(true);

            // Try to issue a certificate while paused
            const issuerContract = certificateIssuance.connect(issuer1);

            await expect(
                issuerContract.issueCertificate(
                    recipient1.address,
                    "ar://paused-test",
                    0
                )
            ).to.be.revertedWith("Pausable: paused");

            // Unpause the contract
            await adminContract.setPaused(false);

            // Should be able to issue certificate now
            const tx = await issuerContract.issueCertificate(
                recipient1.address,
                "ar://unpaused-test",
                0
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CertificateIssued');
            expect(event).to.not.be.undefined;
        });

        it("Should implement circuit breaker pattern", async function () {
            // Break the circuit as admin
            const adminContract = certificateIssuance.connect(admin);
            await adminContract.setCircuitBreaker(true);

            // Try to issue a certificate while circuit is broken
            const issuerContract = certificateIssuance.connect(issuer1);

            await expect(
                issuerContract.issueCertificate(
                    recipient1.address,
                    "ar://circuit-broken-test",
                    0
                )
            ).to.be.revertedWith("Circuit broken: contract in emergency mode");

            // Fix the circuit
            await adminContract.setCircuitBreaker(false);

            // Should be able to issue certificate now
            const tx = await issuerContract.issueCertificate(
                recipient1.address,
                "ar://circuit-fixed-test",
                0
            );

            const receipt = await tx.wait();
            const event = receipt.events.find(e => e.event === 'CertificateIssued');
            expect(event).to.not.be.undefined;
        });
    });

    // Additional tests can be added for EIP-712 signature verification
    // and other advanced features
});