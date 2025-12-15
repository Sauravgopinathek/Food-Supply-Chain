const fs = require('fs');
const path = require('path');

function readDeployment(network = 'localhost') {
  const deploymentsFile = path.join(__dirname, '..', 'deployments', `${network}-deployment.json`);
  if (!fs.existsSync(deploymentsFile)) {
    throw new Error(`Deployment file not found: ${deploymentsFile}`);
  }
  const raw = fs.readFileSync(deploymentsFile, 'utf8');
  return JSON.parse(raw);
}

function replaceContractAddressInFile(filePath, newAddress) {
  if (!fs.existsSync(filePath)) {
    console.warn(`File not found, skipping: ${filePath}`);
    return;
  }
  const content = fs.readFileSync(filePath, 'utf8');
  // Simple replace of the CONTRACT_ADDRESS assignment
  const replaced = content.replace(/(export const CONTRACT_ADDRESS\s*=\s*")[^"]*(";)/, `$1${newAddress}$2`);
  fs.writeFileSync(filePath, replaced, 'utf8');
  console.log(`Updated ${filePath}`);
}

function main() {
  try {
    const deployment = readDeployment('localhost');
    const address = deployment.contractAddress || deployment.address || deployment.contract?.address;
    if (!address) throw new Error('No contract address found in deployment file');

    const frontendConfig = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'config.js');
    const frontendConfigMin = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'config-minimal.js');

    replaceContractAddressInFile(frontendConfig, address);
    replaceContractAddressInFile(frontendConfigMin, address);

    console.log('\nSync complete. Frontend configs updated to:', address);
  } catch (err) {
    console.error('Failed to sync deployment to frontend:', err.message);
    process.exit(1);
  }
}

main();
