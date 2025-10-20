# BlindNFT - 基于 FHEVM 的隐私保护盲盒 NFT 项目

## 项目概述

BlindNFT 是一个创新的 NFT 项目，利用 Zama 的 FHEVM（全同态加密虚拟机）技术实现隐私保护的盲盒 NFT。在这个系统中，NFT 的所有权是公开可见的，但 NFT 的具体内容（图片、属性等）是加密的，只有所有者才能查看。当所有者选择揭示时，NFT 的属性才会公开显示。

### 核心特性

- 🔒 **隐私保护**: 使用 FHEVM 全同态加密技术保护 NFT 内容
- 🎲 **随机属性**: 铸造时自动生成加密的随机属性
- 🔓 **选择性揭示**: 所有者可以选择何时公开 NFT 属性
- 📱 **现代前端**: 基于 React + Vite + Wagmi 的响应式 Web 应用
- 🖼️ **图片上传**: 支持拖拽上传和 IPFS 存储
- 🔄 **批量查询**: 高效的所有权追踪和批量操作

## 技术架构

### 智能合约层
- **BlindNFT.sol**: 核心 NFT 合约，实现加密存储和揭示机制
- **FHEVM**: 基于 Zama 的全同态加密虚拟机
- **网络**: 部署在 Sepolia 测试网

### 前端应用层
- **React 18**: 现代化 UI 框架
- **Vite**: 快速构建工具
- **Wagmi**: 以太坊交互库
- **RainbowKit**: 钱包连接组件
- **TanStack Query**: 数据状态管理

## 智能合约详解

### BlindNFT 合约

 
**网络**: Sepolia 测试网  
**Solidity 版本**: ^0.8.24

#### 核心功能

1. **铸造 NFT** (`mint`)
   - 接收图片 URI 作为参数
   - 自动生成加密的随机属性（稀有度、力量、速度）
   - 设置所有权映射和访问权限

2. **转移 NFT** (`transfer`)
   - 支持 NFT 在用户间转移
   - 自动更新加密数据的访问权限
   - 维护所有权追踪列表

3. **属性揭示** (`submitRevealedAttributes`)
   - 所有者可以提交解密后的属性
   - 将加密属性转换为公开可见的明文
   - 触发揭示事件

4. **查询功能**
   - `tokensOfOwner`: 获取用户拥有的所有 NFT ID
   - `getEncryptedTokenURI`: 获取加密的图片 URI（仅所有者）
   - `getRevealedAttributes`: 获取已揭示的属性（公开）
   - `isRevealed`: 检查 NFT 是否已揭示



### 功能特性

1. **钱包连接**
   - 支持 MetaMask 等主流钱包
   - 自动网络检测和切换
   - 账户状态管理

2. **NFT 铸造**
   - 图片上传模式：拖拽或点击上传
   - 实时预览和元数据生成

3. **NFT 管理**
   - 查看拥有的 NFT 列表
   - 批量查询和显示
   - NFT 详情模态框

4. **属性揭示**
   - 使用 Zama Relayer SDK 解密
   - 提交揭示交易
   - 实时状态更新

### 技术栈

- **React 18**: UI 框架
- **Vite**: 构建工具和开发服务器
- **Wagmi v2**: 以太坊交互
- **RainbowKit**: 钱包连接 UI
- **TanStack Query**: 服务器状态管理
- **IPFS**: 去中心化存储

## 部署信息


### 前端部署

- **开发环境**: `npm run dev` (http://localhost:5173)
- **生产构建**: `npm run build`
- **配置**: 合约地址在 `src/config.js` 中配置

## 使用指南

### 开发者设置

1. **环境准备**
   ```bash
   # 安装依赖
   npm install
   
   # 设置环境变量
   npx hardhat vars set MNEMONIC
   npx hardhat vars set INFURA_API_KEY
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

2. **编译和测试**
   ```bash
   # 编译合约
   npm run compile
   
   # 运行测试
   npm run test
   
   # 在 Sepolia 上测试
   npm run test:sepolia
   ```

3. **部署合约**
   ```bash
   # 部署到 Sepolia
   npm run deploy:sepolia
   
   # 验证合约
   npm run verify:sepolia <CONTRACT_ADDRESS>
   ```

### 用户使用

1. **连接钱包**
   - 安装 MetaMask 浏览器扩展
   - 切换到 Sepolia 测试网
   - 获取测试 ETH

2. **铸造 NFT**
   - 上传图片或输入 Token URI
   - 确认铸造交易
   - 等待交易确认

3. **查看 NFT**
   - 在"我的 NFT"页面查看拥有的 NFT
   - 点击 NFT 查看详细信息
   - 只有所有者能看到加密内容

4. **揭示属性**
   - 选择要揭示的 NFT
   - 使用 Relayer SDK 解密属性
   - 提交揭示交易
   - 属性将变为公开可见

## 项目结构
