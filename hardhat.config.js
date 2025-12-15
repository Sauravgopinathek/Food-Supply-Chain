require("@nomicfoundation/hardhat-toolbox");

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: "0.8.18",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      // Hardhat local network configuration
      chainId: 31337,
    },
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    sepolia: {
      // Prevent HH117: If SEPOLIA_URL is missing, do not pass empty string
      url: process.env.SEPOLIA_URL || "https://sepolia.infura.io/v3/c4ef1d52e43c4d23b3cbe25010bec456'",
      accounts: process.env.PRIVATE_KEY !== undefined ? [process.env.PRIVATE_KEY] : ["946cb12e0bcc4dc183f3d6b6902f20451124e41cebb819ce2cf86f76745b25ac"],
      chainId: 11155111,
    },
    // Ganache local network (use Ganache GUI or CLI)
    ganache: {
      url: process.env.GANACHE_URL || "http://127.0.0.1:7545",
      // Ganache's chainId may vary (1337 or 5777); you can override with GANACHE_CHAIN_ID
      chainId: process.env.GANACHE_CHAIN_ID ? Number(process.env.GANACHE_CHAIN_ID) : 1337,
      accounts: process.env.GANACHE_PRIVATE_KEY !== undefined ? [process.env.GANACHE_PRIVATE_KEY] : [],
    },
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
    gasPrice: 20,
    coinmarketcap: process.env.COINMARKETCAP_API_KEY,
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
  },
  mocha: {
    timeout: 20000,
  },
};
