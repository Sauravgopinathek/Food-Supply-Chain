// scripts/create_shipment_sepolia.js
const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

async function main() {
  const deploymentPath = path.join(__dirname, '..', 'deployments', 'sepolia-deployment.json');
  if (!fs.existsSync(deploymentPath)) throw new Error('Deployment file not found: ' + deploymentPath);
  const deployment = JSON.parse(fs.readFileSync(deploymentPath, 'utf8'));
  const address = deployment.contractAddress || deployment.address;
  if (!address) throw new Error('No contract address in deployment file (' + deploymentPath + ')');

  const artifactPath = path.join(__dirname, '..', 'artifacts', 'contracts', 'Traceability.sol', 'FoodTrace.json');
  if (!fs.existsSync(artifactPath)) throw new Error('Artifact not found: ' + artifactPath);
  const artifact = JSON.parse(fs.readFileSync(artifactPath, 'utf8'));
  const abi = artifact.abi;

  const rpc = process.env.SEPOLIA_URL;
  const key = process.env.PRIVATE_KEY;
  if (!rpc) throw new Error('Please set SEPOLIA_URL environment variable');
  if (!key) throw new Error('Please set PRIVATE_KEY environment variable');

  const provider = new ethers.JsonRpcProvider(rpc);
  const wallet = new ethers.Wallet(key, provider);
  console.log('Using wallet:', wallet.address);
  console.log('Provider network:', await provider.getNetwork());

  const contract = new ethers.Contract(address, abi, wallet);

  try {
    console.log('Calling createShipment("TestProduct", "node-created")');
    const tx = await contract.createShipment('TestProduct', 'node-created', { gasLimit: 600000 });
    console.log('tx hash:', tx.hash);
    console.log('Waiting for receipt...');
    const receipt = await tx.wait();
    console.log('Receipt status:', receipt.status);
    console.log({ blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), transactionHash: receipt.transactionHash });
    console.log('Logs:', receipt.logs.length);
  } catch (err) {
    console.error('Node execution error:');
    console.error(err && err.stack ? err.stack : err);
    if (err?.error) console.error('err.error:', err.error);
    if (err?.code) console.error('err.code:', err.code);
    if (err?.data) console.error('err.data:', JSON.stringify(err.data, null, 2));
    process.exit(1);
  }
}

main();
