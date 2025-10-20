import "@fhevm/hardhat-plugin";
import "@nomicfoundation/hardhat-chai-matchers";
import "@nomicfoundation/hardhat-ethers";
import "@nomicfoundation/hardhat-verify";
import "@typechain/hardhat";
import "hardhat-deploy";
import "hardhat-gas-reporter";
import type { HardhatUserConfig } from "hardhat/config";
import { vars } from "hardhat/config";
import "solidity-coverage";

import "./tasks/accounts";
import "./tasks/FHECounter";
import "./tasks/BlindNFT";

// Run 'npx hardhat vars setup' to see the list of variables that need to be set

const MNEMONIC: string = vars.get("MNEMONIC", "test test test test test test test test test test test junk");
const PRIVATE_KEY: string = vars.get("PRIVATE_KEY", "");
const PRIVATE_KEYA: string = vars.get("PRIVATE_KEYA", "");
const PRIVATE_KEYB: string = vars.get("PRIVATE_KEYB", "");
const INFURA_API_KEY: string = vars.get("INFURA_API_KEY", "zzzzzzzzzzzzzzzzzzzzzzzzzzzzzzzz");

const config: HardhatUserConfig = {
  defaultNetwork: "hardhat",
  namedAccounts: {
    deployer: 0,
  },
  etherscan: {
    apiKey: {
      sepolia: vars.get("ETHERSCAN_API_KEY", ""),
    },
  },
  gasReporter: {
    currency: "USD",
    enabled: process.env.REPORT_GAS ? true : false,
    excludeContracts: [],
  },
  networks: {
    hardhat: {
      accounts: {
        mnemonic: MNEMONIC,
      },
      chainId: 31337,
    },
    anvil: {
      accounts: {
        mnemonic: MNEMONIC,
        path: "m/44'/60'/0'/0/",
        count: 10,
      },
      chainId: 31337,
      url: "http://localhost:8545",
    },
    sepolia: {
      accounts: (() => {
        // 收集所有可用的私钥
        const keys = [];
        if (PRIVATE_KEY) keys.push(PRIVATE_KEY);
        if (PRIVATE_KEYA) keys.push(PRIVATE_KEYA);
        if (PRIVATE_KEYB) keys.push(PRIVATE_KEYB);
        
        // 如果有足够的私钥（至少3个）则使用私钥，否则使用助记词
        return keys.length >= 3 ? keys : {
          mnemonic: MNEMONIC,
          path: "m/44'/60'/0'/0/",
          count: 10,
        };
      })(),
      chainId: 11155111,
      url: `https://sepolia.infura.io/v3/${INFURA_API_KEY}`,
    },
    zamaSepolia: {
      accounts: (() => {
        // 收集所有可用的私钥
        const keys = [];
        if (PRIVATE_KEY) keys.push(PRIVATE_KEY);
        if (PRIVATE_KEYA) keys.push(PRIVATE_KEYA);
        if (PRIVATE_KEYB) keys.push(PRIVATE_KEYB);
        
        // 如果有足够的私钥（至少3个）则使用私钥，否则使用助记词
        return keys.length >= 3 ? keys : {
          mnemonic: MNEMONIC,
          path: "m/44'/60'/0'/0/",
          count: 10,
        };
      })(),
      chainId: 8009,
      url: "https://devnet.zama.ai",
    },
  },
  paths: {
    artifacts: "./artifacts",
    cache: "./cache",
    sources: "./contracts",
    tests: "./test",
  },
  solidity: {
    version: "0.8.27",
    settings: {
      metadata: {
        // Not including the metadata hash
        // https://github.com/paulrberg/hardhat-template/issues/31
        bytecodeHash: "none",
      },
      // Disable the optimizer when debugging
      // https://hardhat.org/hardhat-network/#solidity-optimizer-support
      optimizer: {
        enabled: true,
        runs: 800,
      },
      evmVersion: "cancun",
    },
  },
  typechain: {
    outDir: "types",
    target: "ethers-v6",
  },
};

export default config;
