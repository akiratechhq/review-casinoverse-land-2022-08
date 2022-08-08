### Land

- [ ] getContractBalance
  - [ ] no need for only owner
  - [ ] no need to exist
- [ ] getMerkleRoot
  - [ ] Should not be limited to owner
- [ ] getMaxMintPerAddress
  - [ ] Should not be limited to owner
- [ ] constructor
  - [ ] should set parameters such as `MAX_SUPPLY`, `mintPrice`, `withdrawalRecipient`, `merkleRoot`, `royaltyReceiverAddress`, `royaltyFeesInBips`, `previewURI`.
- [ ] supportsInterface
  - [ ] No need to override if not changed

- [ ] use `uint256` instead of `uint8` / `uint16` / `uint32` / `uint64` / `uint128` unless there's a good reason to.

### Tests

```text
$ npm run test                                          

> casinoverse-land@1.0.0 test /home/daniel/Development/github.com/akiratechhq/review-casinoverse-land-2022-08/code
> hardhat test

Downloading compiler 0.8.7
Compiled 17 Solidity files successfully
Error HH801: Plugin @nomiclabs/hardhat-waffle requires the following dependencies to be installed: ethereum-waffle.
Please run: npm install --save-dev "ethereum-waffle@^3.2.0"
```

