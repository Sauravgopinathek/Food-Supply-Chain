const fs = require('fs');
const path = require('path');
const { ethers } = require('ethers');

function readDeployment() {
  const file = path.join(__dirname, '..', 'deployments', 'localhost-deployment.json');
  if (!fs.existsSync(file)) throw new Error('Deployment file not found: ' + file);
  return JSON.parse(fs.readFileSync(file, 'utf8'));
}

function readFullAbi() {
  const file = path.join(__dirname, '..', 'frontend', 'src', 'utils', 'config.js');
  if (!fs.existsSync(file)) throw new Error('Config file not found: ' + file);
  const content = fs.readFileSync(file, 'utf8');
  const m = content.match(/export const CONTRACT_ABI\s*=\s*(\[([\s\S]*?)\]);/m);
  if (!m) throw new Error('Unable to extract CONTRACT_ABI from config-minimal.js');
  // Evaluate the array safely
  const abiText = m[1];
  // Use Function to parse JS array literal
  const ABI = Function(`return ${abiText};`)();
  return ABI;
}

async function main() {
  try {
    const deployment = readDeployment();
    const address = deployment.contractAddress || deployment.address;
    if (!address) throw new Error('No address in deployment file');

  const abi = readFullAbi();

    const provider = new ethers.JsonRpcProvider('http://127.0.0.1:8545');
    console.log('Provider ready, network:', await provider.getNetwork());

    const contract = new ethers.Contract(address, abi, provider);
    console.log('Contract instance created at', address);

    console.log('ABI length:', abi.length);
      const fnNames = abi.filter((e) => e.type === 'function').map((f) => f.name).filter(Boolean);
      console.log('Function names in ABI:', fnNames.join(', '));
      console.log('contract.interface function keys:', Object.keys(contract.interface.functions).slice(0,20).join(', '));

      // Create a fresh Interface to avoid any runtime issues
      const iface = new ethers.Interface(abi);
      try {
        const fnFrag = iface.getFunction('getBatchCount');
        console.log('Interface getBatchCount fragment:', fnFrag.format ? fnFrag.format() : fnFrag.name);
      } catch (e) {
        console.warn('iface.getFunction failed:', e.message || e);
      }

      // show code at address
      try {
        const code = await provider.getCode(address);
        console.log('Bytecode length at address:', code ? code.length : 0);
      } catch (e) {
        console.warn('Failed to fetch code:', e.message || e);
      }

    // Call a simple read function (getBatchCount) if present
    if (!fnNames.includes('getBatchCount')) {
      console.log('getBatchCount is not in the ABI. Skipping call.');
      return;
    }

    try {
        const count = await contract.getBatchCount();
        // some ethers returns bigint, some return BN-like; normalize
        console.log('getBatchCount ->', count?.toString ? count.toString() : String(count));
        // Low-level test: encode and call raw
        try {
          const fn = contract.interface.getFunction('getBatchCount');
          const data = contract.interface.encodeFunctionData(fn, []);
          const raw = await provider.call({ to: address, data });
          const decoded = contract.interface.decodeFunctionResult(fn, raw);
          console.log('Raw call decoded ->', decoded[0]?.toString ? decoded[0].toString() : String(decoded[0]));
        } catch (lowErr) {
          console.warn('Low-level call failed:', lowErr.message || lowErr);
        }
    } catch (err) {
      console.error('Error calling getBatchCount:', err.message || err);
    }
  } catch (err) {
    console.error('Check failed:', err.message);
    process.exit(1);
  }
}

main();
