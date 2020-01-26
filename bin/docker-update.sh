#!/bin/bash

git pull
CURRENT_UID=$(id -u):$(id -g) docker-compose pull
#CURRENT_UID=$(id -u):$(id -g) docker-compose down
CURRENT_UID=$(id -u):$(id -g) docker-compose up --build -d
