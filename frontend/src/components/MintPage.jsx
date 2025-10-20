import React, { useState } from 'react'
import ImageUpload from './ImageUpload'

const MintPage = ({ 
  onMint, 
  isMinting, 
  isMintConfirming,
  onUploadComplete
}) => {
  const [currentPreview, setCurrentPreview] = useState(null)
  const [isUploading, setIsUploading] = useState(false)

  // 处理上传完成 - 从父组件传来的回调也会被调用
  const handleUploadComplete = (result) => {
    console.log('[MintPage] 收到上传结果:', result)
    setCurrentPreview({
      url: result.imageUrl,
      ipfsUrl: result.metadataUrl,
      name: result.metadata?.name || 'Untitled NFT',
      description: result.metadata?.description || ''
    })
    // 通知父组件
    if (onUploadComplete) {
      onUploadComplete(result)
    }
  }

  // 处理铸造 - 调用父组件的 handleMint
  const handleMintClick = async () => {
    // 父组件的 handleMint 会自动使用 tokenURI state
    await onMint()
  }

  // 是否可以铸造 - 只有上传了图片才能铸造
  const canMint = currentPreview !== null

  return (
    <div className="mint-page">
      <div className="mint-section-modern">
        <div className="mint-card-modern">
          {/* 背景装饰 */}
          <div className="mint-bg-decoration left"></div>
          <div className="mint-bg-decoration right"></div>

          {/* 顶部标题 */}
          <div className="mint-header-modern">
            <div className="mint-title-wrapper">
              <div className="mint-icon-badge">
                <span>🎨</span>
              </div>
              <div>
                <h2 className="mint-title">铸造 NFT</h2>
                <p className="mint-subtitle">创建你的加密隐私 NFT</p>
              </div>
            </div>

            <div className="mint-status-badge">
              <div className="mint-status-dot"></div>
              <span>FHE 加密就绪</span>
            </div>
          </div>

          {/* 模式切换 - 已移除手动输入 URI 模式 */}

          {/* 内容区域 */}
          <div className="mint-content-wrapper">
            {/* 上传模式布局 */}
            <div className="mint-upload-layout">
              {/* 左侧：上传组件 */}
              <div className="mint-upload-section">
                <ImageUpload 
                  onUploadComplete={handleUploadComplete}
                  isUploading={isUploading}
                  setIsUploading={setIsUploading}
                />
              </div>

              {/* 右侧：实时预览 */}
              <div className="mint-preview-section">
                  {currentPreview ? (
                    <div className="mint-preview-card">
                      <div className="mint-preview-header">
                        <span>👁️</span>
                        <h3>铸造预览</h3>
                      </div>

                      <div className="mint-preview-content">
                        {/* 图片预览 */}
                        <div className="mint-preview-image-wrapper">
                          <div className="mint-preview-glow"></div>
                          <div className="mint-preview-image-container">
                            <img 
                              src={currentPreview.url} 
                              alt="Preview" 
                              className="mint-preview-img"
                            />
                            {/* 加密覆盖层 */}
                            <div className="mint-preview-encrypted">
                              <div className="mint-preview-lock">
                                <span>🔒</span>
                              </div>
                              <h4 className="mint-preview-lock-title">链上加密</h4>
                              <p className="mint-preview-lock-text">图片将使用 FHE 加密存储</p>
                            </div>
                          </div>
                        </div>

                        {/* 元数据信息 */}
                        <div className="mint-metadata-info">
                          <h4 className="mint-metadata-title">
                            <span>ℹ️</span>
                            <span>元数据</span>
                          </h4>
                          <div className="mint-metadata-list">
                            <div className="mint-metadata-item">
                              <span className="mint-metadata-label">
                                <span>📝</span>
                                <span>名称</span>
                              </span>
                              <span className="mint-metadata-value">{currentPreview.name}</span>
                            </div>
                            {currentPreview.description && (
                              <div className="mint-metadata-item">
                                <span className="mint-metadata-label">
                                  <span>📄</span>
                                  <span>描述</span>
                                </span>
                                <span className="mint-metadata-value">{currentPreview.description}</span>
                              </div>
                            )}
                            <div className="mint-metadata-item">
                              <span className="mint-metadata-label">
                                <span>🔗</span>
                                <span>IPFS</span>
                              </span>
                              <span className="mint-metadata-value">
                                {currentPreview.ipfsUrl.slice(0, 15)}...
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Gas 费用估计 */}
                        <div className="mint-gas-estimate">
                          <div className="mint-gas-content">
                            <span className="mint-gas-label">
                              <span>⛽</span>
                              <span>预估 Gas</span>
                            </span>
                            <span className="mint-gas-value">~0.002 ETH</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mint-preview-card">
                      <div className="mint-preview-empty">
                        <div className="mint-preview-empty-icon">
                          <span>🎨</span>
                        </div>
                        <p className="mint-preview-empty-text">上传图片后将显示预览</p>
                        <p className="mint-preview-empty-sub">支持 JPG、PNG、GIF 格式</p>
                      </div>
                    </div>
                  )}
              </div>
            </div>

            {/* 铸造按钮 */}
            <button
              onClick={handleMintClick}
              disabled={!canMint || isMinting || isMintConfirming || isUploading}
              className="mint-submit-btn"
            >
              <div className="mint-btn-shimmer"></div>
              <div className="mint-btn-content">
                {isMinting || isMintConfirming ? (
                  <>
                    <div className="mint-btn-spinner"></div>
                    <span>{isMinting ? '铸造中...' : '确认中...'}</span>
                  </>
                ) : (
                  <>
                    <span>🚀</span>
                    <span>Mint Now</span>
                  </>
                )}
              </div>
            </button>

            {/* 提示信息 */}
            <div className="mint-info-box">
              <span className="mint-info-icon">ℹ️</span>
              <div className="mint-info-text">
                <p>💡 你的 NFT 将使用 FHE 完全同态加密技术在链上加密存储</p>
                <p>🔒 只有你能解密和查看属性，保护隐私安全</p>
                <p>🌐 你可以随时选择公开 NFT，让所有人可见</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default MintPage

