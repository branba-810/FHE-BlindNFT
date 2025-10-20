import { useState } from 'react'

function NFTCard({ nft, onDecrypt, onCardClick, ipfsToHttp, formatRarity, getRarityGlow }) {
  const [imageLoaded, setImageLoaded] = useState(false)
  
  // 稀有度配置
  const rarityConfig = {
    1: { 
      name: 'Common', 
      nameZh: '普通',
      color: '#FFFFFF', 
      glow: 'rgba(255, 255, 255, 0.5)',
      gradient: 'from-white/20 to-gray-400/20'
    },
    2: { 
      name: 'Uncommon', 
      nameZh: '罕见',
      color: '#10B981', 
      glow: 'rgba(16, 185, 129, 0.6)',
      gradient: 'from-green-500/30 to-emerald-400/30'
    },
    3: { 
      name: 'Rare', 
      nameZh: '稀有',
      color: '#3B82F6', 
      glow: 'rgba(59, 130, 246, 0.7)',
      gradient: 'from-blue-500/40 to-cyan-400/40'
    },
    4: { 
      name: 'Epic', 
      nameZh: '史诗',
      color: '#A855F7', 
      glow: 'rgba(168, 85, 247, 0.8)',
      gradient: 'from-purple-500/50 to-pink-500/50'
    },
    5: { 
      name: 'Legendary', 
      nameZh: '传说',
      color: '#F59E0B', 
      glow: 'rgba(245, 158, 11, 0.9)',
      gradient: 'from-yellow-500/60 via-orange-500/60 to-yellow-600/60'
    }
  }

  const config = rarityConfig[nft.rarity] || rarityConfig[1]
  const isEncrypted = !nft.revealed && !nft.isLocallyDecrypted

  return (
    <div 
      className="nft-card-modern group relative cursor-pointer"
      onClick={() => onCardClick && onCardClick(nft)}
    >
      {/* 外层发光动画 */}
      <div 
        className="nft-card-glow"
        style={{ 
          background: `radial-gradient(circle at 50% 50%, ${config.glow}, transparent 70%)` 
        }}
      ></div>

      {/* 主卡片容器 - 图片为背景 */}
      <div 
        className="nft-card-container"
        style={{
          border: `3px solid ${config.color}`,
          boxShadow: `
            0 0 30px ${config.glow},
            0 20px 60px -15px rgba(0, 0, 0, 0.8),
            inset 0 0 60px rgba(0, 0, 0, 0.3)
          `
        }}
      >
        {/* 背景图片层 */}
        <div className="nft-card-image-bg">
          {nft.imageUrl ? (
            <>
              <img 
                src={ipfsToHttp(nft.imageUrl)}
                alt={`NFT #${nft.tokenId}`}
                className={`nft-card-image ${imageLoaded ? 'loaded' : ''} ${isEncrypted ? 'encrypted' : ''}`}
                onLoad={() => setImageLoaded(true)}
              />
              {/* 图片加载占位符 */}
              {!imageLoaded && (
                <div className="nft-card-placeholder"></div>
              )}
            </>
          ) : (
            <div className="nft-card-no-image">
              <span className="text-6xl opacity-30">🖼️</span>
            </div>
          )}
        </div>

        {/* 渐变边框内光效 */}
        <div 
          className={`nft-card-gradient bg-gradient-to-br ${config.gradient}`}
        ></div>

        {/* 顶部渐变遮罩 */}
        <div className="nft-card-mask-top"></div>

        {/* 底部渐变遮罩 */}
        <div className="nft-card-mask-bottom"></div>

        {/* 区块链水印 - 左上角 */}
        <div className="nft-card-blockchain-icon" style={{ color: config.color }}>
          <svg className="w-12 h-12" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="1.5" fill="none"/>
          </svg>
        </div>

        {/* 锁水印 - 右下角（仅加密时显示） */}
        {isEncrypted && (
          <div className="nft-card-lock-icon" style={{ color: config.color }}>
            <svg className="w-20 h-20" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2C9.243 2 7 4.243 7 7v3H6c-1.103 0-2 .897-2 2v8c0 1.103.897 2 2 2h12c1.103 0 2-.897 2-2v-8c0-1.103-.897-2-2-2h-1V7c0-2.757-2.243-5-5-5zM9 7c0-1.654 1.346-3 3-3s3 1.346 3 3v3H9V7zm4 10.723V20h-2v-2.277c-.595-.347-1-.984-1-1.723 0-1.103.897-2 2-2s2 .897 2 2c0 .738-.405 1.376-1 1.723z"/>
            </svg>
          </div>
        )}

        {/* 顶部信息栏 */}
        <div className="nft-card-header">
          {/* Token ID 徽章 */}
          <div className="nft-card-token-badge">
            <span className="text-white/60 text-xs font-medium">ID</span>
            <span className="text-white font-bold text-lg ml-2">#{nft.tokenId}</span>
          </div>

          {/* 稀有度徽章 */}
          <div 
            className="nft-card-rarity-badge"
            style={{
              background: `linear-gradient(135deg, ${config.color}40, ${config.color}20)`,
              border: `2px solid ${config.color}`,
              color: config.color,
              boxShadow: `0 0 20px ${config.glow}, 0 4px 15px rgba(0,0,0,0.5)`
            }}
          >
            ⭐ {config.nameZh}
          </div>
        </div>

        {/* 加密覆盖层 */}
        {isEncrypted && (
          <div className="nft-card-encrypted-overlay">
            <div className="nft-card-encrypted-content">
              <div 
                className="nft-card-encrypted-icon"
                style={{
                  background: `radial-gradient(circle, ${config.color}30, ${config.color}10)`,
                  borderColor: config.color,
                  boxShadow: `0 0 40px ${config.glow}`
                }}
              >
                <span className="text-6xl">🔒</span>
              </div>
              <div className="nft-card-encrypted-text">
                <p className="text-white font-bold text-lg mb-1">Encrypted</p>
                <p className="text-white/60 text-sm">Private & Secure</p>
              </div>
            </div>
          </div>
        )}

        {/* 状态标签 - 右上角浮动 */}
        <div className="nft-card-status-badge">
          {nft.revealed ? (
            <div className="nft-card-status public">
              <span className="text-green-400 text-xs">●</span>
              <span className="text-green-400 font-bold text-xs ml-1.5">Public</span>
            </div>
          ) : nft.isLocallyDecrypted ? (
            <div className="nft-card-status unlocked">
              <span className="text-blue-400 text-xs">🔓</span>
              <span className="text-blue-400 font-bold text-xs ml-1.5">Unlocked</span>
            </div>
          ) : (
            <div className="nft-card-status locked">
              <span className="text-amber-400 text-xs">🔐</span>
              <span className="text-amber-400 font-bold text-xs ml-1.5">Locked</span>
            </div>
          )}
        </div>

        {/* 底部信息栏 */}
        <div className="nft-card-footer">
          {/* 属性预览（非加密时显示） */}
          {!isEncrypted && (
            <div className="nft-card-attributes">
              <div className="nft-card-attribute-item">
                <span className="text-white/70 flex items-center space-x-1.5">
                  <span>💎</span>
                  <span>Rarity</span>
                </span>
                <div className="flex items-center space-x-2">
                  <div className="nft-card-progress-bar">
                    <div 
                      className="nft-card-progress-fill"
                      style={{
                        width: `${(nft.rarity / 5) * 100}%`,
                        background: config.color,
                        boxShadow: `0 0 8px ${config.glow}`
                      }}
                    ></div>
                  </div>
                  <span className="text-white font-bold text-sm w-4">{nft.rarity}</span>
                </div>
              </div>

              <div className="nft-card-attribute-item">
                <span className="text-white/70 flex items-center space-x-1.5">
                  <span>⚡</span>
                  <span>Power</span>
                </span>
                <div className="flex items-center space-x-2">
                  <div className="nft-card-progress-bar">
                    <div 
                      className="nft-card-progress-fill power"
                      style={{ width: `${nft.power}%` }}
                    ></div>
                  </div>
                  <span className="text-blue-300 font-bold text-sm w-4">{nft.power}</span>
                </div>
              </div>

              <div className="nft-card-attribute-item">
                <span className="text-white/70 flex items-center space-x-1.5">
                  <span>🏃</span>
                  <span>Speed</span>
                </span>
                <div className="flex items-center space-x-2">
                  <div className="nft-card-progress-bar">
                    <div 
                      className="nft-card-progress-fill speed"
                      style={{ width: `${nft.speed}%` }}
                    ></div>
                  </div>
                  <span className="text-green-300 font-bold text-sm w-4">{nft.speed}</span>
                </div>
              </div>
            </div>
          )}

          {/* 解密按钮（仅加密时显示） */}
          {isEncrypted && (
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDecrypt && onDecrypt(nft.tokenId)
              }}
              className="nft-card-decrypt-btn"
            >
              <svg className="w-5 h-5 nft-card-decrypt-icon" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 11V7a4 4 0 118 0m-4 8v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2z" />
              </svg>
              <span className="text-base">Decrypt to View</span>
            </button>
          )}

          {/* 查看详情按钮（已解密时显示） */}
          {!isEncrypted && (
            <button className="nft-card-view-btn">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span className="text-base">View Details</span>
            </button>
          )}
        </div>

        {/* Hover 光效扫描 */}
        <div className="nft-card-shimmer">
          <div 
            className="nft-card-shimmer-bg"
            style={{
              background: `linear-gradient(135deg, transparent 0%, ${config.color}40 50%, transparent 100%)`
            }}
          ></div>
        </div>
      </div>

      {/* 3D 阴影效果 */}
      <div 
        className="nft-card-shadow"
        style={{
          background: `linear-gradient(135deg, ${config.color}40, transparent)`
        }}
      ></div>
    </div>
  )
}

export default NFTCard

