//import
//main func  - not needed bc hardhat-deploy package
//call main func - not needed bc hardhat-deploy package

//hre = hardhat runtime env
// function deployFunc(hre) {
//     console.log("hi");
// }

// module.exports.default = deployFunc();

// module.exports = async (hre) => {
//     const { getNamedAccounts, deployments } = hre;
//     // same as hre.getNamedAccounts() and hre.Deployments
// };
//alternatively (same as above):

const {
    netoworkConfig,
    networkConfig,
    developmentChains,
} = require("../helper-hardhat-config");
const { network } = require("hardhat");

module.exports = async ({ getNamedAccounts, deployments }) => {
    const { deploy, log } = deployments; //grabbing the deploy and log func from deployments
    const { deployer } = await getNamedAccounts(); //grabbing the deployer account (aka: wallet) from getNamedAccounts function
    const chainId = network.config.chainId;
    const { verify } = require("../utils/verify");

    //when on localhost or hardhat network we want to use a mock
    // if chain id is x use contract address A etc.
    let ethUsdPriceFeedAddress;
    if (developmentChains.includes(network.name)) {
        const ethUsdAggregator = await deployments.get("MockV3Aggregator");
        ethUsdPriceFeedAddress = ethUsdAggregator.address;
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId]["ethUsdPriceFeed"];
    }

    // if contract doesnt exist, we deploy minimal version for local testing
    const args = [ethUsdPriceFeedAddress];
    const fundMe = await deploy("FundMe", {
        from: deployer,
        args: args, //args for contractor constructor
        log: true,
        waitConfirmations: network.config.blockConfirmations || 1,
    });
    if (
        !developmentChains.includes(network.name) &&
        process.env.ETHERSCAN_API_KEY
    ) {
        //verify contract flow
        await verify(fundMe.address, args);
    }
    log(
        "------------------------------------------------------------------------"
    );
};

module.exports.tags = ["all"];
