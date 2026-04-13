#!/bin/bash

echo "Rebuilding and restarting the backend container ..."

docker compose up -d --build backend

echo "Backend updated and started! Tailing logs..."
docker compose logs -f backend