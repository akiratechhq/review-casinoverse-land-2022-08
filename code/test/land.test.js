const { expect } = require("chai");
const { ethers, waffle } = require("hardhat");
const { generateMerkle, generateProof } = require("../utils/merkletree");
const { getShuffledUniqueNumbersByRange } = require("../utils/random-token-id");
const { EVENTS } = require("../utils/const");

const NAME = "Land";
const SYMBOL = "LND";
const INITIAL_TOKEN_URI_SUFFIX = ".json";
const INITIAL_MINT_PRICE = ethers.utils.parseEther(".001");
const INITIAL_WITHDRAWAL_RECIPIENT_ADDRESS = "0x82eB3a9403361b7AD0A662FB13eac1F82BA1e4FB";
const INITIAL_ROYALTY_FEE = 500; // 5%
const INITIAL_MINT_PER_WALLET = 5;

let contract;
let signer, withdrawalRecipient, otherAcc, notWhiteListedAcc;
let merkleRoot;
let merkleTree;
let signerMerkleProof;
const {provider} = waffle;

describe("Land", function() {
    before(async function() {
        [signer, withdrawalRecipient, otherAcc, notWhiteListedAcc] = await ethers.getSigners();

        const merkle = generateMerkle([signer.address, otherAcc.address]);
        merkleRoot = merkle.root;
        merkleTree = merkle.tree;

        signerMerkleProof = generateProof(merkleTree, signer.address);
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

        it("should return the uri suffix", async function() {
            const tokenURISuffix = await contract.tokenURISuffix();

            expect(tokenURISuffix).to.equal(INITIAL_TOKEN_URI_SUFFIX);
        });

        it("should return merkle root", async function() {

            expect(await contract.getMerkleRoot()).to.equal(merkleRoot);
        });

        it("should return max mint per wallet address", async function() {

            expect(await contract.getMaxMintPerAddress()).to.equal(INITIAL_MINT_PER_WALLET);
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

        it("should emit event MintPriceChanged", async function() {
            const price = "2";
            const newMintPrice = ethers.utils.parseEther(price);

            await expect(contract.setMintPrice(newMintPrice)).to.emit(contract, EVENTS.MINT_PRICE_CHANGED);
        });
    });

    describe("setMerkleRoot", function() {
        it("should be able to set new merkle root", async function() {
            const signers = await ethers.getSigners();
            const addresses = signers.map(signer => signer.address);
            const newMerkle = generateMerkle(addresses);
            const newMerkleRoot = newMerkle.root;

            await contract.setMerkleRoot(newMerkleRoot);

            expect(await contract.getMerkleRoot()).to.equal(newMerkleRoot);
        });

        it("should emit event MerkleRootChanged", async function() {
            const signers = await ethers.getSigners();
            const addresses = signers.map(signer => signer.address);
            const newMerkle = generateMerkle(addresses);
            const newMerkleRoot = newMerkle.root;

            await expect(contract.setMerkleRoot(newMerkleRoot)).to.emit(contract, EVENTS.MERKLE_ROOT_CHANGED);
        });
    })

    describe("setWithdrawalRecipient", function() {
        it("sould be able to set new recipient address", async function() {
            const newRecipientAddress = otherAcc.address;
            await contract.setWithdrawalRecipient(newRecipientAddress);

            expect(await contract.withdrawalRecipient()).to.equal(newRecipientAddress);
        });

        it("should emit event WithdrawalRecipientChanged", async function() {
            const newRecipientAddress = otherAcc.address;
            
            await expect(await contract.setWithdrawalRecipient(newRecipientAddress)).to.emit(contract, EVENTS.WITHDRAWAL_RECIPIENT_CHANGED)
        });
    });

    describe("setMaxMintPerAddress", function() {
        beforeEach(async function() {
            await contract.unpause();
        });

        it("sould be able to set new max mint per wallet address", async function() {
            const newMaxMintPerAddress = 10;
            await contract.setMaxMintPerAddress(newMaxMintPerAddress);
            const otherAccProof = generateProof(merkleTree,otherAcc.address);
            
            for(let i=0;i < newMaxMintPerAddress; i++) {
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                await contract.connect(otherAcc).mint(tokenId, tokenURI, otherAccProof, {
                    value: INITIAL_MINT_PRICE
                });
            }

            expect(await contract.getMaxMintPerAddress()).to.equal(newMaxMintPerAddress);
        });


        it("sould emit event MaxMintPerAddressChanged", async function() {
            const newMaxMintPerAddress = 10;

            await expect(contract.setMaxMintPerAddress(newMaxMintPerAddress)).to.emit(contract, EVENTS.MAX_MINT_PER_ADDRESS_CHANGED);
        });
    });

    describe("setBaseTokenURI", function() {
        it("sould be able to set new base token uri", async function() {
            const newBaseTokenURI = "https://arweave/";
            await contract.setBaseTokenURI(newBaseTokenURI);

            expect(await contract.baseTokenURI()).to.equal(newBaseTokenURI);
        });

        it("sould emit event BaseTokenURIChanged", async function() {
            const newBaseTokenURI = "https://arweave/";
            
            await expect(await contract.setBaseTokenURI(newBaseTokenURI)).to.emit(contract, EVENTS.BASE_TOKEN_URI_CHANGED)
        });
    });

    describe("getContractBalance", function() {
        const amountToMint = 5;

        beforeEach(async function() {
            await contract.unpause();
            for(let i=0;i < amountToMint; i++) {
                const tokenId = i+1;
                const tokenURI = `https://tokenuri.com/${tokenId}.json`

                await contract.mint(tokenId,tokenURI,signerMerkleProof, {
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
    });

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

    describe("enable disable base uri mode", function() {
        beforeEach(async function() {
            await contract.unpause();
        })
        
        it("should be able to enable base uri mode", async function() {
            await contract.enableBaseURIMode();

            expect(await contract.baseURIMode()).to.true;
        });

        it("should be able to disable base uri mode", async function() {
            await contract.enableBaseURIMode();
            await contract.disableBaseURIMode();

            expect(await contract.baseURIMode()).to.false;
        });

        it("should emit event BaseURIModeChanged", async function() {
            await expect(contract.enableBaseURIMode()).to.emit(contract, EVENTS.BASE_URI_MODE_CHANGED);
        });

        it("should return base uri if base uri mode is true", async function() {
            const newBaseURI = "https://arweave.net/";
            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;
            
            await contract.setBaseTokenURI(newBaseURI);
            await contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            });

            const tokenURISuffix = await contract.tokenURISuffix();
            const expectedTokenURI = `${newBaseURI}${tokenId}${tokenURISuffix}`

            await contract.enableBaseURIMode();

            expect(await contract.tokenURI(tokenId)).to.equal(expectedTokenURI);
        });

        it("should return token specific uri if base uri mode is false", async function() {
            const amountToMint = 5;
            
            for(let i=0;i < amountToMint; i++) {
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                await contract.mint(tokenId, tokenURI, signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                });

                expect(await contract.tokenURI(tokenId)).to.equal(tokenURI);
            }
        });

        it("should return preview uri if token uri is empty", async function() {
            const previewURI = await contract.previewURI();
            const tokenId = 1;
            const tokenURI = "";

            await contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            });

            expect(await contract.tokenURI(tokenId)).to.equal(previewURI);
        });
    });

    describe("batch minting", async function() {
        let maxSupply;

        beforeEach(async function() {
            maxSupply = Number(await contract.MAX_SUPPLY());
            await contract.unpause();
        });

        it("should be able to batch mint nft", async function() {
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const nftQty = tokenIdsToMint.length;
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await contract.batchMint(tokenIdsToMint,tokenURIs,signerMerkleProof, {
                value: INITIAL_MINT_PRICE.mul(nftQty)
            });

            expect(await contract.balanceOf(signer.address)).to.equal(tokenIdsToMint.length);
        });

        it("should emit event NFTBatchMint", async function() {
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const nftQty = tokenIdsToMint.length;
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await expect(contract.batchMint(tokenIdsToMint,tokenURIs,signerMerkleProof, {
                value: INITIAL_MINT_PRICE.mul(nftQty)
            })).to.emit(contract, EVENTS.NFT_BATCH_MINT);
        });

        it("should be able to batch mint nft from using contract if owner", async function() {
            const TestCaller = await ethers.getContractFactory("MockCallerContract");
            const testCaller = await TestCaller.deploy(contract.address);
            await testCaller.deployed();

            await contract.transferOwnership(testCaller.address);
          
            const amountToTransfer = ethers.utils.parseEther("5");
            const gasLimit = 50000;
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedTestCallerBalanceAfterBatchMint = tokenIdsToMint.length;
          
            await signer.sendTransaction({
                to: testCaller.address,
                value: amountToTransfer,
                gasLimit: gasLimit,
            });

            const newMerkle = generateMerkle([signer.address, otherAcc.address, testCaller.address]);
            const newMerkleRoot = newMerkle.root;
            const newMerkleTree = newMerkle.tree;

            await testCaller.contractCallSetMerkleRoot(newMerkleRoot);

            const testCallerProof = generateProof(newMerkleTree, testCaller.address);
            await testCaller.contractCallBatchMint(tokenIdsToMint, tokenURIs, testCallerProof);

            expect(await contract.balanceOf(testCaller.address)).to.equal(expectedTestCallerBalanceAfterBatchMint)
        });

        it("should not be able to batch mint if contract is paused, should be reverted with error message 'Pausable: paused'", async function() {
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const nftQty = tokenIdsToMint.length;
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);

            await contract.pause();

            await expect(contract.batchMint(tokenIdsToMint,tokenURIs,signerMerkleProof, {
                value: INITIAL_MINT_PRICE.mul(nftQty)
            })).to.be.revertedWith("Pausable: paused");
        });

        it("duplicate token id, should be reverted with error message 'ERC721: token already minted'", async function() {
            const tokenIdsToMint = [1,2,3,4,1];
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedBalanceAfterRevert = 0;

            await expect(contract.batchMint(tokenIdsToMint, tokenURIs, signerMerkleProof, {
                value: INITIAL_MINT_PRICE * tokenIdsToMint.length
            })).to.be.revertedWith("ERC721: token already minted");

            expect(await contract.balanceOf(signer.address)).to.equal(expectedBalanceAfterRevert);
        });

        it("token id should not exceed max supply, should be reverted with error message 'Invalid token id'", async function() {
            const tokenIdsToMint = [...getShuffledUniqueNumbersByRange(maxSupply,4),maxSupply+1];
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedBalanceAfterRevert = 0;

            await expect(contract.batchMint(tokenIdsToMint, tokenURIs, signerMerkleProof, {
                value: INITIAL_MINT_PRICE * tokenIdsToMint.length
            })).to.be.revertedWith("Invalid token id");

            expect(await contract.balanceOf(signer.address)).to.equal(expectedBalanceAfterRevert);
        });

        it("invalid mint price amount, should be reverted with error message 'Invalid Amount'", async function() {
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const nftQty = tokenIdsToMint.length;
            const invalidAmount = nftQty - 1;
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await expect(contract.batchMint(tokenIdsToMint,tokenURIs,signerMerkleProof, {
                value: INITIAL_MINT_PRICE.mul(invalidAmount)
            })).to.be.revertedWith("Invalid Amount")
        });

        it("maxed supply, should be reverted with error message 'Max Reached'", async function() {
            const newMaxMintPerAddress = 20;
            await contract.setMaxMintPerAddress(newMaxMintPerAddress);

            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 19);
            const nftQty = tokenIdsToMint.length;
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await contract.batchMint(tokenIdsToMint,tokenURIs,signerMerkleProof, {
                value: INITIAL_MINT_PRICE.mul(nftQty)
            });

            const otherAccProof = generateProof(merkleTree,otherAcc.address);
            const otherAccTokenIdsToMint = [30,100];
            const otherAccQty = otherAccTokenIdsToMint.length;
            const otherAccTokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`); 

            await expect(contract.connect(otherAcc).batchMint(otherAccTokenIdsToMint,otherAccTokenURIs,otherAccProof, {
                value: INITIAL_MINT_PRICE.mul(otherAccQty)
            })).to.be.revertedWith("Max Reached");
        });

        it("max mint per address, should be reverted with error message 'Max nft per address reached'", async function() {
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 6);
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedBalanceAfterRevert = 0;

            contract.batchMint(tokenIdsToMint, tokenURIs, signerMerkleProof, {
                value: INITIAL_MINT_PRICE * tokenIdsToMint.length
            })

            expect(await contract.balanceOf(signer.address)).to.equal(expectedBalanceAfterRevert);
        });

        it("not whitelisted, should be reverted with error message 'Not on whitelist'", async function() {
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const nftQty = tokenIdsToMint.length;
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const falseMerkleProof = generateProof(merkleTree,notWhiteListedAcc.address);

            await expect(contract.batchMint(tokenIdsToMint,tokenURIs,falseMerkleProof, {
                value: INITIAL_MINT_PRICE.mul(nftQty)
            })).to.be.revertedWith("Not on whitelist");
        });

        it("should not allow contract to call batch mint, should be reverted with error message 'Not allowed'", async function() {
            const TestCaller = await ethers.getContractFactory("MockCallerContract");
            const testCaller = await TestCaller.deploy(contract.address);
            await testCaller.deployed();
          
            const amountToTransfer = ethers.utils.parseEther("5");
            const gasLimit = 50000;

            const tokenIdsToMint = [6,7,8,9,10];
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
          
            await signer.sendTransaction({
                to: testCaller.address,
                value: amountToTransfer,
                gasLimit: gasLimit,
            });
          
            await expect(testCaller.contractCallBatchMint(tokenIdsToMint, tokenURIs, signerMerkleProof)).to.be.revertedWith("Not allowed");
        });
    });

    describe("owner minting", async function() {
        let maxSupply;

        beforeEach(async function() {
            maxSupply = Number(await contract.MAX_SUPPLY());
        });

        it("should be able to owner mint nft", async function() {
            const addressNFTReceiver = otherAcc.address;
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await contract.ownerMint(addressNFTReceiver, tokenIdsToMint, tokenURIs);

            expect(await contract.balanceOf(addressNFTReceiver)).to.equal(tokenIdsToMint.length);
        });

        it("should emit event NFTBatchMint", async function() {
            const addressNFTReceiver = otherAcc.address;
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 5);
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await expect(contract.ownerMint(addressNFTReceiver, tokenIdsToMint, tokenURIs)).to.emit(contract, EVENTS.NFT_BATCH_MINT);
        });

        it("duplicate token id, should be reverted with error message 'ERC721: token already minted'", async function() {
            const addressNFTReceiver = otherAcc.address;
            const tokenIdsToMint = [1,2,3,4,1];
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedBalanceAfterRevert = 0;

            await expect(contract.ownerMint(addressNFTReceiver, tokenIdsToMint, tokenURIs)).to.be.revertedWith("ERC721: token already minted");

            expect(await contract.balanceOf(addressNFTReceiver)).to.equal(expectedBalanceAfterRevert);
        });

        it("token id should not exceed max supply, should be reverted with error message 'Invalid token id'", async function() {
            const addressNFTReceiver = otherAcc.address;
            const tokenIdsToMint = [...getShuffledUniqueNumbersByRange(maxSupply,4),maxSupply+1];
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedBalanceAfterRevert = 0;

            await expect(contract.ownerMint(addressNFTReceiver, tokenIdsToMint, tokenURIs)).to.be.revertedWith("Invalid token id");

            expect(await contract.balanceOf(addressNFTReceiver)).to.equal(expectedBalanceAfterRevert);
        });

        it("maxed supply, should be reverted with error message 'Max Reached'", async function() {
            const newMaxMintPerAddress = 20;
            await contract.setMaxMintPerAddress(newMaxMintPerAddress);

            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 19);
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            
            await contract.ownerMint(signer.address, tokenIdsToMint, tokenURIs);

            const otherAccTokenIdsToMint = [30,100];
            const otherAccTokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`); 

            await expect(contract.ownerMint(otherAcc.address, otherAccTokenIdsToMint, otherAccTokenURIs)).to.be.revertedWith("Max Reached");
        });

        it("max mint per address, should be reverted with error message 'Max nft per address reached'", async function() {
            const addressNFTReceiver = otherAcc.address;
            const tokenIdsToMint = getShuffledUniqueNumbersByRange(maxSupply, 6);
            const tokenURIs = tokenIdsToMint.map(tokenId => `https://s3.land.region.com/metadata/abcd/${tokenId}.json`);
            const expectedBalanceAfterRevert = 0;

            contract.ownerMint(addressNFTReceiver, tokenIdsToMint, tokenURIs)

            expect(await contract.balanceOf(addressNFTReceiver)).to.equal(expectedBalanceAfterRevert);
        });
    });

    describe("minting", function() {
        let maxSupply;

        beforeEach(async function() {
            maxSupply = Number(await contract.MAX_SUPPLY());
            await contract.unpause();
        });

        it("should be able to mint nft", async function() {
            const expectedBalanceAfterMint = 1;
            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

            await contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            });

            expect(await contract.balanceOf(signer.address)).to.equal(expectedBalanceAfterMint);
        });

        it("should emit event NFTSingleMint", async function() {
            const expectedBalanceAfterMint = 1;
            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

            await expect(contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.emit(contract, EVENTS.NFT_SINGLE_MINT);

        });

        it("should be able to mint nft using contract if owner", async function() {
            const TestCaller = await ethers.getContractFactory("MockCallerContract");
            const testCaller = await TestCaller.deploy(contract.address);
            await testCaller.deployed();

            await contract.transferOwnership(testCaller.address);
          
            const amountToTransfer = ethers.utils.parseEther("5");
            const gasLimit = 50000;
            const tokenId = 8;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;
            const expectedTestCallerBalanceAfterMint = 1;
          
            await signer.sendTransaction({
                to: testCaller.address,
                value: amountToTransfer,
                gasLimit: gasLimit,
            });

            const newMerkle = generateMerkle([signer.address, otherAcc.address, testCaller.address]);
            const newMerkleRoot = newMerkle.root;
            const newMerkleTree = newMerkle.tree;

            await testCaller.contractCallSetMerkleRoot(newMerkleRoot);

            const testCallerProof = generateProof(newMerkleTree, testCaller.address);
            await testCaller.contractCallMint(tokenId, tokenURI, testCallerProof);

            expect(await contract.balanceOf(testCaller.address)).to.equal(expectedTestCallerBalanceAfterMint);
        });

        it("should be able to mint nft with different accs", async function() {
            const testWallets = await ethers.getSigners();
            const testWalletAddresses = testWallets.map(testWallet => testWallet.address);
            const newMerkle = generateMerkle(testWalletAddresses);
            const newMerkleRoot = newMerkle.root;
            const newMerkleTree = newMerkle.tree;

            await contract.setMerkleRoot(newMerkleRoot);

            for(let i=0;i < testWallets.length; i++) {
                const merkleProof = generateProof(newMerkleTree,testWallets[i].address);
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                expect(await contract.connect(testWallets[i]).mint(tokenId, tokenURI, merkleProof, {
                    value: INITIAL_MINT_PRICE
                }));
            }
        });

        it("token id should not exceed max supply, should be reverted with error message 'Invalid token id'", async function() {
            const tokenId = maxSupply + 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;
            const expectedBalanceAfterRevert = 0;

            await expect(contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("Invalid token id");

            expect(await contract.balanceOf(signer.address)).to.equal(expectedBalanceAfterRevert);
        });

        it("token already minted, should be reverted with error message 'ERC721: token already minted'", async function() {
            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

            await contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })

            await expect(contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("ERC721: token already minted");
        });

        it("should not be able to mint if contract is paused, should be reverted with error message 'Pausable: paused'", async function() {
            await contract.pause();

            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

            await expect(contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("Pausable: paused");
        });

        it("maxed supply, should be reverted with error message 'Max Reached'", async function() {
            const testWallets = (await ethers.getSigners()).slice(0, 6);
            const testWalletAddresses = testWallets.map(testWallet => testWallet.address);
            const newMerkle = generateMerkle(testWalletAddresses);
            const newMerkleRoot = newMerkle.root;
            const newMerkleTree = newMerkle.tree;

            await contract.setMerkleRoot(newMerkleRoot);

            for(let i=0;i < testWallets.length; i++) {
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;
                const merkleProof = generateProof(newMerkleTree,testWallets[i].address);

                await contract.connect(testWallets[i]).mint(tokenId, tokenURI, merkleProof, {
                    value: INITIAL_MINT_PRICE
                });

                if (i === testWallets.length) {
                    await expect(contract.connect(testWallets[i]).mint(tokenId, tokenURI, merkleProof, {
                        value: INITIAL_MINT_PRICE
                    })).to.be.revertedWith("Max Reached");
                }
            }
        });

        it("invalid mint price amount, should be reverted with error message 'Invalid Amount'", async function() {
            const amount = ".0001";
            const invalidMintAmount = ethers.utils.parseEther(amount);
            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

            await expect(contract.mint(tokenId, tokenURI, signerMerkleProof, {
                value: invalidMintAmount
            })).to.be.revertedWith("Invalid Amount"); 
        });

        it("not whitelisted, should be reverted with error message 'Not on whitelist'", async function() {
            const falseMerkleProof = generateProof(merkleTree,notWhiteListedAcc.address);
            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

            await expect(contract.mint(tokenId, tokenURI, falseMerkleProof, {
                value: INITIAL_MINT_PRICE
            })).to.be.revertedWith("Not on whitelist");
        });

        it("max mint per address, should be reverted with error message 'Max nft per address reached'", async function() {
            const amountToMint = await contract.getMaxMintPerAddress();
            const otherAccProof = generateProof(merkleTree,otherAcc.address);
            
            for(let i=0;i < amountToMint; i++) {
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                await contract.connect(otherAcc).mint(tokenId, tokenURI, otherAccProof, {
                    value: INITIAL_MINT_PRICE
                });

                if(i === amountToMint - 1) {
                    await expect(contract.connect(otherAcc).mint(tokenId, tokenURI, otherAccProof, {
                        value: INITIAL_MINT_PRICE
                    })).to.be.revertedWith("Max nft per address reached");
                }
            }
        });

        it("should not allow contract to call mint, should be reverted with error message 'Not allowed'", async function() {
            const TestCaller = await ethers.getContractFactory("MockCallerContract");
            const testCaller = await TestCaller.deploy(contract.address);
            await testCaller.deployed();
          
            const amountToTransfer = ethers.utils.parseEther("5");
            const gasLimit = 50000;

            const tokenId = 1;
            const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;
          
            await signer.sendTransaction({
                to: testCaller.address,
                value: amountToTransfer,
                gasLimit: gasLimit,
            });
          
            await expect(testCaller.contractCallMint(tokenId, tokenURI, signerMerkleProof)).to.be.revertedWith("Not allowed");
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
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                await contract.mint(tokenId, tokenURI, signerMerkleProof, {
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

        it("should emit event Withdraw", async function() {
            const amountToMint = 5;

            await contract.unpause();
            for(let i=0;i < amountToMint; i++) {
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                await contract.mint(tokenId, tokenURI, signerMerkleProof, {
                    value: INITIAL_MINT_PRICE
                });
            }

            await expect(contract.withdrawAll(withdrawalRecipient.address)).to.emit(contract, EVENTS.WITHDRAW);
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
                const tokenId = i+1;
                const tokenURI = `https://s3.land.region.com/metadata/abcd/${tokenId}.json`;

                await contract.mint(tokenId, tokenURI, signerMerkleProof, {
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

        it("should be able to withdraw balance", async function() {
            const contractBalanceBeforeWithdrawInWei = await contract.getContractBalance();
            let amountWitdrawnInWei = ethers.utils.parseEther("0");

            for(let i = 0; i < 4; i++) {
                const currentContractBalanceInWei = await contract.getContractBalance();
                const randomAmountInWei = Math.floor(Math.random() * currentContractBalanceInWei); 
                const amountToWitdrawInEther = ethers.utils.formatEther(String(randomAmountInWei));

                amountWitdrawnInWei = amountWitdrawnInWei.add(ethers.utils.parseEther(amountToWitdrawInEther));

                await expect(contract.withdraw(withdrawalRecipient.address, ethers.utils.parseEther(amountToWitdrawInEther))).to.emit(contract, EVENTS.WITHDRAW);
            }
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

    describe("royalty info", function() {
        it("should return current royalty info", async function() {
            const exampleTokenId = 1;
            const exampleSalePrice = 10000;

            const [currentRoyaltyReceiverAddress, currentRoyaltyFee] = await contract.royaltyInfo(exampleTokenId, exampleSalePrice);

            expect(currentRoyaltyReceiverAddress).equal(INITIAL_WITHDRAWAL_RECIPIENT_ADDRESS);
            expect(currentRoyaltyFee).equal(INITIAL_ROYALTY_FEE);
        });

        it("should be able to set new royalty info", async function() {
            const newReceiver = otherAcc.address;
            const newRoyalTyFee = 100; // 1%
            const exampleTokenId = 1;
            const exampleSalePrice = 10000;

            await contract.setRoyaltyInfo(newReceiver, newRoyalTyFee);

            const [receiverAddress,royaltyFee] = await contract.royaltyInfo(exampleTokenId, exampleSalePrice)

            expect(receiverAddress).to.equal(otherAcc.address);
            expect(royaltyFee).to.equal(newRoyalTyFee);
        });

        it("should emit event RoyaltyInfoChanged", async function() {
            const newReceiver = otherAcc.address;
            const newRoyalTyFee = 100; // 1%

            await expect(contract.setRoyaltyInfo(newReceiver, newRoyalTyFee)).to.emit(contract, EVENTS.ROYALTY_INFO_CHANGED);

        });
    });

    describe("setContractURI", function() {
        const newContractURI = "https://contractURI/"

        it("should be able to set new contract URI", async function() {
            await contract.setContractURI(newContractURI);

            expect(await contract.contractURI()).to.equal(newContractURI);
        });

        it("should emit event ContractURIChanged", async function() {
            await expect(contract.setContractURI(newContractURI)).to.emit(contract, EVENTS.CONTRACT_URI_CHANGED);
        });
    });

    describe("setPreviewURI", function() {
        const newPreviewURI = "https://arweave.net/previewURI/"

        it("should be able to set new preview URI", async function() {
            await contract.setPreviewURI(newPreviewURI);

            expect(await contract.previewURI()).to.equal(newPreviewURI);
        });

        it("should emit event PreviewURIChanged", async function() {
            await expect(contract.setPreviewURI(newPreviewURI)).to.emit(contract, EVENTS.PREVIEW_URI_CHANGED);
        });
    });
})