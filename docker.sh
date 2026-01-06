
#!/bin/bash

# Docker management script for Laravel app
# Usage: ./docker.sh <command> <environment>
# Commands: build, run, up, down, logs
# Environments: prod, local

COMMAND=$1
ENVIRONMENT=$2

if [ -z "$COMMAND" ] || [ -z "$ENVIRONMENT" ]; then
    echo "Usage: ./docker.sh <command> <environment>"
    echo "Commands: build, run, start, up, down, logs"
    echo "Environments: prod, local"
    echo ""
    echo "Examples:"
    echo "  ./docker.sh build prod    # Build production images"
    echo "  ./docker.sh run local     # Run local tests"
    echo "  ./docker.sh start local   # Start local dev environment (detached)"
    echo "  ./docker.sh up prod       # Start production containers (foreground)"
    echo "  ./docker.sh down local    # Stop local containers"
    exit 1
fi

COMPOSE_FILE=""
if [ "$ENVIRONMENT" = "prod" ]; then
    COMPOSE_FILE="docker-compose.prod.yml"
elif [ "$ENVIRONMENT" = "local" ]; then
    COMPOSE_FILE="docker-compose.local.yml"
else
    echo "Invalid environment. Use 'prod' or 'local'."
    exit 1
fi

case $COMMAND in
    build)
        echo "Building $ENVIRONMENT Docker images..."
        docker compose -f $COMPOSE_FILE build
        ;;
    run)
        if [ "$ENVIRONMENT" = "local" ]; then
            echo "Running local Cypress tests..."
            docker compose -f $COMPOSE_FILE up --build --abort-on-container-exit
        else
            echo "Running production containers..."
            docker compose -f $COMPOSE_FILE up --build
        fi
        ;;
    start)
        echo "Starting $ENVIRONMENT containers in detached mode..."
        docker compose -f $COMPOSE_FILE up --build -d
        ;;
    up)
        echo "Starting $ENVIRONMENT containers..."
        docker compose -f $COMPOSE_FILE up --build
        ;;
    down)
        echo "Stopping $ENVIRONMENT containers..."
        docker compose -f $COMPOSE_FILE down
        ;;
    logs)
        echo "Showing $ENVIRONMENT container logs..."
        docker compose -f $COMPOSE_FILE logs -f
        ;;
    *)
        echo "Invalid command. Use: build, run, start, up, down, logs"
        exit 1
        ;;
esac

echo "Command completed successfully."
