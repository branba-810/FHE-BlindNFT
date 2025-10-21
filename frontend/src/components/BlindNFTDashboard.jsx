import { useState, useEffect } from 'react'
import { useAccount, useWriteContract, useWaitForTransactionReceipt, usePublicClient, useChainId } from 'wagmi'
import { ConnectButton } from '@rainbow-me/rainbowkit'
import { BrowserProvider } from 'ethers'
import { CONTRACT_ADDRESS } from '../config'
import contractABI from '../abi.json'
import Navigation from './Navigation'
import DashboardPage from './DashboardPage'
import MintPage from './MintPage'
import MyNFTsPage from './MyNFTsPage'
import { useZamaFHE } from '../hooks/useZamaFHE'
import { ipfsToHttp } from '../utils/ipfs'

// 稀有度映射函数：将数字转换为文字描述
const formatRarity = (rarityValue) => {
  const rarityMap = {
    0: "未知",
    1: "⚪ 普通",
    2: "🟢 罕见",
    3: "🔵 稀有",
    4: "🟣 史诗",
    5: "🟠 传说"
  }
  return rarityMap[rarityValue] || `未知 (${rarityValue})`
}

// 稀有度发光颜色映射函数
const getRarityGlow = (rarityValue) => {
  const glowMap = {
    0: { color: '#9ca3af', shadow: '0 0 10px rgba(156, 163, 175, 0.3)' }, // 灰色 - 未知
    1: { color: '#e5e7eb', shadow: '0 0 15px rgba(229, 231, 235, 0.5)' }, // 白色 - 普通
    2: { color: '#10b981', shadow: '0 0 20px rgba(16, 185, 129, 0.6)' }, // 绿色 - 罕见
    3: { color: '#3b82f6', shadow: '0 0 25px rgba(59, 130, 246, 0.7)' }, // 蓝色 - 稀有
    4: { color: '#a855f7', shadow: '0 0 30px rgba(168, 85, 247, 0.8)' }, // 紫色 - 史诗
    5: { color: '#f97316', shadow: '0 0 35px rgba(249, 115, 22, 0.9)' }  // 橙色 - 传说
  }
  return glowMap[rarityValue] || glowMap[0]
}

function BlindNFTDashboard() {
  const { address, isConnected } = useAccount()
  const publicClient = usePublicClient()
  const chainId = useChainId()
  const [currentPage, setCurrentPage] = useState('dashboard') // 'dashboard', 'mint', 'mynfts'
  const [tokenURI, setTokenURI] = useState('')
  const [userNFTs, setUserNFTs] = useState([])
  const [statusMessage, setStatusMessage] = useState({ type: '', message: '' })
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedMetadata, setUploadedMetadata] = useState(null)
  const [useUploadMode, setUseUploadMode] = useState(true) // 默认使用上传模式
  const [contractStats, setContractStats] = useState({ totalSupply: 0 })
  const [isDecrypting, setIsDecrypting] = useState(false)
  
  // 设置状态消息，所有消息3秒后自动消失
  const showStatusMessage = (type, message) => {
    setStatusMessage({ type, message })
    setTimeout(() => {
      setStatusMessage({ type: '', message: '' })
    }, 3000)
  }
  
  // 从 localStorage 读取已解密的属性（按地址存储，支持多个 NFT）
  const getStoredDecryptedAttributes = () => {
    if (!address) return {}
    try {
      const key = `decrypted_${address.toLowerCase()}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      console.error('读取 localStorage 失败:', e)
      return {}
    }
  }
  
  // 从 localStorage 读取已上传的图片 URL（按地址存储，支持多个 NFT）
  const getStoredUploadedImages = () => {
    if (!address) return {}
    try {
      const key = `uploaded_images_${address.toLowerCase()}`
      const stored = localStorage.getItem(key)
      return stored ? JSON.parse(stored) : {}
    } catch (e) {
      console.error('读取已上传图片 localStorage 失败:', e)
      return {}
    }
  }
  
  // 现在 decryptedAttributes 是一个对象，key 是 tokenId，value 是解密数据
  const [decryptedAttributes, setDecryptedAttributes] = useState(getStoredDecryptedAttributes)
  
  // uploadedImages 对象：key 是 tokenId，value 是 imageUrl
  const [uploadedImages, setUploadedImages] = useState(getStoredUploadedImages)
  
  // Zama FHE SDK
  const { fheInstance, isLoading: isFHELoading, error: fheError, isReady: isFHEReady, decrypt, decryptBatch } = useZamaFHE()

  // 写入合约
  const { data: mintHash, writeContract: mint, isPending: isMinting } = useWriteContract()
  const { data: revealHash, writeContract: reveal, isPending: isRevealing } = useWriteContract()

  // 等待交易确认
  const { isLoading: isMintConfirming, isSuccess: isMintSuccess } = useWaitForTransactionReceipt({
    hash: mintHash,
  })

  const { isLoading: isRevealConfirming, isSuccess: isRevealSuccess } = useWaitForTransactionReceipt({
    hash: revealHash,
  })

  // 已删除 getLogsInChunks 函数 - 使用新合约的 tokensOfOwner() 替代日志扫描

  // 处理图片上传完成
  const handleUploadComplete = (result) => {
    console.log('[Dashboard] 上传完成 ->', result)
    setUploadedMetadata(result)
    setTokenURI(result.metadataUrl)
    showStatusMessage('success', '图片上传成功！现在可以铸造 NFT 了 🎉')
  }

  // 处理铸造
  const handleMint = async () => {
    const uri = useUploadMode ? tokenURI : tokenURI
    console.log('[Dashboard] 发起铸造，URI =', uri)
    
    if (!uri.trim()) {
      setStatusMessage({ type: 'error', message: '请先上传图片或输入 Token URI' })
      return
    }

    try {
      // 网络校验：必须在 Sepolia (0xaa36a7 -> 11155111)
      if (chainId && Number(chainId) !== 11155111) {
        setStatusMessage({ type: 'error', message: '请切换到 Sepolia 网络后重试' })
        return
      }
      setStatusMessage({ type: 'info', message: '正在铸造 NFT...' })
      console.log('[Dashboard] 估算 gas ...')
      // 预估 gas 并留出 20% 裕量；若估算失败，则不强制设置 gas，交由钱包处理
      let gasWithBuffer = undefined
      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACT_ADDRESS,
          abi: contractABI,
          functionName: 'mint',
          args: [uri],
          account: address,
          chainId,
        })
        gasWithBuffer = (gasEstimate * 120n) / 100n
        console.log('[Dashboard] gas 估算成功 ->', gasEstimate.toString(), 'buffer ->', gasWithBuffer.toString())
      } catch (_) {
        // 估算失败时，交由钱包自行估算（不设置 gas）
        console.warn('[Dashboard] gas 估算失败，交由钱包估算')
        gasWithBuffer = undefined
      }

      console.log('[Dashboard] 发送交易 mint(...) 到合约:', CONTRACT_ADDRESS)
      await mint({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'mint',
        args: [uri],
        account: address,
        chainId,
        ...(gasWithBuffer ? { gas: gasWithBuffer } : {}),
        // 不设置 gasPrice，交由钱包按 EIP-1559 处理
      })
      console.log('[Dashboard] 已提交交易，哈希等待中 ...')
    } catch (error) {
      console.error('铸造错误:', error)
      setStatusMessage({ type: 'error', message: `铸造失败: ${error.message}` })
    }
  }

  // 监听地址变化，重新加载 localStorage 中的解密数据
  useEffect(() => {
    if (address) {
      const stored = getStoredDecryptedAttributes()
      console.log('[Dashboard] 从 localStorage 恢复解密数据:', stored)
      console.log('[Dashboard] 当前地址:', address.toLowerCase())
      console.log('[Dashboard] localStorage key:', `decrypted_${address.toLowerCase()}`)
      
      // 调试：列出所有 localStorage 中的 decrypted_ 开头的 key
      console.log('[Dashboard] 所有 localStorage keys:')
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i)
        if (key.startsWith('decrypted_')) {
          console.log(`  - ${key}:`, localStorage.getItem(key))
        }
      }
      
      setDecryptedAttributes(stored || {})
    } else {
      setDecryptedAttributes({})
    }
  }, [address])

  // 新增：铸造后自动本地解密
  const autoDecryptAfterMint = async (tokenId) => {
    if (!isFHEReady) {
      setStatusMessage({ type: 'info', message: `FHE SDK 未就绪，稍后可尝试解密 (#${tokenId})` })
      return
    }
    try {
      setStatusMessage({ type: 'info', message: `🔓 正在本地解密新铸造的 NFT #${tokenId}...` })
      console.log('[Dashboard] autoDecryptAfterMint -> tokenId =', tokenId)
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const { Contract } = await import('ethers')
      const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer)

      console.log('[Dashboard] 读取密文句柄 getEncryptedRarity / getEncryptedAttributes ...')
      const encryptedRarity = await contract.getEncryptedRarity(BigInt(tokenId))
      const [encryptedPower, encryptedSpeed] = await contract.getEncryptedAttributes(BigInt(tokenId))
      console.log('[Dashboard] 加密句柄 -> rarity:', encryptedRarity, 'power:', encryptedPower, 'speed:', encryptedSpeed)

      const handleContractPairs = [
        { handle: encryptedRarity, contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedPower, contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedSpeed, contractAddress: CONTRACT_ADDRESS },
      ]
      console.log('[Dashboard] 调用 decryptBatch，pairs =', handleContractPairs)
      const decryptedResults = await decryptBatch(handleContractPairs, signer)
      console.log('[Dashboard] 解密返回结果 =', decryptedResults)

      const rarityValue = Number(decryptedResults[encryptedRarity]) % 101
      const powerValue = Number(decryptedResults[encryptedPower]) % 101
      const speedValue = Number(decryptedResults[encryptedSpeed]) % 101
      console.log('[Dashboard] 解密后的明文 -> rarity:', rarityValue, 'power:', powerValue, 'speed:', speedValue)

      const decrypted = {
        rarity: rarityValue,
        power: powerValue,
        speed: speedValue,
      }
      
      // 保存到 localStorage（按地址存储，支持多个 NFT）
      if (address) {
        try {
          const key = `decrypted_${address.toLowerCase()}`
          const allDecrypted = { ...decryptedAttributes, [String(tokenId)]: decrypted }
          localStorage.setItem(key, JSON.stringify(allDecrypted))
          console.log('[Dashboard] 已保存解密数据到 localStorage，Token ID:', tokenId)
          setDecryptedAttributes(allDecrypted)
        } catch (e) {
          console.error('[Dashboard] 保存到 localStorage 失败:', e)
        }
      }
      
      showStatusMessage('success', `✅ 已本地解密 NFT #${tokenId}`)
      fetchUserNFTs()
    } catch (err) {
      console.error('[Dashboard] 自动解密失败 ->', err)
      showStatusMessage('error', `自动解密失败: ${err.message || String(err)}`)
    }
  }

  // 用户选择是否公开到链上
  const handleSubmitToChain = async (tokenId) => {
    const attrs = decryptedAttributes[tokenId]
    if (!attrs) {
      setStatusMessage({ type: 'error', message: `NFT #${tokenId} 未解密` })
      return
    }

    try {
      if (chainId && Number(chainId) !== 11155111) {
        setStatusMessage({ type: 'error', message: '请切换到 Sepolia 网络后重试' })
        return
      }
      setStatusMessage({ type: 'info', message: `⛓️ 正在公开 NFT #${tokenId} 的属性到链上...` })
      console.log(`[Dashboard] 提交公开属性到链上 -> Token #${tokenId}`, attrs)
      // 预估 gas；失败则不设置 gas 让钱包估算
      let revealGasWithBuffer = undefined
      try {
        const gasEstimate = await publicClient.estimateContractGas({
          address: CONTRACT_ADDRESS,
          abi: contractABI,
          functionName: 'submitRevealedAttributes',
          args: [
            BigInt(tokenId),
            BigInt(attrs.rarity),
            BigInt(attrs.power),
            BigInt(attrs.speed)
          ],
          account: address,
          chainId,
        })
        revealGasWithBuffer = (gasEstimate * 120n) / 100n
        console.log('[Dashboard] reveal gas 估算成功 ->', gasEstimate.toString(), 'buffer ->', revealGasWithBuffer.toString())
      } catch (_) {
        console.warn('[Dashboard] reveal gas 估算失败，交由钱包估算')
        revealGasWithBuffer = undefined
      }

      await reveal({
        address: CONTRACT_ADDRESS,
        abi: contractABI,
        functionName: 'submitRevealedAttributes',
        args: [
          BigInt(tokenId),
          BigInt(attrs.rarity),
          BigInt(attrs.power),
          BigInt(attrs.speed)
        ],
        ...(revealGasWithBuffer ? { gas: revealGasWithBuffer } : {}),
      })
      console.log('[Dashboard] 已提交公开交易，哈希等待中 ...')
    } catch (error) {
      console.error('提交错误:', error)
      setStatusMessage({ type: 'error', message: `提交失败: ${error.message}` })
    }
  }

  // （已移除）单独查询 NFT 属性

  // 监听铸造成功
  useEffect(() => {
    if (isMintSuccess) {
      showStatusMessage('success', `NFT 铸造成功！解析交易回执中… (tx: ${mintHash})`)
      console.log('[Dashboard] 铸造成功，开始解析回执 ->', mintHash)

      // 解析交易回执中的 Transfer(0x0 -> user, tokenId)
      ;(async () => {
        try {
          const provider = new BrowserProvider(window.ethereum)
          const receipt = await provider.getTransactionReceipt(mintHash)
          if (!receipt) throw new Error('未获取到交易回执')
          console.log('[Dashboard] 获取到回执，log 数量:', receipt.logs?.length)

          const { Interface, ZeroAddress } = await import('ethers')
          const iface = new Interface(contractABI)
          let mintedTokenId = null

          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog({ topics: log.topics, data: log.data })
              if (parsed?.name === 'Transfer') {
                const from = String(parsed.args.from)
                const to = String(parsed.args.to)
                const tokenId = parsed.args.tokenId?.toString?.() || String(parsed.args.tokenId)
                console.log('[Dashboard] 解析到 Transfer -> from:', from, 'to:', to, 'tokenId:', tokenId)
                if (from === ZeroAddress && to.toLowerCase() === String(address).toLowerCase()) {
                  mintedTokenId = tokenId
                  break
                }
              }
            } catch (_) {
              // 不是本合约的事件或解析失败，忽略
            }
          }

          if (mintedTokenId) {
            showStatusMessage('success', `🎉 铸造成功！Token ID: ${mintedTokenId} (tx: ${mintHash})`)
            console.log('[Dashboard] 回执中解析到 tokenId =', mintedTokenId)
            
            // 保存上传的图片 URL 到 localStorage
            if (uploadedMetadata?.imageUrl) {
              const key = `uploaded_images_${address.toLowerCase()}`
              const allImages = { ...uploadedImages, [mintedTokenId]: uploadedMetadata.imageUrl }
              localStorage.setItem(key, JSON.stringify(allImages))
              setUploadedImages(allImages)
              console.log(`[Dashboard] 已保存 Token #${mintedTokenId} 的图片 URL:`, uploadedMetadata.imageUrl)
            }
            
            // 自动本地解密
            await autoDecryptAfterMint(mintedTokenId)
          } else {
            // 未解析到 tokenId 时，回退：使用 tokensOfOwner 查找最新的 Token
            try {
              console.warn('[Dashboard] 回执未解析到 tokenId，使用 tokensOfOwner 查询最新的 NFT ...')
              const provider2 = new BrowserProvider(window.ethereum)
              const { Contract } = await import('ethers')
              const contract2 = new Contract(CONTRACT_ADDRESS, contractABI, provider2)

              // ✅ 使用 tokensOfOwner 获取所有 NFT，取最大的 tokenId（最新的）
              const allTokenIds = await contract2.tokensOfOwner(address)
              console.log('[Dashboard] 回退查询到的所有 Token IDs:', allTokenIds.map(id => id.toString()))
              
              if (allTokenIds.length > 0) {
                // 取最大的 tokenId（最新铸造的）
                const latestOwned = allTokenIds.reduce((max, current) => 
                  BigInt(current) > BigInt(max) ? current : max
                , allTokenIds[0]).toString()
                
                console.log('[Dashboard] 找到最新的 Token ID:', latestOwned)
                showStatusMessage('success', `🎉 铸造成功！(未解析到 Token ID，尝试对最新的 #${latestOwned} 进行本地解密)`)
                
                // 保存上传的图片 URL 到 localStorage
                if (uploadedMetadata?.imageUrl) {
                  const key = `uploaded_images_${address.toLowerCase()}`
                  const allImages = { ...uploadedImages, [latestOwned]: uploadedMetadata.imageUrl }
                  localStorage.setItem(key, JSON.stringify(allImages))
                  setUploadedImages(allImages)
                  console.log(`[Dashboard] 已保存 Token #${latestOwned} 的图片 URL:`, uploadedMetadata.imageUrl)
                }
                
                await autoDecryptAfterMint(latestOwned)
              } else {
                showStatusMessage('success', `🎉 铸造成功！(未在回执中解析到 Token ID，且 tokensOfOwner 返回为空，tx: ${mintHash})`)
              }
            } catch (fallbackErr) {
              console.error('[Dashboard] 回退查询失败 ->', fallbackErr)
              showStatusMessage('success', `🎉 铸造成功！(未解析到 Token ID；回退查询失败: ${fallbackErr.message || String(fallbackErr)})`)
            }
          }
        } catch (e) {
          console.error('[Dashboard] 回执解析失败 ->', e)
          showStatusMessage('success', `🎉 铸造成功！(解析 Token ID 失败: ${e.message || String(e)})`)
        } finally {
          setTokenURI('')
          setUploadedMetadata(null)
          // 延迟刷新用户的 NFT 列表，确保区块链状态已更新
          console.log('[Dashboard] 等待 2 秒后刷新我的 NFT 列表 ...')
          setTimeout(() => {
            console.log('[Dashboard] 开始刷新我的 NFT 列表')
            fetchUserNFTs()
          }, 2000)
        }
      })()
    }
  }, [isMintSuccess, mintHash])

  // 监听公开成功
  useEffect(() => {
    if (isRevealSuccess) {
      ;(async () => {
        try {
          // 解析 revealHash 获取 tokenId
          const provider = new BrowserProvider(window.ethereum)
          const receipt = await provider.getTransactionReceipt(revealHash)
          const { Interface } = await import('ethers')
          const iface = new Interface(contractABI)
          
          let revealedTokenId = null
          for (const log of receipt.logs) {
            try {
              const parsed = iface.parseLog({ topics: log.topics, data: log.data })
              if (parsed && parsed.name === 'Revealed') {
                revealedTokenId = String(parsed.args.tokenId)
                break
              }
            } catch (_) {}
          }
          
          if (revealedTokenId && address) {
            // 清除该 tokenId 的本地解密数据
            const key = `decrypted_${address.toLowerCase()}`
            const allDecrypted = { ...decryptedAttributes }
            delete allDecrypted[revealedTokenId]
            localStorage.setItem(key, JSON.stringify(allDecrypted))
            setDecryptedAttributes(allDecrypted)
            console.log(`[Dashboard] 已清除 Token #${revealedTokenId} 的本地解密数据`)
            
            // 清除该 tokenId 的本地图片 URL（因为链上已经有了）
            const imageKey = `uploaded_images_${address.toLowerCase()}`
            const allImages = { ...uploadedImages }
            delete allImages[revealedTokenId]
            localStorage.setItem(imageKey, JSON.stringify(allImages))
            setUploadedImages(allImages)
            console.log(`[Dashboard] 已清除 Token #${revealedTokenId} 的本地图片 URL`)
          }
        } catch (e) {
          console.error('[Dashboard] 清除解密数据失败:', e)
        }
        
        showStatusMessage('success', `NFT 属性公开成功！交易哈希: ${revealHash}`)
        fetchUserNFTs()
      })()
    }
  }, [isRevealSuccess, revealHash, address, decryptedAttributes])

  // 辅助函数：从 tokenURI 解析图片 URL
  const parseImageFromTokenURI = async (tokenURI) => {
    if (!tokenURI) {
      console.log('[parseImageFromTokenURI] tokenURI 为空')
      return null
    }
    
    console.log('[parseImageFromTokenURI] 开始解析 tokenURI:', tokenURI)
    
    try {
      // 如果是 IPFS URI，转换为 HTTP gateway (使用 Pinata)
      if (tokenURI.startsWith('ipfs://')) {
        const metadataUrl = ipfsToHttp(tokenURI)
        console.log('[parseImageFromTokenURI] IPFS -> HTTP:', metadataUrl)
        
        // 获取 metadata JSON
        const response = await fetch(metadataUrl)
        console.log('[parseImageFromTokenURI] Fetch 响应状态:', response.status)
        if (response.ok) {
          const metadata = await response.json()
          console.log('[parseImageFromTokenURI] 解析到 metadata:', metadata)
          if (metadata.image) {
            // 将 image 的 IPFS URI 也转换为 HTTP
            const imageUrl = ipfsToHttp(metadata.image)
            console.log('[parseImageFromTokenURI] 图片 URL:', imageUrl)
            return imageUrl
          }
        }
      } else if (tokenURI.startsWith('data:application/json')) {
        // 如果是 base64 编码的 JSON
        console.log('[parseImageFromTokenURI] 处理 base64 编码的 JSON')
        const base64Data = tokenURI.split(',')[1]
        const jsonStr = atob(base64Data)
        const metadata = JSON.parse(jsonStr)
        console.log('[parseImageFromTokenURI] 解析到 metadata:', metadata)
        if (metadata.image) {
          const imageUrl = ipfsToHttp(metadata.image)
          console.log('[parseImageFromTokenURI] 图片 URL:', imageUrl)
          return imageUrl
        }
      } else if (tokenURI.startsWith('http')) {
        // 如果是 HTTP URL，获取 metadata
        console.log('[parseImageFromTokenURI] 处理 HTTP URL')
        const response = await fetch(tokenURI)
        console.log('[parseImageFromTokenURI] Fetch 响应状态:', response.status)
        if (response.ok) {
          const metadata = await response.json()
          console.log('[parseImageFromTokenURI] 解析到 metadata:', metadata)
          if (metadata.image) {
            const imageUrl = ipfsToHttp(metadata.image)
            console.log('[parseImageFromTokenURI] 图片 URL:', imageUrl)
            return imageUrl
          }
        }
      }
    } catch (error) {
      console.error('[parseImageFromTokenURI] 解析图片 URL 失败:', error)
    }
    
    console.log('[parseImageFromTokenURI] 返回 null')
    return null
  }

  // 模态框操作
  const openNFTDetail = (nft) => {
    setSelectedNFT(nft)
    setIsModalOpen(true)
  }

  const closeNFTDetail = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedNFT(null), 300)
  }

  // 解密单个 NFT
  const handleDecrypt = async (tokenId) => {
    if (!isFHEReady) {
      setStatusMessage({ type: 'error', message: 'FHE SDK 未就绪' })
      return
    }
    
    try {
      setIsDecrypting(true)
      setStatusMessage({ type: 'info', message: `🔓 正在解密 NFT #${tokenId}...` })
      
      const provider = new BrowserProvider(window.ethereum)
      const signer = await provider.getSigner()
      const { Contract } = await import('ethers')
      const contract = new Contract(CONTRACT_ADDRESS, contractABI, signer)

      const encryptedRarity = await contract.getEncryptedRarity(BigInt(tokenId))
      const [encryptedPower, encryptedSpeed] = await contract.getEncryptedAttributes(BigInt(tokenId))

      const handleContractPairs = [
        { handle: encryptedRarity, contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedPower, contractAddress: CONTRACT_ADDRESS },
        { handle: encryptedSpeed, contractAddress: CONTRACT_ADDRESS },
      ]
      
      const decryptedResults = await decryptBatch(handleContractPairs, signer)

      const rarityValue = Number(decryptedResults[encryptedRarity]) % 101
      const powerValue = Number(decryptedResults[encryptedPower]) % 101
      const speedValue = Number(decryptedResults[encryptedSpeed]) % 101

      const decrypted = {
        rarity: rarityValue,
        power: powerValue,
        speed: speedValue,
      }
      
      if (address) {
        const key = `decrypted_${address.toLowerCase()}`
        const allDecrypted = { ...decryptedAttributes, [String(tokenId)]: decrypted }
        localStorage.setItem(key, JSON.stringify(allDecrypted))
        setDecryptedAttributes(allDecrypted)
      }
      
     // setStatusMessage({ type: 'success', message: `✅ NFT #${tokenId} 解密成功！` })
      fetchUserNFTs()
    } catch (err) {
      console.error('解密失败:', err)
      setStatusMessage({ type: 'error', message: `解密失败: ${err.message}` })
    } finally {
      setIsDecrypting(false)
    }
  }

  // 获取用户的 NFT（将本地解密但未公开的属性也显示出来）
  const fetchUserNFTs = async () => {
    if (!address) return
    try {
      console.log('[Dashboard] fetchUserNFTs ... address =', address)
      const provider = new BrowserProvider(window.ethereum)
      const { Contract } = await import('ethers')
      const contract = new Contract(CONTRACT_ADDRESS, contractABI, provider)

      // ✅ 使用新合约的 tokensOfOwner 函数直接查询（比扫描日志更高效准确）
      console.log('[Dashboard] 调用 tokensOfOwner ...')
      const tokenIds = await contract.tokensOfOwner(address)
      console.log('[Dashboard] 用户拥有的 Token IDs:', tokenIds.map(id => id.toString()))
      
      const nextList = []
      
      // 遍历所有 tokenId，获取详细信息
      for (const tokenId of tokenIds) {
        const id = tokenId.toString()
        
        try {
          console.log(`[Dashboard] 处理 Token #${id}`)
          const owner = await contract.ownerOf(Number(id))
          console.log(`[Dashboard] Token #${id} 的 owner:`, owner)
          
          const attributes = await contract.getRevealedAttributes(Number(id))
          console.log(`[Dashboard] Token #${id} 的属性:`, attributes)
          
          let tokenURI = ''
          let imageUrl = null
          
          // 优先使用本地保存的图片 URL
          if (uploadedImages[id]) {
            imageUrl = ipfsToHttp(uploadedImages[id])
            console.log(`[Dashboard] Token #${id} 使用本地保存的图片 URL:`, imageUrl)
          } else {
            // 如果本地没有，从链上获取
            try { 
              tokenURI = await contract.getRevealedTokenURI(Number(id))
              console.log(`[Dashboard] Token #${id} 的 tokenURI:`, tokenURI)
              // 解析图片 URL
              imageUrl = await parseImageFromTokenURI(tokenURI)
              console.log(`[Dashboard] Token #${id} 解析到的 imageUrl:`, imageUrl)
            } catch (err) {
              console.error(`[Dashboard] Token #${id} 获取 tokenURI 或解析图片失败:`, err)
            }
          }
          
          const local = decryptedAttributes && decryptedAttributes[String(id)]
          const nftData = {
            tokenId: String(id),
            owner,
            revealed: attributes[3],
            rarity: local ? local.rarity : (attributes[3] ? attributes[0].toString() : '?'),
            power: local ? local.power : (attributes[3] ? attributes[1].toString() : '?'),
            speed: local ? local.speed : (attributes[3] ? attributes[2].toString() : '?'),
            tokenURI,
            imageUrl,
            isLocallyDecrypted: !!local && !attributes[3],
          }
          console.log(`[Dashboard] Token #${id} 完整数据:`, nftData)
          nextList.push(nftData)
        } catch (err) {
          console.error(`[Dashboard] Token #${id} 处理失败:`, err)
        }
      }
      
      console.log('[Dashboard] 我的 NFT 列表 ->', nextList)
      setUserNFTs(nextList)
    } catch (error) {
      console.error('获取用户 NFT 失败:', error)
    }
  }

  useEffect(() => {
    if (isConnected && address) {
      fetchUserNFTs()
    }
  }, [isConnected, address, decryptedAttributes, uploadedImages])

  return (
    <div className="dashboard-modern">
      {/* 导航栏 */}
      <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />

      {/* 头部：连接钱包 + FHE 状态 */}
      <div className="dashboard-header-modern">
        <div className="dashboard-header-bg"></div>
        <div className="dashboard-header-content">
          <div className="dashboard-title-section">
            <div className="dashboard-icon-wrapper">
              <span className="dashboard-icon">🎭</span>
            </div>
            <div>
              <h1 className="dashboard-title">隐私 NFT 系统</h1>
              <p className="dashboard-subtitle">基于 Zama 的隐私 NFT 系统</p>
            </div>
          </div>
          
          <div className="dashboard-connect-wrapper">
            <ConnectButton />
          </div>
        </div>
        
        {/* FHE SDK 状态显示 */}
        {isConnected && (
          <div className="dashboard-fhe-status">
            {isFHELoading && (
              <div className="fhe-status-item loading">
                <span>⏳</span>
                <span>正在初始化 FHE SDK...</span>
              </div>
            )}
            {isFHEReady && (
              <div className="fhe-status-item ready">
                <span>✅</span>
                <span>FHE SDK 已就绪</span>
              </div>
            )}
            {fheError && (
              <div className="fhe-status-item error">
                <span>❌</span>
                <span>FHE 初始化失败: {fheError}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 状态消息 */}
      {statusMessage.message && (
        <div className={`status-message-modern ${statusMessage.type}`}>
          <div className="status-message-content">
            {statusMessage.type === 'success' && <span className="status-icon">✅</span>}
            {statusMessage.type === 'error' && <span className="status-icon">❌</span>}
            {statusMessage.type === 'info' && <span className="status-icon">ℹ️</span>}
            <span>{statusMessage.message}</span>
          </div>
        </div>
      )}

      {isConnected ? (
        <>
          {/* 根据当前页面显示不同内容 */}
          {currentPage === 'dashboard' && (
            <DashboardPage 
              account={address}
              userNFTs={userNFTs}
              contractStats={contractStats}
              onNavigate={setCurrentPage}
            />
          )}

          {currentPage === 'mint' && (
            <MintPage
              onMint={handleMint}
              isMinting={isMinting}
              isMintConfirming={isMintConfirming}
              onUploadComplete={handleUploadComplete}
            />
          )}

          {currentPage === 'mynfts' && (
            <MyNFTsPage
              userNFTs={userNFTs}
              onDecrypt={handleDecrypt}
              onReveal={handleSubmitToChain}
              isDecrypting={isDecrypting}
              isRevealing={isRevealing}
              isRevealConfirming={isRevealConfirming}
              onRefresh={fetchUserNFTs}
              ipfsToHttp={ipfsToHttp}
              formatRarity={formatRarity}
              getRarityGlow={getRarityGlow}
            />
          )}

        </>
      ) : (
        <div className="welcome-section-modern">
          <div className="welcome-card">
            <div className="welcome-icon">
              <span>👋</span>
            </div>
            <h2 className="welcome-title">欢迎使用 Blind NFT</h2>
            <p className="welcome-text">请连接钱包以开始使用</p>
            <div className="welcome-features">
              <div className="welcome-feature">
                <span className="welcome-feature-icon">🔒</span>
                <span>链上加密</span>
              </div>
              <div className="welcome-feature">
                <span className="welcome-feature-icon">🎨</span>
                <span>创建 NFT</span>
              </div>
              <div className="welcome-feature">
                <span className="welcome-feature-icon">🔓</span>
                <span>随时解密</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BlindNFTDashboard
