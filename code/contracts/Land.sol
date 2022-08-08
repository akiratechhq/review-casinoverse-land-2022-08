// SPDX-License-Identifier: GPL-3.0
pragma solidity ^0.8.7;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/common/ERC2981.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";

contract Land is ERC721, ERC2981, ReentrancyGuard, Ownable, Pausable {
    /**
    * @dev Passed on single mint modifier
    */
    uint8 constant SINGLE_MINT_QTY = 1;
    
    /**
    * @notice Maximum NFT supply
    *
    * @dev Maximum NFT that can be minted
    */
    // **NOTE: MAX_SUPPLY value should be change to 10000 before mainnet deployment
    uint256 public constant MAX_SUPPLY = 20;

    /**
    * @notice Minting price
    *
    * @dev Minting price in ether
    * 
    */
    // **NOTE: mintPrice value should be change before mainnet deployment
    uint256 public mintPrice = .001 ether;

    /**
    * @notice Total supply
    *
    * @dev Total of tokens minted
    */
    uint256 public totalMinted = 0;

    /**
    * @notice Withdrawal recipient address
    *
    * @dev Address to send contract's ether balance
    *
    */
    // **NOTE: withdrawalRecipient value should be change before mainnet deployment
    address public withdrawalRecipient = 0x82eB3a9403361b7AD0A662FB13eac1F82BA1e4FB;

    /**
    * @notice Merkle root
    *
    * @dev Should be set by admin after whitelising
    *
    */
    // **NOTE: merkleRoot value should be change before mainnet deployment
    bytes32 merkleRoot = 0x84e49f262788fc6e60aae4f375e63daf197871e6bbf19227657d4e7754db7d57;

    /**
    * @notice Contract-level metadata
    * 
    * @dev Field is declared for opensea contract-level metadata 
    *      for on-chain royalty see https://docs.opensea.io/docs/contract-level-metadata
    */
    string public contractURI = "";

    /**
    * @notice Base token URI of nft
    *
    * @dev If baseURIMode is true, all token id will use this as their token URI
    *
    */
    string public baseTokenURI = "";

    /**
    * @notice Suffix of baseTokenURI
    *
    */
    string public tokenURISuffix = ".json";

    /**
    * @notice Mode to determine if tokenURI will return tokenIdURI or baseTokenURI
    *
    * @dev Should be set to true after all nft is minted 
    */
    bool public baseURIMode = false;

    /**
    * @notice Maximum nft amount an address can hold
    *
    */
    uint16 maxMintPerAddress = 5;

    /**
    * @notice This is for individual uri of tokens
    *
    * @dev Maps token ID => token URI
    */
    mapping(uint256 => string) tokenIdURI;

    /**
    * @notice Address to receive EIP-2981 royalties from secondary sales
    *         see https://eips.ethereum.org/EIPS/eip-2981
    *
    */
    // **NOTE: royaltyReceiverAddress value should be replace before mainnet deployment
    address public royaltyReceiverAddress = 0x82eB3a9403361b7AD0A662FB13eac1F82BA1e4FB;

    /**
    * @notice Percentage of token sale price to be used for EIP-2981 royalties from secondary sales
    *         see https://eips.ethereum.org/EIPS/eip-2981
    *
    * @dev Has 2 decimal precision. E.g. a value of 500 would result in a 5% royalty fee
    *
    */
    // **NOTE: royaltyFeesInBips value should be replace before mainnet deployment
    uint96 public royaltyFeesInBips = 500; // 5%

    /**
    * @dev Used if baseURIMode is false and token uri is blank
    *
    */
    // **NOTE: previewURI value should be change before mainnet deployment
    string public previewURI = "https://arweave.net/OEpdYUZsk9vAteHHxvD-cwgl8BhM3m8Yp_E8f6TltLI/";

    /**
    * @dev Fired in `mint()` when token is minted
    * 
    * @param _tokenId token id of minted token
    * @param _tokenURI token URI of minted token
    * @param _addressMinted address where the token is minted
    */
    event NFTSingleMint(uint256 _tokenId, string _tokenURI, address _addressMinted);

    /**
    * @dev Fired in `batchMint()` and `ownerMint()` when token are minted
    * 
    * @param _tokenIds token id array of minted tokens
    * @param _tokenURIs token uri array of minted tokens
    * @param _addressMinted address where the token is minted
    */
    event NFTBatchMint(uint256[] _tokenIds, string[] _tokenURIs, address _addressMinted);

    /**
    * @dev Fired in `setWithdrawalRecipient()` when new withdrawal recipient is set
    * 
    * @param _withdrawalRecipient new withdrawal address
    */
    event WithdrawalRecipientChanged(address _withdrawalRecipient);

    /**
    * @dev Fired in `setMaxMintPerAddress()` when new maxMintPerAddress is set
    * 
    * @param _maxMintPerAddress new maxMintPerAddress
    */
    event MaxMintPerAddressChanged(uint16 _maxMintPerAddress);

    /**
    * @dev Fired in `setMintPrice()` when new mintPrice is set
    * 
    * @param _mintPrice new mintPrice
    */
    event MintPriceChanged(uint256 _mintPrice);

    /**
    * @dev Fired in `setBaseTokenURI()` when new baseTOkenURI is set
    * 
    * @param _baseTokenURI new baseTokenURI
    */
    event BaseTokenURIChanged(string _baseTokenURI);

    /**
    * @dev Fired in `setContractURI()` when new setContractURI is set
    * 
    * @param _contractURI new contractURI
    */
    event ContractURIChanged(string _contractURI);

    /**
    * @dev Fired in `setMerkleRoot()` when new merkleRoot is set
    * 
    * @param _merkleRoot new merkleRoot
    */
    event MerkleRootChanged(bytes32 _merkleRoot);

    /**
    * @dev Fired in `withdraw()` and `withdrawAll()` when contract balance is withdrawn
    * 
    * @param _withdrawalAddress address of recipient should match the set witdrawalRecipient
    * @param _amount amount withdrawn
    */
    event Withdraw(address _withdrawalAddress, uint256 _amount);

    /**
    * @dev Fired in `setRoyaltyInfo()` when new royaltyInfo is set
    * 
    * @param _royaltyReceiverAddress address to receive EIP-2981 royalties from secondary sales 
    * @param royaltyFeesInBips has 2 decimal precision. E.g. a value of 500 would result in a 5% royalty fee
    */
    event RoyaltyInfoChanged(address _royaltyReceiverAddress, uint96 royaltyFeesInBips);

    /**
    * @dev Fired in `enableBaseURIMode()` and `disableBaseURIMode()` when new baseURIMode is set
    * 
    * @param _baseURIMode new baseURIMode
    */
    event BaseURIModeChanged(bool _baseURIMode);

    /**
    * @dev Fired in `setPreviewURI()` when new previewURI is set
    * 
    * @param _previewURI new previewURI
    */
    event PreviewURIChanged(string _previewURI);


    /**
    * @param _name token name
    * @param _symbol token symbol
    *
    */
    constructor(string memory _name, string memory _symbol)
        ERC721(_name, _symbol)
    {
        setRoyaltyInfo(royaltyReceiverAddress, royaltyFeesInBips);
        _pause();
    }

    /**
    * @dev Throws if totalMinted + total amount of nft to mint exceeds MAX_SUPPLY
    *
    * @param _nftQty quantity of nft to mint
    */
    modifier isTotalMintedExceedsMaxSupply(uint256 _nftQty) {
        require((totalMinted + _nftQty) <= MAX_SUPPLY, "Max Reached");
        _;
    }

    /**
    * @dev Throws if amount is not enough
    *
    * @param _nftQty quantity of nft to mint
    */
    modifier isValidAmount(uint256 _nftQty) {
        require(msg.value >= (mintPrice * _nftQty), "Invalid Amount");
        _;
    }

    /**
    * @dev Throws if withdrawalRecipient is invalid
    *
    * @param _withdrawalRecipient withdrawalRecipient passed by caller
    */
    modifier isValidRecipient(address _withdrawalRecipient) {
        require(
            withdrawalRecipient == _withdrawalRecipient,
            "Invalid Recipient"
        );
        _;
    }

    /**
    * @dev Throws if _amount exceeds contract balance
    *
    * @param _amount amount to withdraw
    */
    modifier isBalanceEnough(uint256 _amount) {
        require(_amount <= address(this).balance, "Not Enough Balance");
        _;
    }

    /**
    * @dev Throws if contract balance is 0
    *
    */
    modifier isBalanceNotZero() {
        require(address(this).balance > 0, "No Balance");
        _;
    }

    /**
    * @dev Throws if a token ID is already minted
    *
    * @param _tokenId token passed by caller
    */
    modifier isTokenExist(uint256 _tokenId) {
        require(_exists(_tokenId), "Token ID not exist");
        _;
    }


    /**
    * @dev Throws address is not on the whitelist
    *
    * @param _merkleProof address proof passed by caller
    */
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

    /**
    * @dev Throws if caller balance + amount of nft to mint 
    *      exceeds maxMintPerAddress
    *
    * @param _address address of minter
    * @param _nftQty amount of nft to mint
    */
    modifier isNFTBalanceExceedsMaxMintPerAddress(address _address, uint256 _nftQty) {
        require(
            (balanceOf(_address) + _nftQty) <= maxMintPerAddress,
            "Max nft per address reached"
        );
        _;
    }

    /**
    * @dev Throws if caller is a contract except if owner
    *
    */
    modifier isCallerValid() {
        require(
            tx.origin == msg.sender || owner() == msg.sender,
            "Not allowed");
        _;
    }

    /**
    * @dev Throws if _tokenId exceeds MAX_SUPPLY
    *
    * @param _tokenId token id to check if valid passed by caller
    */
    modifier isTokenIdValid(uint256 _tokenId) {
        require(_tokenId <= MAX_SUPPLY, "Invalid token id");
        _;
    }

    /**
    * @dev Set the previewURI onlyOwner
    *
    * @param _previewURI new previewURI
    */
    function setPreviewURI(string memory _previewURI)
        external
        onlyOwner
    {
        previewURI = _previewURI;

        emit PreviewURIChanged(previewURI);
    }

    /**
    * @dev Set the maxMintPerAddress onlyOwner
    *
    * @param _maxMintPerAddress new maxMintPerAddress
    */
    function setMaxMintPerAddress(uint16 _maxMintPerAddress)
        external
        onlyOwner
    {
        maxMintPerAddress = _maxMintPerAddress;

        emit MaxMintPerAddressChanged(maxMintPerAddress);
    }

    /**
    * @dev Restricted mint function requires bytes32[] merkleProof
    *
    * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
    *
    * @dev Creates new token with token id specified
    *      and assigns an ownership to caller for this token
    *
    * @dev Store new tokenIdURI for this token 
    *
    * @param _tokenId token id to mint
    * @param _tokenURI token uri of token id to mint
    * @param _merkleProof address proof for whitelisting
    */
    function mint(
        uint256 _tokenId,
        string memory _tokenURI,
        bytes32[] memory _merkleProof
    )
        external
        payable
        whenNotPaused
        isCallerValid
        isTotalMintedExceedsMaxSupply(SINGLE_MINT_QTY)
        isValidAmount(SINGLE_MINT_QTY)
        isNFTBalanceExceedsMaxMintPerAddress(msg.sender, SINGLE_MINT_QTY)
        isWhitelisted(_merkleProof)
    {
        _mintNFT(msg.sender, _tokenId, _tokenURI);

        emit NFTSingleMint(_tokenId, _tokenURI, msg.sender);
    }

    /**
    * @dev Restricted mint function requires bytes32[] merkleProof
    *
    * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
    *
    * @dev Creates new tokens with token ids specified
    *      and assigns an ownership to caller for this token
    *
    * @dev Store new tokenIdURI for this token 
    *
    * @param _tokenIds token ids to mint
    * @param _tokenURIs token uris of token id to mint
    * @param _merkleProof address proof for whitelisting
    */
    function batchMint(
        uint256[] calldata _tokenIds,
        string[] calldata _tokenURIs,
        bytes32[] memory _merkleProof
    )
        external
        payable
        whenNotPaused
        isCallerValid
        isTotalMintedExceedsMaxSupply(_tokenIds.length)
        isValidAmount(_tokenIds.length)
        isNFTBalanceExceedsMaxMintPerAddress(msg.sender, _tokenIds.length)
        isWhitelisted(_merkleProof)
    {
        _batchMintNFT(msg.sender, _tokenIds, _tokenURIs);

        emit NFTBatchMint(_tokenIds, _tokenURIs, msg.sender);
    }

    /**
    * @dev Restricted mint function requires onlyOwner
    *
    * @dev Unsafe: doesn't execute `onERC721Received` on the receiver.
    *
    * @dev Creates new tokens with token ids specified
    *      and assigns an ownership to `_addressToMint` for this token
    *
    * @dev Store new tokenIdURI for this token 
    *
    * @param _addressToMint address to mint the token
    * @param _tokenIds token ids to mint
    * @param _tokenURIs token uris of token id to mint
    */
    function ownerMint(
        address _addressToMint,
        uint256[] calldata _tokenIds,
        string[] calldata _tokenURIs
    )
        external
        onlyOwner
        isTotalMintedExceedsMaxSupply(_tokenIds.length)
        isNFTBalanceExceedsMaxMintPerAddress(msg.sender, _tokenIds.length)
    {
        _batchMintNFT(_addressToMint, _tokenIds, _tokenURIs);

        emit NFTBatchMint(_tokenIds, _tokenURIs, msg.sender);
    }

    /**
    * @dev Private function for batchMint
    *
    * @param _address address to mint the token
    * @param _tokenIds token ids to mint
    * @param _tokenURIs token uris of token id to mint
    */
    function _batchMintNFT(
        address _address,
        uint256[] calldata _tokenIds,
        string[] calldata _tokenURIs
    ) 
        private 
    {
        for(uint8 i; i < _tokenIds.length; i++) {
            uint256 tokenId = _tokenIds[i];
            _mintNFT(_address, tokenId, _tokenURIs[i]);
        }
    }

    /**
    * @dev Private function for mint
    *
    * @param _address address to mint the token
    * @param _tokenId token id to mint
    * @param _tokenURI token uri of token id to mint
    */
    function _mintNFT(
        address _address, 
        uint256 _tokenId,
        string memory _tokenURI
    )
        private
        isTokenIdValid(_tokenId)
    {
        // **NOTE: index will start at 1
        totalMinted = totalMinted + 1;

        tokenIdURI[_tokenId] = _tokenURI;
        _mint(_address, _tokenId);
    }

    /**
    * @dev Set new minting price
    *
    * @param _mintPrice new mint price
    */
    function setMintPrice(uint256 _mintPrice)
        external
        onlyOwner
    {
        mintPrice = _mintPrice;

        emit MintPriceChanged(mintPrice);
    }

    /**
    * @dev Set new withdrawal recipient
    *
    * @param _withdrawalRecipient new withdrawal recipient
    */
    function setWithdrawalRecipient(address _withdrawalRecipient)
        external
        onlyOwner
    {
        withdrawalRecipient = _withdrawalRecipient;

        emit WithdrawalRecipientChanged(withdrawalRecipient);
    }

    /**
    * @dev Set new base token URI
    *
    * @param _baseTokenURI new base token URI
    */
    function setBaseTokenURI(string memory _baseTokenURI)
        external
        onlyOwner
    {
        baseTokenURI = _baseTokenURI;

        emit BaseTokenURIChanged(baseTokenURI);
    }

    /**
    * @dev Set new contract URI
    *
    * @param _contractURI new contract URI
    */
    function setContractURI(string memory _contractURI)
        external 
        onlyOwner
    {
        contractURI = _contractURI;

        emit ContractURIChanged(contractURI);
    }

    /**
    * @inheritdoc ERC721
    *
    * @dev if baseURIMode is false, returns stored uri in tokenIdURI
    *      if tokenIdURI is empty, returns previewURI
    *
    * @param _tokenId use to determin which token id uri to return
    */
    function tokenURI(uint256 _tokenId)
        public
        view
        override
        isTokenExist(_tokenId)
        returns (string memory)
    {
        if (baseURIMode == true) {
            return
                bytes(baseTokenURI).length > 0
                    ? string(
                        abi.encodePacked(
                            baseTokenURI,
                            Strings.toString(_tokenId),
                            tokenURISuffix
                        )
                    )
                    : "";
        }

        return
            bytes(tokenIdURI[_tokenId]).length > 0
                ? tokenIdURI[_tokenId]
                : previewURI;
    }

    /**
    * @dev Set new merkle root
    *
    * @param _merkleRoot new merkle root
    */
    function setMerkleRoot(bytes32 _merkleRoot)
        external
        onlyOwner
    {
        merkleRoot = _merkleRoot;

        emit MerkleRootChanged(merkleRoot);
    }

    /**
    * @dev Set paused to true, prevent mint, and batchMint to be called
    *
    */
    function pause()
        external
        onlyOwner
    {
        _pause();
    }

    /**
    * @dev Set paused to false, allow mint, and batchMint to be called
    *
    */
    function unpause() 
        external
        onlyOwner
    {
        _unpause();
    }

    /**
    * @dev enable tokenURI to return baseURI instead of stored
    *      tokenIdURI
    *
    */
    function enableBaseURIMode()
        external
        onlyOwner
    {
        baseURIMode = true;

        emit BaseURIModeChanged(baseURIMode);
    }

    /**
    * @dev disable tokenURI to return baseURI
    *
    */
    function disableBaseURIMode()
        external
        onlyOwner
    {
        baseURIMode = false;

        emit BaseURIModeChanged(baseURIMode);
    }

    /**
    * @dev send contract balance to withdrawal recipient requires onlyOwner
    *      and a valid withdrawalRecipient
    *
    * @param _withdrawalRecipient withdrawal recipient passed by caller
    * @param _amount amount to withdraw
    */
    function withdraw(address _withdrawalRecipient, uint256 _amount)
        external
        onlyOwner
        nonReentrant
        isValidRecipient(_withdrawalRecipient)
        isBalanceEnough(_amount)
    {
        _withdraw(_withdrawalRecipient, _amount);
    }

    /**
    * @dev send all contract balance to withdrawal recipient requires onlyOwner
    *      and a valid withdrawalRecipient
    *
    * @param _withdrawalRecipient withdrawal recipient passed by caller
    */
    function withdrawAll(address _withdrawalRecipient)
        external
        onlyOwner
        isValidRecipient(_withdrawalRecipient)
        isBalanceNotZero
    {
        uint256 balance = address(this).balance;

        _withdraw(_withdrawalRecipient, balance);

    }

    /**
    * @dev Private function called being called withdraw and withdrawAll
    *
    * @param _withdrawalRecipient withdrawal recipient passed by caller
    * @param _amount amount to withdraw
    */
    function _withdraw(address _withdrawalRecipient, uint256 _amount)
        private
    {
        (bool success, ) = (_withdrawalRecipient).call{value: _amount}("");
        require(success, "Withdraw Failed");

        emit Withdraw(_withdrawalRecipient, _amount);
    }

    /**
    * @dev Returns contract balance
    *
    */
    function getContractBalance()
        external
        view
        onlyOwner
        returns (uint256)
    {
        return address(this).balance;
    }

    /**
    * @dev Returns current merkleRoot
    *
    */
    function getMerkleRoot()
        external
        view
        onlyOwner
        returns (bytes32)
    {
        return merkleRoot;
    }

    /**
    * @dev Returns current maxMintPerAddress
    *
    */
    function getMaxMintPerAddress()
        external
        view
        onlyOwner
        returns (uint16)
    {
        return maxMintPerAddress;
    }

    /**
    * @dev Validate merkleProof
    *
    * @param _merkleProof address proof
    * @param _merkleLeaf address to validate the proof
    */
    function isValidMerkleProof(
        bytes32[] memory _merkleProof,
        bytes32 _merkleLeaf
    )
        private
        view
        returns (bool)
    {
        return MerkleProof.verify(_merkleProof, merkleRoot, _merkleLeaf);
    }

    /**
    * @inheritdoc ERC2981
    *
    */
    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC2981)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /**
    * @dev Set new royalty info
    *
    * @param _royaltyReceiverAddress address to receive royalty fee
    * @param _royaltyFeesInBips Percentage of token sale price to be used for
    *                           EIP-2981 royalties from secondary sales
    *                           Has 2 decimal precision. E.g. a value of 500 would result in a 5% royalty fee
    *                           value should be replace before mainnet deployment
    */
    function setRoyaltyInfo(
        address _royaltyReceiverAddress,
        uint96 _royaltyFeesInBips
    )
        public
        onlyOwner 
    {
        _setDefaultRoyalty(_royaltyReceiverAddress, _royaltyFeesInBips);

        emit RoyaltyInfoChanged(_royaltyReceiverAddress, _royaltyFeesInBips);
    }
}
