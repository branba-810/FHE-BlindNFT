import { useState } from 'react'
import { CONTRACT_ADDRESS } from '../config'

function NFTDetailModal({ nft, isOpen, onClose, onReveal, isRevealing, onDecrypt, isDecrypting, getRarityGlow, formatRarity, ipfsToHttp }) {
  if (!isOpen || !nft) return null

  const rarityGlow = getRarityGlow(nft.rarity)
  
  // 获取区块链浏览器链接 - 使用 Sepolia 网络
  const getExplorerUrl = (tokenId) => {
    // Sepolia Etherscan - 查看 NFT 详情
    return `https://sepolia.etherscan.io/token/${CONTRACT_ADDRESS}?a=${tokenId}`
  }
  
  // 打开区块链浏览器查看交易
  const handleViewOnExplorer = () => {
    const url = getExplorerUrl(nft.tokenId)
    window.open(url, '_blank', 'noopener,noreferrer')
  }

  return (
    <div className="nft-modal-backdrop">
      {/* 背景遮罩 */}
      <div 
        className="nft-modal-overlay"
        onClick={onClose}
      ></div>

      {/* 模态框内容 */}
      <div className="nft-modal-wrapper">
        <div 
          className="nft-modal-container"
          onClick={(e) => e.stopPropagation()}
        >
          {/* 发光效果 */}
          <div 
            className="nft-modal-glow"
            style={{ background: `radial-gradient(circle, ${rarityGlow.color}40, transparent)` }}
          ></div>

          {/* 主内容卡片 */}
          <div 
            className="nft-modal-card"
            style={{ border: `2px solid ${rarityGlow.color}` }}
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="nft-modal-close-btn"
            >
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* 顶部装饰条 */}
            <div 
              className="nft-modal-top-bar"
              style={{ background: `linear-gradient(to right, ${rarityGlow.color}, transparent, ${rarityGlow.color})` }}
            ></div>

            <div className="nft-modal-content">
              {/* 左侧：图片展示 */}
              <div className="nft-modal-left">
                {/* NFT 图片 */}
                <div className="nft-modal-image-wrapper">
                  <div 
                    className="nft-modal-image-glow"
                    style={{ background: `linear-gradient(135deg, ${rarityGlow.color}40, transparent)` }}
                  ></div>
                  <div className="nft-modal-image-container" style={{ borderColor: rarityGlow.color }}>
                    {nft.imageUrl && (
                      <img 
                        src={ipfsToHttp(nft.imageUrl)}
                        alt={`NFT #${nft.tokenId}`}
                        className="nft-modal-image"
                        style={{
                          filter: nft.revealed || nft.isLocallyDecrypted ? 'none' : 'blur(30px) brightness(0.6)'
                        }}
                      />
                    )}
                    
                    {/* 加密覆盖层 */}
                    {!nft.revealed && !nft.isLocallyDecrypted && (
                      <div className="nft-modal-encrypted-layer">
                        <div className="nft-modal-encrypted-inner">
                          <div 
                            className="nft-modal-lock-circle"
                            style={{
                              background: `radial-gradient(circle, ${rarityGlow.color}30, ${rarityGlow.color}10)`,
                              borderColor: rarityGlow.color,
                              boxShadow: `0 0 40px ${rarityGlow.color}60`
                            }}
                          >
                            <span className="text-6xl">🔒</span>
                          </div>
                          <div className="nft-modal-encrypted-badge">
                            <p className="text-white font-bold text-2xl mb-2">加密保护中</p>
                            <p className="text-purple-200">点击解密查看完整内容</p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* 解密后的角标 */}
                    {(nft.revealed || nft.isLocallyDecrypted) && (
                      <div className="nft-modal-revealed-badge">
                        <div className="nft-modal-revealed-tag">
                          <span className="text-lg">✅</span>
                          <span className="text-green-400 font-semibold text-sm ml-2">
                            {nft.revealed ? '已公开' : '已解密'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* 链上信息 */}
                <div className="nft-modal-chain-info">
                  <h4 className="nft-modal-section-title chain">
                    <span>⛓️</span>
                    <span>链上信息</span>
                  </h4>
                  <div className="nft-modal-info-list">
                    <div className="nft-modal-info-item">
                      <span className="text-gray-400">Token ID</span>
                      <span className="text-white font-mono font-bold">#{nft.tokenId}</span>
                    </div>
                    <div className="nft-modal-info-item">
                      <span className="text-gray-400">合约标准</span>
                      <span className="text-purple-400 font-semibold">ERC-721</span>
                    </div>
                    <div className="nft-modal-info-item last">
                      <span className="text-gray-400">加密状态</span>
                      <span className="text-blue-400 font-semibold">FHE 加密</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 右侧：详细信息 */}
              <div className="nft-modal-right">
                {/* 标题和稀有度 */}
                <div className="nft-modal-header-info">
                  <div className="nft-modal-title-row">
                    <h2 className="nft-modal-title">NFT #{nft.tokenId}</h2>
                    <div 
                      className="nft-modal-rarity-tag"
                      style={{
                        background: `linear-gradient(135deg, ${rarityGlow.color}40, ${rarityGlow.color}20)`,
                        border: `2px solid ${rarityGlow.color}`,
                        color: rarityGlow.color,
                        boxShadow: `0 0 20px ${rarityGlow.color}40`
                      }}
                    >
                      {formatRarity(nft.rarity)}
                    </div>
                  </div>
                  <p className="text-gray-400">基于 Fhenix 的隐私 NFT</p>
                </div>

                {/* 属性卡片 */}
                <div className="nft-modal-attributes-card">
                  <h3 className="nft-modal-section-title attributes">
                    <span>⚡</span>
                    <span>NFT 属性</span>
                  </h3>
                  
                  <div className="nft-modal-attributes-list">
                    {/* 稀有度 */}
                    <div className="nft-modal-attribute">
                      <div className="nft-modal-attribute-header">
                        <span className="nft-modal-attribute-label">
                          <span>💎</span>
                          <span>稀有度等级</span>
                        </span>
                        <span className="nft-modal-attribute-value" style={{ color: rarityGlow.color }}>
                          {nft.rarity}
                        </span>
                      </div>
                      <div className="nft-modal-progress-container">
                        <div 
                          className="nft-modal-progress-fill"
                          style={{
                            width: `${(nft.rarity / 5) * 100}%`,
                            background: `linear-gradient(to right, ${rarityGlow.color}, ${rarityGlow.color}80)`
                          }}
                        ></div>
                      </div>
                    </div>

                    {/* 力量 */}
                    <div className="nft-modal-attribute">
                      <div className="nft-modal-attribute-header">
                        <span className="nft-modal-attribute-label">
                          <span>⚡</span>
                          <span>力量值</span>
                        </span>
                        <span className="nft-modal-attribute-value power">
                          {nft.power}
                        </span>
                      </div>
                      <div className="nft-modal-progress-container">
                        <div 
                          className="nft-modal-progress-fill power"
                          style={{ width: `${nft.power}%` }}
                        ></div>
                      </div>
                    </div>

                    {/* 速度 */}
                    <div className="nft-modal-attribute">
                      <div className="nft-modal-attribute-header">
                        <span className="nft-modal-attribute-label">
                          <span>🏃</span>
                          <span>速度值</span>
                        </span>
                        <span className="nft-modal-attribute-value speed">
                          {nft.speed}
                        </span>
                      </div>
                      <div className="nft-modal-progress-container">
                        <div 
                          className="nft-modal-progress-fill speed"
                          style={{ width: `${nft.speed}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* 所有权信息 */}
                <div className="nft-modal-ownership-card">
                  <h4 className="nft-modal-section-title ownership">
                    <span>🔑</span>
                    <span>所有权详情</span>
                  </h4>
                  <div className="nft-modal-ownership-list">
                    <div className="nft-modal-ownership-item">
                      <span className="text-gray-400">持有者:</span>
                      <span className="text-purple-400 font-mono">你</span>
                    </div>
                    <div className="nft-modal-ownership-item">
                      <span className="text-gray-400">权限:</span>
                      <span className="text-green-400 font-semibold">完全控制</span>
                    </div>
                    <div className="nft-modal-ownership-item">
                      <span className="text-gray-400">解密密钥:</span>
                      <span className="text-blue-400 font-semibold">私钥签名</span>
                    </div>
                  </div>
                </div>

                {/* 操作按钮 */}
                <div className="nft-modal-actions">
                  {!nft.revealed && !nft.isLocallyDecrypted && (
                    <button
                      onClick={() => onDecrypt && onDecrypt(nft.tokenId)}
                      disabled={isDecrypting}
                      className="nft-modal-btn decrypt"
                    >
                      {isDecrypting ? (
                        <>
                          <div className="nft-modal-spinner"></div>
                          <span>解密中...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">🔓</span>
                          <span>解密查看属性</span>
                        </>
                      )}
                    </button>
                  )}
                  
                  {nft.isLocallyDecrypted && !nft.revealed && (
                    <button
                      onClick={() => onReveal && onReveal(nft.tokenId)}
                      disabled={isRevealing}
                      className="nft-modal-btn reveal"
                    >
                      {isRevealing ? (
                        <>
                          <div className="nft-modal-spinner"></div>
                          <span>公开中...</span>
                        </>
                      ) : (
                        <>
                          <span className="text-xl">🌟</span>
                          <span>公开展示属性</span>
                        </>
                      )}
                    </button>
                  )}

                  {nft.revealed && (
                    <div className="nft-modal-btn revealed">
                      <span className="text-xl">✨</span>
                      <span>已公开展示</span>
                    </div>
                  )}

                  {/* 辅助按钮 */}
                  <div className="nft-modal-secondary-actions">
                    <button 
                      className="nft-modal-secondary-btn"
                      onClick={handleViewOnExplorer}
                    >
                      <span>🔗</span>
                      <span>查看交易</span>
                    </button>
                    <button className="nft-modal-secondary-btn" disabled>
                      <span>📤</span>
                      <span>分享</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* 底部装饰条 */}
            <div 
              className="nft-modal-bottom-bar"
              style={{ background: `linear-gradient(to right, transparent, ${rarityGlow.color}, transparent)` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NFTDetailModal

