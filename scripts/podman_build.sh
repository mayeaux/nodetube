#!/bin/sh
if [ -n "$CI_REGISTRY_PASSWORD" ]
then
    export STORAGE_DRIVER=vfs
fi
exec podman build -t nodetube -t "nodetube:$(date +%Y%m%d%H%M)" .
