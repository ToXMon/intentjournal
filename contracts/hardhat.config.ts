import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomicfoundation/hardhat-verify";
import * as dotenv from "dotenv";

// Load environment variables from parent directory
dotenv.config({ path: "../.env" });

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.24",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
      viaIR: true, // Enable IR compiler to handle complex contracts
    },
  },
  networks: {
    buildbear: {
      url: process.env.BUILD_BEAR_RPC || "https://rpc.buildbear.io/smooth-spiderman-faa2b8b9",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 27257, // BuildBear Sandbox Network
    },
    buildbearBaseFork: {
      url: process.env.BUILD_BEAR_RPC || "https://rpc.buildbear.io/smooth-spiderman-faa2b8b9",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 27257, // BuildBear Sandbox Network
    },
    etherlinkTestnet: {
      url: process.env.ETHERLINK_RPC || "https://node.ghostnet.etherlink.com",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 128123, // Etherlink testnet
    },
    hardhat: {
      chainId: 1337,
    },
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  etherscan: {
    apiKey: {
      etherlinkTestnet: "no-api-key-needed"
    },
    customChains: [
      {
        network: "etherlinkTestnet",
        chainId: 128123,
        urls: {
          apiURL: "https://testnet.explorer.etherlink.com/api",
          browserURL: "https://testnet.explorer.etherlink.com"
        }
      }
    ]
  },
};

export default config;