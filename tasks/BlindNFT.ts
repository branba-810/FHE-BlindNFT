import { task } from "hardhat/config";
import type { TaskArguments } from "hardhat/types";

task("task:deployBlindNFT")
  .setDescription("Deploy BlindNFT contract")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { deployer } = await hre.getNamedAccounts();
    const BlindNFT = await hre.ethers.getContractFactory("BlindNFT");
    const blindNFT = await BlindNFT.deploy();
    await blindNFT.waitForDeployment();
    const address = await blindNFT.getAddress();
    console.log(`BlindNFT deployed to: ${address}`);
  });

task("task:mintBlindNFT")
  .addParam("contract", "The BlindNFT contract address")
  .addOptionalParam("uri", "The NFT image URI (IPFS or HTTP)", "https://i.imgur.com/dNGIj0E_d.webp?maxwidth=520&shape=thumb&fidelity=high")
  .setDescription("Mint a new BlindNFT with FHE encrypted random attributes")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { contract, uri } = taskArguments;
    const [signer] = await hre.ethers.getSigners();
    
    const BlindNFT = await hre.ethers.getContractAt("BlindNFT", contract);
    
    console.log("\n" + "=".repeat(60));
    console.log("🎲 铸造 BlindNFT - 使用 FHE 加密随机属性");
    console.log("=".repeat(60));
    console.log(`\n📷 图片 URI: ${uri}`);
    console.log(`👤 铸造者: ${signer.address}`);
    console.log(`\n⛏️  正在铸造...`);
    
    const tx = await BlindNFT.mint(uri);
    console.log(`📤 交易已提交: ${tx.hash}`);
    console.log(`⏳ 等待确认...`);
    
    const receipt = await tx.wait();
    console.log(`✅ 交易已确认！`);
    console.log(`⛽ Gas 使用: ${receipt?.gasUsed.toString()}`);
    
    // 获取新铸造的 tokenId
    const totalSupply = await BlindNFT.totalSupply();
    console.log(`\n🎉 铸造成功！`);
    console.log(`🎫 Token ID: ${totalSupply}`);
    console.log(`👤 所有者: ${signer.address}`);
    
    console.log(`\n🔒 FHE 加密属性（链上生成的随机值）:`);
    console.log(`   ⭐ 稀有度: ??? (euint64 加密)`);
    console.log(`   💪 力量: ??? (euint64 加密)`);
    console.log(`   ⚡ 速度: ??? (euint64 加密)`);
    
    console.log(`\n💡 下一步操作:`);
    console.log(`   1. 使用 Relayer SDK 解密查看属性`);
    console.log(`   2. 或使用以下命令:`);
    console.log(`      npx hardhat task:getBlindNFTDetails --contract ${contract} --tokenid ${totalSupply} --network sepolia`);
    console.log("=".repeat(60) + "\n");
  });

task("task:getBlindNFTDetails")
  .addParam("contract", "The BlindNFT contract address")
  .addParam("tokenid", "The token ID to view")
  .setDescription("🔍 View BlindNFT details (decrypted with Relayer SDK)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { contract, tokenid } = taskArguments;
    const [signer] = await hre.ethers.getSigners();
    
    const BlindNFT = await hre.ethers.getContractAt("BlindNFT", contract);
    
    console.log("\n" + "=".repeat(60));
    console.log(`🔍 BlindNFT #${tokenid} 详情`);
    console.log("=".repeat(60));
    
    // 检查所有权
    const owner = await BlindNFT.ownerOf(tokenid);
    console.log(`\n👤 所有者: ${owner}`);
    console.log(`👤 查看者: ${signer.address}`);
    
    if (owner.toLowerCase() !== signer.address.toLowerCase()) {
      console.log(`\n⚠️  注意: 您不是此 NFT 的所有者`);
      console.log(`❌ 只有所有者可以查看加密属性`);
      return;
    }
    
    // 获取图片URI
    console.log(`\n📷 正在读取图片 URI...`);
    const tokenURI = await BlindNFT.getEncryptedTokenURI(tokenid);
    console.log(`✅ 图片 URI: ${tokenURI}`);
    
    // 获取加密的属性
    console.log(`\n🔐 正在读取加密属性...`);
    const encryptedRarity = await BlindNFT.getEncryptedRarity(tokenid);
    const [encryptedPower, encryptedSpeed] = await BlindNFT.getEncryptedAttributes(tokenid);
    console.log(`✅ 加密属性已获取 (euint64 类型)`);
    
    // 尝试使用 Relayer SDK 解密
    console.log(`\n🔓 正在使用 Relayer SDK 解密...`);
    try {
      const { createInstance } = await import("@zama-fhe/relayer-sdk");
      const relayer = await createInstance({
        network: "sepolia",
        gatewayUrl: "https://gateway.sepolia.zama.ai",
      });
      
      console.log(`✅ Relayer SDK 已连接`);
      
      const rarity = await relayer.decrypt(contract, encryptedRarity);
      const power = await relayer.decrypt(contract, encryptedPower);
      const speed = await relayer.decrypt(contract, encryptedSpeed);
      
      console.log(`\n🎲 解密后的属性:`);
      console.log(`   ⭐ 稀有度: ${rarity} / 127`);
      console.log(`   💪 力量: ${power} / 127`);
      console.log(`   ⚡ 速度: ${speed} / 127`);
      
      // 稀有度评级
      let grade = "";
      const rarityNum = Number(rarity);
      if (rarityNum >= 100) grade = "🔥 Legendary";
      else if (rarityNum >= 75) grade = "💎 Epic";
      else if (rarityNum >= 50) grade = "✨ Rare";
      else if (rarityNum >= 25) grade = "🌟 Uncommon";
      else grade = "⚪ Common";
      
      console.log(`\n🏆 等级: ${grade}`);
      
      // 计算综合战力
      const totalPower = Number(rarity) + Number(power) + Number(speed);
      const avgPower = (totalPower / 3).toFixed(2);
      console.log(`\n⚔️  综合战力: ${avgPower} / 127`);
      
    } catch (error: any) {
      console.log(`\n❌ 解密失败: ${error.message}`);
      console.log(`\n💡 提示:`);
      console.log(`   1. 确保您在正确的网络上 (Sepolia)`);
      console.log(`   2. 确保 Relayer SDK 配置正确`);
      console.log(`   3. 您可以使用 task:revealBlindNFTPublic 公开解密`);
    }
    
    console.log("\n" + "=".repeat(60) + "\n");
  });

task("task:revealBlindNFT")
  .addParam("contract", "The BlindNFT contract address")
  .addParam("tokenid", "The token ID to reveal")
  .setDescription("🔓 Decrypt and view your BlindNFT attributes (private)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    // 重定向到新的详情查看任务
    console.log("ℹ️  此任务已更新，请使用: task:getBlindNFTDetails\n");
    await hre.run("task:getBlindNFTDetails", taskArguments);
  });

task("task:getBlindNFTInfo")
  .addParam("contract", "The BlindNFT contract address")
  .setDescription("Get BlindNFT contract information")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { contract } = taskArguments;
    const BlindNFT = await hre.ethers.getContractAt("BlindNFT", contract);
    
    const totalSupply = await BlindNFT.totalSupply();
    console.log(`📊 Total Supply: ${totalSupply}`);
    
    const signers = await hre.ethers.getSigners();
    const balance = await BlindNFT.balanceOf(signers[0].address);
    console.log(`💰 Your Balance: ${balance}`);
  });

task("task:revealBlindNFTPublic")
  .addParam("contract", "The BlindNFT contract address")
  .addParam("tokenid", "The token ID to reveal publicly")
  .setDescription("🌍 Publicly reveal the NFT attributes for EVERYONE to see")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { contract, tokenid } = taskArguments;
    const [signer] = await hre.ethers.getSigners();
    
    const BlindNFT = await hre.ethers.getContractAt("BlindNFT", contract);
    
    console.log(`\n⚠️  Warning: Once publicly revealed, this CANNOT be undone!`);
    console.log(`⚠️  Everyone will be able to see this NFT's attributes and image.`);
    console.log(`\n🌍 Publicly revealing NFT #${tokenid}...`);
    
    const tx = await BlindNFT.revealPublic(tokenid);
    const receipt = await tx.wait();
    
    console.log(`✅ Transaction confirmed: ${receipt?.hash}`);
    
    // 获取解密后的属性
    const [rarity, power, speed, revealed] = await BlindNFT.getRevealedAttributes(tokenid);
    
    console.log(`\n🎉 NFT #${tokenid} is now publicly visible to EVERYONE!`);
    console.log(`\n🎲 Public Attributes:`);
    console.log(`   ⭐ Rarity: ${rarity}/100`);
    console.log(`   💪 Power: ${power}/100`);
    console.log(`   ⚡ Speed: ${speed}/100`);
  });

task("task:viewPublicNFT")
  .addParam("contract", "The BlindNFT contract address")
  .addParam("tokenid", "The token ID to view")
  .setDescription("👀 View publicly revealed NFT (anyone can call this)")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { contract, tokenid } = taskArguments;
    const BlindNFT = await hre.ethers.getContractAt("BlindNFT", contract);
    
    console.log(`\n🔍 Checking NFT #${tokenid}...`);
    
    const [rarity, power, speed, revealed] = await BlindNFT.getRevealedAttributes(tokenid);
    
    if (!revealed) {
      console.log(`\n🔒 NFT #${tokenid} has NOT been publicly revealed yet.`);
      console.log(`💡 Tip: Only the owner can see this NFT's attributes until they choose to reveal it publicly.`);
      return;
    }
    
    const uri = await BlindNFT.getRevealedTokenURI(tokenid);
    const owner = await BlindNFT.ownerOf(tokenid);
    
    console.log(`\n🌍 Public NFT #${tokenid}:`);
    console.log(`👤 Owner: ${owner}`);
    console.log(`📷 Image: ${uri}`);
    console.log(`\n🎲 Attributes:`);
    console.log(`   ⭐ Rarity: ${rarity}/100`);
    console.log(`   💪 Power: ${power}/100`);
    console.log(`   ⚡ Speed: ${speed}/100`);
  });

task("task:checkRevealStatus")
  .addParam("contract", "The BlindNFT contract address")
  .addParam("tokenid", "The token ID to check")
  .setDescription("🔍 Check if an NFT has been publicly revealed")
  .setAction(async function (taskArguments: TaskArguments, hre) {
    const { contract, tokenid } = taskArguments;
    const BlindNFT = await hre.ethers.getContractAt("BlindNFT", contract);
    
    const isRevealed = await BlindNFT.isRevealed(tokenid);
    const owner = await BlindNFT.ownerOf(tokenid);
    
    console.log(`\n📊 NFT #${tokenid} Status:`);
    console.log(`👤 Owner: ${owner}`);
    console.log(`🌍 Publicly Revealed: ${isRevealed ? "✅ YES" : "❌ NO"}`);
    
    if (!isRevealed) {
      console.log(`\n💡 This NFT is still a blind box. Only the owner can:`);
      console.log(`   1. View it privately using: pnpm task:revealBlindNFT`);
      console.log(`   2. Reveal it publicly using: pnpm task:revealBlindNFTPublic`);
    } else {
      console.log(`\n✅ This NFT is public! Anyone can view it using:`);
      console.log(`   pnpm task:viewPublicNFT --contract ${contract} --tokenid ${tokenid}`);
    }
  });

