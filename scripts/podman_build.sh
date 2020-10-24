#!/bin/sh
exec podman build -t nodetube -t "nodetube:$(date +%Y%m%d%H%M)" .
