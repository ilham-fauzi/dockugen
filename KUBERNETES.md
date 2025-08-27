# 🚀 DockuGen Kubernetes Deployment Guide

This guide explains how to deploy DockuGen to Kubernetes for production use with CI/CD integration.

## 📋 Table of Contents

- [Prerequisites](#prerequisites)
- [Quick Start](#quick-start)
- [Architecture](#architecture)
- [Deployment Options](#deployment-options)
- [Configuration](#configuration)
- [Monitoring & Health Checks](#monitoring--health-checks)
- [CI/CD Integration](#cicd-integration)
- [Troubleshooting](#troubleshooting)

## 🔧 Prerequisites

### Required Tools
- `kubectl` - Kubernetes command line tool
- `helm` - Kubernetes package manager (optional)
- `docker` - For building container images
- Access to a Kubernetes cluster

### Cluster Requirements
- Kubernetes 1.19+
- 2GB RAM available
- 2 CPU cores available
- 50GB storage available
- Ingress controller (nginx, traefik, etc.)

## 🚀 Quick Start

### 1. Build Docker Image
```bash
# Build the image
docker build -t dockugen:1.0.0 .

# Tag for your registry (optional)
docker tag dockugen:1.0.0 your-registry/dockugen:1.0.0
docker push your-registry/dockugen:1.0.0
```

### 2. Deploy to Kubernetes
```bash
# Using the deployment script
chmod +x scripts/deploy-k8s.sh
./scripts/deploy-k8s.sh

# Or manually with kubectl
kubectl apply -f k8s/
```

### 3. Verify Deployment
```bash
kubectl get all -n dockugen
kubectl get services -n dockugen
```

## 🏗️ Architecture

### Components
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Ingress       │    │   Load Balancer │    │   External      │
│   Controller    │◄──►│   Service       │◄──►│   Access        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Nginx         │    │   DockuGen      │
│   Service       │    │   Service       │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Nginx Pod     │    │   DockuGen Pod  │
│   (Docs Viewer) │    │   (API Gen)     │
└─────────────────┘    └─────────────────┘
         │                       │
         ▼                       ▼
┌─────────────────┐    ┌─────────────────┐
│   Output PVC    │    │   Project PVC   │
│   (Generated)   │    │   (Source Code) │
└─────────────────┘    └─────────────────┘
```

### Data Flow
1. **Source Code** → Project PVC (read-only)
2. **DockuGen** → Scans source code and generates docs
3. **Output** → Generated docs stored in Output PVC
4. **Nginx** → Serves generated docs via web interface
5. **CronJob** → Scheduled regeneration every 6 hours

## 🚀 Deployment Options

### Option 1: kubectl (Recommended for beginners)
```bash
# Apply all manifests
kubectl apply -f k8s/

# Check status
kubectl get all -n dockugen
```

### Option 2: Helm Chart
```bash
# Install Helm chart
helm install dockugen ./helm --namespace dockugen

# Upgrade existing installation
helm upgrade dockugen ./helm --namespace dockugen
```

### Option 3: Deployment Script
```bash
# Run automated deployment
./scripts/deploy-k8s.sh

# Deploy with Helm
./scripts/deploy-k8s.sh helm
```

## ⚙️ Configuration

### Environment Variables
```yaml
# ConfigMap: k8s/configmap.yaml
data:
  DOCKUGEN_VERSION: "1.0.0"
  NODE_ENV: "production"
  LOG_LEVEL: "info"
  DEFAULT_OUTPUT_DIR: "/app/output"
  DEFAULT_FORMAT: "all"
```

### Resource Limits
```yaml
resources:
  requests:
    memory: "256Mi"
    cpu: "250m"
  limits:
    memory: "512Mi"
    cpu: "500m"
```

### Storage Configuration
```yaml
# Persistent Volume Claims
- dockugen-output-pvc: 10Gi (generated docs)
- dockugen-project-pvc: 20Gi (source code)
- dockugen-cache-pvc: 5Gi (cache files)
```

## 📊 Monitoring & Health Checks

### Health Check Endpoints
- **DockuGen**: `/health` on port 3000
- **Nginx**: `/health` on port 80
- **Metrics**: `/metrics` on port 8080

### Prometheus Integration
```yaml
annotations:
  prometheus.io/scrape: "true"
  prometheus.io/port: "3000"
  prometheus.io/path: "/metrics"
```

### Logging
```bash
# View logs
kubectl logs -f deployment/dockugen -n dockugen
kubectl logs -f deployment/dockugen -c nginx -n dockugen

# Log aggregation (if configured)
kubectl logs -l app=dockugen -n dockugen
```

## 🔄 CI/CD Integration

### GitLab CI/CD
```yaml
# .gitlab-ci.yml
generate_docs:
  stage: docs
  image: node:18
  script:
    - npm install -g dockugen
    - dockugen generate --out ./docs
  artifacts:
    paths:
      - docs/
```

### GitHub Actions
```yaml
# .github/workflows/docs.yml
- name: Generate API Docs
  run: |
    npm install -g dockugen
    dockugen generate --out ./docs
```

### Jenkins Pipeline
```groovy
stage('Generate Docs') {
    steps {
        sh 'npm install -g dockugen'
        sh 'dockugen generate --out ./docs'
    }
}
```

### Scheduled Generation
```yaml
# CronJob runs every 6 hours
schedule: "0 */6 * * *"
```

## 🐛 Troubleshooting

### Common Issues

#### 1. Pods Not Starting
```bash
# Check pod status
kubectl describe pod <pod-name> -n dockugen

# Check logs
kubectl logs <pod-name> -n dockugen
```

#### 2. Services Not Accessible
```bash
# Check service endpoints
kubectl get endpoints -n dockugen

# Test internal connectivity
kubectl exec -it <pod-name> -n dockugen -- curl localhost:3000/health
```

#### 3. Storage Issues
```bash
# Check PVC status
kubectl get pvc -n dockugen

# Check PV status
kubectl get pv
```

#### 4. Resource Constraints
```bash
# Check resource usage
kubectl top pods -n dockugen

# Check node resources
kubectl top nodes
```

### Debug Commands
```bash
# Get all resources
kubectl get all -n dockugen

# Describe specific resource
kubectl describe deployment dockugen -n dockugen

# Port forward for local access
kubectl port-forward service/dockugen-service 3000:3000 -n dockugen

# Execute commands in pod
kubectl exec -it <pod-name> -n dockugen -- /bin/sh
```

## 📚 Advanced Configuration

### Custom Ingress
```yaml
# Update k8s/service.yaml
spec:
  rules:
  - host: api-docs.yourcompany.com
    http:
      paths:
      - path: /
        pathType: Prefix
        backend:
          service:
            name: dockugen-nginx-service
            port:
              number: 80
```

### SSL/TLS Configuration
```yaml
# With cert-manager
spec:
  tls:
  - hosts:
    - api-docs.yourcompany.com
    secretName: dockugen-tls
```

### Horizontal Pod Autoscaling
```yaml
apiVersion: autoscaling/v2
kind: HorizontalPodAutoscaler
metadata:
  name: dockugen-hpa
spec:
  scaleTargetRef:
    apiVersion: apps/v1
    kind: Deployment
    name: dockugen
  minReplicas: 2
  maxReplicas: 10
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

## 🔐 Security Considerations

### Security Context
```yaml
securityContext:
  allowPrivilegeEscalation: false
  runAsNonRoot: true
  runAsUser: 1001
  capabilities:
    drop:
    - ALL
```

### Network Policies
```yaml
apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: dockugen-network-policy
spec:
  podSelector:
    matchLabels:
      app: dockugen
  policyTypes:
  - Ingress
  - Egress
  ingress:
  - from:
    - namespaceSelector:
        matchLabels:
          name: ingress-nginx
    ports:
    - protocol: TCP
      port: 80
    - protocol: TCP
      port: 3000
```

## 📈 Scaling & Performance

### Performance Tuning
- **Memory**: Increase limits for large projects
- **CPU**: Adjust based on scanning complexity
- **Storage**: Use SSD-backed storage for better I/O
- **Caching**: Enable Redis for metadata caching

### Monitoring Metrics
- **Response Time**: API generation latency
- **Throughput**: Docs generated per hour
- **Resource Usage**: CPU, memory, storage
- **Error Rate**: Failed generation attempts

## 🚀 Next Steps

1. **Customize Configuration**: Update values.yaml for your environment
2. **Set Up Monitoring**: Configure Prometheus and Grafana
3. **Implement CI/CD**: Integrate with your existing pipeline
4. **Add Authentication**: Implement OAuth or API keys
5. **Set Up Backup**: Configure backup for generated documentation

## 📞 Support

- **GitHub Issues**: [https://github.com/ilham-fauzi/dockugen/issues](https://github.com/ilham-fauzi/dockugen/issues)
- **Documentation**: [https://github.com/ilham-fauzi/dockugen](https://github.com/ilham-fauzi/dockugen)
- **Community**: Join our discussions and contribute!

---

**Happy Deploying! 🎉**
