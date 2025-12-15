# FROST-CHAIN Complete Application Flow Report

## 📋 Executive Summary
## Application Flow — Food Supply Chain

This document summarizes the runtime flows between the frontend, helper scripts, and the on‑chain contract `FoodSupplyChain` (source: `contracts/Traceability.sol`). It's short and actionable so the team and integrators can work without wading through legacy content.

1) Startup
- Start a local node for development: `npx hardhat node` (RPC: http://127.0.0.1:8545, chainId: 31337)
- Compile contracts: `npx hardhat compile`
- Deploy locally: `npx hardhat run scripts/deploy.js --network localhost`
- Start the frontend: `cd frontend && npm start`

2) User connection
- Users connect via an injected wallet (MetaMask). The frontend creates a provider and signer with Ethers and attaches the `FoodSupplyChain` contract using the configured address/ABI.
- The app queries `getShipmentCount()` and individual `getShipmentInfo(id)` to populate listings, and checks `hasRole(...)` to drive role-specific UI.

3) Create → Trace → Transfer
- Handlers create shipments via `createShipment(product, meta)`; the contract emits `TraceLog(..., "CREATED", ...)`.
- Holders or `SENSOR_ROLE` accounts call `addTrace` / `submitSensorReadings`. If temperature breaches occur the contract marks shipments `CONTAMINATED` and emits `ReputationUpdated`.
- Current holder calls `transferCustody(id, newHolder, note)` to pass custody. Status updates depend on the role of `newHolder` (CARRIER → TRANSIT, STORE → RECEIVED).

4) Frontend sync and event handling
- Prefer event-driven UI updates (listen to `TraceLog`) and fall back to polling `getShipmentCount` + `getShipmentInfo` for completeness.
- Use `scripts/sync-deploy-to-frontend.js` to copy the deployed address into the frontend config (or update `frontend/src/utils/config.js`).

5) Off-chain helpers
- Scripts in `scripts/` provide utilities: deploying, granting roles, syncing deployments to frontend, and reproducing transactions on Sepolia (e.g. `create_shipment_sepolia.js`).

6) Troubleshooting notes
- If MetaMask shows provider errors ("circuit breaker"), try: switch RPC URL, reset MetaMask, or use a direct node RPC (avoid rate-limited public providers during tests).
- If you rename a contract in `contracts/` (like we did to `FoodSupplyChain`), run `npx hardhat compile` before using scripts that import artifacts by filename.

This is intentionally concise — for an expanded step-by-step developer runbook see `docs/DEPLOYMENT.md`.
- **Regulatory Readiness**: Comprehensive audit trails and documentation
- **Cost Efficiency**: Optimized gas usage reduces operational costs
- **Future-Proof Design**: Extensible architecture for additional features

The FROST-CHAIN system demonstrates a production-ready implementation of blockchain technology for supply chain traceability, providing transparency, security, and efficiency for the frozen food industry.

---

**Report Generated**: October 5, 2025  
**Application Version**: 2.0.0  
**System Status**: Production Ready ✅  
**Total Flow Duration**: Startup to Complete Product Journey (~15-30 minutes typical)
