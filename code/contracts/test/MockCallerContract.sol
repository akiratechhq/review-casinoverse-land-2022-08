// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "../Land.sol";

contract MockCallerContract {
    Land landContract;

    constructor(Land _landContract) {
        landContract = Land(_landContract);
    }

    function contractCallMint(uint256 _tokenId, string memory _tokenURI, bytes32[] memory _merkleProof) external {
        landContract.mint{value: 0.01 ether}(_tokenId,_tokenURI,_merkleProof);
    }

    function contractCallBatchMint(uint256[] memory _tokenIds, string[] memory _tokenURIs, bytes32[] memory _merkleProof) external {
        landContract.batchMint{value: (0.01 ether * _tokenIds.length)}(_tokenIds, _tokenURIs, _merkleProof);
    }

    function contractCallOwnerMint(address _addressToMint, uint256[] memory _tokenIds, string[] memory _tokenURIs) external {
        landContract.ownerMint(_addressToMint, _tokenIds, _tokenURIs);
    }
    
    function contractCallSetMerkleRoot(bytes32 _merkleRoot) external {
        landContract.setMerkleRoot(_merkleRoot);
    }

    receive() external payable {}
}
