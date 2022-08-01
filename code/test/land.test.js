const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { generateMerkleRoot, generateProof } = require("../utils/merkletree");

const NAME = "Land";
const SYMBOL = "LND";
const INITIAL_PREVIEW_URI = "https://arweave.net/OEpdYUZsk9vAteHHxvD-cwgl8BhM3m8Yp_E8f6TltLI/";
const TOKEN_URI_SUFFIX = ".json";
const INITIAL_MINT_PRICE = ethers.utils.parseEther(".001");
const INITIAL_WITHDRAWAL_RECIPIENT_ADDRESS = "0x82eB3a9403361b7AD0A662FB13eac1F82BA1e4FB";

let contract;
let signer, withdrawalRecipient, otherAcc, notWhiteListedAcc;
let merkleRoot;
let signerMerkleProof;
const {provider} = waffle;

describe("Land", function() {
    before(async function() {
        [signer, withdrawalRecipient, otherAcc, notWhiteListedAcc] = await ethers.getSigners();

        merkleRoot = generateMerkleRoot([signer.address, otherAcc.address]);
        signerMerkleProof = generateProof(signer.address);
    })

    beforeEach(async function() {
        const Land = await ethers.getContractFactory("Land");
        const land = await Land.deploy(NAME, SYMBOL);

        contract = await land.deployed();

        await contract.setMerkleRoot(merkleRoot);
    })

    describe("deployment", async function() {
        it("deployer is owner", async function() {
            const owner = await contract.owner();

            expect(owner).to.equal(signer.address);
        });

        it("should return the expected name and symbol", async function() {
            const name = await contract.name();
            const symbole = await contract.symbol();

            expect(name).to.equal(NAME);
            expect(symbole).to.equal(SYMBOL);
        });

        it("should return MAX_SUPPLY", async function() {
            const expectedMaxSupply = 20;

            expect(await contract.MAX_SUPPLY()).to.equal(expectedMaxSupply);
        });

        it("should return withdrawalRecipient address", async function() {
            const currentReceipient = await contract.withdrawalRecipient();

            expect(currentReceipient).to.equal(INITIAL_WITHDRAWAL_RECIPIENT_ADDRESS);
        });

        it("should return the initial base uri", async function() {
            const baseTokenURI = await contract.baseTokenURI();

            expect(baseTokenURI).to.equal("");
        });

        it("should return the preview uri", async function() {
            const previewURI = await contract.previewURI();

            expect(previewURI).to.equal(INITIAL_PREVIEW_URI);
        })

        it("should return the uri suffix", async function() {
            const tokenURISuffix = await contract.tokenURISuffix();

            expect(tokenURISuffix).to.equal(TOKEN_URI_SUFFIX);
        });

        it("should return merkle root", async function() {

            expect(await contract.getMerkleRoot()).to.equal(merkleRoot);
        });
    });

    describe("setMintingPrice", function() {
        it("should return mintPrice", async function() {
            const mintPrice = await contract.mintPrice();

            expect(mintPrice).to.equal(INITIAL_MINT_PRICE);
        });

        it("should be able to set new minting price", async function() {
            const price = "2";
            const newMintPrice = ethers.utils.parseEther(price);

            await contract.setMintPrice(newMintPrice);
            const mintPrice = await contract.mintPrice();
            
            expect(mintPrice).to.equal(newMintPrice);
        });
    });

    describe("setMerkleRoot", function() {
        it("should be able to set new merkle root", async function() {
            const signers = await ethers.getSigners();
            const addresses = signers.map(signer => signer.address);
            const newMerkleRoot = generateMerkleRoot(addresses);

            await contract.setMerkleRoot(newMerkleRoot);

            expect(await contract.getMerkleRoot()).to.equal(newMerkleRoot);
        })
    })

    describe("setWithdrawalRecipient", function() {
        it("sould be able to set new recipient address", async function() {
            const newRecipientAddress = otherAcc.address;
            await contract.setWithdrawalRecipient(newRecipientAddress);

            expect(await contract.withdrawalRecipient()).to.equal(newRecipientAddress);
        })
    });

    describe("setPreviewURI", function() {
        it("should be able to set new previewURI", async function() {
            const newPreviewURI = "ipfs://previewURI/";

            await contract.setPreviewURI(newPreviewURI);

            expect(await contract.previewURI()).to.equal(newPreviewURI);
        });
    });

    describe("reveal nft", function() {
        const newBaseTokenURI = "https://arweave.net/newBaseTokenURI/";

        beforeEach(async function() {
            await contract.unpause();
            const amountToMint = 5;

            for (let i = 0;i < amountToMint;i++) {
                await contract.mint(signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                })
            }
        });

        it("should be able to reveal nft", async function() {
            const lastTokenSoldAfterCutoff = 5;
            await contract.revealNFT(newBaseTokenURI, lastTokenSoldAfterCutoff);

            const tokenId = 1;
            const tokenURISuffix = await contract.tokenURISuffix();
            const expectedBaseTokenURI = `${newBaseTokenURI}${tokenId}${tokenURISuffix}`;

            expect(await contract.tokenURI(tokenId)).to.equal(expectedBaseTokenURI);
            expect(await contract.lastTokenSoldAfterCutoff()).to.equal(lastTokenSoldAfterCutoff);
        });

        it("should return token uri of unrevealed nfts", async function() {
            const lastTokenSoldAfterCutoff = 2;
            await contract.revealNFT(newBaseTokenURI, lastTokenSoldAfterCutoff);

            const tokenId = 3;

            expect(await contract.tokenURI(tokenId)).to.equal(INITIAL_PREVIEW_URI);
        });

        it("should return token uri of unrevealed nfts", async function() {
            const lastTokenSoldAfterCutoff = 2;
            await contract.revealNFT(newBaseTokenURI, lastTokenSoldAfterCutoff);

            const tokenId = 1;
            const tokenURISuffix = await contract.tokenURISuffix();
            const expectedBaseTokenURI = `${newBaseTokenURI}${tokenId}${tokenURISuffix}`;

            expect(await contract.tokenURI(tokenId)).to.equal(expectedBaseTokenURI);
        });
    })

    describe("getContractBalance", function() {
        const amountToMint = 5;

        beforeEach(async function() {
            await contract.unpause();
            for(let i=0;i < amountToMint; i++) {
                await contract.mint(signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                });
            }
        })

        it("sould return contract balance", async function() {
            const contractBalance = await contract.getContractBalance();
            const initialMintPriceInEther = ethers.utils.formatEther(String(INITIAL_MINT_PRICE));
            const expectedContractBalance = (initialMintPriceInEther * amountToMint);

            expect(contractBalance).to.equal(ethers.utils.parseEther(String(expectedContractBalance)));
        })
    })

    describe("pausing", function() {
        it("should return if contract is paused", async function() {
            const paused = await contract.paused();

            expect(paused).to.true;
        });

        it("should be able to pause contract", async function() {
            await contract.unpause();
            await contract.pause();

            expect(await contract.paused()).to.true;
        });

        it("should be able to unpause contract", async function() {
            await contract.unpause();

            expect(await contract.paused()).to.false;
        });
    });

    describe("minting", async function() {
        beforeEach(async function() {
            await contract.unpause();
        });

        it("should be able to mint token", async function() {
            const expectedBalanceAfterMint = 1;

            await contract.mint(signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            });

            expect(await contract.balanceOf(signer.address)).to.equal(expectedBalanceAfterMint);
        });

        it("should be able to mint token with different accs", async function() {
            const testWallets = await ethers.getSigners();
            const testWalletAddresses = testWallets.map(testWallet => testWallet.address);
            const newMerkleRoot = generateMerkleRoot(testWalletAddresses);

            await contract.setMerkleRoot(newMerkleRoot);

            for(let i=0;i < testWallets.length; i++) {
                const merkleProof = generateProof(testWallets[i].address);

                expect(await contract.connect(testWallets[i]).mint(merkleProof, {
                    value: INITIAL_MINT_PRICE
                }));
            }
        });

        it("should not be able to mint if contract is paused, should be reverted with error message 'Pausable: paused'", async function() {
            await contract.pause();

            await expect(contract.mint(signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("Pausable: paused");
        });

        it("maxed supply, should be reverted with error message 'Max Reached'", async function() {
            const maxSupply = await contract.MAX_SUPPLY();

            for (let i=0;i < maxSupply; i++) {
                await contract.mint(signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                })
            }

            await expect(contract.mint(signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("Max Reached");
        });

        it("invalid mint price amount, should be reverted with error message 'Invalid Amount'", async function() {
            const amount = ".0001";
            const invalidMintAmount = ethers.utils.parseEther(amount);

            await expect(contract.mint(signerMerkleProof, {
                value: invalidMintAmount
            })).to.be.revertedWith("Invalid Amount"); 
        });

        it("not whitelisted, should be reverted with error message 'Not on whitelist'", async function() {
            const falseMerkleProof = generateProof(notWhiteListedAcc.address);

            await expect(contract.mint(falseMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("Not on whitelist");
        });
    });

    describe("withdrawAll", function() {
        beforeEach(async function() {
            await contract.setWithdrawalRecipient(withdrawalRecipient.address);
        });

        it("should be able to withdraw all balance", async function() {
            const amountToMint = 5;
            const withdrawalRecipientBalanceInWei = await provider.getBalance(withdrawalRecipient.address);

            await contract.unpause();
            for(let i=0;i < amountToMint; i++) {
                await contract.mint(signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                });
            }

            const amountToWithdraw = await contract.getContractBalance();

            await contract.withdrawAll(withdrawalRecipient.address);

            const balanceOfRecipientAfterWitdhrawInWei = await provider.getBalance(withdrawalRecipient.address);
            const expectedBalanceOfRecipientInWei = withdrawalRecipientBalanceInWei.add(amountToWithdraw); 

            const balanceOfContractAfterWithdraw = await contract.getContractBalance();

            expect(balanceOfRecipientAfterWitdhrawInWei).to.equal(expectedBalanceOfRecipientInWei);
            expect(balanceOfContractAfterWithdraw).to.equal(0);
        });
        it("invalid recipient, should be reverted with error message 'Invalid Recipient'", async function() {
            await expect(contract.withdrawAll(otherAcc.address)).to.be.revertedWith("Invalid Recipient");
        });
        it("invalid balance, should be reverted with error message 'No Balance'", async function() {
            await expect(contract.withdrawAll(withdrawalRecipient.address)).to.be.revertedWith("No Balance");
        });
        it("caller is not owner, should be reverted with errror message 'Ownable: caller is not the owner'", async function() {
            await expect(contract.connect(otherAcc).withdrawAll(withdrawalRecipient.address)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    })

    describe("withdraw", function() {
        beforeEach(async function() {
            await contract.setWithdrawalRecipient(withdrawalRecipient.address);
        });

        const amountToMint = 5;

        beforeEach(async function() {
            await contract.unpause();
            for(let i = 0;i < amountToMint; i++) {
                await contract.mint(signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                })
            }
        });

        it("should be able to withdraw balance", async function() {
            const contractBalanceBeforeWithdrawInWei = await contract.getContractBalance();
            let amountWitdrawnInWei = ethers.utils.parseEther("0");

            for(let i = 0; i < 4; i++) {
                const currentContractBalanceInWei = await contract.getContractBalance();
                const randomAmountInWei = Math.floor(Math.random() * currentContractBalanceInWei); 
                const amountToWitdrawInEther = ethers.utils.formatEther(String(randomAmountInWei));

                amountWitdrawnInWei = amountWitdrawnInWei.add(ethers.utils.parseEther(amountToWitdrawInEther));

                await contract.withdraw(withdrawalRecipient.address, ethers.utils.parseEther(amountToWitdrawInEther));
            }

            const recipientBalanceAfterWithdrawInWei = await provider.getBalance(withdrawalRecipient.address);
            const contractBalanceAfterWithdrawInWei = await contract.getContractBalance();
            const expectedContractBalanceAfterWithdrawInWei = contractBalanceBeforeWithdrawInWei.sub(amountWitdrawnInWei);

            expect(recipientBalanceAfterWithdrawInWei).to.not.equal(ethers.utils.parseEther("0"));
            expect(contractBalanceAfterWithdrawInWei).to.not.equal(ethers.utils.parseEther("0"));
            expect(contractBalanceAfterWithdrawInWei).to.equal(expectedContractBalanceAfterWithdrawInWei);
        });
        it("should be able to withdraw all balance", async function() {
            let amountWitdrawnInWei = ethers.utils.parseEther("0");

            for(let i = 0; i < 5; i++) {
                const amountToWitdrawInWei = INITIAL_MINT_PRICE;
                amountWitdrawnInWei = amountWitdrawnInWei.add(amountToWitdrawInWei);

                await contract.withdraw(withdrawalRecipient.address, amountToWitdrawInWei);
            }

            const contractBalanceAfterWithdrawInWei = await contract.getContractBalance();

            expect(contractBalanceAfterWithdrawInWei).to.equal(ethers.utils.parseEther("0"));
        });
        it("invalid recipient, should be reverted with error message 'Invalid Recipient'", async function() {
            const amountToWithdraw = ethers.utils.parseEther("1");
            await expect(contract.withdraw(otherAcc.address, amountToWithdraw)).to.be.revertedWith("Invalid Recipient");
        });
        it("invalid balance, should be reverted with error message 'Not Enough Balance'", async function() {
            const contractBalanceInWei = await contract.getContractBalance();
            const amountToWithdrawInWei = contractBalanceInWei.add(ethers.utils.parseEther("1"));
            await expect(contract.withdraw(withdrawalRecipient.address, amountToWithdrawInWei)).to.be.revertedWith("Not Enough Balance");
        });
        it("caller is not owner, should be reverted with errror message 'Ownable: caller is not the owner'", async function() {
            const amountToWithdrawInWei = ethers.utils.parseEther("1");
            await expect(contract.connect(otherAcc).withdraw(withdrawalRecipient.address, amountToWithdrawInWei)).to.be.revertedWith("Ownable: caller is not the owner");
        });
    })
})