const { MerkleTree } = require('merkletreejs');
const keccak256 = require("keccak256");

function generateMerkle(addresses) {
    const merkleLeaves = addresses.map(address => keccak256(address));
    const merkleTree = new MerkleTree(merkleLeaves, keccak256, { sortPairs: true });
    const merkleRoot = merkleTree.getRoot().toString("hex");

    return {
        root: buf2hex(merkleRoot),
        tree: merkleTree
    }
}

function generateProof(merkleTree, address) {
    const leaf = keccak256(address);
    const bufProof = merkleTree.getProof(leaf);
    const proof = bufProof.map(buf => buf2hex(buf.data));

    return proof;
}

function buf2hex(buf) {
    return `0x${buf.toString("hex")}`
}

module.exports = {
    generateMerkle,
    generateProof
}
