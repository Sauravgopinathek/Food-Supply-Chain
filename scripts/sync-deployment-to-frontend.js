const fs = require('fs');
const path = require('path');

// Usage: node scripts/sync-deployment-to-frontend.js [network]
const network = process.argv[2] || 'localhost';

const repoRoot = path.join(__dirname, '..');
const deploymentsPath = path.join(repoRoot, 'deployments', `${network}-deployment.json`);

if (!fs.existsSync(deploymentsPath)) {
  console.error(`Deployment file not found: ${deploymentsPath}`);
  process.exit(1);
}

const deployment = JSON.parse(fs.readFileSync(deploymentsPath, 'utf8'));
const contractAddress = deployment.contractAddress || deployment.address || (deployment.contract && deployment.contract.address);

if (!contractAddress) {
  console.error('No contract address found in deployment file');
  process.exit(1);
}

const targets = [
  path.join(repoRoot, 'frontend', 'src', 'utils', 'config.js'),
  path.join(repoRoot, 'frontend', 'src', 'utils', 'config-minimal.js')
];

targets.forEach((filePath) => {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return;
  }

  const content = fs.readFileSync(filePath, 'utf8');

  const updated = content.replace(/export const CONTRACT_ADDRESS\s*=\s*\".*?\"\s*;/, `export const CONTRACT_ADDRESS = "${contractAddress}";`);

  if (updated === content) {
    console.log(`No CONTRACT_ADDRESS pattern found in ${filePath}, skipping write.`);
    return;
  }

  fs.writeFileSync(filePath, updated, 'utf8');
  console.log(`Updated CONTRACT_ADDRESS in ${filePath} -> ${contractAddress}`);
});

console.log('\nSync complete. Restart the frontend if it is running.');
