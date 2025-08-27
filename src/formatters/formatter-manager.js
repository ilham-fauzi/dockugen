const fs = require('fs');
const path = require('path');

class FormatterManager {
  constructor() {
    this.formatters = new Map();
    this.registerFormatters();
  }

  registerFormatters() {
    this.formatters.set('swagger', this.formatSwagger.bind(this));
    this.formatters.set('markdown', this.formatMarkdown.bind(this));
    this.formatters.set('openapi', this.formatOpenAPI.bind(this));
    this.formatters.set('json', this.formatJSON.bind(this));
  }

  formatSwagger(data, options = {}) {
    const {
      title = 'API Documentation',
      description = 'Auto-generated API documentation',
      version = '1.0.0'
    } = options;

    const swaggerDoc = {
      openapi: '3.0.0',
      info: {
        title,
        description,
        version
      },
      paths: {},
      components: {
        schemas: {}
      }
    };

    if (data.routes && Array.isArray(data.routes)) {
      data.routes.forEach(route => {
        const pathKey = route.path;
        if (!swaggerDoc.paths[pathKey]) {
          swaggerDoc.paths[pathKey] = {};
        }

        const methodKey = route.method.toLowerCase();
        const operation = {
          tags: [route.controller || 'default'],
          summary: `${route.method} ${route.path}`,
          description: `Endpoint from ${route.controller || 'unknown controller'}`,
          parameters: [],
          responses: {
            '200': {
              description: 'Successful operation',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    description: 'Response data'
                  }
                }
              }
            }
          }
        };

        if (route.parameters) {
          // Try to determine request body from method name and controller
          if (route.method === 'POST' || route.method === 'PUT' || route.method === 'PATCH') {
            // Look for matching DTO based on route path and method
            const possibleDtoName = this.findMatchingDTO(route, data.dtos);
            
            if (possibleDtoName && data.dtos[possibleDtoName]) {
              operation.requestBody = {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      $ref: `#/components/schemas/${possibleDtoName}`
                    }
                  }
                }
              };
            } else {
              // Fallback to generic object
              operation.requestBody = {
                required: true,
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      description: 'Request body'
                    }
                  }
                }
              };
            }
          }

          if (route.parameters.query && route.parameters.query.length > 0) {
            route.parameters.query.forEach(query => {
              operation.parameters.push({
                name: query.name,
                in: 'query',
                required: query.required,
                schema: {
                  type: this.mapTypeToSwagger(query.type)
                },
                description: `${query.name} query parameter`
              });
            });
          }

          if (route.parameters.params && route.parameters.params.length > 0) {
            route.parameters.params.forEach(param => {
              operation.parameters.push({
                name: param.name,
                in: 'path',
                required: param.required,
                schema: {
                  type: this.mapTypeToSwagger(param.type)
                },
                description: `${param.name} path parameter`
              });
            });
          }

          if (route.parameters.headers && route.parameters.headers.length > 0) {
            route.parameters.headers.forEach(header => {
              operation.parameters.push({
                name: header.name,
                in: 'header',
                required: header.required,
                schema: {
                  type: this.mapTypeToSwagger(header.type)
                },
                description: `${header.name} header parameter`
              });
            });
          }
        }

        swaggerDoc.paths[pathKey][methodKey] = operation;
      });
    }

    // Process DTOs and add them to components/schemas
    if (data.dtos && typeof data.dtos === 'object') {
      Object.keys(data.dtos).forEach(dtoName => {
        const dto = data.dtos[dtoName];
        if (dto && dto.properties) {
          // Convert DTO properties to Swagger schema format
          const properties = {};
          const required = [];
          
          dto.properties.forEach(prop => {
            properties[prop.name] = {
              type: this.mapTypeToSwagger(prop.type),
              description: `${prop.name} property`,
              ...(prop.required && { required: true })
            };
            
            if (prop.required) {
              required.push(prop.name);
            }
          });
          
          swaggerDoc.components.schemas[dtoName] = {
            type: 'object',
            properties,
            ...(required.length > 0 && { required })
          };
        }
      });
    }

    return swaggerDoc;
  }

  formatMarkdown(data, options = {}) {
    const {
      title = 'API Documentation',
      description = 'Auto-generated API documentation'
    } = options;

    let markdown = `# ${title}\n\n`;
    markdown += `${description}\n\n`;

    if (data.routes && Array.isArray(data.routes)) {
      const routesByController = {};
      data.routes.forEach(route => {
        const controller = route.controller || 'default';
        if (!routesByController[controller]) {
          routesByController[controller] = [];
        }
        routesByController[controller].push(route);
      });

      Object.keys(routesByController).forEach(controller => {
        markdown += `## ${controller}\n\n`;

        routesByController[controller].forEach(route => {
          markdown += `### ${route.method} ${route.path}\n\n`;
          markdown += `**Controller:** ${route.controller}\n`;
          if (route.file) markdown += `**File:** ${route.file}\n`;
          if (route.line) markdown += `**Line:** ${route.line}\n`;
          markdown += '\n';

          if (route.parameters) {
            if (route.parameters.body) {
              markdown += `**Request Body:**\n`;
              markdown += `- Type: ${route.parameters.body.type}\n`;
              if (route.parameters.body.schema && route.parameters.body.schema.properties) {
                markdown += `- Properties:\n`;
                Object.keys(route.parameters.body.schema.properties).forEach(prop => {
                  const propInfo = route.parameters.body.schema.properties[prop];
                  markdown += `  - \`${prop}\` (${propInfo.type})${propInfo.required ? ' - required' : ''}: ${propInfo.description}\n`;
                });
              }
              markdown += '\n';
            }

            if (route.parameters.query && route.parameters.query.length > 0) {
              markdown += `**Query Parameters:**\n`;
              route.parameters.query.forEach(query => {
                markdown += `- \`${query.name}\` (${query.type})${query.required ? ' - required' : ''}\n`;
              });
              markdown += '\n';
            }

            if (route.parameters.params && route.parameters.params.length > 0) {
              markdown += `**Path Parameters:**\n`;
              route.parameters.params.forEach(param => {
                markdown += `- \`${param.name}\` (${param.type})${param.required ? ' - required' : ''}\n`;
              });
              markdown += '\n';
            }

            if (route.parameters.headers && route.parameters.headers.length > 0) {
              markdown += `**Headers:**\n`;
              route.parameters.headers.forEach(header => {
                markdown += `- \`${header.name}\` (${header.type})${header.required ? ' - required' : ''}\n`;
              });
              markdown += '\n';
            }
          }

          markdown += '---\n\n';
        });
      });
    }

    return markdown;
  }

  formatOpenAPI(data, options = {}) {
    return this.formatSwagger(data, options);
  }

  formatJSON(data, options = {}) {
    return JSON.stringify(data, null, 2);
  }

  mapTypeToSwagger(type) {
    if (!type) return 'string';
    
    const typeStr = type.toString().toLowerCase();
    
    // Basic types
    if (typeStr.includes('string')) return 'string';
    if (typeStr.includes('number')) return 'number';
    if (typeStr.includes('boolean')) return 'boolean';
    if (typeStr.includes('date')) return 'string';
    
    // Array types
    if (typeStr.includes('[]') || typeStr.includes('array')) return 'array';
    
    // Custom types (like PickupMethod, PackageDTO, etc.)
    if (typeStr.includes('dto') || typeStr.includes('enum') || typeStr.includes('method')) {
      return 'string'; // For now, treat custom types as string
    }
    
    // Default fallback
    return 'string';
  }

  format(data, format = 'all', options = {}) {
    const results = {};
    const outDir = options.out || './api-docs';

    if (!fs.existsSync(outDir)) {
      fs.mkdirSync(outDir, { recursive: true });
    }

    if (format === 'all' || format === 'swagger') {
      const swaggerDoc = this.formatSwagger(data, options);
      const swaggerPath = path.join(outDir, 'swagger.json');
      fs.writeFileSync(swaggerPath, JSON.stringify(swaggerDoc, null, 2));
      results.swagger = swaggerPath;
      console.log(`📄 Generated Swagger JSON: ${swaggerPath}`);
    }

    if (format === 'all' || format === 'markdown') {
      const markdown = this.formatMarkdown(data, options);
      const markdownPath = path.join(outDir, 'api-documentation.md');
      fs.writeFileSync(markdownPath, markdown);
      results.markdown = markdownPath;
      console.log(`📝 Generated Markdown: ${markdownPath}`);
    }

    if (format === 'all' || format === 'openapi') {
      const openapiDoc = this.formatOpenAPI(data, options);
      const openapiPath = path.join(outDir, 'openapi.json');
      fs.writeFileSync(openapiPath, JSON.stringify(openapiDoc, null, 2));
      results.openapi = openapiPath;
      console.log(`🔓 Generated OpenAPI JSON: ${openapiPath}`);
    }

    if (format === 'all' || format === 'json') {
      const jsonData = this.formatJSON(data, options);
      const jsonPath = path.join(outDir, 'api-data.json');
      fs.writeFileSync(jsonPath, jsonData);
      results.json = jsonPath;
      console.log(`📊 Generated JSON: ${jsonPath}`);
    }

    return results;
  }

  findMatchingDTO(route, dtos) {
    if (!dtos || !route) return null;
    
    // Common DTO naming patterns
    const routePath = route.path.toLowerCase();
    const controller = route.controller || '';
    
    // Look for exact matches first
    if (routePath.includes('request') && dtos['RequestPickupDTO']) {
      return 'RequestPickupDTO';
    }
    if (routePath.includes('booking') && dtos['BookingPickupDTO']) {
      return 'BookingPickupDTO';
    }
    if (routePath.includes('confirm') && dtos['ConfirmPickupDTO']) {
      return 'ConfirmPickupDTO';
    }
    if (routePath.includes('cancel') && dtos['CancelPickupDTO']) {
      return 'CancelPickupDTO';
    }
    if (routePath.includes('tiktok') && dtos['TikTokRequestPickupDTO']) {
      return 'TikTokRequestPickupDTO';
    }
    if (routePath.includes('lazada') && dtos['LazadaRequestPickupDTO']) {
      return 'LazadaRequestPickupDTO';
    }
    
    // Look for controller-based matches
    if (controller === 'partner' && dtos['RequestPickupDTO']) {
      return 'RequestPickupDTO';
    }
    if (controller === 'tiktok' && dtos['TikTokRequestPickupDTO']) {
      return 'TikTokRequestPickupDTO';
    }
    
    return null;
  }

  listAvailableFormats() {
    return Array.from(this.formatters.keys());
  }
}

module.exports = FormatterManager;
