import React from 'react'

const DashboardPage = ({ account, userNFTs, contractStats, onNavigate }) => {
  // 计算统计数据
  const totalNFTs = userNFTs.length
  const decryptedNFTs = userNFTs.filter(nft => nft.isLocallyDecrypted || nft.revealed).length
  const publicNFTs = userNFTs.filter(nft => nft.revealed).length
  const encryptedNFTs = userNFTs.filter(nft => !nft.isLocallyDecrypted && !nft.revealed).length

  // 稀有度统计
  const rarityStats = {
    common: userNFTs.filter(nft => nft.rarity === 0).length,
    uncommon: userNFTs.filter(nft => nft.rarity === 1).length,
    rare: userNFTs.filter(nft => nft.rarity === 2).length,
    epic: userNFTs.filter(nft => nft.rarity === 3).length,
    legendary: userNFTs.filter(nft => nft.rarity === 4).length
  }

  // 平均属性值
  const avgPower = userNFTs.length > 0 
    ? Math.round(userNFTs.reduce((sum, nft) => sum + nft.power, 0) / userNFTs.length) 
    : 0
  const avgSpeed = userNFTs.length > 0 
    ? Math.round(userNFTs.reduce((sum, nft) => sum + nft.speed, 0) / userNFTs.length) 
    : 0

  return (
    <div className="dashboard-page">
      {/* 欢迎横幅 */}
      <div className="dashboard-welcome">
        <div className="welcome-content">
          <h2 className="welcome-greeting">👋 欢迎回来!</h2>
          <p className="welcome-address">
            {account ? `${account.slice(0, 6)}...${account.slice(-4)}` : '未连接'}
          </p>
        </div>
        <div className="welcome-decoration">
          <div className="decoration-circle"></div>
          <div className="decoration-circle"></div>
        </div>
      </div>

      {/* 统计卡片网格 */}
      <div className="stats-grid">
        {/* NFT 总数 */}
        <div className="stat-card primary">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🎴</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">NFT 总数</p>
            <h3 className="stat-value">{totalNFTs}</h3>
            <p className="stat-change positive">+{contractStats?.totalSupply || 0} 全网</p>
          </div>
          <div className="stat-glow primary"></div>
        </div>

        {/* 已解密 */}
        <div className="stat-card success">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🔓</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">已解密</p>
            <h3 className="stat-value">{decryptedNFTs}</h3>
            <p className="stat-change">
              {totalNFTs > 0 ? `${Math.round((decryptedNFTs / totalNFTs) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="stat-glow success"></div>
        </div>

        {/* 公开中 */}
        <div className="stat-card info">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🌐</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">公开中</p>
            <h3 className="stat-value">{publicNFTs}</h3>
            <p className="stat-change">
              {totalNFTs > 0 ? `${Math.round((publicNFTs / totalNFTs) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="stat-glow info"></div>
        </div>

        {/* 加密中 */}
        <div className="stat-card warning">
          <div className="stat-icon-wrapper">
            <span className="stat-icon">🔒</span>
          </div>
          <div className="stat-content">
            <p className="stat-label">加密中</p>
            <h3 className="stat-value">{encryptedNFTs}</h3>
            <p className="stat-change">
              {totalNFTs > 0 ? `${Math.round((encryptedNFTs / totalNFTs) * 100)}%` : '0%'}
            </p>
          </div>
          <div className="stat-glow warning"></div>
        </div>
      </div>

      {/* 详细统计 */}
      <div className="dashboard-details">
        {/* 稀有度分布 */}
        <div className="detail-card">
          <div className="detail-header">
            <h3 className="detail-title">
              <span>💎</span>
              <span>稀有度分布</span>
            </h3>
          </div>
          <div className="detail-content">
            <div className="rarity-list">
              <div className="rarity-item">
                <div className="rarity-info">
                  <div className="rarity-badge common">普通</div>
                  <span className="rarity-count">{rarityStats.common}</span>
                </div>
                <div className="rarity-bar">
                  <div 
                    className="rarity-fill common" 
                    style={{ width: totalNFTs > 0 ? `${(rarityStats.common / totalNFTs) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="rarity-item">
                <div className="rarity-info">
                  <div className="rarity-badge uncommon">罕见</div>
                  <span className="rarity-count">{rarityStats.uncommon}</span>
                </div>
                <div className="rarity-bar">
                  <div 
                    className="rarity-fill uncommon" 
                    style={{ width: totalNFTs > 0 ? `${(rarityStats.uncommon / totalNFTs) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="rarity-item">
                <div className="rarity-info">
                  <div className="rarity-badge rare">稀有</div>
                  <span className="rarity-count">{rarityStats.rare}</span>
                </div>
                <div className="rarity-bar">
                  <div 
                    className="rarity-fill rare" 
                    style={{ width: totalNFTs > 0 ? `${(rarityStats.rare / totalNFTs) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="rarity-item">
                <div className="rarity-info">
                  <div className="rarity-badge epic">史诗</div>
                  <span className="rarity-count">{rarityStats.epic}</span>
                </div>
                <div className="rarity-bar">
                  <div 
                    className="rarity-fill epic" 
                    style={{ width: totalNFTs > 0 ? `${(rarityStats.epic / totalNFTs) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>

              <div className="rarity-item">
                <div className="rarity-info">
                  <div className="rarity-badge legendary">传说</div>
                  <span className="rarity-count">{rarityStats.legendary}</span>
                </div>
                <div className="rarity-bar">
                  <div 
                    className="rarity-fill legendary" 
                    style={{ width: totalNFTs > 0 ? `${(rarityStats.legendary / totalNFTs) * 100}%` : '0%' }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 平均属性 */}
        <div className="detail-card">
          <div className="detail-header">
            <h3 className="detail-title">
              <span>⚡</span>
              <span>平均属性值</span>
            </h3>
          </div>
          <div className="detail-content">
            <div className="attribute-stats">
              {/* 力量 */}
              <div className="attribute-stat-item">
                <div className="attribute-stat-header">
                  <span className="attribute-stat-label">💪 力量</span>
                  <span className="attribute-stat-value power">{avgPower}</span>
                </div>
                <div className="attribute-stat-bar">
                  <div 
                    className="attribute-stat-fill power" 
                    style={{ width: `${(avgPower / 100) * 100}%` }}
                  ></div>
                </div>
                <p className="attribute-stat-desc">平均力量值 / 100</p>
              </div>

              {/* 速度 */}
              <div className="attribute-stat-item">
                <div className="attribute-stat-header">
                  <span className="attribute-stat-label">⚡ 速度</span>
                  <span className="attribute-stat-value speed">{avgSpeed}</span>
                </div>
                <div className="attribute-stat-bar">
                  <div 
                    className="attribute-stat-fill speed" 
                    style={{ width: `${(avgSpeed / 100) * 100}%` }}
                  ></div>
                </div>
                <p className="attribute-stat-desc">平均速度值 / 100</p>
              </div>
            </div>
          </div>
        </div>

        {/* 快速操作 */}
        <div className="detail-card actions">
          <div className="detail-header">
            <h3 className="detail-title">
              <span>🚀</span>
              <span>快速操作</span>
            </h3>
          </div>
          <div className="detail-content">
            <div className="quick-actions">
              <button 
                className="quick-action-btn mint"
                onClick={() => onNavigate && onNavigate('mint')}
              >
                <span className="quick-action-icon">🎨</span>
                <div className="quick-action-text">
                  <h4>铸造新 NFT</h4>
                  <p>创建你的隐私 NFT</p>
                </div>
              </button>

              <button className="quick-action-btn decrypt">
                <span className="quick-action-icon">🔓</span>
                <div className="quick-action-text">
                  <h4>批量解密</h4>
                  <p>解密所有加密 NFT</p>
                </div>
              </button>

              <button className="quick-action-btn share">
                <span className="quick-action-icon">📤</span>
                <div className="quick-action-text">
                  <h4>分享收藏</h4>
                  <p>展示你的 NFT</p>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 最近活动 */}
      {totalNFTs > 0 && (
        <div className="dashboard-recent">
          <div className="recent-header">
            <h3 className="recent-title">
              <span>📋</span>
              <span>最近收藏</span>
            </h3>
          </div>
          <div className="recent-list">
            {userNFTs.slice(0, 3).map((nft) => (
              <div key={nft.tokenId} className="recent-item">
                <div className="recent-image">
                  {nft.imageUrl ? (
                    <img src={nft.imageUrl} alt={`NFT #${nft.tokenId}`} />
                  ) : (
                    <div className="recent-placeholder">🎨</div>
                  )}
                </div>
                <div className="recent-info">
                  <h4 className="recent-name">NFT #{nft.tokenId}</h4>
                  <p className="recent-status">
                    {nft.revealed ? '🌐 公开' : (nft.isLocallyDecrypted ? '🔓 已解密' : '🔒 加密中')}
                  </p>
                </div>
                <div className="recent-action">
                  <button 
                    className="recent-view-btn"
                    onClick={() => onNavigate('mynfts')}
                  >
                    查看
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default DashboardPage

