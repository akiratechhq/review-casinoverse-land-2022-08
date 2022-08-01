<div id="splash">
    <div id="project">
          <span class="splash-title">
               Project
          </span>
          <br />
          <span id="project-value">
               Casinoverse Land
          </span>
    </div>
     <div id="details">
          <div id="left">
               <span class="splash-title">
                    Client
               </span>
               <br />
               <span class="details-value">
                    Casino Metaverse
               </span>
               <br />
               <span class="splash-title">
                    Date
               </span>
               <br />
               <span class="details-value">
                    August 2022
               </span>
          </div>
          <div id="right">
               <span class="splash-title">
                    Reviewers
               </span>
               <br />
               <span class="details-value">
                    Daniel Luca
               </span><br />
               <span class="contact">@cleanunicorn</span>
               <br />
               <span class="details-value">
                    Andrei Simion
               </span><br />
               <span class="contact">@andreiashu</span>
          </div>
    </div>
</div>


## Table of Contents
 - [Details](#details)
 - [Issues Summary](#issues-summary)
 - [Executive summary](#executive-summary)
     - [Week 1](#week-1)
     - [Week 2](#week-2)
 - [Scope](#scope)
 - [Recommendations](#recommendations)
     - [Increase the number of tests](#increase-the-number-of-tests)
 - [Issues](#issues)
 - [Artifacts](#artifacts)
     - [Surya](#surya)
 - [Sūrya's Description Report](#suryas-description-report)
     - [Files Description Table](#files-description-table)
     - [Contracts Description Table](#contracts-description-table)
     - [Legend](#legend)
     - [Coverage](#coverage)
     - [Tests](#tests)
 - [License](#license)


## Details

- **Client** Casino Metaverse
- **Date** August 2022
- **Lead reviewer** Daniel Luca ([@cleanunicorn](https://twitter.com/cleanunicorn))
- **Reviewers** Daniel Luca ([@cleanunicorn](https://twitter.com/cleanunicorn)), Andrei Simion ([@andreiashu](https://twitter.com/andreiashu))
- **Repository**: [Casinoverse Land](git@github.com:casinometaverse/casinoverse-land.git)
- **Commit hash** `91140addb06bf9df3ad3ed38ea0509406c0eafb9`
- **Technologies**
  - Solidity
  - Node.JS

## Issues Summary

| SEVERITY       |    OPEN    |    CLOSED    |
|----------------|:----------:|:------------:|
|  Informational  |  0  |  0  |
|  Minor  |  0  |  0  |
|  Medium  |  0  |  0  |
|  Major  |  0  |  0  |

## Executive summary

This report represents the results of the engagement with **Casino Metaverse** to review **Casinoverse Land**.

The review was conducted over the course of **1 week** from **August the 1st to August the 5th, 2022**. A total of **5 person-days** were spent reviewing the code.

### Week 1

During the first week, we ...

### Week 2

The second week was ...

## Scope

The initial review focused on the [Casinoverse Land](git@github.com:casinometaverse/casinoverse-land.git) repository, identified by the commit hash `91140addb06bf9df3ad3ed38ea0509406c0eafb9`.

We focused on manually reviewing the codebase, searching for security issues such as, but not limited to, re-entrancy problems, transaction ordering, block timestamp dependency, exception handling, call stack depth limitation, integer overflow/underflow, self-destructible contracts, unsecured balance, use of origin, costly gas patterns, architectural problems, code readability.

**Includes:**
- code/contracts/Land.sol


## Recommendations

We identified a few possible general improvements that are not security issues during the review, which will bring value to the developers and the community reviewing and using the product.

### Increase the number of tests

A good rule of thumb is to have 100% test coverage. This does not guarantee the lack of security problems, but it means that the desired functionality behaves as intended. The negative tests also bring a lot of value because not allowing some actions to happen is also part of the desired behavior.

## Issues


## Artifacts

### Surya

Sūrya is a utility tool for smart contract systems. It provides a number of visual outputs and information about the structure of smart contracts. It also supports querying the function call graph in multiple ways to aid in the manual inspection and control flow analysis of contracts.

## Sūrya's Description Report

### Files Description Table


|  File Name  |  SHA-1 Hash  |
|-------------|--------------|
| code/contracts/Land.sol | cf07001a2f52228bcb3f14607b8f2ad3b9820dd0 |


### Contracts Description Table


|  Contract  |         Type        |       Bases      |                  |                 |
|:----------:|:-------------------:|:----------------:|:----------------:|:---------------:|
|     └      |  **Function Name**  |  **Visibility**  |  **Mutability**  |  **Modifiers**  |
||||||
| **Land** | Implementation | ERC721, ReentrancyGuard, Ownable, Pausable |||
| └ | <Constructor> | Public ❗️ | 🛑  | ERC721 |
| └ | setPreviewURI | External ❗️ | 🛑  | onlyOwner |
| └ | revealNFT | External ❗️ | 🛑  | onlyOwner |
| └ | mint | Public ❗️ |  💵 | whenNotPaused isWhitelisted notCap isValidAmount |
| └ | setMintPrice | Public ❗️ | 🛑  | onlyOwner |
| └ | setWithdrawalRecipient | Public ❗️ | 🛑  | onlyOwner |
| └ | tokenURI | Public ❗️ |   | isTokenExist |
| └ | setMerkleRoot | Public ❗️ | 🛑  | onlyOwner |
| └ | pause | External ❗️ | 🛑  | onlyOwner |
| └ | unpause | External ❗️ | 🛑  | onlyOwner |
| └ | withdraw | Public ❗️ | 🛑  | onlyOwner nonReentrant isValidRecipient isBalanceEnough |
| └ | withdrawAll | Public ❗️ | 🛑  | onlyOwner isValidRecipient isBalanceNotZero |
| └ | _withdraw | Internal 🔒 | 🛑  | |
| └ | getContractBalance | External ❗️ |   | onlyOwner |
| └ | getMerkleRoot | External ❗️ |   | onlyOwner |
| └ | isValidMerkleProof | Private 🔐 |   | |


### Legend

|  Symbol  |  Meaning  |
|:--------:|-----------|
|    🛑    | Function can modify state |
|    💵    | Function is payable |

#### Graphs

![Land Graph](./static/Land_graph.png)


![Land Inheritance](./static/Land_inheritance.png)


#### Describe

```text

❯ npx surya describe ./code/contracts/Land.sol
 +  Land (ERC721, ReentrancyGuard, Ownable, Pausable)
    - [Pub] <Constructor> #
       - modifiers: ERC721
    - [Ext] setPreviewURI #
       - modifiers: onlyOwner
    - [Ext] revealNFT #
       - modifiers: onlyOwner
    - [Pub] mint ($)
       - modifiers: whenNotPaused,isWhitelisted,notCap,isValidAmount
    - [Pub] setMintPrice #
       - modifiers: onlyOwner
    - [Pub] setWithdrawalRecipient #
       - modifiers: onlyOwner
    - [Pub] tokenURI
       - modifiers: isTokenExist
    - [Pub] setMerkleRoot #
       - modifiers: onlyOwner
    - [Ext] pause #
       - modifiers: onlyOwner
    - [Ext] unpause #
       - modifiers: onlyOwner
    - [Pub] withdraw #
       - modifiers: onlyOwner,nonReentrant,isValidRecipient,isBalanceEnough
    - [Pub] withdrawAll #
       - modifiers: onlyOwner,isValidRecipient,isBalanceNotZero
    - [Int] _withdraw #
    - [Ext] getContractBalance
       - modifiers: onlyOwner
    - [Ext] getMerkleRoot
       - modifiers: onlyOwner
    - [Prv] isValidMerkleProof


 ($) = payable function
 # = non-constant function

```

### Coverage

NB: there are no tests included in the original repository.

### Tests

NB: there are no tests included in the original repository.

## License

This report falls under the terms described in the included [LICENSE](./LICENSE).

<!-- Load highlight.js -->
<link rel="stylesheet"
href="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.4.1/styles/default.min.css">
<script src="//cdnjs.cloudflare.com/ajax/libs/highlight.js/10.4.1/highlight.min.js"></script>
<script>hljs.initHighlightingOnLoad();</script>
<script type="text/javascript" src="https://cdn.jsdelivr.net/npm/highlightjs-solidity@1.0.20/solidity.min.js"></script>
<script type="text/javascript">
    hljs.registerLanguage('solidity', window.hljsDefineSolidity);
    hljs.initHighlightingOnLoad();
</script>
<link rel="stylesheet" href="./style/print.css"/>
