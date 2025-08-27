const fs = require('fs');
const path = require('path');
const glob = require('glob');
const FrameworkDetector = require('../detectors/framework-detector');
const RouteParser = require('../route-parser');

class SimpleScanner {
  constructor() {
    this.routes = [];
    this.frameworkDetector = new FrameworkDetector();
    this.routeParser = new RouteParser();
  }

  scan(options = {}) {
    const {
      projectPath = process.cwd(),
      out = './api-docs',
      format = 'all',
      watch = false
    } = options;

    // Set project root from options
    this.projectRoot = projectPath;
    
    console.log('🔍 Scanning project for API routes...');
    
    // Auto-detect project structure
    const srcDir = this.findSrcDir();
    const framework = this.detectFramework();
    const frameworkInfo = this.frameworkDetector.getFrameworkInfo(framework);
    
    console.log(`📁 Source directory: ${srcDir}`);
    console.log(`🚀 Framework detected: ${frameworkInfo.name}`);
    console.log(`📖 Description: ${frameworkInfo.description}`);
    
    // Scan routes
    this.scanRoutes(srcDir, framework);
    
    // Remove duplicates
    this.routes = this.removeDuplicates(this.routes);
    
    // Generate docs
    this.generateDocs(options);
    
    console.log(`✅ Found ${this.routes.length} unique routes`);
    return this.routes;
  }

  findSrcDir() {
    const possibleDirs = [
      'src', 'app', 'routes', 'controllers', 'api', 'lib', 
      'server', 'backend', 'pages', 'server/api', 'app/api'
    ];
    
    for (const dir of possibleDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath)) {
        return fullPath;
      }
    }
    
    // Fallback ke root jika tidak ada folder khusus
    return this.projectRoot;
  }

  detectFramework() {
    return this.frameworkDetector.detect(this.projectRoot);
  }

  scanRoutes(srcDir, framework) {
    // Find all JavaScript/TypeScript files
    const patterns = [
      '**/*.js',
      '**/*.ts',
      '**/*.mjs',
      '**/*.jsx',
      '**/*.tsx'
    ];
    
    let allFiles = [];
    patterns.forEach(pattern => {
      const files = glob.sync(pattern, { 
        cwd: srcDir, 
        absolute: true,
        ignore: [
          '**/node_modules/**', 
          '**/dist/**', 
          '**/build/**', 
          '**/.next/**', 
          '**/.nuxt/**',
          '**/coverage/**',
          '**/.git/**'
        ]
      });
      allFiles = allFiles.concat(files);
    });
    
    // If srcDir is not root, also check root for main files
    if (srcDir !== this.projectRoot) {
      const rootFiles = glob.sync('*.js', { 
        cwd: this.projectRoot, 
        absolute: true,
        ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
      });
      allFiles = allFiles.concat(rootFiles);
    }
    
    // Remove duplicates from file list
    allFiles = [...new Set(allFiles)];
    
    console.log(`📄 Scanning ${allFiles.length} files...`);
    
    // Parse each file for routes
    allFiles.forEach(file => {
      try {
        let routes = [];
        
        // Special handling for Next.js
        if (framework === 'nextjs') {
          routes = this.routeParser.parseNextJSRoutes(file);
        } else {
          routes = this.routeParser.parseFile(file, framework);
        }
        
        this.routes = this.routes.concat(routes);
      } catch (error) {
        console.warn(`⚠️  Error parsing ${file}: ${error.message}`);
      }
    });
  }

  removeDuplicates(routes) {
    const seen = new Set();
    return routes.filter(route => {
      const key = `${route.method}:${route.path}:${route.file}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }

  generateDocs(options) {
    // Use the new formatter system instead of old generator
    const FormatterManager = require('../formatters/formatter-manager');
    const formatter = new FormatterManager();
    
    // Create mock data structure for universal scanner
    const data = {
      routes: this.routes,
      dtos: new Map() // Universal scanner doesn't have DTOs
    };
    
    formatter.format(data, options.format || 'swagger', options);
  }
}

module.exports = SimpleScanner;
