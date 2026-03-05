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
  // lightningcss needs BOTH the package AND the .node file in the right place
  const arm64NodeFile = path.join(projectRoot, 'node_modules', 'lightningcss', 'lightningcss.darwin-arm64.node');
  return {
    lightningcss: {
      arm64: fs.existsSync(path.join(projectRoot, 'node_modules', 'lightningcss-darwin-arm64')) && fs.existsSync(arm64NodeFile),
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
      // Always clean .next to prevent stale Turbopack cache (even when binaries are already installed)
      const nextDir = path.join(projectRoot, '.next');
      if (removeDir(nextDir)) {
        log('   ✓ Removed .next (M1+x64: ensuring fresh Turbopack build)', colors.green);
      }

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

        // Clean node_modules/.cache when installing binaries
        if (removeDir(path.join(projectRoot, 'node_modules', '.cache'))) {
          log('   ✓ Removed node_modules/.cache', colors.green);
        }

        // Install missing binaries via pack+extract (bypasses npm's platform skip for optionalDeps)
        const os2 = require('os');
        const tmpDir = os2.tmpdir();
        log('', colors.reset);
        for (const binary of missingBinaries) {
          log(`   Installing ${binary.name}@${binary.version}...`, colors.yellow);
          try {
            // npm install --force says "up to date" for optional deps on wrong platform.
            // Pack the tarball and extract directly instead.
            execSync(`npm pack ${binary.name}@${binary.version}`, {
              cwd: tmpDir,
              stdio: 'pipe'
            });
            const safeName = binary.name.replace('@', '').replace(/\//g, '-');
            const tarball = path.join(tmpDir, `${safeName}-${binary.version}.tgz`);
            const destDir = path.join(projectRoot, 'node_modules', ...binary.name.split('/'));
            fs.mkdirSync(path.dirname(destDir), { recursive: true });
            if (fs.existsSync(destDir)) fs.rmSync(destDir, { recursive: true, force: true });
            execSync(`tar -xzf ${tarball} -C ${tmpDir}`, { stdio: 'pipe' });
            fs.renameSync(path.join(tmpDir, 'package'), destDir);
            // Also copy .node file to lightningcss root for the fallback require path
            if (binary.name === 'lightningcss-darwin-arm64') {
              const src = path.join(destDir, 'lightningcss.darwin-arm64.node');
              const dst = path.join(projectRoot, 'node_modules', 'lightningcss', 'lightningcss.darwin-arm64.node');
              if (fs.existsSync(src)) fs.copyFileSync(src, dst);
            }
            log(`   ✓ ${binary.name} installed`, colors.green);
          } catch (err) {
            log(`   ⚠ Failed to install ${binary.name}: ${err.message}`, colors.red);
          }
        }

        log('\n✓ Fix complete. Starting dev server...\n', colors.green);
        log('💡 For a permanent fix, install native arm64 Node.js:', colors.yellow);
        log('   See CLAUDE.md for instructions\n', colors.yellow);
      }
    }

    // Patch @vercel/nft to handle TypeError in MemberExpression static evaluator.
    // Bug: nft's computePureStaticValue throws "Cannot convert object to primitive value"
    // when evaluating `a.value in s.value` where a.value is a non-primitive object.
    // Fix: wrap the entire if/else-if block in try-catch so nft returns undefined instead.
    const nftPath = path.join(projectRoot, 'node_modules', 'next', 'dist', 'compiled', '@vercel', 'nft', 'index.js');
    if (fs.existsSync(nftPath)) {
      const nftContent = fs.readFileSync(nftPath, 'utf8');
      const buggyPattern = 'if(a.value in s.value){const e=s.value[a.value];if(e===t.UNKNOWN)return undefined;return{value:e}}else if(s.value[t.UNKNOWN]){return undefined}';
      const fixedPattern = 'try{if(a.value in s.value){const e=s.value[a.value];if(e===t.UNKNOWN)return undefined;return{value:e}}else if(s.value[t.UNKNOWN]){return undefined}}catch(_){return undefined;}';
      if (nftContent.includes(buggyPattern)) {
        fs.writeFileSync(nftPath, nftContent.replace(buggyPattern, fixedPattern));
        log('   ✓ Patched @vercel/nft MemberExpression evaluator', colors.green);
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
