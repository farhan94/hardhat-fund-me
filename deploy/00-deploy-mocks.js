const { network } = require("hardhat");
const {
    developmentChains,
    DECIMALS,
    INITIAL_ANSWER,
} = require("../helper-hardhat-config");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; //grabbing the deploy and log func from deployments
    const { deployer } = await getNamedAccounts(); //grabbing the deployer account (akaL: wallet) from getNamedAccounts function
    // const chainId = network.config.chainId;
    if (developmentChains.includes(network.name)) {
        log("Local network detected! Deploying mocks...");
        await deploy("MockV3Aggregator", {
            contract: "MockV3Aggregator",
            from: deployer,
            log: true,
            args: [DECIMALS, INITIAL_ANSWER],
        });
        log("Mocks deployed!");
        log("----------------------------------------------------");
    }
};

module.exports.tags = ["all", "mocks"];
