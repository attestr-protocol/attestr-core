const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("VeriChain", function () {
    let certificateContract;
    let verificationContract;
    let owner, issuer, recipient, verifier;

    beforeEach(async function () {
        // Get signers
        [owner, issuer, recipient, verifier] = await ethers.getSigners();

        // Deploy the CertificateIssuance contract
        const CertificateIssuance = await ethers.getContractFactory("CertificateIssuance");
        certificateContract = await CertificateIssuance.deploy();
        await certificateContract.deployed();

        // Verify an issuer
        await certificateContract.verifyIssuer(issuer.address);

        // Deploy the Verification contract
        const Verification = await ethers.getContractFactory("Verification");
        verificationContract = await Verification.deploy(certificateContract.address);
        await verificationContract.deployed();
    });

    it("Should allow a verified issuer to issue certificates", async function () {
        const metadataURI = "ipfs://QmTest";
        const expiryDate = 0; // No expiry

        // Connect as issuer and issue a certificate
        const issuerContract = certificateContract.connect(issuer);
        const tx = await issuerContract.issueCertificate(
            recipient.address,
            metadataURI,
            expiryDate
        );

        const receipt = await tx.wait();

        // Find the certificate ID from the emitted event
        const event = receipt.events.find(e => e.event === 'CertificateIssued');
        const certificateId = event.args.id;

        // Verify the certificate
        const [isValid] = await certificateContract.verifyCertificate(certificateId);
        expect(isValid).to.be.true;

        // Get certificate details
        const certDetails = await certificateContract.getCertificate(certificateId);
        expect(certDetails.issuer).to.equal(issuer.address);
        expect(certDetails.recipient).to.equal(recipient.address);
        expect(certDetails.metadataURI).to.equal(metadataURI);
    });
});