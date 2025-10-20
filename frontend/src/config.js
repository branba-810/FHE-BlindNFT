import { http, createConfig } from 'wagmi'
import { sepolia } from 'wagmi/chains'
import { getDefaultConfig } from '@rainbow-me/rainbowkit'

// RainbowKit 配置
export const config = getDefaultConfig({
  appName: 'Blind NFT - Phenix',
  appDescription: 'Zama FHE 盲盒 NFT 系统 - 使用全同态加密保护 NFT 属性隐私',
  appUrl: 'https://your-domain.com', // 替换为你的域名
  appIcon: 'https://your-domain.com/icon.png', // 替换为你的图标
  projectId: 'YOUR_WALLETCONNECT_PROJECT_ID', // 可以从 https://cloud.walletconnect.com/ 获取
  chains: [sepolia],
  transports: {
    // ✅ 使用多个 RPC 提高稳定性
    [sepolia.id]: http('https://sepolia.gateway.tenderly.co', {
      timeout: 30000,  // 30秒超时
      retryCount: 3,   // 重试3次
    })
  },
})

// 合约配置
// ⚠️ 旧地址: 0xEc8E33994D8267c573489677b3EF2C1241607f7E
// ✅ 新地址（部署于 2025-10-20）:
export const CONTRACT_ADDRESS = '0xaDc2F5DB582f6d479c2FE5c4Dd2b377bedAdBeC8'

