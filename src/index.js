const SimpleScanner = require('./scanner');
const NestJSScanner = require('./nestjs-scanner');
const AdvancedNestJSScanner = require('./advanced-nestjs-scanner');
const fs = require('fs');
const path = require('path');

// Function untuk mendeteksi framework
function detectFramework() {
  try {
    const packagePath = path.join(process.cwd(), 'package.json');
    if (fs.existsSync(packagePath)) {
      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const deps = { ...pkg.dependencies, ...pkg.devDependencies };
      
      // Check for NestJS
      if (deps['@nestjs/core'] || deps['@nestjs/common']) {
        return 'nestjs';
      }
      
      // Check for other frameworks
      if (deps.express) return 'express';
      if (deps.fastify) return 'fastify';
      if (deps.koa) return 'koa';
      if (deps.hapi) return 'hapi';
      if (deps.restify) return 'restify';
    }
  } catch (error) {
    console.warn('⚠️  Could not read package.json');
  }
  
  return 'generic';
}

// Main entry point
function main() {
  const framework = detectFramework();
  let scanner;
  
  if (framework === 'nestjs') {
    console.log('🚀 Detected NestJS framework, using Advanced NestJS scanner...');
    scanner = new AdvancedNestJSScanner();
  } else {
    console.log(`🚀 Detected ${framework} framework, using Simple scanner...`);
    scanner = new SimpleScanner();
  }
  
  scanner.scan();
}

// Export untuk penggunaan sebagai module
module.exports = {
  SimpleScanner,
  NestJSScanner,
  AdvancedNestJSScanner,
  detectFramework,
  scan: main
};

// Jika dijalankan langsung
if (require.main === module) {
  main();
}
