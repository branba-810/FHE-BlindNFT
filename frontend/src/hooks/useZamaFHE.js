/**
 * React Hook for Zama FHE SDK
 * 在组件中轻松使用 FHE 功能
 */

import { useState, useEffect, useCallback } from 'react';
import { useAccount } from 'wagmi';
import { 
  initializeZamaFHE, 
  getFHEInstance, 
  resetFHEInstance, 
  debugSDKStatus,
  userDecrypt,
  userDecryptBatch 
} from '../utils/zamaRelayer';

export const useZamaFHE = () => {
  const [fheInstance, setFheInstance] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const { address, isConnected } = useAccount();

  /**
   * 初始化 FHE 实例
   */
  const initialize = useCallback(async () => {
    if (!isConnected || !window.ethereum) {
      setError('Please connect your wallet first');
      return null;
    }

    setIsLoading(true);
    setError(null);

    try {
      // 调试：输出 SDK 状态
      console.log('🔍 开始初始化 FHE，先检查 SDK 状态...');
      debugSDKStatus();
      
      const instance = await initializeZamaFHE(window.ethereum);
      setFheInstance(instance);
      return instance;
    } catch (err) {
      const errorMsg = err.message || 'Failed to initialize FHE';
      setError(errorMsg);
      console.error('❌ FHE initialization error:', err);
      
      // 输出调试信息
      console.log('🔍 初始化失败，再次检查 SDK 状态...');
      debugSDKStatus();
      
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [isConnected]);

  /**
   * 重置实例
   */
  const reset = useCallback(() => {
    resetFHEInstance();
    setFheInstance(null);
    setError(null);
  }, []);

  /**
   * 当钱包连接状态变化时，自动初始化或重置
   */
  useEffect(() => {
    if (isConnected && !fheInstance && !isLoading) {
      // 钱包已连接但没有 FHE 实例，自动初始化
      initialize();
    } else if (!isConnected && fheInstance) {
      // 钱包断开连接，重置实例
      reset();
    }
  }, [isConnected, address, fheInstance, isLoading, initialize, reset]);

  /**
   * 确保有可用的实例
   */
  const ensureInstance = useCallback(async () => {
    const existing = getFHEInstance();
    if (existing) {
      setFheInstance(existing);
      return existing;
    }
    return await initialize();
  }, [initialize]);

  /**
   * 解密单个密文句柄
   */
  const decrypt = useCallback(async (ciphertextHandle, contractAddress, signer) => {
    const instance = await ensureInstance();
    if (!instance) {
      throw new Error('FHE instance not available');
    }
    return await userDecrypt(ciphertextHandle, contractAddress, signer);
  }, [ensureInstance]);

  /**
   * 批量解密多个密文句柄
   */
  const decryptBatch = useCallback(async (handleContractPairs, signer) => {
    const instance = await ensureInstance();
    if (!instance) {
      throw new Error('FHE instance not available');
    }
    return await userDecryptBatch(handleContractPairs, signer);
  }, [ensureInstance]);

  return {
    fheInstance,
    isLoading,
    error,
    initialize,
    reset,
    ensureInstance,
    decrypt,
    decryptBatch,
    isReady: !!fheInstance && !isLoading && !error
  };
};

export default useZamaFHE;

