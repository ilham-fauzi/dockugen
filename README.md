# 🚀 DockuGen

> Auto-generate API documentation for Node.js apps - **Zero config, multi-framework support!**

DockuGen adalah package Node.js yang otomatis mendeteksi dan generate dokumentasi API dari kode aplikasi Anda tanpa perlu memodifikasi kode yang sudah ada.

## ✨ Features

- 🔍 **Auto-detection** - Otomatis detect framework dan route
- 🚀 **Zero Config** - Tidak perlu config file
- 📱 **Multi Framework** - Support Express, Fastify, Koa, Hapi, dll
- 📄 **Multiple Formats** - Swagger, Markdown, Postman, HTML
- ⚡ **Super Fast** - Generate docs dalam hitungan detik
- 🎯 **Smart Parsing** - Otomatis detect parameter dan middleware

## 🚀 Quick Start

### Install

```bash
# Install globally
npm install -g dockugen

# Atau install di project
npm install --save-dev dockugen
```

### Usage

```bash
# Generate docs (super simple!)
dockugen

# Output ke folder custom
dockugen --out ./docs

# Format tertentu
dockugen --format swagger

# Verbose output
dockugen --verbose
```

## 📁 Output

Setelah menjalankan `dockugen`, Anda akan mendapatkan:

```
api-docs/
├── swagger.json      # OpenAPI 3.0 specification
├── api.md           # Markdown documentation
├── postman.json     # Postman collection
└── index.html       # Beautiful HTML docs
```

## 🔧 Supported Frameworks

- ✅ **Express.js** - `app.get('/path', handler)`
- ✅ **Fastify** - `fastify.get('/path', handler)`
- ✅ **Koa** - `app.get('/path', handler)`
- ✅ **Hapi** - `server.route()`
- ✅ **Restify** - `server.get('/path', handler)`
- ✅ **Native Node.js** - `http.createServer()`

## 📝 Examples

### Express.js App

```javascript
// app.js
const express = require('express');
const app = express();

app.get('/users', (req, res) => {
  res.json({ users: [] });
});

app.post('/users', (req, res) => {
  res.json({ message: 'User created' });
});

app.get('/users/:id', (req, res) => {
  res.json({ user: { id: req.params.id } });
});

app.listen(3000);
```

Jalankan:
```bash
dockugen
```

Hasil:
- ✅ Auto-detect Express framework
- ✅ Auto-detect 3 routes
- ✅ Auto-detect parameter `:id`
- ✅ Generate Swagger, Markdown, Postman, HTML

### Fastify App

```javascript
// server.js
const fastify = require('fastify')();

fastify.get('/api/health', async (request, reply) => {
  return { status: 'OK' };
});

fastify.post('/api/users', async (request, reply) => {
  return { message: 'User created' };
});

fastify.listen(3000);
```

Jalankan:
```bash
swagjs
```

## 🎯 CLI Options

```bash
dockugen [options]

Options:
  -o, --out <dir>        Output directory (default: ./api-docs)
  -f, --format <format>  Output format: swagger, markdown, postman, html, all (default: all)
  -s, --src <dir>        Source directory to scan (default: auto-detect)
  -v, --verbose          Verbose output
  -h, --help             Display help
  -V, --version          Display version
```

## 🔄 CI/CD Integration

### GitHub Actions

```yaml
name: Generate API Docs
on: [push, pull_request]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - run: npm install -g dockugen
- run: dockugen --out ./docs
      - name: Commit docs
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/
          git commit -m "Update API documentation" || exit 0
          git push
```

### GitLab CI

```yaml
generate_docs:
  stage: build
  image: node:16
  script:
    - npm install -g dockugen
- dockugen --out ./docs
  artifacts:
    paths:
      - docs/
```

### Package.json Scripts

```json
{
  "scripts": {
    "docs": "dockugen",
"docs:watch": "dockugen --watch",
"docs:swagger": "dockugen --format swagger"
  }
}
```

## 🏗️ Project Structure Detection

DockuGen otomatis detect struktur project:

```
project/
├── src/           ✅ Auto-detect
├── app/           ✅ Auto-detect  
├── routes/        ✅ Auto-detect
├── controllers/   ✅ Auto-detect
├── api/           ✅ Auto-detect
└── lib/           ✅ Auto-detect
```

## 🔍 Route Detection

Otomatis detect berbagai pattern route:

```javascript
// Express
app.get('/users', handler);           // ✅ GET /users
router.post('/users', handler);       // ✅ POST /users

// Fastify
fastify.get('/api/health', handler);  // ✅ GET /api/health

// Koa
app.put('/users/:id', handler);       // ✅ PUT /users/:id

// Generic
server.get('/status', handler);       // ✅ GET /status
```

## 📊 Generated Documentation

### Swagger/OpenAPI 3.0

```json
{
  "openapi": "3.0.0",
  "paths": {
    "/users": {
      "get": {
        "summary": "GET /users",
        "tags": ["app"],
        "responses": {
          "200": {
            "description": "Successful response"
          }
        }
      }
    }
  }
}
```

### Markdown

```markdown
# API Documentation

## GET Routes

### /users
- **Method**: `GET`
- **File**: `app.js`
- **Line**: `5`
- **Framework**: `express`
```

## 🚀 Advanced Usage

### Programmatic Usage

```javascript
const { SimpleScanner } = require('dockugen');

const scanner = new SimpleScanner();
const routes = scanner.scan({
  out: './custom-docs',
  format: 'swagger'
});

console.log(`Found ${routes.length} routes`);
```

### Custom Output Directory

```bash
dockugen --out ./my-docs
```

### Specific Format

```bash
# Hanya generate Swagger
dockugen --format swagger

# Hanya generate Markdown
dockugen --format markdown

# Hanya generate Postman
dockugen --format postman

# Hanya generate HTML
dockugen --format html
```

## 🔧 Configuration

DockuGen tidak memerlukan config file! Semua otomatis:

- ✅ **Framework Detection** - Auto dari package.json
- ✅ **Source Directory** - Auto detect folder structure
- ✅ **Route Patterns** - Auto detect semua pattern
- ✅ **Output Formats** - Generate semua format sekaligus

## 🐛 Troubleshooting

### Common Issues

1. **No routes found**
   - Pastikan file JavaScript/TypeScript ada di folder yang benar
   - Check apakah route menggunakan pattern yang standard

2. **Permission denied**
   - Pastikan folder output bisa di-write
   - Gunakan `sudo` jika perlu

3. **Framework not detected**
   - Pastikan dependencies ada di package.json
   - Check versi Node.js (minimal 14.0.0)

### Debug Mode

```bash
dockugen --verbose
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

MIT License - lihat [LICENSE](LICENSE) file untuk detail.

## 🙏 Acknowledgments

- Terinspirasi dari [Swaggo](https://github.com/swaggo/swag) untuk Go
- Dibuat dengan ❤️ untuk komunitas Node.js

---

**DockuGen** - Zero config, multi-framework support! 🚀
