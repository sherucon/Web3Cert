require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
    solidity: {
        version: "0.8.20",
        settings: {
            optimizer: {
                enabled: true,
                runs: 200
            }
        }
    },
    networks: {
        amoy: {
            url: process.env.AMOY_RPC_URL,
            accounts: [process.env.PRIVATE_KEY],
            gasPrice: 30000000000, // 30 gwei
        },
        localhost: {
            url: "http://127.0.0.1:8545"
        }
    },
    etherscan: {
        apiKey: process.env.POLYGONSCAN_API_KEY
    }
};
