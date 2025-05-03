// scripts/deploy.js
const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function main() {
    console.log(`Deploying VeriChain contracts to ${hre.network.name} network...`);
    console.log(`Network ID: ${hre.network.config.chainId}`);

    // Get the contract factory
    const CertificateIssuance = await hre.ethers.getContractFactory("CertificateIssuance");
    const Verification = await hre.ethers.getContractFactory("Verification");

    // Deploy Certificate Issuance contract
    console.log("Deploying CertificateIssuance...");
    const certificateIssuance = await CertificateIssuance.deploy();
    await certificateIssuance.deployed();
    console.log("CertificateIssuance deployed to:", certificateIssuance.address);

    // Deploy Verification contract with Certificate address
    console.log("Deploying Verification contract...");
    const verification = await Verification.deploy(certificateIssuance.address);
    await verification.deployed();
    console.log("Verification deployed to:", verification.address);

    // Wait a few blocks for contract deployment to be secure
    console.log("Waiting for confirmations...");
    await certificateIssuance.deployTransaction.wait(5);
    await verification.deployTransaction.wait(5);
    console.log("Confirmed!");

    // Add a few demo issuers to the contract
    // NOTE: In production, you would add real institutions 
    if (hre.network.name === 'localhost' || hre.network.name === 'amoy') {
        console.log("Setting up demo issuers...");

        try {
            // Get signers 
            const signers = await hre.ethers.getSigners();

            // Make sure we have enough signers
            if (signers.length >= 3) {
                const [owner, issuer1, issuer2] = signers;

                // Grant issuer role to test accounts
                const ISSUER_ROLE = hre.ethers.utils.keccak256(hre.ethers.utils.toUtf8Bytes("ISSUER_ROLE"));
                await certificateIssuance.grantIssuerRole(issuer1.address);
                await certificateIssuance.grantIssuerRole(issuer2.address);

                console.log(`Granted issuer role to ${issuer1.address}`);
                console.log(`Granted issuer role to ${issuer2.address}`);
            } else {
                console.log("Not enough signers available for demo setup, skipping demo issuer configuration");
            }
        } catch (error) {
            console.warn("Error setting up demo issuers, continuing deployment:", error.message);
        }
    }

    // Output deployment information
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("Network:", hre.network.name);
    console.log("Chain ID:", hre.network.config.chainId);
    console.log("CertificateIssuance:", certificateIssuance.address);
    console.log("Verification:", verification.address);
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
        contracts: {
            CertificateIssuance: certificateIssuance.address,
            Verification: verification.address
        }
    };

    fs.writeFileSync(
        deploymentPath,
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log(`Deployment info saved to ${deploymentPath}`);

    // Update the .env.local file
    try {
        const envPath = path.resolve(__dirname, '../../.env.local');
        let envContent = '';

        if (fs.existsSync(envPath)) {
            envContent = fs.readFileSync(envPath, 'utf8');
        }

        // Update or add contract addresses
        const certificateAddressRegex = /NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=.*/;
        const verificationAddressRegex = /NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=.*/;

        if (certificateAddressRegex.test(envContent)) {
            envContent = envContent.replace(certificateAddressRegex, `NEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=${certificateIssuance.address}`);
        } else {
            envContent += `\nNEXT_PUBLIC_CERTIFICATE_CONTRACT_ADDRESS=${certificateIssuance.address}`;
        }

        if (verificationAddressRegex.test(envContent)) {
            envContent = envContent.replace(verificationAddressRegex, `NEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=${verification.address}`);
        } else {
            envContent += `\nNEXT_PUBLIC_VERIFICATION_CONTRACT_ADDRESS=${verification.address}`;
        }

        // Write updated content
        fs.writeFileSync(envPath, envContent);
        console.log("Contract addresses saved to .env.local");
    } catch (error) {
        console.warn("Could not update environment files:", error.message);
        console.log("Please manually update your .env.local with these addresses");
    }

    console.log("Deployment complete!");
}

// Execute deployment
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });