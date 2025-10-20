
项目概述
BlindNFT 是一个创新的 NFT 项目，利用 Zama 的 FHEVM（全同态加密虚拟机）技术实现隐私保护的盲盒 NFT。在这个系统中，NFT 的所有权是公开可见的，但 NFT 的具体内容（图片、属性等）是加密的，只有所有者才能查看。当所有者选择揭示时，NFT 的属性才会公开显示。

核心特性
🔒 隐私保护: 使用 FHEVM 全同态加密技术保护 NFT 内容
🎲 随机属性: 铸造时自动生成加密的随机属性
🔓 选择性揭示: 所有者可以选择何时公开 NFT 属性
📱 现代前端: 基于 React + Vite + Wagmi 的响应式 Web 应用
🖼️ 图片上传: 支持拖拽上传和 IPFS 存储
🔄 批量查询: 高效的所有权追踪和批量操作
技术架构
智能合约层
BlindNFT.sol: 核心 NFT 合约，实现加密存储和揭示机制
FHEVM: 基于 Zama 的全同态加密虚拟机
网络: 部署在 Sepolia 测试网
前端应用层
React 18: 现代化 UI 框架
Vite: 快速构建工具
Wagmi: 以太坊交互库
RainbowKit: 钱包连接组件
TanStack Query: 数据状态管理
## Quick Start

For detailed instructions see:
[FHEVM Hardhat Quick Start Tutorial](https://docs.zama.ai/protocol/solidity-guides/getting-started/quick-start-tutorial)

### Prerequisites

- **Node.js**: Version 20 or higher
- **npm or yarn/pnpm**: Package manager

### Installation

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Set up environment variables**

   ```bash
   npx hardhat vars set MNEMONIC

   # Set your Infura API key for network access
   npx hardhat vars set INFURA_API_KEY

   # Optional: Set Etherscan API key for contract verification
   npx hardhat vars set ETHERSCAN_API_KEY
   ```

3. **Compile and test**

   ```bash
   npm run compile
   npm run test
   ```

4. **Deploy to local network**

   ```bash
   # Start a local FHEVM-ready node
   npx hardhat node
   # Deploy to local network
   npx hardhat deploy --network localhost
   ```

5. **Deploy to Sepolia Testnet**

   ```bash
   # Deploy to Sepolia
   npx hardhat deploy --network sepolia
   # Verify contract on Etherscan
   npx hardhat verify --network sepolia <CONTRACT_ADDRESS>
   ```

6. **Test on Sepolia Testnet**

   ```bash
   # Once deployed, you can run a simple test on Sepolia.
   npx hardhat test --network sepolia
   ```

## 📁 Project Structure

```
fhevm-hardhat-template/
├── contracts/           # Smart contract source files
│   └── FHECounter.sol   # Example FHE counter contract
├── deploy/              # Deployment scripts
├── tasks/               # Hardhat custom tasks
├── test/                # Test files
├── hardhat.config.ts    # Hardhat configuration
└── package.json         # Dependencies and scripts
```

## 📜 Available Scripts

| Script             | Description              |
| ------------------ | ------------------------ |
| `npm run compile`  | Compile all contracts    |
| `npm run test`     | Run all tests            |
| `npm run coverage` | Generate coverage report |
| `npm run lint`     | Run linting checks       |
| `npm run clean`    | Clean build artifacts    |

## 📚 Documentation

- [FHEVM Documentation](https://docs.zama.ai/fhevm)
- [FHEVM Hardhat Setup Guide](https://docs.zama.ai/protocol/solidity-guides/getting-started/setup)
- [FHEVM Testing Guide](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat/write_test)
- [FHEVM Hardhat Plugin](https://docs.zama.ai/protocol/solidity-guides/development-guide/hardhat)

## 📄 License

This project is licensed under the BSD-3-Clause-Clear License. See the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **GitHub Issues**: [Report bugs or request features](https://github.com/zama-ai/fhevm/issues)
- **Documentation**: [FHEVM Docs](https://docs.zama.ai)
- **Community**: [Zama Discord](https://discord.gg/zama)

---

**Built with ❤️ by the Zama team**
