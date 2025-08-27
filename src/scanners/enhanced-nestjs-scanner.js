const fs = require('fs');
const path = require('path');
const glob = require('glob');

class EnhancedNestJSScanner {
  constructor() {
    this.projectRoot = process.cwd();
    this.routes = [];
    this.controllers = new Map();
    this.dtos = new Map();
    this.parameters = new Map();
  }

  scan(options = {}) {
    console.log(
      '🔍 Enhanced NestJS Scanner: Scanning for API routes with advanced DTO detection...'
    );

    // Auto-detect project structure
    const srcDir = this.findSrcDir();
    console.log(`📁 Source directory: ${srcDir}`);
    console.log(`🚀 Framework detected: NestJS (Enhanced)`);

    // Scan controllers, routes, and DTOs
    this.scanControllers(srcDir);
    this.scanRoutes(srcDir);
    this.scanDTOs(srcDir);
    this.scanParameters(srcDir);

    // Remove duplicates
    this.routes = this.removeDuplicates(this.routes);

    console.log(`✅ Found ${this.routes.length} unique routes`);
    console.log(`✅ Found ${this.dtos.size} DTOs`);
    console.log(`✅ Found ${this.parameters.size} parameter definitions`);

    // Convert Map to plain object for better serialization
    const dtosObject = {};
    for (const [key, value] of this.dtos.entries()) {
      dtosObject[key] = value;
    }
    
    return {
      routes: this.routes,
      dtos: dtosObject
    };
  }

  findSrcDir() {
    const possibleDirs = ['src', 'app', 'routes', 'controllers', 'api', 'lib'];
    for (const dir of possibleDirs) {
      const fullPath = path.join(this.projectRoot, dir);
      if (fs.existsSync(fullPath) && fs.statSync(fullPath).isDirectory()) {
        return fullPath;
      }
    }
    return this.projectRoot;
  }

  scanControllers(srcDir) {
    const controllerFiles = glob.sync('**/*.controller.ts', {
      cwd: srcDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    console.log(`📄 Found ${controllerFiles.length} controller files`);

    controllerFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const controllerName = path.basename(file, '.controller.ts');
        
        // Extract controller base path
        const controllerMatch = content.match(/@Controller\(['"`]([^'"`]*)['"`]\)/);
        const basePath = controllerMatch ? controllerMatch[1] : '';
        
        this.controllers.set(controllerName, {
          file: path.relative(this.projectRoot, file),
          basePath,
          content
        });
      } catch (error) {
        console.warn(`⚠️  Error reading controller ${file}: ${error.message}`);
      }
    });
  }

  scanRoutes(srcDir) {
    const controllerFiles = glob.sync('**/*.controller.ts', {
      cwd: srcDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    controllerFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const controllerName = path.basename(file, '.controller.ts');
        const controller = this.controllers.get(controllerName);
        
        if (!controller) return;

        // Extract HTTP method decorators with better pattern matching
        const httpMethods = ['Get', 'Post', 'Put', 'Delete', 'Patch', 'Options', 'Head', 'All'];
        
        httpMethods.forEach(method => {
          // Find all method decorators
          const methodRegex = new RegExp(`@${method}\\(['"]([^'"]*)['"]\\)`, 'g');
          let match;
          
          while ((match = methodRegex.exec(content)) !== null) {
            const [, routePath] = match;
            
            // Look for the method definition after this decorator
            const afterDecorator = content.substring(match.index + match[0].length);
            
            // Find method definition - look for async/function declaration
            // Support both Promise<> and simple return types
            const methodPatterns = [
              // Pattern for Promise<> return types
              new RegExp(`\\s*(?:async\\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(([^)]*)\\)\\s*:\\s*Promise<[^>]*>`, 'g'),
              // Pattern for simple return types
              new RegExp(`\\s*(?:async\\s+)?([a-zA-Z_$][a-zA-Z0-9_$]*)\\s*\\(([^)]*)\\)\\s*:\\s*([^{]+)`, 'g')
            ];
            
            let methodFound = false;
            for (const pattern of methodPatterns) {
              let methodMatch;
              
              while ((methodMatch = pattern.exec(afterDecorator)) !== null) {
                const [, methodName, paramsString] = methodMatch;
                
                // Only process if this looks like a real method (not a comment or other text)
                if (methodName && methodName.length > 0 && !methodName.includes('@')) {
                  const fullPath = path.join(controller.basePath, routePath).replace(/\\/g, '/');
                  
                  // Parse method parameters
                  const params = this.parseMethodParameters(paramsString);
                  
                  this.routes.push({
                    method: method.toUpperCase(),
                    path: fullPath || '/',
                    controller: controllerName,
                    file: controller.file,
                    methodName,
                    parameters: params
                  });
                  
                  methodFound = true;
                  break;
                }
              }
              
              if (methodFound) break;
            }
          }
        });
      } catch (error) {
        console.warn(`⚠️  Error parsing routes in ${file}: ${error.message}`);
      }
    });
  }

  parseMethodParameters(paramString) {
    const params = {
      body: null,
      query: [],
      params: [],
      headers: []
    };

    // Parse @Body() parameter
    const bodyMatch = paramString.match(/@Body\(\)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$<>[\],\s]*)/);
    if (bodyMatch) {
      const [, paramName, paramType] = bodyMatch;
      // Clean up the type (remove Promise, etc.)
      const cleanType = paramType.replace(/Promise<[^>]*>/, '').trim();
      params.body = {
        name: paramName,
        type: cleanType,
        required: true
      };
    }

    // Parse @Query() parameters
    const queryMatches = paramString.matchAll(/@Query\(['"`]([^'"`]*)['"`]\s*\)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$<>[\],\s]*)/g);
    for (const match of queryMatches) {
      const [, queryName, paramName, paramType] = match;
      params.query.push({
        name: queryName,
        paramName,
        type: paramType.trim(),
        required: false
      });
    }

    // Parse @Param() parameters
    const paramMatches = paramString.matchAll(/@Param\(['"`]([^'"`]*)['"`]\s*\)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$<>[\],\s]*)/g);
    for (const match of paramMatches) {
      const [, paramName, variableName, paramType] = match;
      params.params.push({
        name: paramName,
        paramName: variableName,
        type: paramType.trim(),
        required: true
      });
    }

    // Parse @Headers() parameters
    const headerMatches = paramString.matchAll(/@Headers\(['"`]([^'"`]*)['"`]\s*\)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([a-zA-Z_$][a-zA-Z0-9_$<>[\],\s]*)/g);
    for (const match of headerMatches) {
      const [, headerName, paramName, paramType] = match;
      params.headers.push({
        name: headerName,
        paramName,
        type: paramType.trim(),
        required: false
      });
    }

    return params;
  }

  scanDTOs(srcDir) {
    const dtoFiles = glob.sync('**/*.dto.ts', {
      cwd: srcDir,
      absolute: true,
      ignore: ['**/node_modules/**', '**/dist/**', '**/build/**']
    });

    console.log(`📄 Found ${dtoFiles.length} DTO files`);

    dtoFiles.forEach(file => {
      try {
        const content = fs.readFileSync(file, 'utf8');
        const dtoName = path.basename(file, '.dto.ts');
        
        // Extract class definition - look for all classes in the file
        const classMatches = content.matchAll(/export\s+class\s+([a-zA-Z_$][a-zA-Z0-9_$]*)/g);
        
        for (const classMatch of classMatches) {
          const className = classMatch[1];
          console.log(`Processing DTO class: ${className} from file: ${file}`);
          
          const properties = this.parseDTOProperties(content);
          console.log(`Found ${properties.length} properties for ${className}`);
          
          this.dtos.set(className, {
            name: className,
            file: path.relative(this.projectRoot, file),
            properties
          });
        }
      } catch (error) {
        console.warn(`⚠️  Error reading DTO ${file}: ${error.message}`);
      }
    });
  }

  parseDTOProperties(content) {
    const properties = [];
    
    // Use regex with multiline flag to handle decorators that span multiple lines
    const propertyPattern = /@([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\([^)]*\)\s*\n\s*([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*([^;]+)/g;
    
    let match;
    while ((match = propertyPattern.exec(content)) !== null) {
      const [, decorator, propertyName, propertyType] = match;
      
      // Determine if property is required based on decorator
      const isRequired = this.isRequiredDecorator(decorator);
      const isOptional = this.isOptionalDecorator(decorator);
      
      // Parse the property type
      const cleanType = this.cleanPropertyType(propertyType);
      
      properties.push({
        name: propertyName,
        type: cleanType,
        required: isRequired,
        optional: isOptional,
        decorator: decorator
      });
    }
    
    return properties;
  }

  isRequiredDecorator(decorator) {
    const requiredDecorators = [
      'MandatoryString', 'MandatoryNumber', 'MandatoryBoolean', 'MandatoryDate',
      'MandatoryArray', 'MandatoryObject', 'MandatoryNested', 'MandatoryEnum',
      'ApiProperty', 'IsString', 'IsNumber', 'IsBoolean', 'IsDate', 'IsArray', 'IsObject'
    ];
    return requiredDecorators.includes(decorator);
  }

  isOptionalDecorator(decorator) {
    const optionalDecorators = [
      'OptionalString', 'OptionalNumber', 'OptionalBoolean', 'OptionalDate',
      'OptionalArray', 'OptionalObject', 'OptionalNested', 'OptionalEnum',
      'ApiPropertyOptional', 'IsOptional'
    ];
    return optionalDecorators.includes(decorator);
  }

  cleanPropertyType(typeString) {
    return typeString
      .replace(/\|/g, ' | ')
      .replace(/\[\]/g, '[]')
      .replace(/<[^>]*>/g, '')
      .trim();
  }

  scanParameters(srcDir) {
    // This method can be extended to scan for additional parameter definitions
    // like validation rules, custom decorators, etc.
  }

  removeDuplicates(routes) {
    const seen = new Set();
    return routes.filter(route => {
      const key = `${route.method}:${route.path}`;
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  }
}

module.exports = EnhancedNestJSScanner;
