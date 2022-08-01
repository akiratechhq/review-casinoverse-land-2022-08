// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Land is ERC721, ReentrancyGuard, Ownable, Pausable {
    uint256 public mintPrice = .001 ether;

    // Should be change before deploying to mainnet
    uint256 public constant MAX_SUPPLY = 20;
    uint256 public totalMinted = 0;
    address public withdrawalRecipient =
        0x82eB3a9403361b7AD0A662FB13eac1F82BA1e4FB;
    bytes32 merkleRoot =
        0x84e49f262788fc6e60aae4f375e63daf197871e6bbf19227657d4e7754db7d57;
    string public baseTokenURI = "";
    string public tokenURISuffix = ".json";
    string public previewURI =
        "https://arweave.net/OEpdYUZsk9vAteHHxvD-cwgl8BhM3m8Yp_E8f6TltLI/";
    uint16 public lastTokenSoldAfterCutoff;

    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        _pause();
    }

    modifier notCap() {
        require(totalMinted < MAX_SUPPLY, "Max Reached");
        _;
    }

    modifier isValidAmount() {
        require(msg.value >= mintPrice, "Invalid Amount");
        _;
    }

    modifier isValidRecipient(address _withdrawalRecipient) {
        require(
            withdrawalRecipient == _withdrawalRecipient,
            "Invalid Recipient"
        );
        _;
    }

    modifier isBalanceEnough(uint256 _amount) {
        require(_amount <= address(this).balance, "Not Enough Balance");
        _;
    }

    modifier isBalanceNotZero() {
        require(address(this).balance > 0, "No Balance");
        _;
    }

    modifier isTokenExist(uint256 _tokenId) {
        require(_exists(_tokenId), "Token ID not exist");
        _;
    }

    modifier isWhitelisted(bytes32[] memory _merkleProof) {
        require(
            isValidMerkleProof(
                _merkleProof,
                keccak256(abi.encodePacked(msg.sender))
            ),
            "Not on whitelist"
        );
        _;
    }

    function setPreviewURI(string memory _previewURI) external onlyOwner {
        previewURI = _previewURI;
    }

    function revealNFT(
        string memory _baseTokenURI,
        uint16 _lastTokenSoldAfterCutoff
    ) external onlyOwner {
        baseTokenURI = _baseTokenURI;
        lastTokenSoldAfterCutoff = _lastTokenSoldAfterCutoff;
    }

    function mint(bytes32[] memory _merkleProof)
        public
        payable
        whenNotPaused
        isWhitelisted(_merkleProof)
        notCap
        isValidAmount
    {
        totalMinted = totalMinted + 1;

        _safeMint(msg.sender, totalMinted);
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function setWithdrawalRecipient(address _withdrawalRecipient)
        public
        onlyOwner
    {
        withdrawalRecipient = _withdrawalRecipient;
    }

    function tokenURI(uint256 _tokenId)
        public
        view
        override
        isTokenExist(_tokenId)
        returns (string memory)
    {
        if (_tokenId <= lastTokenSoldAfterCutoff) {
            string memory baseURI = baseTokenURI;

            return
                bytes(baseURI).length > 0
                    ? string(
                        abi.encodePacked(
                            baseURI,
                            Strings.toString(_tokenId),
                            tokenURISuffix
                        )
                    )
                    : "";
        }

        return previewURI;
    }

    function setMerkleRoot(bytes32 _merkleRoot) public onlyOwner {
        merkleRoot = _merkleRoot;
    }

    function pause() external onlyOwner {
        _pause();
    }

    function unpause() external onlyOwner {
        _unpause();
    }

    function withdraw(address _withdrawalRecipient, uint256 _amount)
        public
        onlyOwner
        nonReentrant
        isValidRecipient(_withdrawalRecipient)
        isBalanceEnough(_amount)
    {
        _withdraw(_withdrawalRecipient, _amount);
    }

    function withdrawAll(address _withdrawalRecipient)
        public
        onlyOwner
        isValidRecipient(_withdrawalRecipient)
        isBalanceNotZero
    {
        uint256 balance = address(this).balance;

        _withdraw(_withdrawalRecipient, balance);
    }

    function _withdraw(address _withdrawalRecipient, uint256 _amount) internal {
        (bool success, ) = (_withdrawalRecipient).call{value: _amount}("");
        require(success, "Withdraw Failed");
    }

    function getContractBalance() external view onlyOwner returns (uint256) {
        return address(this).balance;
    }

    function getMerkleRoot() external view onlyOwner returns (bytes32) {
        return merkleRoot;
    }

    function isValidMerkleProof(
        bytes32[] memory _merkleProof,
        bytes32 _merkleLeaf
    ) private view returns (bool) {
        return MerkleProof.verify(_merkleProof, merkleRoot, _merkleLeaf);
    }
}
