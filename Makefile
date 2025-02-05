# Project Variables
COMPOSE=docker compose
DB_CONTAINER=postgres-db
DB_USER=admin
DB_NAME=localevent

# Start the project (Docker Compose)
up:
	$(COMPOSE) up --build

# Stop and remove containers
down:
	$(COMPOSE) down

# Restart the project
restart:
	$(COMPOSE) down && $(COMPOSE) up --build

# Access PostgreSQL Database
db:
	docker exec -it $(DB_CONTAINER) psql -U $(DB_USER) -d $(DB_NAME)

# Show running containers
ps:
	docker ps

# Tail logs from all containers
logs:
	$(COMPOSE) logs -f

# Tail logs from PostgreSQL container
db-logs:
	$(COMPOSE) logs -f $(DB_CONTAINER)

# Remove all stopped containers, networks, and volumes
clean:
	$(COMPOSE) down -v && docker system prune -f

# Help command to list all available commands
help:
	@echo "Available commands:"
	@echo "  make up         - Start the entire Docker Compose setup"
	@echo "  make down       - Stop and remove all containers"
	@echo "  make restart    - Restart all containers"
	@echo "  make db         - Access PostgreSQL database via docker exec"
	@echo "  make ps         - Show running containers"
	@echo "  make logs       - Show logs for all services"
	@echo "  make db-logs    - Show logs for PostgreSQL"
	@echo "  make clean      - Remove stopped containers and prune Docker system"
