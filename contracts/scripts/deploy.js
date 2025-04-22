const fs = require('fs');
const path = require('path');
const hre = require("hardhat");

async function main() {
    console.log("Deploying VeriChain contracts...");

    // Deploy Certificate Issuance contract
    const CertificateIssuance = await hre.ethers.getContractFactory("CertificateIssuance");
    const certificateIssuance = await CertificateIssuance.deploy();
    await certificateIssuance.deployed();

    console.log("CertificateIssuance deployed to:", certificateIssuance.address);

    // Deploy Verification contract with Certificate address
    const Verification = await hre.ethers.getContractFactory("Verification");
    const verification = await Verification.deploy(certificateIssuance.address);
    await verification.deployed();

    console.log("Verification deployed to:", verification.address);

    // Output deployment information
    console.log("\nDeployment Summary:");
    console.log("-------------------");
    console.log("Network:", hre.network.name);
    console.log("CertificateIssuance:", certificateIssuance.address);
    console.log("Verification:", verification.address);
    console.log("-------------------");
    
    // Update .env.local file with contract addresses
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
        console.warn("Could not update .env.local file:", error.message);
        console.log("Please manually update your .env.local with these addresses");
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });