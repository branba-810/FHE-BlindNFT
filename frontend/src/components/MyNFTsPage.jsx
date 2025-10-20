import React, { useState } from 'react'
import NFTCard from './NFTCard'
import NFTDetailModal from './NFTDetailModal'

const MyNFTsPage = ({ 
  userNFTs, 
  onDecrypt,
  onReveal,
  isDecrypting,
  isRevealing,
  isRevealConfirming,
  onRefresh,
  ipfsToHttp,
  formatRarity,
  getRarityGlow
}) => {
  const [selectedNFT, setSelectedNFT] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [activeFilter, setActiveFilter] = useState('all') // all, decrypted, public, encrypted

  // 筛选 NFT
  const filteredNFTs = userNFTs.filter(nft => {
    if (activeFilter === 'all') return true
    if (activeFilter === 'decrypted') return nft.isLocallyDecrypted || nft.revealed
    if (activeFilter === 'public') return nft.revealed
    if (activeFilter === 'encrypted') return !nft.isLocallyDecrypted && !nft.revealed
    return true
  })

  // 统计数据
  const totalNFTs = userNFTs.length
  const decryptedNFTs = userNFTs.filter(nft => nft.isLocallyDecrypted || nft.revealed).length
  const publicNFTs = userNFTs.filter(nft => nft.revealed).length
  const encryptedNFTs = userNFTs.filter(nft => !nft.isLocallyDecrypted && !nft.revealed).length

  // 打开详情
  const openNFTDetail = (nft) => {
    setSelectedNFT(nft)
    setIsModalOpen(true)
  }

  // 关闭详情
  const closeNFTDetail = () => {
    setIsModalOpen(false)
    setTimeout(() => setSelectedNFT(null), 300)
  }

  // 处理解密
  const handleDecrypt = async (tokenId) => {
    await onDecrypt(tokenId)
    // 刷新 NFT 列表
    if (onRefresh) {
      await onRefresh()
    }
  }

  // 处理公开
  const handleReveal = async (tokenId) => {
    await onReveal(tokenId)
    // 刷新 NFT 列表
    if (onRefresh) {
      await onRefresh()
    }
  }

  return (
    <div className="mynfts-page">
      <div className="mynfts-section-modern">
        <div className="mynfts-bg-decoration"></div>
        
        <div className="mynfts-card-modern">
          {/* 顶部标题区域 */}
          <div className="mynfts-header-modern">
            <div className="mynfts-title-section">
              <div className="mynfts-icon-badge">
                <span>🖼️</span>
              </div>
              <div>
                <h2 className="mynfts-title">My NFT Collection</h2>
                <p className="mynfts-subtitle">你的隐私 NFT 收藏，完全由你掌控</p>
              </div>
            </div>

            <div className="mynfts-actions">
              {/* 统计信息 */}
              <div className="mynfts-stats">
                <div className="mynfts-stat-item">
                  <div className="mynfts-stat-value">{totalNFTs}</div>
                  <div className="mynfts-stat-label">总数</div>
                </div>
                <div className="mynfts-stat-divider"></div>
                <div className="mynfts-stat-item">
                  <div className="mynfts-stat-value purple">
                    {decryptedNFTs}
                  </div>
                  <div className="mynfts-stat-label">已解密</div>
                </div>
              </div>

              <button onClick={onRefresh} className="mynfts-refresh-btn">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                <span>刷新</span>
              </button>
            </div>
          </div>

          <div className="mynfts-content">
            {totalNFTs > 0 ? (
              <>
                {/* 筛选和排序 */}
                <div className="mynfts-filters">
                  <button 
                    onClick={() => setActiveFilter('all')}
                    className={`mynfts-filter-btn ${activeFilter === 'all' ? 'active' : ''}`}
                  >
                    全部 ({totalNFTs})
                  </button>
                  <button 
                    onClick={() => setActiveFilter('decrypted')}
                    className={`mynfts-filter-btn ${activeFilter === 'decrypted' ? 'active' : ''}`}
                  >
                    已解密 ({decryptedNFTs})
                  </button>
                  <button 
                    onClick={() => setActiveFilter('public')}
                    className={`mynfts-filter-btn ${activeFilter === 'public' ? 'active' : ''}`}
                  >
                    已公开 ({publicNFTs})
                  </button>
                  <button 
                    onClick={() => setActiveFilter('encrypted')}
                    className={`mynfts-filter-btn ${activeFilter === 'encrypted' ? 'active' : ''}`}
                  >
                    加密中 ({encryptedNFTs})
                  </button>
                </div>

                {/* NFT 网格 */}
                {filteredNFTs.length > 0 ? (
                  <div className="mynfts-grid">
                    {filteredNFTs.map((nft) => (
                      <NFTCard
                        key={nft.tokenId}
                        nft={nft}
                        onDecrypt={handleDecrypt}
                        onCardClick={openNFTDetail}
                        ipfsToHttp={ipfsToHttp}
                        formatRarity={formatRarity}
                        getRarityGlow={getRarityGlow}
                      />
                    ))}
                  </div>
                ) : (
                  <div className="mynfts-empty">
                    <div className="mynfts-empty-icon">
                      <span>🔍</span>
                    </div>
                    <h3 className="mynfts-empty-title">没有找到 NFT</h3>
                    <p className="mynfts-empty-text">试试其他筛选条件</p>
                  </div>
                )}
              </>
            ) : (
              <div className="mynfts-empty">
                <div className="mynfts-empty-icon">
                  <span>📦</span>
                </div>
                <h3 className="mynfts-empty-title">还没有 NFT</h3>
                <p className="mynfts-empty-text">前往铸造页面创建你的第一个隐私 NFT</p>
                <button 
                  onClick={() => window.scrollTo(0, 0)}
                  className="mynfts-empty-btn"
                >
                  <span>🎨</span>
                  <span>立即铸造</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* NFT 详情模态框 */}
      <NFTDetailModal
        nft={selectedNFT}
        isOpen={isModalOpen}
        onClose={closeNFTDetail}
        onReveal={handleReveal}
        isRevealing={isRevealing || isRevealConfirming}
        onDecrypt={handleDecrypt}
        isDecrypting={isDecrypting}
        getRarityGlow={getRarityGlow}
        formatRarity={formatRarity}
        ipfsToHttp={ipfsToHttp}
      />
    </div>
  )
}

export default MyNFTsPage

