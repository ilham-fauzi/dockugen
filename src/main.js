const ScannerManager = require('./scanners/scanner-manager');
const FormatterManager = require('./formatters/formatter-manager');
const path = require('path');

class DockuGen {
  constructor() {
    this.scannerManager = new ScannerManager();
    this.formatterManager = new FormatterManager();
  }

  /**
   * Main method to generate API documentation
   * @param {Object} options - Configuration options
   * @returns {Object} - Scan results and generated files
   */
  generate(options = {}) {
    const {
      projectPath = process.cwd(),
      framework = 'auto',
      format = 'all',
      out = './api-docs',
      watch = false,
      debug = false,
      title = 'API Documentation',
      description = 'Auto-generated API documentation',
      version = '1.0.0'
    } = options;

    try {
      console.log('🚀 DockuGen - Universal API Documentation Generator');
      console.log('================================================');
      console.log(`📁 Project Path: ${projectPath}`);
      console.log(`🎯 Framework: ${framework}`);
      console.log(`📄 Output Format: ${format}`);
      console.log(`📂 Output Directory: ${out}`);
      console.log('');

      // Perform scan
      const scanResult = this.scannerManager.scan(projectPath, {
        framework,
        format,
        out,
        watch,
        debug
      });

      // Format output - use the actual data from scanner results
      const formatResult = this.formatterManager.format(scanResult.results, format, {
        out,
        title,
        description,
        version
      });

      // Return comprehensive results
      return {
        success: true,
        scan: scanResult,
        output: formatResult,
        summary: {
          framework: scanResult.framework,
          scanner: scanResult.scanner,
          routesFound: scanResult.results.routes ? scanResult.results.routes.length : 0,
          dtosFound: scanResult.results.dtos ? scanResult.results.dtos.size : 0,
          filesGenerated: Object.keys(formatResult).length
        }
      };

    } catch (error) {
      console.error('❌ Error generating documentation:', error.message);
      if (debug) {
        console.error('Stack trace:', error.stack);
      }
      
      return {
        success: false,
        error: error.message,
        stack: debug ? error.stack : undefined
      };
    }
  }

  /**
   * List available scanners
   * @returns {Array} - List of available scanner names
   */
  listScanners() {
    return this.scannerManager.listAvailableScanners();
  }

  /**
   * List available output formats
   * @returns {Array} - List of available format names
   */
  listFormats() {
    return this.formatterManager.listAvailableFormats();
  }

  /**
   * Get scanner information
   * @param {string} framework - Framework name
   * @returns {Object|null} - Scanner information
   */
  getScannerInfo(framework) {
    return this.scannerManager.getScannerInfo(framework);
  }

  /**
   * Detect framework for a project
   * @param {string} projectPath - Path to project
   * @returns {string} - Detected framework name
   */
  detectFramework(projectPath = process.cwd()) {
    return this.scannerManager.detectFramework(projectPath);
  }

  /**
   * Quick scan with minimal options
   * @param {string} projectPath - Path to project
   * @returns {Object} - Scan results
   */
  quickScan(projectPath = process.cwd()) {
    return this.generate({
      projectPath,
      framework: 'auto',
      format: 'swagger',
      out: './api-docs'
    });
  }

  /**
   * Full scan with all formats
   * @param {string} projectPath - Path to project
   * @returns {Object} - Scan results with all formats
   */
  fullScan(projectPath = process.cwd()) {
    return this.generate({
      projectPath,
      framework: 'auto',
      format: 'all',
      out: './api-docs'
    });
  }
}

// Export both class and instance
module.exports = {
  DockuGen,
  dockugen: new DockuGen()
};
