# FROST-CHAIN Deployment Guide

## Prerequisites

### System Requirements
- **Node.js**: v16+ (v22.14.0 recommended)
- **npm**: v8+ or yarn v1.22+
- **Git**: For version control
- **MetaMask**: Browser extension for wallet interaction

### Development Tools
- **Hardhat**: Ethereum development environment
- **VS Code**: Recommended IDE with Solidity extensions
- **Postman**: For API testing (optional)

## Environment Setup

### 1. Clone Repository
```bash
git clone <repository-url>
cd Frost-chain
```

### 2. Install Dependencies
```bash
# Root dependencies (Hardhat, testing tools)
npm install

# Frontend dependencies
cd frontend
# Deployment — Food Supply Chain

This document explains how to set up, compile, test and deploy the Food Supply Chain dApp locally and to Sepolia. It's concise and tailored to the repo's scripts and structure.

Prerequisites
- Node.js 18+ and npm
- Git
- An RPC provider for Sepolia (Alchemy/Infura) if deploying to testnet
- MetaMask for manual frontend interaction

Quick start (development)
1. Clone and install
```powershell
git clone <repo-url>
cd "Food Supply Chain"
npm install
cd frontend
npm install
cd ..
```

2. Compile
```powershell
npx hardhat compile
```

3. Run local node and deploy
```powershell
# terminal 1
npx hardhat node

# terminal 2
npx hardhat run scripts/deploy.js --network localhost
```

4. Start frontend
```powershell
cd frontend
npm start
# open http://localhost:3000
```

Environment variables (minimal)
- Create a `.env` file in the repo root for network deploys (do NOT commit):
```
SEPOLIA_URL=https://sepolia.infura.io/v3/YOUR_KEY
PRIVATE_KEY=0xYOUR_DEPLOYER_PRIVATE_KEY
ETHERSCAN_API_KEY=your_etherscan_key
```

Deploy to Sepolia
1. Ensure `SEPOLIA_URL` and `PRIVATE_KEY` are set in your environment or `.env`.
2. Run:
```powershell
npx hardhat run scripts/deploy.js --network sepolia
```

Notes
- Deployment writes a manifest to `deployments/<network>-deployment.json`. Use `scripts/sync-deploy-to-frontend.js` to copy the address into the frontend.
- If you renamed the Solidity contract (e.g. to `FoodSupplyChain`), run `npx hardhat compile` before using scripts that load artifacts by filename.

Verification & post‑deploy
- Optionally verify on Etherscan (requires API key):
```powershell
npx hardhat verify --network sepolia <DEPLOYED_ADDRESS>
```

Cleanup & artifacts
- If you want a clean working tree, remove `artifacts/` and `cache/` then recompile: `npx hardhat compile`.

If you want, I can add a small `scripts/clean-artifacts.js` and update `.gitignore` to avoid committing build artifacts.

---

Last updated: October 10, 2025
3. Export private key (keep secure!)
