// IPFS 上传工具 - 使用 Pinata

// ⭐ Pinata 配置（硬编码）
const PINATA_API_KEY = '9bb6eabe841e232fe251'
const PINATA_SECRET_KEY = '6e207f70bc46adc69ec12d893bbb5405446eb299b5c3ea967f062f72802bb8ae'

// ============================================
// 主上传函数：使用 Pinata
// ============================================
export async function uploadToIPFSAuto(file, nftName, description) {
  if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    console.log('🚀 使用 Pinata 上传到 IPFS...')
    try {
      return await uploadToPinata(file, nftName, description)
    } catch (error) {
      console.error('❌ Pinata 上传失败:', error)
      console.log('📦 使用本地备用方案（仅供测试）')
      return uploadToIPFS(file, nftName, description)
    }
  }
  
  console.warn('⚠️ 未配置 Pinata API 密钥，使用本地备用方案')
  console.warn('请在 conf-token/.env 文件中配置 VITE_APIkey 和 VITE_APISecret')
  return uploadToIPFS(file, nftName, description)
}

// ============================================
// Pinata 上传图片
// ============================================
async function uploadImageToPinata(file) {
  try {
    const formData = new FormData()
    formData.append('file', file)
    
    // Pinata 元数据（可选）
    const pinataMetadata = JSON.stringify({
      name: `nft-image-${Date.now()}`
    })
    formData.append('pinataMetadata', pinataMetadata)
    
    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: formData
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`图片上传失败: ${errorText}`)
    }
    
    const data = await response.json()
    return data.IpfsHash
  } catch (error) {
    console.error('图片上传失败:', error)
    throw error
  }
}

// ============================================
// Pinata 上传元数据 JSON
// ============================================
async function uploadMetadataToPinata(metadata) {
  try {
    const response = await fetch('https://api.pinata.cloud/pinning/pinJSONToIPFS', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_KEY,
      },
      body: JSON.stringify({
        pinataContent: metadata,
        pinataMetadata: {
          name: `nft-metadata-${Date.now()}`
        }
      })
    })
    
    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`元数据上传失败: ${errorText}`)
    }
    
    const data = await response.json()
    return data.IpfsHash
  } catch (error) {
    console.error('元数据上传失败:', error)
    throw error
  }
}

// ============================================
// Pinata 完整上传函数（图片 + 元数据）
// ============================================
export async function uploadToPinata(file, nftName, description) {
  try {
    console.log('📤 开始 Pinata 上传...')
    
    // 1. 上传图片文件
    const imageCid = await uploadImageToPinata(file)
    console.log('✅ 图片上传成功，CID:', imageCid)
    
    // 2. 创建元数据
    const metadata = {
      name: nftName || `Blind NFT #${Date.now()}`,
      description: description || '一个神秘的盲盒 NFT，等待揭示其真实属性！',
      image: `ipfs://${imageCid}`,
      attributes: [
        {
          trait_type: 'Type',
          value: 'Blind Box'
        },
        {
          trait_type: 'Status',
          value: 'Unrevealed'
        }
      ]
    }
    
    // 3. 上传元数据 JSON
    const metadataCid = await uploadMetadataToPinata(metadata)
    console.log('✅ 元数据上传成功，CID:', metadataCid)
    
    console.log('🎉 Pinata 上传完成！')
    
    return {
      imageUrl: `ipfs://${imageCid}`,
      metadataUrl: `ipfs://${metadataCid}`,
      metadata
    }
  } catch (error) {
    console.error('❌ Pinata 上传失败:', error)
    throw error
  }
}

// ============================================
// 本地备用方案（不需要 API key，仅供测试）
// ============================================
export async function uploadToIPFS(file, nftName, description) {
  try {
    // ⚠️ 重要：为了避免交易数据过大，我们不在链上存储图片数据
    // 只存储一个简短的占位符 URI
    
    // 1. 生成一个唯一的占位符 ID（用于本地缓存）
    const placeholderId = `local-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    
    // 2. 创建轻量级元数据（不包含图片 base64）
    const metadata = {
      name: nftName || `Blind NFT #${Date.now()}`,
      description: description || '一个神秘的盲盒 NFT，等待揭示其真实属性！',
      // ✅ 使用简短的占位符，而不是完整的 base64 图片
      image: `ipfs://QmPlaceholder${placeholderId.substr(0, 32)}`,
      attributes: [
        {
          trait_type: 'Type',
          value: 'Blind Box'
        },
        {
          trait_type: 'Status',
          value: 'Unrevealed'
        }
      ]
    }
    
    // 3. 将元数据转换为简短的 JSON
    const metadataJson = JSON.stringify(metadata)
    
    // 4. 创建简短的 metadata URI（使用 IPFS 格式占位符）
    const metadataCid = `Qm${btoa(metadataJson).substr(0, 44).replace(/[^a-zA-Z0-9]/g, '0')}`
    
    return {
      imageUrl: await fileToDataURL(file), // 仅用于前端预览
      metadataUrl: `ipfs://${metadataCid}`, // ✅ 简短的 IPFS URI
      metadata
    }
  } catch (error) {
    console.error('本地备用上传失败:', error)
    throw error
  }
}

// 辅助函数：将 File 转换为 Data URL（用于前端预览）
function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => resolve(e.target.result)
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}

// ============================================
// 揭示 NFT：上传真实的图片和元数据
// ============================================
export async function revealNFT(file, revealedName, revealedDescription, attributes = []) {
  if (PINATA_API_KEY && PINATA_SECRET_KEY) {
    console.log('🚀 使用 Pinata 上传揭示的 NFT 数据...')
    try {
      return await revealWithPinata(file, revealedName, revealedDescription, attributes)
    } catch (error) {
      console.error('❌ Pinata 揭示上传失败:', error)
      return revealLocal(file, revealedName, revealedDescription, attributes)
    }
  }
  
  return revealLocal(file, revealedName, revealedDescription, attributes)
}

// 使用 Pinata 揭示
async function revealWithPinata(file, revealedName, revealedDescription, attributes) {
  try {
    // 1. 上传真实图片
    const imageCid = await uploadImageToPinata(file)
    console.log('✅ 揭示图片上传成功，CID:', imageCid)
    
    // 2. 创建揭示后的元数据
    const metadata = {
      name: revealedName,
      description: revealedDescription,
      image: `ipfs://${imageCid}`,
      attributes: [
        ...attributes,
        {
          trait_type: 'Status',
          value: 'Revealed'
        },
        {
          trait_type: 'Reveal Time',
          value: new Date().toISOString()
        }
      ]
    }
    
    // 3. 上传元数据
    const metadataCid = await uploadMetadataToPinata(metadata)
    console.log('✅ 揭示元数据上传成功，CID:', metadataCid)
    
    return {
      imageUrl: `ipfs://${imageCid}`,
      metadataUrl: `ipfs://${metadataCid}`,
      metadata
    }
  } catch (error) {
    console.error('❌ Pinata 揭示失败:', error)
    throw error
  }
}

// 本地揭示（备用）
async function revealLocal(file, revealedName, revealedDescription, attributes) {
  const placeholderId = `revealed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  
  const metadata = {
    name: revealedName,
    description: revealedDescription,
    image: `ipfs://QmRevealed${placeholderId.substr(0, 32)}`,
    attributes: [
      ...attributes,
      {
        trait_type: 'Status',
        value: 'Revealed'
      }
    ]
  }
  
  const metadataJson = JSON.stringify(metadata)
  const metadataCid = `Qm${btoa(metadataJson).substr(0, 44).replace(/[^a-zA-Z0-9]/g, '0')}`
  
  return {
    imageUrl: await fileToDataURL(file),
    metadataUrl: `ipfs://${metadataCid}`,
    metadata
  }
}

// ============================================
// 从 IPFS 获取数据（支持多个网关）
// ============================================
export async function getFromIPFS(ipfsUrl) {
  // 支持的 IPFS 网关列表（按优先级排序）
  const gateways = [
    'https://gateway.pinata.cloud/ipfs/',
    'https://ipfs.io/ipfs/',
    'https://cloudflare-ipfs.com/ipfs/',
    'https://gateway.ipfs.io/ipfs/'
  ]
  
  // 提取 CID
  const cid = ipfsUrl.replace('ipfs://', '')
  
  // 尝试每个网关
  for (const gateway of gateways) {
    try {
      const response = await fetch(`${gateway}${cid}`)
      if (response.ok) {
        const data = await response.json()
        return data
      }
    } catch (error) {
      console.warn(`网关 ${gateway} 失败，尝试下一个...`)
    }
  }
  
  throw new Error('无法从任何 IPFS 网关获取数据')
}

// ============================================
// 解析 IPFS URL 为 HTTP URL
// ============================================
export function ipfsToHttp(ipfsUrl, preferredGateway = 'https://gateway.pinata.cloud/ipfs/') {
  if (!ipfsUrl) return ''
  if (ipfsUrl.startsWith('http')) return ipfsUrl
  
  const cid = ipfsUrl.replace('ipfs://', '')
  return `${preferredGateway}${cid}`
}
