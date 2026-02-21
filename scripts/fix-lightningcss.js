const os = require('os');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const colors = {
  yellow: '\x1b[33m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  reset: '\x1b[0m'
};

function log(message, color = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function removeDir(dirPath) {
  if (fs.existsSync(dirPath)) {
    fs.rmSync(dirPath, { recursive: true, force: true });
    return true;
  }
  return false;
}

function isMacM1() {
  if (process.platform !== 'darwin') return false;
  try {
    const cpuInfo = execSync('sysctl -n machdep.cpu.brand_string', { encoding: 'utf8' });
    return cpuInfo.includes('Apple');
  } catch {
    return false;
  }
}

function getPackageVersion(packageName) {
  const projectRoot = path.resolve(__dirname, '..');
  try {
    const pkgPath = path.join(projectRoot, 'node_modules', packageName, 'package.json');
    const pkgJson = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
    return pkgJson.version;
  } catch {
    return null;
  }
}

function checkBinariesExist() {
  const projectRoot = path.resolve(__dirname, '..');

  // Check for all native binaries needed on M1 Mac
  return {
    lightningcss: {
      arm64: fs.existsSync(path.join(projectRoot, 'node_modules', 'lightningcss-darwin-arm64')),
      x64: fs.existsSync(path.join(projectRoot, 'node_modules', 'lightningcss-darwin-x64'))
    },
    tailwindcssOxide: {
      arm64: fs.existsSync(path.join(projectRoot, 'node_modules', '@tailwindcss', 'oxide-darwin-arm64')),
      x64: fs.existsSync(path.join(projectRoot, 'node_modules', '@tailwindcss', 'oxide-darwin-x64'))
    }
  };
}

function main() {
  try {
    const projectRoot = path.resolve(__dirname, '..');

    // Special handling for M1 Mac running x64 Node.js via Rosetta
    if (isMacM1() && process.arch === 'x64') {
      const binaries = checkBinariesExist();
      const missingBinaries = [];

      // Check which arm64 binaries are missing
      if (!binaries.lightningcss.arm64) {
        const version = getPackageVersion('lightningcss') || '1.31.1';
        missingBinaries.push({ name: 'lightningcss-darwin-arm64', version });
      }

      if (!binaries.tailwindcssOxide.arm64) {
        const version = getPackageVersion('@tailwindcss/oxide') || '4.2.0';
        missingBinaries.push({ name: '@tailwindcss/oxide-darwin-arm64', version });
      }

      if (missingBinaries.length > 0) {
        log('\n⚡ M1 Mac Detected - Installing arm64 Binaries', colors.yellow);
        log('   (Running Node.js in x64 mode via Rosetta)\n', colors.yellow);

        // Clean caches
        const dirsToClean = [
          path.join(projectRoot, '.next'),
          path.join(projectRoot, 'node_modules', '.cache')
        ];

        for (const dir of dirsToClean) {
          if (removeDir(dir)) {
            log(`   ✓ Removed ${path.basename(dir)}`, colors.green);
          }
        }

        // Install missing binaries
        log('', colors.reset);
        for (const binary of missingBinaries) {
          log(`   Installing ${binary.name}@${binary.version}...`, colors.yellow);
          try {
            // Use --force to bypass platform checks, allow saving to package.json
            execSync(`npm install --force ${binary.name}@${binary.version}`, {
              cwd: projectRoot,
              stdio: 'pipe' // Hide npm output to keep logs clean
            });
            log(`   ✓ ${binary.name} installed`, colors.green);
          } catch (err) {
            log(`   ⚠ Failed to install ${binary.name}`, colors.red);
          }
        }

        log('\n✓ Fix complete. Starting dev server...\n', colors.green);
        log('💡 For a permanent fix, install native arm64 Node.js:', colors.yellow);
        log('   See CLAUDE.md for instructions\n', colors.yellow);
      }
    }

    process.exit(0);

  } catch (error) {
    log(`\n⚠ Error during fix: ${error.message}`, colors.red);
    log('   Continuing with dev server startup...\n', colors.yellow);
    process.exit(0);
  }
}

main();
