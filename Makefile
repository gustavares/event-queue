.PHONY: build up down logs shell install add dev-deps help

# Variables
DOCKER_COMPOSE = docker compose

# Build commands
build: ## Build the Docker images
	@echo "Building Docker images..."
	@$(DOCKER_COMPOSE) build

# Run commands
up: ## Start all services
	@echo "Starting all services..."
	@$(DOCKER_COMPOSE) up

	# Run commands
up-w: ## Start all services
	@echo "Starting all services..."
	@$(DOCKER_COMPOSE) up --watch

up-d: ## Start all services in detached mode
	@echo "Starting all services in detached mode..."
	@$(DOCKER_COMPOSE) up -d

# Stop commands
down: ## Stop all running containers
	@echo "Stopping containers..."
	@$(DOCKER_COMPOSE) down

# Log commands
logs: ## View logs from all services
	@$(DOCKER_COMPOSE) logs -f

logs-rn: ## View logs from the React Native app
	@$(DOCKER_COMPOSE) logs -f rn-app

# Shell commands
shell-rn: ## Open a shell in the React Native app container
	@$(DOCKER_COMPOSE) exec rn-app sh

# Package management
install-rn: ## Install dependencies for the React Native app
	@$(DOCKER_COMPOSE) exec rn-app pnpm install

add-rn: ## Add a package to the React Native app (usage: make add-rn pkg=PACKAGE_NAME)
	@$(DOCKER_COMPOSE) exec rn-app pnpm add $(pkg)

add-rn-dev: ## Add a dev package to the React Native app (usage: make add-rn-dev pkg=PACKAGE_NAME)
	@$(DOCKER_COMPOSE) exec rn-app pnpm add -D $(pkg)

# Help command
help: ## Display this help message
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | sort | awk 'BEGIN {FS = ":.*?## "}; {printf "\033[36m%-30s\033[0m %s\n", $$1, $$2}'

.DEFAULT_GOAL := help
