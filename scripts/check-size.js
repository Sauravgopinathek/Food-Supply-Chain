// scripts/check-size.js
// Helper to inspect compiled contract bytecode size and warn about EIP-170 limits.
const hre = require('hardhat');

async function main() {
  console.log('\n=== Contract bytecode size checker ===\n');

  const names = ['FoodTrace']; // add other contracts here if needed

  for (const name of names) {
    try {
      const artifact = await hre.artifacts.readArtifact(name);
      const deployed = artifact.deployedBytecode || artifact.bytecode || '';
      const initcode = artifact.bytecode || '';

      const deployedBytes = Buffer.from(deployed.replace(/^0x/, ''), 'hex').length;
      const initBytes = Buffer.from(initcode.replace(/^0x/, ''), 'hex').length;

      console.log(`Contract: ${name}`);
      console.log(`  - init code size: ${initBytes} bytes`);
      console.log(`  - deployed runtime code size: ${deployedBytes} bytes`);

      const EIP170_LIMIT = 24576; // 24 KB
      if (deployedBytes > EIP170_LIMIT) {
        console.warn(`\n⚠️  Runtime bytecode exceeds EIP-170 limit (${EIP170_LIMIT} bytes).`);
        console.warn('   This will cause deployment to fail on most networks.');
      } else {
        console.log('  ✅ Runtime bytecode is within EIP-170 limits');
      }

      // Heuristic: if init code is large, gas estimation may fail or be very expensive
      const INIT_WARN = 65536; // arbitrary threshold
      if (initBytes > INIT_WARN) {
        console.warn(`\n⚠️  Init code is large (> ${INIT_WARN} bytes). Gas estimation or client limits may fail.`);
      }

      console.log('');
    } catch (err) {
      console.error(`Could not read artifact for ${name}:`, err.message || err);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
