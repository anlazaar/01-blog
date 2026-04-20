#!/bin/bash

echo "Stopping container and deleting database volume..."
docker compose down --volumes --remove-orphans

echo "Rebuilding and restarting containers..."
docker compose up -d --build


echo "App restarted with a fresh database. Tailing backend logs..."
docker compose logs -f backend