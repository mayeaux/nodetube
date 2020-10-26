#!/bin/bash
# CI build for github. Builds various Void Linux based images. See Readme.md

export BUILDAH_FORMAT=docker # Use docker instead of OCI format
: ${STORAGE_DRIVER:=vfs} # Use vfs because overlay on overlay in Docker is whack
export STORAGE_DRIVER 
IMAGE_NAME=nodetube

# Normally would not set this, but we definitely want any error to be fatal in CI
set -e

usage() { # {{{
    cat <<-EOT
    Usage: $0 

    Push images to gitlab container registry
EOT
} # }}}

die() { # {{{
    local -i code
    code=$1
    shift
    echo "Error! => $*" >&2
    echo >&2
    usage >&2
    # shellcheck disable=SC2086
    exit $code
} # }}}

scan_image() { # {{{
    tag=$1
    [ -d /tmp/oci ] || mkdir -p /tmp/oci
    shortname=$(basename "$IMAGE_NAME")
    oci_path=/tmp/oci/${shortname}_${tag}
    buildah push "$IMAGE_NAME:$tag" "oci:/$oci_path"
    ./trivy --exit-code 0 --severity HIGH --no-progress image --input "$oci_path"
    ./trivy --exit-code 1 --severity CRITICAL --no-progress image --input "$oci_path"
    rm -rf "$oci_path"
} # }}}

scan_image latest

# publish images _only_ if we're run in CI. This allows us to mimic the whole
# build locally in the exact manner the CI builder does, without any publishing to registries
if [ -n "$CI_REGISTRY_PASSWORD" ] # {{{
then
    export REGISTRY_AUTH_FILE=${HOME}/auth.json # Set registry file location
    echo "$CI_REGISTRY_PASSWORD" | buildah login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY" # Login to registry
    
    : "${FQ_IMAGE_NAME:=docker://${CI_REGISTRY}/nodetube/nodetube}"

    set +x
    # Push everything to the registry
    datestamp=$(date +%Y%m%d%H%M)
    podman tag "$IMAGE_NAME:${tag}" "$IMAGE_NAME:${datestamp}"
    for tag in latest "$datestamp"
    do
        echo "Publishing $tag"
        podman push "$IMAGE_NAME:${tag}" "$FQ_IMAGE_NAME:${tag}"
    done

    # Trigger Docker Hub builds, "$docker_hook" is supplied by gitlab, defined in this project's CI/CD "variables"
    # shellcheck disable=SC2154
    # curl -X POST -H "Content-Type: application/json" --data '{"source_type": "Branch", "source_name": "main"}' "$docker_hook" || \
     #    die 33 "Failed to trigger docker build"
    echo
    # Show us all the images built
    buildah images
fi # }}}

# vim: set foldmethod=marker et ts=4 sts=4 sw=4 :
