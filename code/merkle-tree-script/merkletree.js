const { MerkleTree } = require('merkletreejs');
const keccak256 = require("keccak256");
const fs = require("node:fs/promises");
const csvtojson = require("csvtojson/v2");
const walletAddressesPath = `${__dirname}/whitelist.csv`;

let merkleTree;
let merkleLeaves;
let walletAddresses;
const PROOF_FILE_NAME = 'wallet-addresses-proofs';

async function csvToJsonArrayOfAddresses() {
    const csvtojsonResult = await csvtojson().fromFile(walletAddressesPath);
    let arrayOfAddresses = csvtojsonResult.map(result => result.address);

    // constructor SET removes duplicate
    arrayOfAddresses = [...new Set(arrayOfAddresses)];

    walletAddresses = arrayOfAddresses;
}

function generateMerkleRoot() {
    merkleLeaves = walletAddresses.map(address => keccak256(address));
    merkleTree = new MerkleTree(merkleLeaves, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot().toString("hex");

    return buf2hex(merkleRoot);
}

async function writeProof() {
    const proofs = merkleLeaves.map((leaf, i) => {
        const proofPerAddress = merkleTree.getProof(leaf).map(buf => `"${buf2hex(buf.data)}"`);

        return `${i+1}.)${walletAddresses[i]} = [${proofPerAddress}]`
    })

    // Note: Format is WALLET ADDRESS = PROOF
    await fs.writeFile(`${__dirname}/${PROOF_FILE_NAME}.txt`, proofs.join("\n"));
}

const buf2hex = (buf) => {
    return `0x${buf.toString("hex")}`
}

csvToJsonArrayOfAddresses()
    .then(() => {
        console.log("Merkle root: ", generateMerkleRoot());
        console.log("Generating proofs...");
        writeProof()
            .then(() => { 
                console.log(`Proofs generated successfully ${__dirname}/${PROOF_FILE_NAME}.txt`);
                process.exit(0);
            })
            .catch((error) => {
                console.log(error);
                process.exit(1);
            });
    })
    .catch((error) => {
        console.log(error);
        process.exit(1);
    });