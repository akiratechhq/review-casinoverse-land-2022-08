require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("@nomiclabs/hardhat-waffle");

const EMPTY_PRIVATE_KEY = "0000000000000000000000000000000000000000000000000000000000000000";

const {
  ETHERSCAN_API_KEY,
  RINKEBY_PROVIDER_BASE_URL,
  ROPSTEN_PROVIDER_BASE_URL,
  PROVIDER_API_KEY,
  DEPLOYER_PRIVATE_KEY,
} = process.env;

module.exports = {
  solidity: "0.8.7",
  etherscan: {
    apiKey: ETHERSCAN_API_KEY
  },
  networks: {
    rinkeby: {
      url: `${RINKEBY_PROVIDER_BASE_URL || ""}${PROVIDER_API_KEY || ""}`,
      accounts: [DEPLOYER_PRIVATE_KEY || EMPTY_PRIVATE_KEY],
    },
    ropsten: {
      url: `${ROPSTEN_PROVIDER_BASE_URL || ""}${PROVIDER_API_KEY || ""}`,
      accounts: [DEPLOYER_PRIVATE_KEY || EMPTY_PRIVATE_KEY]
    }
  }
};
