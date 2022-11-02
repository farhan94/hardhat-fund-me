const {
    netoworkConfig,
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { log } = deployments; //grabbing the deploy and log func from deployments

    const { verify } = require("../utils/verify");
    const chainId = network.config.chainId;

    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //verify contract flow
        await verify("0x31246B8ffD04B4d21CdaDC8a172fFe8fc0fA3146", [
            ethUsdPriceFeedAddress,
        ]);
    }
    log(
        "------------------------------------------------------------------------"
    );
};

module.exports.tags = ["verify"];
