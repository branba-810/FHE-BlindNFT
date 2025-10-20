import { useState, useRef } from 'react'
import { uploadToIPFSAuto } from '../utils/ipfs'

function ImageUpload({ onUploadComplete, isUploading, setIsUploading }) {
  const [preview, setPreview] = useState(null)
  const [nftName, setNftName] = useState('')
  const [description, setDescription] = useState('')
  const [dragActive, setDragActive] = useState(false)
  const fileInputRef = useRef(null)

  const handleFileChange = async (file) => {
    if (!file) return

    // 检查文件类型
    if (!file.type.startsWith('image/')) {
      alert('请上传图片文件！')
      return
    }

    // 检查文件大小（限制为 10MB）
    if (file.size > 10 * 1024 * 1024) {
      alert('图片大小不能超过 10MB！')
      return
    }

    // 预览图片
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreview(e.target.result)
    }
    reader.readAsDataURL(file)
  }

  const handleUpload = async () => {
    const file = fileInputRef.current?.files[0]
    if (!file) {
      alert('请先选择图片！')
      return
    }

    if (!nftName.trim()) {
      alert('请输入 NFT 名称！')
      return
    }

    try {
      setIsUploading(true)
      
      // 上传到 IPFS（使用 Pinata，失败则使用本地方案）
      const result = await uploadToIPFSAuto(
        file,
        nftName,
        description || `神秘的盲盒 NFT - ${nftName}`
      )

      // 回调父组件
      onUploadComplete(result)

      // 重置表单但保留图片预览
      setNftName('')
      setDescription('')
      // 不重置 preview 和 fileInputRef，保持图片显示
    } catch (error) {
      console.error('上传失败:', error)
      alert(`上传失败: ${error.message}`)
    } finally {
      setIsUploading(false)
    }
  }

  const handleDrag = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0])
      // 更新 input
      if (fileInputRef.current) {
        const dataTransfer = new DataTransfer()
        dataTransfer.items.add(e.dataTransfer.files[0])
        fileInputRef.current.files = dataTransfer.files
      }
    }
  }

  return (
    <div className="upload-modern-container">
      {/* 拖拽上传区域 */}
      <div
        className={`upload-modern-zone ${dragActive ? 'drag-active' : ''} ${preview ? 'has-preview' : ''}`}
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={(e) => handleFileChange(e.target.files[0])}
          style={{ display: 'none' }}
        />
        
        {preview ? (
          <div className="upload-preview-wrapper">
            <img src={preview} alt="预览" className="upload-preview-img" />
            <div className="upload-preview-overlay">
              <div className="upload-preview-badge">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-white font-semibold ml-2">点击或拖拽更换图片</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="upload-placeholder-modern">
            <div className="upload-icon-wrapper">
              <svg className="w-10 h-10 text-purple-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            </div>
            <p className="upload-main-text">
              {dragActive ? '松开鼠标上传' : '点击或拖拽图片到此处'}
            </p>
            <p className="upload-sub-text">支持 JPG, PNG, GIF 格式</p>
            <div className="upload-info-tag">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
              </svg>
              <span className="ml-1">最大文件大小: 10MB</span>
            </div>
          </div>
        )}
      </div>

      {/* NFT 信息表单 */}
      {preview && (
        <div className="upload-form-modern">
          <div className="upload-input-wrapper">
            <label className="upload-label">
              <span>📝</span>
              <span>NFT 名称</span>
              <span className="upload-required">*</span>
            </label>
            <input
              type="text"
              placeholder="例如: 神秘宝箱 #001"
              value={nftName}
              onChange={(e) => setNftName(e.target.value)}
              maxLength={50}
              className="upload-input-modern"
            />
            <div className="upload-input-footer">
              <span className="upload-hint-text">为你的 NFT 起一个独特的名字</span>
              <span className="upload-char-count">{nftName.length}/50</span>
            </div>
          </div>

          <div className="upload-input-wrapper">
            <label className="upload-label">
              <span>✍️</span>
              <span>描述（可选）</span>
            </label>
            <textarea
              placeholder="描述你的 NFT 的故事和特点..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              maxLength={200}
              rows={4}
              className="upload-textarea-modern"
            />
            <div className="upload-input-footer">
              <span className="upload-hint-text">添加更多细节让你的 NFT 更有价值</span>
              <span className="upload-char-count">{description.length}/200</span>
            </div>
          </div>

          <button
            className="upload-submit-btn"
            onClick={handleUpload}
            disabled={isUploading || !nftName.trim()}
          >
            <div className="upload-btn-shimmer"></div>
            <div className="upload-btn-content">
              {isUploading ? (
                <>
                  <div className="upload-spinner"></div>
                  <span>上传到 IPFS 中...</span>
                </>
              ) : (
                <>
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <span>上传并准备铸造</span>
                </>
              )}
            </div>
          </button>
        </div>
      )}
    </div>
  )
}

export default ImageUpload

