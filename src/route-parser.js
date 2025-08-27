/**
 * Route Parser for DockuGen
 * Parses route definitions from various frameworks
 */

class RouteParser {
  constructor() {
    this.supportedPatterns = [
      // Express patterns
      { regex: /app\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g, method: '$1', path: '$2' },
      { regex: /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g, method: '$1', path: '$2' },
      
      // Fastify patterns
      { regex: /fastify\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g, method: '$1', path: '$2' },
      
      // Koa patterns
      { regex: /router\.(get|post|put|delete|patch)\(['"`]([^'"`]+)['"`]/g, method: '$1', path: '$2' },
      
      // NestJS patterns
      { regex: /@(Get|Post|Put|Delete|Patch)\(['"`]([^'"`]+)['"`]\)/g, method: '$1', path: '$2' }
    ];
  }

  /**
   * Parse routes from file content
   * @param {string} content - File content
   * @param {string} filePath - File path
   * @returns {Array} - Array of route objects
   */
  parseRoutes(content, filePath) {
    const routes = [];
    
    this.supportedPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        const method = match[1] ? match[1].toLowerCase() : 'get';
        const path = match[2] || '/';
        
        routes.push({
          method,
          path,
          file: filePath,
          framework: this.detectFrameworkFromContent(content)
        });
      }
    });
    
    return routes;
  }

  /**
   * Parse routes from a file
   * @param {string} filePath - Path to the file
   * @param {string} framework - Framework name
   * @returns {Array} - Array of route objects
   */
  parseFile(filePath, framework = 'auto') {
    try {
      const fs = require('fs');
      const content = fs.readFileSync(filePath, 'utf8');
      return this.parseRoutes(content, filePath);
    } catch (error) {
      console.warn(`⚠️ Error reading file ${filePath}: ${error.message}`);
      return [];
    }
  }

  /**
   * Parse Next.js routes (placeholder for future implementation)
   * @param {string} filePath - Path to the file
   * @returns {Array} - Array of route objects
   */
  parseNextJSRoutes(filePath) {
    // TODO: Implement Next.js route parsing
    return [];
  }

  /**
   * Detect framework from file content
   * @param {string} content - File content
   * @returns {string} - Framework name
   */
  detectFrameworkFromContent(content) {
    if (content.includes('@Controller') || content.includes('@Get') || content.includes('@Post')) {
      return 'nestjs';
    }
    if (content.includes('express') || content.includes('app.get') || content.includes('app.post')) {
      return 'express';
    }
    if (content.includes('fastify') || content.includes('fastify.get') || content.includes('fastify.post')) {
      return 'fastify';
    }
    if (content.includes('koa') || content.includes('router.get') || content.includes('router.post')) {
      return 'koa';
    }
    return 'unknown';
  }

  /**
   * Parse route parameters from path
   * @param {string} path - Route path
   * @returns {Array} - Array of parameter names
   */
  parseParameters(path) {
    const paramRegex = /:([^/]+)/g;
    const params = [];
    let match;
    
    while ((match = paramRegex.exec(path)) !== null) {
      params.push(match[1]);
    }
    
    return params;
  }

  /**
   * Validate route path
   * @param {string} path - Route path
   * @returns {boolean} - Is valid path
   */
  isValidPath(path) {
    return path && typeof path === 'string' && path.startsWith('/');
  }
}

module.exports = RouteParser;
