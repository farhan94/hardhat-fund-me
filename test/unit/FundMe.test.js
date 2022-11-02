const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { developmentChains } = require("../../helper-hardhat-config");
const { assert, expect } = require("chai");

!developmentChains.includes(network.name)
    ? describe.skip
    : describe("FundMe", async function () {
          let fundMe;
          let deployer;
          let mockV3Aggregator;
          const sendValue = ethers.utils.parseEther("1"); //1000000000000000000; // 1 eth
          beforeEach(async function () {
              //deploy fund me contract using hardhat deploy
              deployer = (await getNamedAccounts()).deployer;
              // alternatively:
              // const accounts = ethers.getSigners(); // gets all accounts for network listed in config
              // const accountZero = accounts[0];
              await deployments.fixture(["all"]);
              fundMe = await ethers.getContract("FundMe", deployer);
              // when we include deployer as parameter, the functions we call on fundMe will use deployer account
              mockV3Aggregator = await ethers.getContract(
                  "MockV3Aggregator",
                  deployer
              );
          });
          describe("constructor", async function () {
              it("sets the aggregator addresses directly", async function () {
                  const response = await fundMe.getPriceFeed();
                  assert.equal(response, mockV3Aggregator.address);
              });
          });

          describe("fund", async function () {
              it("fails if you don't send enough eth", async function () {
                  await expect(fundMe.fund()).to.be.revertedWith(
                      "You need to spend more ETH!"
                  );
              });

              it("updates the amount funded data structure", async function () {
                  await fundMe.fund({ value: sendValue });
                  const response = await fundMe.getAddressToAmountFunded(
                      deployer
                  );
                  assert.equal(response.toString(), sendValue.toString());
              });

              it("adds funder to array of funders", async function () {
                  await fundMe.fund({ value: sendValue });
                  const funder = await fundMe.getFunder(0);
                  assert.equal(funder, deployer);
              });
          });

          describe("withdraw", async function () {
              beforeEach(async function () {
                  await fundMe.fund({ value: sendValue });
              });

              it("withdraws eth from a single funder", async function () {
                  // arrange - arrange what we need for test set up
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // act - do the action we want to test
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //gas cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ); // use BigNumber.add function instead of + operator
              });

              it("allows us to withdraw eth from multiple funders", async function () {
                  //arrange
                  const accounts = await ethers.getSigners(); // get the other accounts
                  let totalAmountFunded = 0;
                  for (let i = 1; i < 6; i += 1) {
                      //i=1 because "deployer" is at the 0th index
                      const fundMeConnectedContract = await fundMe.connect(
                          // connecting a new account with the fundMe contract rather than the deployer (returns new object)
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // act
                  const transactionResponse = await fundMe.withdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //gas cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  );

                  // need to also make sure funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;
                  for (i = 1; i < 6; i += 1) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("only allows the owner to withdraw", async function () {
                  const accounts = await ethers.getSigners();
                  const attacker = accounts[1];
                  const attackerConnectedContract = await fundMe.connect(
                      attacker
                  );
                  await expect(
                      attackerConnectedContract.withdraw()
                  ).to.be.revertedWithCustomError(fundMe, "FundMe__NotOwner");
              });

              it("cheaperWithdraw testing...", async function () {
                  //arrange
                  const accounts = await ethers.getSigners(); // get the other accounts
                  let totalAmountFunded = 0;
                  for (let i = 1; i < 6; i += 1) {
                      //i=1 because "deployer" is at the 0th index
                      const fundMeConnectedContract = await fundMe.connect(
                          // connecting a new account with the fundMe contract rather than the deployer (returns new object)
                          accounts[i]
                      );
                      await fundMeConnectedContract.fund({ value: sendValue });
                  }
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // act
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //gas cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);

                  //assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  );

                  // need to also make sure funders array is reset properly
                  await expect(fundMe.getFunder(0)).to.be.reverted;
                  for (i = 1; i < 6; i += 1) {
                      assert.equal(
                          await fundMe.getAddressToAmountFunded(
                              accounts[i].address
                          ),
                          0
                      );
                  }
              });

              it("cheaperWithdraw single funder", async function () {
                  // arrange - arrange what we need for test set up
                  const startingFundMeBalance =
                      await fundMe.provider.getBalance(fundMe.address);
                  const startingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // act - do the action we want to test
                  const transactionResponse = await fundMe.cheaperWithdraw();
                  const transactionReceipt = await transactionResponse.wait(1);
                  //gas cost
                  const { gasUsed, effectiveGasPrice } = transactionReceipt;
                  const gasCost = gasUsed.mul(effectiveGasPrice);
                  const endingFundMeBalance = await fundMe.provider.getBalance(
                      fundMe.address
                  );
                  const endingDeployerBalance =
                      await fundMe.provider.getBalance(deployer);
                  // assert
                  assert.equal(endingFundMeBalance, 0);
                  assert.equal(
                      endingDeployerBalance.add(gasCost).toString(),
                      startingFundMeBalance
                          .add(startingDeployerBalance)
                          .toString()
                  ); // use BigNumber.add function instead of + operator
              });
          });
      });
