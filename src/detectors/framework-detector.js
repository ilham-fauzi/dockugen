const fs = require('fs');
const path = require('path');

class FrameworkDetector {
  constructor() {
    this.frameworks = {
      // Web Frameworks
      express: ['express'],
      fastify: ['fastify'],
      koa: ['koa'],
      hapi: ['hapi', '@hapi/hapi'],
      restify: ['restify'],
      nestjs: ['@nestjs/core', '@nestjs/common'],
      adonisjs: ['@adonisjs/core', 'adonis'],
      sails: ['sails', '@sailsjs/core'],
      loopback: ['@loopback/core', 'loopback'],
      keystone: ['@keystonejs/core', 'keystone'],
      strapi: ['@strapi/core', 'strapi'],
      
      // Full-Stack Frameworks
      nextjs: ['next'],
      nuxtjs: ['nuxt', '@nuxt/core'],
      gatsby: ['gatsby'],
      remix: ['@remix-run/node', 'remix'],
      astro: ['astro'],
      
      // Frontend Frameworks
      react: ['react', '@react/core'],
      vue: ['vue', '@vue/core'],
      angular: ['@angular/core', 'angular'],
      svelte: ['svelte', '@svelte/core'],
      solid: ['solid-js', '@solid/core'],
      qwik: ['@qwik/core', 'qwik'],
      
      // Database ORMs
      prisma: ['@prisma/client', 'prisma'],
      typeorm: ['typeorm', '@typeorm/core'],
      sequelize: ['sequelize'],
      mongoose: ['mongoose'],
      knex: ['knex'],
      
      // GraphQL
      apollo: ['apollo-server', '@apollo/server'],
      mercurius: ['mercurius', '@mercuriusjs/core'],
      yoga: ['@graphql-yoga/core', '@graphql-yoga/node'],
      
      // Microservices
      moleculer: ['moleculer', '@moleculer/core'],
      seneca: ['seneca', '@seneca/core'],
      
      // Real-time
      socketio: ['socket.io', '@socket.io/core'],
      ws: ['ws'],
      uws: ['uws'],
      
      // CMS
      ghost: ['ghost', '@ghost/core'],
      wordpress: ['@wordpress/core', 'wordpress'],
      drupal: ['@drupal/core', 'drupal'],
      
      // E-commerce
      shopify: ['@shopify/core', 'shopify'],
      woocommerce: ['@woocommerce/core', 'woocommerce'],
      magento: ['@magento/core', 'magento'],
      
      // Generic patterns
      generic: []
    };
  }

  detect(projectRoot) {
    try {
      const packagePath = path.join(projectRoot, 'package.json');
      if (!fs.existsSync(packagePath)) {
        return 'generic';
      }

      const pkg = JSON.parse(fs.readFileSync(packagePath, 'utf8'));
      const allDeps = { 
        ...pkg.dependencies, 
        ...pkg.devDependencies,
        ...pkg.peerDependencies,
        ...pkg.optionalDependencies
      };

      // Check each framework
      for (const [framework, packages] of Object.entries(this.frameworks)) {
        for (const pkg of packages) {
          if (allDeps[pkg]) {
            return framework;
          }
        }
      }

      // Check for custom patterns
      return this.detectCustomFramework(pkg, allDeps);
      
    } catch (error) {
      console.warn('⚠️  Could not read package.json:', error.message);
      return 'generic';
    }
  }

  detectCustomFramework(pkg, deps) {
    // Check for custom server patterns
    if (pkg.scripts) {
      const scripts = Object.values(pkg.scripts).join(' ');
      if (scripts.includes('start') || scripts.includes('dev') || scripts.includes('serve')) {
        return 'custom-server';
      }
    }

    // Check for specific keywords in description/name
    const projectInfo = `${pkg.name || ''} ${pkg.description || ''}`.toLowerCase();
    
    if (projectInfo.includes('api') || projectInfo.includes('server')) {
      return 'api-server';
    }
    
    if (projectInfo.includes('microservice') || projectInfo.includes('micro')) {
      return 'microservice';
    }
    
    if (projectInfo.includes('fullstack') || projectInfo.includes('full-stack')) {
      return 'fullstack';
    }

    return 'generic';
  }

  getFrameworkInfo(framework) {
    const info = {
      express: {
        name: 'Express.js',
        description: 'Fast, unopinionated, minimalist web framework',
        patterns: ['app.get()', 'router.get()', 'app.use()'],
        website: 'https://expressjs.com'
      },
      fastify: {
        name: 'Fastify',
        description: 'Fast and low overhead web framework',
        patterns: ['fastify.get()', 'fastify.post()', 'fastify.route()'],
        website: 'https://fastify.io'
      },
      koa: {
        name: 'Koa.js',
        description: 'Next generation web framework',
        patterns: ['app.use()', 'app.get()', 'app.post()'],
        website: 'https://koajs.com'
      },
      nestjs: {
        name: 'NestJS',
        description: 'Progressive Node.js framework',
        patterns: ['@Get()', '@Post()', '@Controller()'],
        website: 'https://nestjs.com'
      },
      nextjs: {
        name: 'Next.js',
        description: 'React framework for production',
        patterns: ['pages/api/', 'app/api/', 'getServerSideProps'],
        website: 'https://nextjs.org'
      },
      nuxtjs: {
        name: 'Nuxt.js',
        description: 'Vue.js framework for production',
        patterns: ['pages/api/', 'server/api/', 'serverMiddleware'],
        website: 'https://nuxtjs.org'
      },
      generic: {
        name: 'Generic Node.js',
        description: 'Custom Node.js application',
        patterns: ['http.createServer()', 'custom routing'],
        website: 'https://nodejs.org'
      }
    };

    return info[framework] || info.generic;
  }
}

module.exports = FrameworkDetector;
