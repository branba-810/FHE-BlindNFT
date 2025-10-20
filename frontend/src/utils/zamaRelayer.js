/**
 * Zama Relayer SDK 集成模块
 * 用于 FHE（全同态加密）操作
 */

let fheInstance = null;
let isInitialized = false;
let sdkModule = null;

/**
 * 获取 Zama SDK 全局对象
 * @returns {object|null} SDK 模块对象
 */
const getSDK = () => {
  if (sdkModule) return sdkModule;

  // 尝试不同的可能的全局变量名
  const possibleNames = [
    'zamaRelayerSDK',    // 官方 CDN 使用的名称
    'relayerSDK',        // 可能的替代名称
    'ZamaRelayerSDK',    // 大写版本
    'RelayerSDK',        // 大写版本
    'initSDK'            // 直接挂载的情况
  ];
  
  for (const name of possibleNames) {
    if (window[name]) {
      console.log(`✅ 找到 SDK: window.${name}`);
      // 如果是 initSDK 直接挂载，包装成对象
      if (name === 'initSDK') {
        sdkModule = {
          initSDK: window.initSDK,
          createInstance: window.createInstance,
          SepoliaConfig: window.SepoliaConfig
        };
      } else {
        sdkModule = window[name];
      }
      return sdkModule;
    }
  }
  
  console.error('❌ 未找到 SDK 全局对象，可用的全局对象：', 
    Object.keys(window).filter(k => k.toLowerCase().includes('sdk') || k.toLowerCase().includes('zama')));
  return null;
};

/**
 * 初始化 Zama FHE SDK
 * @returns {Promise<void>}
 */
export const initZamaSDK = async () => {
  if (isInitialized) {
    console.log('Zama SDK already initialized');
    return;
  }

  try {
    // 获取 SDK 模块
    const sdk = getSDK();
    
    if (!sdk || typeof sdk.initSDK !== 'function') {
      throw new Error('Zama Relayer SDK not loaded. Please check if the script is included in index.html');
    }

    console.log('🔐 正在初始化 Zama SDK...');
    await sdk.initSDK(); // 加载所需的 WASM
    isInitialized = true;
    console.log('✅ Zama SDK initialized successfully');
  } catch (error) {
    console.error('❌ Failed to initialize Zama SDK:', error);
    throw error;
  }
};

/**
 * 创建 FHE 实例
 * @param {object} provider - Web3 provider (通常是 window.ethereum)
 * @returns {Promise<object>} FHE 实例
 */
export const createFHEInstance = async (provider = null) => {
  try {
    // 确保 SDK 已初始化
    if (!isInitialized) {
      await initZamaSDK();
    }

    // 获取 SDK 模块
    const sdk = getSDK();
    
    if (!sdk || typeof sdk.createInstance !== 'function') {
      throw new Error('Zama SDK functions not available');
    }

    // 使用提供的 provider 或默认使用 window.ethereum
    const ethProvider = provider || window.ethereum;
    
    if (!ethProvider) {
      throw new Error('No Ethereum provider found. Please install MetaMask.');
    }

    console.log('🔧 Creating FHE instance...');
    
    // 配置 Sepolia 测试网
    const config = {
      ...(sdk.SepoliaConfig || {}),
      network: ethProvider
    };

    // 创建实例
    const instance = await sdk.createInstance(config);
    fheInstance = instance;
    
    console.log('✅ FHE instance created successfully');
    return instance;
  } catch (error) {
    console.error('❌ Failed to create FHE instance:', error);
    throw error;
  }
};

/**
 * 获取当前的 FHE 实例
 * @returns {object|null} FHE 实例或 null
 */
export const getFHEInstance = () => {
  return fheInstance;
};

/**
 * 检查 SDK 是否已初始化
 * @returns {boolean}
 */
export const isSDKInitialized = () => {
  return isInitialized;
};

/**
 * 完整的初始化流程（初始化 SDK + 创建实例）
 * @param {object} provider - Web3 provider
 * @returns {Promise<object>} FHE 实例
 */
export const initializeZamaFHE = async (provider = null) => {
  try {
    // 如果已有实例，直接返回
    if (fheInstance) {
      console.log('Using existing FHE instance');
      return fheInstance;
    }

    // 初始化 SDK
    await initZamaSDK();
    
    // 创建实例
    const instance = await createFHEInstance(provider);
    
    return instance;
  } catch (error) {
    console.error('Failed to initialize Zama FHE:', error);
    throw error;
  }
};

/**
 * 重置 FHE 实例（用于切换账户或网络时）
 */
export const resetFHEInstance = () => {
  fheInstance = null;
  sdkModule = null;
  console.log('FHE instance reset');
};

/**
 * 用户解密加密数据
 * 根据 Zama 官方文档实现：https://docs.zama.ai/protocol/relayer-sdk-guides/fhevm-relayer/decryption/user-decryption
 * 
 * @param {string} ciphertextHandle - 密文句柄（从合约返回的 euint64）
 * @param {string} contractAddress - 合约地址
 * @param {object} signer - ethers.js Signer 对象
 * @returns {Promise<bigint>} 解密后的值
 */
export const userDecrypt = async (ciphertextHandle, contractAddress, signer) => {
  try {
    if (!fheInstance) {
      throw new Error('FHE instance not initialized. Call initializeZamaFHE() first.');
    }

    console.log('🔓 [UserDecrypt] 开始用户解密流程');
    console.log('  -> handle:', ciphertextHandle);
    console.log('  -> contract:', contractAddress);
    console.log('  -> signer.address:', signer?.address);

    // Step 1: 生成密钥对
    const keypair = fheInstance.generateKeypair();
    console.log('  ✅ [UserDecrypt] 已生成临时密钥对 (pubKey 前16字节):',
      typeof keypair?.publicKey === 'string' ? keypair.publicKey.slice(0, 32) + '...' : typeof keypair?.publicKey
    );

    // Step 2: 准备解密请求数据
    const handleContractPairs = [
      {
        handle: ciphertextHandle,
        contractAddress: contractAddress,
      },
    ];

    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10'; // 签名有效期 10 天
    const contractAddresses = [contractAddress];

    // Step 3: 创建 EIP712 签名消息
    const eip712 = fheInstance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays,
    );

    console.log('  ✅ [UserDecrypt] 已创建 EIP712 消息');
    console.log('     domain.name:', eip712?.domain?.name, 'domain.chainId:', eip712?.domain?.chainId);
    console.log('     message.contracts:', contractAddresses);
    console.log('     message.validFrom:', startTimeStamp, 'message.validDurationDays:', durationDays);

    // Step 4: 签名
    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message,
    );

    console.log('  ✅ [UserDecrypt] 已获得用户签名 (前12字节):', signature?.slice(0, 26) + '...');

    // Step 5: 通过 Relayer 解密
    const result = await fheInstance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''),
      contractAddresses,
      signer.address,
      startTimeStamp,
      durationDays,
    );

    // Step 6: 提取解密值
    const decryptedValue = result[ciphertextHandle];
    console.log('  ✅ [UserDecrypt] 解密成功 ->', decryptedValue);

    return BigInt(decryptedValue);
  } catch (error) {
    console.error('❌ [UserDecrypt] 用户解密失败:', error);
    throw error;
  }
};

/**
 * 批量解密多个密文
 * @param {Array<{handle: string, contractAddress: string}>} handleContractPairs - 密文句柄和合约地址对数组
 * @param {object} signer - ethers.js Signer 对象
 * @returns {Promise<Object>} 解密结果对象 {handle: decryptedValue}
 */
export const userDecryptBatch = async (handleContractPairs, signer) => {
  try {
    if (!fheInstance) {
      throw new Error('FHE instance not initialized. Call initializeZamaFHE() first.');
    }

    console.log('🔓 [UserDecryptBatch] 开始批量解密');
    console.log('  -> items:', handleContractPairs.length);
    console.log('  -> pairs sample[0]:', handleContractPairs?.[0]);
    console.log('  -> signer.address:', signer?.address);

    // 生成密钥对
    const keypair = fheInstance.generateKeypair();
    
    // 提取所有合约地址（去重）
    const contractAddresses = [...new Set(handleContractPairs.map(p => p.contractAddress))];
    
    const startTimeStamp = Math.floor(Date.now() / 1000).toString();
    const durationDays = '10';

    // 创建 EIP712 签名
    const eip712 = fheInstance.createEIP712(
      keypair.publicKey,
      contractAddresses,
      startTimeStamp,
      durationDays,
    );

    // 签名
    const signature = await signer.signTypedData(
      eip712.domain,
      {
        UserDecryptRequestVerification: eip712.types.UserDecryptRequestVerification,
      },
      eip712.message,
    );
    console.log('  ✅ [UserDecryptBatch] 已获得签名 (前12字节):', signature?.slice(0, 26) + '...');

    // 批量解密
    const result = await fheInstance.userDecrypt(
      handleContractPairs,
      keypair.privateKey,
      keypair.publicKey,
      signature.replace('0x', ''),
      contractAddresses,
      signer.address,
      startTimeStamp,
      durationDays,
    );

    console.log('  ✅ [UserDecryptBatch] 批量解密成功，结果 keys:', Object.keys(result || {}));
    
    // 将所有值转换为 BigInt
    const decryptedResults = {};
    for (const [handle, value] of Object.entries(result)) {
      decryptedResults[handle] = BigInt(value);
    }
    
    return decryptedResults;
  } catch (error) {
    console.error('❌ [UserDecryptBatch] 批量解密失败:', error);
    throw error;
  }
};

/**
 * 调试函数：检查 SDK 加载状态
 * @returns {object} SDK 状态信息
 */
export const debugSDKStatus = () => {
  const status = {
    isInitialized,
    hasFHEInstance: !!fheInstance,
    sdkModule: !!sdkModule,
    globalObjects: Object.keys(window).filter(k => 
      k.toLowerCase().includes('sdk') || 
      k.toLowerCase().includes('zama') ||
      k === 'initSDK' ||
      k === 'createInstance'
    ),
    sdkFunctions: {}
  };

  const sdk = getSDK();
  if (sdk) {
    status.sdkFunctions = {
      hasInitSDK: typeof sdk.initSDK === 'function',
      hasCreateInstance: typeof sdk.createInstance === 'function',
      hasSepoliaConfig: !!sdk.SepoliaConfig
    };
  }

  console.log('📊 Zama SDK Debug Info:', status);
  return status;
};

// 导出所有功能
export default {
  initZamaSDK,
  createFHEInstance,
  getFHEInstance,
  isSDKInitialized,
  initializeZamaFHE,
  resetFHEInstance,
  userDecrypt,
  userDecryptBatch,
  debugSDKStatus
};

