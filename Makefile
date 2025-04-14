.PHONY: build up up-w up-d down logs start-rn install-rn add-rn add-rn-dev dev-rn help

# Variables
DOCKER_COMPOSE = docker compose

# Docker commands for backend services
build: ## Build the Docker images for backend services
	@echo "Building Docker images..."
	@$(DOCKER_COMPOSE) build

up: ## Start all backend services
	@echo "Starting backend services..."
	@$(DOCKER_COMPOSE) up

up-w: ## Start all backend services with watch mode
	@echo "Starting backend services with watch mode..."
	@$(DOCKER_COMPOSE) up --watch

up-d: ## Start all backend services in detached mode
	@echo "Starting backend services in detached mode..."
	@$(DOCKER_COMPOSE) up -d

down: ## Stop all running containers
	@echo "Stopping containers..."
	@$(DOCKER_COMPOSE) down

logs: ## View logs from all backend services
	@$(DOCKER_COMPOSE) logs -f

# React Native local development commands
start-rn: ## Start the React Native app locally
	@echo "Starting React Native app locally..."
	@cd rn-app && pnpm dev

dev-rn: ## Start the React Native app with tunnel option
	@echo "Starting React Native app with tunnel..."
	@cd rn-app && pnpm dev -- --tunnel

clean-rn: ## Clean React Native app cache
	@echo "Cleaning React Native cache..."
	@cd rn-app && pnpm cache clean && rm -rf node_modules/.cache

# Help command
help: ## Display this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
