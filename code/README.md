# Casinoverse Land




## Run Locally

Clone the project

```bash
  git clone git@github.com:casinometaverse/casinoverse-land.git
```

Go to the project directory

```bash
  cd my-project
```

Install dependencies

```bash
  npm install
```

Start local chain

```bash
  npm run local:chain
```

Deploy contract lacally - (This will print the contract address deployed on the local chain)

```bash
  npm run deploy:local
```

Start hardhat local console

```bash
  npm run console:local
```

Creating instance of land

```bash
  const Land = await ethers.getContractFactory("Land")
  const land = await Land.attach("<contract_address>")
```

## Testing Merkletree Whitelisting

Print current merkle root hash

```bash
  await land.getMerkleRoot()
```

Generate new merkle tree hash clone https://github.com/casinometaverse/merkle-proof-script
then add the addresses to whitelist.json

Set new merkle root hash

```bash
  await land.setMerkleRoot("<new_merkle_root_hash>")
```

Testing mint func

```bash
  await land.unpause()
  await land.mint(<token_id>, <merkle_proof>, { value: ethers.utils.parseEther("1") })
```

## Environment Variables

To run this project, you will need to add the following environment variables to your .env file

`DEPLOYER_PRIVATE_KEY` - Private key of wallet that will be use to deploy smart contract

`RINKEBY_PROVIDER_BASE_URL` - Rinkeby provider base url is the url that can be obtain on which provider you use eg. [alchemy](https://dashboard.alchemyapi.io/), [infura](https://infura.io/dashboard), etc.

`ROPSTEN_PROVIDER_BASE_URL` - Ropsten provider base url is the url that can be obtain on which provider you use eg. [alchemy](https://dashboard.alchemyapi.io/), [infura](https://infura.io/dashboard), etc.

`PROVIDER_API_KEY` - Provider api key will be use to connect to provider can be obtain on [alchemy](https://dashboard.alchemyapi.io/), [infura](https://infura.io/dashboard) etc.

`ETHERSCAN_API_KEY` - Etherscan api key will be use to verify contract source, can be obtain [here](https://etherscan.io/myapikey)


## Deployment

Deploying contract

`npm run deploy:local` - Deploy on local

`npm run deploy:rinkeby` - Deploy on rinkeby testnet

`npm run deploy:ropsten` - Deploy on ropsten testnet

Verifying src of contract

`npm run verify:rinkeby <DEPLOYED_CONTRACT_ADDRESS>` - Verify deployed contract address on rinkeby testnet

`npm run verify:ropsten <DEPLOYED_CONTRACT_ADDRESS>` - Verify deployed contract address on ropsten testnet