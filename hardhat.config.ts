import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "@nomiclabs/hardhat-etherscan";
import "@nomiclabs/hardhat-waffle";
import "@openzeppelin/hardhat-upgrades";

// load env variables
import dotenv from "dotenv";
dotenv.config();

const config: HardhatUserConfig = {
  solidity: "0.8.17",
  networks: {
    goerli: {
      url: "https://goerli.infura.io/v3/9aa3d95b3bc440fa88ea12eaa4456161",
      accounts: [
        process.env.ADMIN_PRIVATE_KEY!,
        process.env.TESTER_PRIVATE_KEY!,
      ],
      gasPrice: 60000000000,
    },
    bsc: {
      url: "https://bsc-dataseed3.binance.org",
      accounts: [process.env.ADMIN_PRIVATE_KEY!],
    },
    mumbai: {
      url: "https://rpc.ankr.com/polygon_mumbai",
      accounts: [process.env.ADMIN_PRIVATE_KEY!],
    },
    polygon: {
      url: "https://polygon-rpc.com",
      accounts: [process.env.ADMIN_PRIVATE_KEY!],
    },
    arbitrumOne: {
      url: "https://arb1.arbitrum.io/rpc",
      accounts: [process.env.ADMIN_PRIVATE_KEY!],
    },
  },
  etherscan: {
    apiKey: {
      mainnet: process.env.ETHERSCAN_API_KEY!,
      goerli: process.env.ETHERSCAN_API_KEY!,
      polygonMumbai: process.env.MATICSCAN_API_KEY!,
      polygon: process.env.MATICSCAN_API_KEY!,
      bsc: process.env.BSCSCAN_API_KEY!,
      arbitrumOne: process.env.ARBITRUMSCAN_API_KEY!,
    },
  },
};

export default config;
