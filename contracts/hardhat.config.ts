import { HardhatUserConfig } from "hardhat/config";
import "@nomiclabs/hardhat-waffle";
import "@nomiclabs/hardhat-ethers";
import "@openzeppelin/hardhat-upgrades";
import "@nomicfoundation/hardhat-verify";
import "hardhat-gas-reporter";
import "solidity-coverage";
import "@typechain/hardhat";
import dotenv from "dotenv";

// Load environment variables from parent directory
dotenv.config({ path: "../.env.local" });

// Private key for deployment - make sure this is in your .env file
const PRIVATE_KEY: string = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000000";

// Optional API keys
const POLYGONSCAN_API_KEY: string = process.env.POLYGONSCAN_API_KEY || "";
const ETHERSCAN_API_KEY: string = process.env.ETHERSCAN_API_KEY || "";

// Amoy testnet configuration
const AMOY_RPC_URL: string = process.env.NEXT_PUBLIC_RPC_URL || "https://polygon-amoy.g.alchemy.com/v2/demo";
const AMOY_CHAIN_ID: number = 80002;  // Polygon Amoy testnet

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.17",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200
      }
    }
  },
  networks: {
    // Local development
    hardhat: {
      chainId: 31337
    },
    localhost: {
      chainId: 31337
    },

    // Polygon Amoy Testnet
    amoy: {
      url: AMOY_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: AMOY_CHAIN_ID,
      gasPrice: 35000000000,  // 35 gwei - adjust as needed
      timeout: 60000  // 1 minute timeout
    },

    // Add more networks as needed
    mumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: [PRIVATE_KEY],
      chainId: 80001
    }
  },

  // For contract verification - temporarily disabled for TypeScript compatibility
  // etherscan: {
  //   apiKey: {
  //     polygon: POLYGONSCAN_API_KEY,
  //     polygonMumbai: POLYGONSCAN_API_KEY,
  //     polygonAmoy: POLYGONSCAN_API_KEY,
  //     mainnet: ETHERSCAN_API_KEY
  //   },
  //   customChains: [
  //     {
  //       network: "polygonAmoy",
  //       chainId: AMOY_CHAIN_ID,
  //       urls: {
  //         apiURL: "https://api-amoy.polygonscan.com/api",
  //         browserURL: "https://amoy.polygonscan.com"
  //       }
  //     }
  //   ]
  // },

  // For gas reporting - temporarily disabled for TypeScript compatibility
  // gasReporter: {
  //   enabled: process.env.REPORT_GAS === "true",
  //   currency: "USD",
  //   coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  //   outputFile: "gas-report.txt",
  //   noColors: true,
  //   excludeContracts: []
  // },

  // Test settings
  mocha: {
    timeout: 50000  // 50 seconds for tests
  },

  // Paths configuration
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },

  // TypeChain configuration - temporarily disabled for TypeScript compatibility
  // typechain: {
  //   outDir: "typechain-types",
  //   target: "ethers-v5",
  //   alwaysGenerateOverloads: false,
  //   externalArtifacts: ["externalArtifacts/*.json"],
  //   dontOverrideCompile: false
  // }
};

export default config;