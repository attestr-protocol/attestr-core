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
    console.log("Copy these addresses to your .env.local file!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });