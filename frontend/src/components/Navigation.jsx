import React from 'react'

const Navigation = ({ currentPage, onPageChange }) => {
  const navItems = [
    { id: 'dashboard', label: '📊 仪表盘', icon: '📊' },
    { id: 'mint', label: '🎨 Mint NFT', icon: '🎨' },
    { id: 'mynfts', label: '🖼️ 我的 NFT', icon: '🖼️' }
  ]

  return (
    <nav className="navigation-modern">
      <div className="navigation-container">
        {/* Logo 区域 */}
        <div className="navigation-logo">
          <div className="logo-icon">🔐</div>
          <div className="logo-text">
            <h1 className="logo-title">Blind NFT</h1>
            <p className="logo-subtitle">Privacy First</p>
          </div>
        </div>

        {/* 导航链接 */}
        <div className="navigation-links">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`nav-link ${currentPage === item.id ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.icon}</span>
              <span className="nav-label">{item.label}</span>
              {currentPage === item.id && (
                <div className="nav-indicator"></div>
              )}
            </button>
          ))}
        </div>

        {/* 装饰元素 */}
        <div className="navigation-decoration">
          <div className="decoration-dot"></div>
          <div className="decoration-dot"></div>
          <div className="decoration-dot"></div>
        </div>
      </div>

      {/* 发光效果 */}
      <div className="navigation-glow"></div>
    </nav>
  )
}

export default Navigation

