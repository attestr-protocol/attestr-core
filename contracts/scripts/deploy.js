// scripts/deploy.js
const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function main() {
    console.log(`Deploying Attestr Protocol v2.0 contracts to ${hre.network.name} network...`);
    console.log(`Network ID: ${hre.network.config.chainId}`);

    // Get the contract factories for the new universal attestation system
    const AttestationRegistry = await hre.ethers.getContractFactory("AttestationRegistry");
    const AttestationVerifier = await hre.ethers.getContractFactory("AttestationVerifier");

    // Deploy AttestationRegistry contract
    console.log("Deploying AttestationRegistry (Universal Attestation System)...");
    const attestationRegistry = await AttestationRegistry.deploy();
    await attestationRegistry.deployed();
    console.log("AttestationRegistry deployed to:", attestationRegistry.address);

    // Deploy AttestationVerifier contract with AttestationRegistry address
    console.log("Deploying AttestationVerifier contract...");
    const attestationVerifier = await AttestationVerifier.deploy(attestationRegistry.address);
    await attestationVerifier.deployed();
    console.log("AttestationVerifier deployed to:", attestationVerifier.address);

    // Wait a few blocks for contract deployment to be secure
    console.log("Waiting for confirmations...");
    await attestationRegistry.deployTransaction.wait(5);
    await attestationVerifier.deployTransaction.wait(5);
    console.log("Confirmed!");

    // Set up demo data for development/testing networks
    if (hre.network.name === 'localhost' || hre.network.name === 'amoy') {
        console.log("Setting up demo roles and schemas...");

        try {
            // Get signers 
            const signers = await hre.ethers.getSigners();

            // Make sure we have enough signers
            if (signers.length >= 4) {
                const [owner, attester1, attester2, verifier1] = signers;

                // Grant attester roles
                await attestationRegistry.grantAttesterRole(attester1.address);
                await attestationRegistry.grantAttesterRole(attester2.address);
                console.log(`Granted attester role to ${attester1.address}`);
                console.log(`Granted attester role to ${attester2.address}`);

                // Grant verifier roles
                await attestationVerifier.grantVerifierRole(verifier1.address);
                console.log(`Granted verifier role to ${verifier1.address}`);

                // Create some demo schemas
                console.log("Creating demo schemas...");
                
                const educationSchema = JSON.stringify({
                    type: 'object',
                    properties: {
                        institution: { type: 'string', title: 'Institution' },
                        degree: { type: 'string', title: 'Degree' },
                        major: { type: 'string', title: 'Major/Field of Study' },
                        graduationDate: { type: 'string', format: 'date', title: 'Graduation Date' },
                        gpa: { type: 'number', minimum: 0, maximum: 4, title: 'GPA' }
                    },
                    required: ['institution', 'degree', 'major', 'graduationDate']
                });

                await attestationRegistry.createSchema(
                    "Academic Degree",
                    "University degree attestation for educational achievements",
                    educationSchema
                );
                console.log("Created 'Academic Degree' schema");

                const identitySchema = JSON.stringify({
                    type: 'object',
                    properties: {
                        documentType: { 
                            type: 'string', 
                            enum: ['passport', 'drivers-license', 'national-id'],
                            title: 'Document Type' 
                        },
                        documentNumber: { type: 'string', title: 'Document Number' },
                        fullName: { type: 'string', title: 'Full Name' },
                        dateOfBirth: { type: 'string', format: 'date', title: 'Date of Birth' },
                        nationality: { type: 'string', title: 'Nationality' }
                    },
                    required: ['documentType', 'documentNumber', 'fullName', 'dateOfBirth']
                });

                await attestationRegistry.createSchema(
                    "Identity Verification",
                    "KYC identity verification attestation",
                    identitySchema
                );
                console.log("Created 'Identity Verification' schema");

            } else {
                console.log("Not enough signers available for demo setup, skipping demo configuration");
            }
        } catch (error) {
            console.warn("Error setting up demo data, continuing deployment:", error.message);
        }
    }

    // Output deployment information
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("AttestationRegistry:", attestationRegistry.address);
    console.log("AttestationVerifier:", attestationVerifier.address);
    console.log("-------------------");

    // Create or update the deployments directory
    const deploymentsDir = path.resolve(__dirname, '../deployments');
    if (!fs.existsSync(deploymentsDir)) {
        fs.mkdirSync(deploymentsDir, { recursive: true });
    }

    // Write deployment addresses to a network-specific JSON file
    const deploymentPath = path.resolve(deploymentsDir, `${hre.network.name}.json`);
    const deploymentInfo = {
        network: hre.network.name,
        chainId: hre.network.config.chainId,
        timestamp: new Date().toISOString(),
        version: "2.0.0",
        contracts: {
            AttestationRegistry: attestationRegistry.address,
            AttestationVerifier: attestationVerifier.address,
            // Legacy contract names for backward compatibility
            CertificateIssuance: attestationRegistry.address, // Point to new contract
            Verification: attestationVerifier.address // Point to new contract
        }
    };

    fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`Deployment info saved to ${deploymentPath}`);

    // Update the .env.local file with new contract addresses
    try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update contract addresses for the new universal system
        const attestationRegistryRegex = /NEXT_PUBLIC_ATTESTATION_REGISTRY_ADDRESS=.*/;
        const attestationVerifierRegex = /NEXT_PUBLIC_ATTESTATION_VERIFIER_ADDRESS=.*/;
        
        // Legacy contract address references (for backward compatibility)
        const certificateAddressRegex = /NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=.*/;
        const verificationAddressRegex = /NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=.*/;

        // Add/update new contract addresses
        if (attestationRegistryRegex.test(envContent)) {
            envContent = envContent.replace(attestationRegistryRegex, `NEXT_PUBLIC_ATTESTATION_REGISTRY_ADDRESS=${attestationRegistry.address}`);
        } else {
            envContent += `\nNEXT_PUBLIC_ATTESTATION_REGISTRY_ADDRESS=${attestationRegistry.address}`;
        }

        if (attestationVerifierRegex.test(envContent)) {
            envContent = envContent.replace(attestationVerifierRegex, `NEXT_PUBLIC_ATTESTATION_VERIFIER_ADDRESS=${attestationVerifier.address}`);
        } else {
            envContent += `\nNEXT_PUBLIC_ATTESTATION_VERIFIER_ADDRESS=${attestationVerifier.address}`;
        }

        // Update legacy contract addresses for backward compatibility
        if (certificateAddressRegex.test(envContent)) {
            envContent = envContent.replace(certificateAddressRegex, `NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=${attestationRegistry.address}`);
        } else {
            envContent += `\nNEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=${attestationRegistry.address}`;
        }

        if (verificationAddressRegex.test(envContent)) {
            envContent = envContent.replace(verificationAddressRegex, `NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=${attestationVerifier.address}`);
        } else {
            envContent += `\nNEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=${attestationVerifier.address}`;
        }

        // Add protocol version for identification
        const versionRegex = /NEXT_PUBLIC_ATTESTR_PROTOCOL_VERSION=.*/;
        if (versionRegex.test(envContent)) {
            envContent = envContent.replace(versionRegex, `NEXT_PUBLIC_ATTESTR_PROTOCOL_VERSION=2.0.0`);
        } else {
            envContent += `\nNEXT_PUBLIC_ATTESTR_PROTOCOL_VERSION=2.0.0`;
        }

        // Write updated content
        fs.writeFileSync(envPath, envContent);
        console.log("Contract addresses saved to .env.local");
    } catch (error) {
        console.warn("Could not update environment files:", error.message);
        console.log("Please manually update your .env.local with these addresses:");
        console.log(`NEXT_PUBLIC_ATTESTATION_REGISTRY_ADDRESS=${attestationRegistry.address}`);
        console.log(`NEXT_PUBLIC_ATTESTATION_VERIFIER_ADDRESS=${attestationVerifier.address}`);
    }

    // Log next steps
    console.log("\n🎉 Deployment complete!");
    console.log("\nNext steps:");
    console.log("1. Update your frontend to use the new AttestationRegistry contract");
    console.log("2. Test the new schema creation functionality");
    console.log("3. Migrate any existing certificate data to the new attestation format");
    console.log("4. Update your documentation to reflect the new universal attestation system");

    if (hre.network.name !== 'localhost' && hre.network.name !== 'hardhat') {
        console.log(`\n📝 Contract verification commands:`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${attestationRegistry.address}`);
        console.log(`npx hardhat verify --network ${hre.network.name} ${attestationVerifier.address} ${attestationRegistry.address}`);
    }
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });