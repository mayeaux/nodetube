#!/bin/bash

sudo chown -R ubuntu:ubuntu .

git stash && git pull && git stash pop

CURRENT_UID=$(id -u):$(id -g) docker-compose pull
CURRENT_UID=$(id -u):$(id -g) docker-compose build
CURRENT_UID=$(id -u):$(id -g) docker-compose up -d
