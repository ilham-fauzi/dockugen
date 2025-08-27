#!/bin/bash

# DockuGen Kubernetes Deployment Script
# This script deploys DockuGen to a Kubernetes cluster

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration
NAMESPACE="dockugen"
CHART_PATH="./helm"
VALUES_FILE="./helm/values.yaml"

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Function to check prerequisites
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    # Check if kubectl is installed
    if ! command -v kubectl &> /dev/null; then
        print_error "kubectl is not installed. Please install kubectl first."
        exit 1
    fi
    
    # Check if helm is installed
    if ! command -v helm &> /dev/null; then
        print_warning "Helm is not installed. Installing via script..."
        curl https://raw.githubusercontent.com/helm/helm/main/scripts/get-helm-3 | bash
    fi
    
    # Check if cluster is accessible
    if ! kubectl cluster-info &> /dev/null; then
        print_error "Cannot connect to Kubernetes cluster. Please check your kubeconfig."
        exit 1
    fi
    
    print_success "Prerequisites check passed!"
}

# Function to create namespace
create_namespace() {
    print_status "Creating namespace: $NAMESPACE"
    
    if kubectl get namespace $NAMESPACE &> /dev/null; then
        print_warning "Namespace $NAMESPACE already exists"
    else
        kubectl create namespace $NAMESPACE
        print_success "Namespace $NAMESPACE created"
    fi
}

# Function to deploy with Helm
deploy_with_helm() {
    print_status "Deploying DockuGen with Helm..."
    
    if [ -f "$VALUES_FILE" ]; then
        helm upgrade --install dockugen $CHART_PATH \
            --namespace $NAMESPACE \
            --values $VALUES_FILE \
            --wait \
            --timeout 10m
    else
        helm upgrade --install dockugen $CHART_PATH \
            --namespace $NAMESPACE \
            --wait \
            --timeout 10m
    fi
    
    print_success "Helm deployment completed!"
}

# Function to deploy with kubectl
deploy_with_kubectl() {
    print_status "Deploying DockuGen with kubectl..."
    
    # Apply all Kubernetes manifests
    kubectl apply -f k8s/namespace.yaml
    kubectl apply -f k8s/configmap.yaml
    kubectl apply -f k8s/rbac.yaml
    kubectl apply -f k8s/persistent-volumes.yaml
    kubectl apply -f k8s/deployment.yaml
    kubectl apply -f k8s/service.yaml
    kubectl apply -f k8s/cronjob.yaml
    
    print_success "Kubernetes deployment completed!"
}

# Function to check deployment status
check_deployment() {
    print_status "Checking deployment status..."
    
    # Wait for pods to be ready
    kubectl wait --for=condition=ready pod -l app=dockugen -n $NAMESPACE --timeout=300s
    
    # Show deployment status
    kubectl get all -n $NAMESPACE
    
    # Show service endpoints
    kubectl get endpoints -n $NAMESPACE
    
    print_success "Deployment status check completed!"
}

# Function to show access information
show_access_info() {
    print_status "DockuGen deployment information:"
    
    echo -e "${GREEN}Namespace:${NC} $NAMESPACE"
    echo -e "${GREEN}Services:${NC}"
    kubectl get services -n $NAMESPACE
    
    echo -e "${GREEN}Pods:${NC}"
    kubectl get pods -n $NAMESPACE
    
    echo -e "${GREEN}Access URLs:${NC}"
    echo "  - Internal API: http://dockugen-service.$NAMESPACE.svc.cluster.local:3000"
    echo "  - Documentation: http://dockugen-nginx-service.$NAMESPACE.svc.cluster.local:80"
    
    print_success "Access information displayed!"
}

# Function to run tests
run_tests() {
    print_status "Running deployment tests..."
    
    # Test if pods are running
    if kubectl get pods -n $NAMESPACE -l app=dockugen --field-selector=status.phase=Running | grep -q dockugen; then
        print_success "Pods are running successfully"
    else
        print_error "Some pods are not running"
        exit 1
    fi
    
    # Test if services are accessible
    if kubectl get endpoints -n $NAMESPACE dockugen-service | grep -q ":"; then
        print_success "Services are accessible"
    else
        print_error "Services are not accessible"
        exit 1
    fi
    
    print_success "All tests passed!"
}

# Main deployment function
main() {
    print_status "Starting DockuGen Kubernetes deployment..."
    
    check_prerequisites
    create_namespace
    
    # Choose deployment method
    if [ "$1" = "helm" ] || [ -d "$CHART_PATH" ]; then
        deploy_with_helm
    else
        deploy_with_kubectl
    fi
    
    check_deployment
    run_tests
    show_access_info
    
    print_success "DockuGen deployment completed successfully!"
    print_status "You can now access DockuGen in your Kubernetes cluster."
}

# Run main function with arguments
main "$@"
