// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {FHE, euint64} from "@fhevm/solidity/lib/FHE.sol";
import {SepoliaConfig} from "@fhevm/solidity/config/ZamaConfig.sol";

/// @title BlindNFT v2 - 改进版盲盒NFT合约
/// @notice 别人能看到你拥有NFT，但看不到具体内容（图片、属性等）
/// @dev 增加批量查询功能，更高效的所有权追踪
contract BlindNFT is SepoliaConfig {
    
    // ============ State Variables ============
    
    uint256 private _tokenIdCounter;
    
    // ✅ 明文所有权 - 别人能看到
    mapping(uint256 => address) public owners;
    mapping(address => uint256) public balanceOf;
    
    // 🆕 用户拥有的所有 NFT ID 列表（方便批量查询）
    mapping(address => uint256[]) private _ownedTokens;
    mapping(uint256 => uint256) private _ownedTokensIndex; // tokenId -> index in _ownedTokens
    
    // 🔒 加密的图片URI - 只有所有者能看到
    mapping(uint256 => string) private _encryptedTokenURIs;
    
    // 🔒 加密的属性
    mapping(uint256 => euint64) private _encryptedRarity;   // 稀有度
    mapping(uint256 => euint64) private _encryptedPower;    // 力量
    mapping(uint256 => euint64) private _encryptedSpeed;    // 速度
    
    // 🌍 公开解密状态
    mapping(uint256 => bool) private _isRevealed;
    
    // 🌍 解密后的明文属性（只在解密后填充）
    mapping(uint256 => uint64) private _revealedRarity;
    mapping(uint256 => uint64) private _revealedPower;
    mapping(uint256 => uint64) private _revealedSpeed;
    
    // ============ Events ============
    
    event NFTMinted(
        uint256 indexed tokenId, 
        address indexed owner,
        uint256 timestamp
    );
    
    event Transfer(
        address indexed from, 
        address indexed to, 
        uint256 indexed tokenId
    );
    
    event NFTRevealed(
        uint256 indexed tokenId,
        uint64 rarity,
        uint64 power,
        uint64 speed,
        uint256 timestamp
    );
    
    // ============ Errors ============
    
    error NotOwner();
    error InvalidAddress();
    error TokenDoesNotExist();
    error AlreadyRevealed();
    error NotRevealed();
    
    // ============ Core Functions ============
    
    /// @notice 铸造盲盒NFT - 用户上传图片，属性随机生成
    /// @param tokenURI NFT图片URI（可以是IPFS链接或HTTP链接）
    /// @return 新铸造的 tokenId
    function mint(string calldata tokenURI) external returns (uint256) {
        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;
        
        // ✅ 明文所有权 - 公开可见
        owners[newTokenId] = msg.sender;
        balanceOf[msg.sender]++;
        
        // 🆕 添加到用户的 NFT 列表
        _ownedTokens[msg.sender].push(newTokenId);
        _ownedTokensIndex[newTokenId] = _ownedTokens[msg.sender].length - 1;
        
        // 🔒 存储图片URI（明文，但只有所有者能查询）
        _encryptedTokenURIs[newTokenId] = tokenURI;
        
        // 🎲 使用 FHE 生成加密随机数（0-127 范围，然后模 101 得到 0-100）
        // 注意：上界必须是 2 的幂，所以使用 128
        euint64 encRarity = FHE.randEuint64(128);
        _encryptedRarity[newTokenId] = encRarity;
        FHE.allowThis(encRarity);
        FHE.allow(encRarity, msg.sender);
        
        euint64 encPower = FHE.randEuint64(128);
        _encryptedPower[newTokenId] = encPower;
        FHE.allowThis(encPower);
        FHE.allow(encPower, msg.sender);
        
        euint64 encSpeed = FHE.randEuint64(128);
        _encryptedSpeed[newTokenId] = encSpeed;
        FHE.allowThis(encSpeed);
        FHE.allow(encSpeed, msg.sender);
        
        emit NFTMinted(newTokenId, msg.sender, block.timestamp);
        emit Transfer(address(0), msg.sender, newTokenId);
        
        return newTokenId;
    }
    
    /// @notice 转移NFT
    /// @param to 接收者地址
    /// @param tokenId NFT ID
    function transfer(address to, uint256 tokenId) external {
        if (owners[tokenId] != msg.sender) revert NotOwner();
        if (to == address(0)) revert InvalidAddress();
        
        address from = msg.sender;
        
        // 更新明文所有权
        owners[tokenId] = to;
        balanceOf[from]--;
        balanceOf[to]++;
        
        // 🆕 更新用户的 NFT 列表
        _removeTokenFromOwnerEnumeration(from, tokenId);
        _addTokenToOwnerEnumeration(to, tokenId);
        
        // 🔓 更新加密数据的访问权限
        FHE.allow(_encryptedRarity[tokenId], to);
        FHE.allow(_encryptedPower[tokenId], to);
        FHE.allow(_encryptedSpeed[tokenId], to);
        
        emit Transfer(from, to, tokenId);
    }
    
    // ============ View Functions ============
    
    /// @notice 🆕 获取用户拥有的所有 NFT ID
    /// @param owner 用户地址
    /// @return 用户拥有的所有 tokenId 数组
    function tokensOfOwner(address owner) external view returns (uint256[] memory) {
        return _ownedTokens[owner];
    }
    
    /// @notice 获取加密的图片URI（只有所有者能调用）
    /// @param tokenId NFT ID
    /// @return 加密的URI字符串
    function getEncryptedTokenURI(uint256 tokenId) 
        external 
        view 
        returns (string memory) 
    {
        if (owners[tokenId] != msg.sender) revert NotOwner();
        return _encryptedTokenURIs[tokenId];
    }
    
    /// @notice 获取加密的稀有度（只有所有者能调用）
    /// @param tokenId NFT ID
    /// @return 加密的稀有度
    function getEncryptedRarity(uint256 tokenId) 
        external 
        view 
        returns (euint64) 
    {
        if (owners[tokenId] != msg.sender) revert NotOwner();
        return _encryptedRarity[tokenId];
    }
    
    /// @notice 获取加密的属性（只有所有者能调用）
    /// @param tokenId NFT ID
    /// @return power 加密的力量属性
    /// @return speed 加密的速度属性
    function getEncryptedAttributes(uint256 tokenId) 
        external 
        view 
        returns (euint64 power, euint64 speed) 
    {
        if (owners[tokenId] != msg.sender) revert NotOwner();
        return (_encryptedPower[tokenId], _encryptedSpeed[tokenId]);
    }
    
    /// @notice 获取NFT所有者（明文，任何人都能调用）
    /// @param tokenId NFT ID
    /// @return NFT所有者地址
    function ownerOf(uint256 tokenId) external view returns (address) {
        address owner = owners[tokenId];
        if (owner == address(0)) revert TokenDoesNotExist();
        return owner;
    }
    
    /// @notice 获取总供应量
    /// @return 已铸造的NFT总数
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
    
    /// @notice 检查token是否存在
    /// @param tokenId NFT ID
    /// @return 是否存在
    function exists(uint256 tokenId) external view returns (bool) {
        return owners[tokenId] != address(0);
    }
    
    // ============ Public Reveal Functions ============
    
    /// @notice 提交解密后的NFT属性 - 让所有人都能看到
    /// @param tokenId NFT ID
    /// @param rarity 稀有度（0-100）
    /// @param power 力量（0-100）
    /// @param speed 速度（0-100）
    /// @dev 只有所有者能调用，需要先通过 Relayer SDK 解密数据
    function submitRevealedAttributes(
        uint256 tokenId,
        uint64 rarity,
        uint64 power,
        uint64 speed
    ) external {
        if (owners[tokenId] != msg.sender) revert NotOwner();
        if (_isRevealed[tokenId]) revert AlreadyRevealed();
        
        // 📝 保存明文属性
        _isRevealed[tokenId] = true;
        _revealedRarity[tokenId] = rarity;
        _revealedPower[tokenId] = power;
        _revealedSpeed[tokenId] = speed;
        
        emit NFTRevealed(tokenId, rarity, power, speed, block.timestamp);
    }
    
    /// @notice 检查NFT是否已公开解密
    /// @param tokenId NFT ID
    /// @return 是否已解密
    function isRevealed(uint256 tokenId) external view returns (bool) {
        return _isRevealed[tokenId];
    }
    
    /// @notice 获取公开解密后的属性（任何人都能调用）
    /// @param tokenId NFT ID
    /// @return rarity 稀有度
    /// @return power 力量
    /// @return speed 速度
    /// @return revealed 是否已解密
    function getRevealedAttributes(uint256 tokenId) 
        external 
        view 
        returns (uint64 rarity, uint64 power, uint64 speed, bool revealed) 
    {
        if (!_isRevealed[tokenId]) {
            return (0, 0, 0, false);
        }
        return (
            _revealedRarity[tokenId],
            _revealedPower[tokenId],
            _revealedSpeed[tokenId],
            true
        );
    }
    
    /// @notice 获取公开解密后的图片URI（任何人都能调用）
    /// @param tokenId NFT ID
    /// @return 图片URI
    function getRevealedTokenURI(uint256 tokenId) 
        external 
        view 
        returns (string memory) 
    {
        if (!_isRevealed[tokenId]) revert NotRevealed();
        return _encryptedTokenURIs[tokenId];
    }
    
    // ============ Internal Helper Functions ============
    
    /// @dev 从用户的 NFT 列表中移除
    function _removeTokenFromOwnerEnumeration(address from, uint256 tokenId) private {
        uint256 lastTokenIndex = _ownedTokens[from].length - 1;
        uint256 tokenIndex = _ownedTokensIndex[tokenId];

        if (tokenIndex != lastTokenIndex) {
            uint256 lastTokenId = _ownedTokens[from][lastTokenIndex];
            _ownedTokens[from][tokenIndex] = lastTokenId;
            _ownedTokensIndex[lastTokenId] = tokenIndex;
        }

        _ownedTokens[from].pop();
        delete _ownedTokensIndex[tokenId];
    }
    
    /// @dev 添加到用户的 NFT 列表
    function _addTokenToOwnerEnumeration(address to, uint256 tokenId) private {
        _ownedTokens[to].push(tokenId);
        _ownedTokensIndex[tokenId] = _ownedTokens[to].length - 1;
    }
}

