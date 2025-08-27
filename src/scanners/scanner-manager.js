const UniversalScanner = require('./universal-scanner');
const EnhancedNestJSScanner = require('./enhanced-nestjs-scanner');
const FrameworkDetector = require('../detectors/framework-detector');

class ScannerManager {
  constructor() {
    this.scanners = new Map();
    this.frameworkDetector = new FrameworkDetector();
    this.registerScanners();
  }

  registerScanners() {
    // Register only available scanners
    this.scanners.set('universal', UniversalScanner);
    this.scanners.set('nestjs-enhanced', EnhancedNestJSScanner);
    
    // Future scanners can be added here
    // this.scanners.set('express', ExpressScanner);
    // this.scanners.set('fastify', FastifyScanner);
    // this.scanners.set('koa', KoaScanner);
  }

  detectFramework(projectPath) {
    return this.frameworkDetector.detect(projectPath);
  }

  getScanner(framework = 'auto', options = {}) {
    let selectedFramework = framework;
    
    // Auto-detect framework if not specified
    if (framework === 'auto') {
      selectedFramework = this.detectFramework(process.cwd());
      console.log(`🔍 Auto-detected framework: ${selectedFramework}`);
    }

    // Get scanner class
    const ScannerClass = this.scanners.get(selectedFramework);
    
    if (!ScannerClass) {
      console.warn(`⚠️ Scanner for framework '${selectedFramework}' not found, falling back to universal scanner`);
      return new UniversalScanner();
    }

    // Create scanner instance with options
    const scanner = new ScannerClass();
    
    // Apply options
    if (options.debug) {
      scanner.debug = true;
    }
    
    return scanner;
  }

  listAvailableScanners() {
    return Array.from(this.scanners.keys());
  }

  getScannerInfo(framework) {
    const ScannerClass = this.scanners.get(framework);
    if (!ScannerClass) {
      return null;
    }
    
    return {
      name: framework,
      description: ScannerClass.description || `Scanner for ${framework} framework`,
      capabilities: ScannerClass.capabilities || []
    };
  }

  scan(projectPath, options = {}) {
    const {
      framework = 'auto',
      scanner = 'auto',
      format = 'all',
      out = './api-docs',
      watch = false,
      debug = false
    } = options;

    console.log('🚀 DockuGen - Universal API Documentation Generator');
    console.log('================================================');
    
    // Get appropriate scanner
    const selectedScanner = this.getScanner(framework, { debug });
    
    // Perform scan
    const results = selectedScanner.scan({
      out,
      format,
      watch,
      projectPath: projectPath || process.cwd()
    });

    // Ensure results have the correct structure
    let processedResults = results;
    
    // If scanner returns just routes array, wrap it in proper structure
    if (Array.isArray(results)) {
      processedResults = {
        routes: results,
        dtos: new Map()
      };
    }
    
    // If scanner returns object but missing routes/dtos, ensure proper structure
    if (processedResults && typeof processedResults === 'object') {
      if (!processedResults.routes) {
        processedResults.routes = [];
      }
      if (!processedResults.dtos) {
        processedResults.dtos = new Map();
      }
    }
    
    return {
      framework: framework === 'auto' ? this.detectFramework(projectPath || process.cwd()) : framework,
      scanner: selectedScanner.constructor.name,
      results: processedResults,
      options
    };
  }
}

module.exports = ScannerManager;
