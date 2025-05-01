require("@nomiclabs/hardhat-waffle");
require("dotenv").config({ path: "../.env.local" });

// Private key for deployment
const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY;

module.exports = {
  solidity: "0.8.17",
  networks: {
    hardhat: {},
    amoy: {
      url: process.env.NEXT_PUBLIC_RPC_URL,
      accounts: [PRIVATE_KEY],
      chainId: parseInt(process.env.NEXT_PUBLIC_CHAIN_ID, 10),
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  },
};