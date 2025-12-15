# Food Supply Chain

[![Netlify Status](https://api.netlify.com/api/v1/badges/2acd3758-bf7a-40e3-b58f-d2afe9a6c700/deploy-status)](https://app.netlify.com/sites/foodsupplychain/deploys)

Food Supply Chain is a blockchain-powered traceability dApp for frozen-food supply chains. This repository contains a Solidity smart contract, Hardhat deployment scripts, and a React frontend that lets you create product shipments (batches), record trace events, and view a simple reputation system for handlers/carriers.

## 🌐 Live Demo

**[https://foodsupplychain.netlify.app](https://foodsupplychain.netlify.app)**

> Connect your MetaMask wallet on **Sepolia testnet** to interact with the dApp.

---

## Quick links
- Compile: `npm run compile`
- Deploy (Sepolia): `npm run deploy:sepolia`
- Deploy (local Hardhat): `npm run deploy:local`
- Sync deployed address to frontend: `npm run sync-deploy` (copies deployment into frontend config)
- Start frontend: `npm run frontend:start`

## Prerequisites
- Node.js 16+ and npm
- Git
- MetaMask (for testnet interaction)

## Local development (fast)
1. Install dependencies (repo root):

```powershell
npm ci
```

2. Start a local Hardhat node (new terminal):

```powershell
npx hardhat node
```

3. Deploy locally (in another terminal):

```powershell
npm run compile
npm run deploy:local
```

4. Sync the deployed address into the frontend and start it:

```powershell
npm run sync-deploy
npm run frontend:start
```

Open http://localhost:3000 and connect MetaMask (or use a local provider account).

## Deploying to Sepolia (testnet)
1. Export environment variables in your PowerShell session (example using Infura):

```powershell
$env:SEPOLIA_URL = 'https://sepolia.infura.io/v3/YOUR_INFURA_PROJECT_ID'
$env:PRIVATE_KEY  = '0xYOUR_PRIVATE_KEY'
```

2. Compile and deploy:

```powershell
npm run compile
npm run deploy:sepolia
```

3. Sync the deployed address to the frontend (quick copy approach):

```powershell
Copy-Item .\deployments\sepolia-deployment.json .\deployments\localhost-deployment.json -Force
npm run sync-deploy
npm run frontend:start
```

Set MetaMask to Sepolia and use an account with test ETH to perform transactions.

## How the frontend finds batches
- Primary: listen/query `BatchEventLog` events using `queryFilter`.
- Fallbacks (used when providers don't return events consistently): parse `receipt.logs` and `receipt.events`, query block ranges for matching logs, or iterate `getBatchCount()` and fetch by index.

## Troubleshooting (common issues)
- MetaMask "circuit breaker is open": MetaMask can block RPC calls after repeated provider failures. Quick fixes: Reset Account in MetaMask (Settings → Advanced → Reset Account), switch RPC (try `https://rpc.sepolia.org`), or test the RPC with:

```powershell
$body = '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}'
curl -Method POST -Uri $env:SEPOLIA_URL -Body $body -ContentType 'application/json' | ConvertFrom-Json
```

- `batch/undefined` after create: frontend now avoids navigating to an undefined id. If you see this, check the transaction receipt (developer console) and paste it for debugging.
- ENS/address whitespace: ensure `CONTRACT_ADDRESS` in `frontend/src/utils/config.js` is the exact deployed address (no spaces).

## Useful scripts (summary)
- `npm run compile` — compile contracts
- `npm run deploy:local` — deploy to Hardhat local node
- `npm run deploy:sepolia` — deploy to Sepolia (requires env vars)
- `npm run sync-deploy` — update frontend `CONTRACT_ADDRESS` from deployment manifest
- `npm run frontend:start` — start the React app


## Project layout
- `contracts/` — Solidity contracts
- `scripts/` — deployment & helper scripts
- `frontend/` — React app
- `deployments/` — generated deployment manifests
- `artifacts/` — Hardhat compiled artifacts

## Deploying Frontend to Netlify

The frontend is deployed on Netlify. To redeploy after making changes:

```powershell
cd frontend
npm run build
netlify deploy --prod --dir=build
```

Or connect your GitHub repo to Netlify for automatic deployments on every push.

## License

MIT
