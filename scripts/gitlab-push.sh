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

declare -a publish_tags

# publish images _only_ if we're run in CI. This allows us to mimic the whole
# build locally in the exact manner the CI builder does, without any publishing to registries
if [ -n "$CI_REGISTRY_PASSWORD" ] # {{{
then
    export REGISTRY_AUTH_FILE=${HOME}/auth.json # Set registry file location
    echo "$CI_REGISTRY_PASSWORD" | buildah login -u "$CI_REGISTRY_USER" --password-stdin "$CI_REGISTRY" || die 44 "Could not log in to gitlab registry"
    
    : "${FQ_IMAGE_NAME:=docker://${CI_REGISTRY}/nodetube/nodetube}"

    set +x
    # Push everything to the registry
    publish_tags+=( "$CI_COMMIT_REF_SLUG" )
    if [ "$CI_COMMIT_REF_SLUG" = "master" ]
    then
        datestamp=$(date +%Y%m%d%H%M)
        publish_tags+=( latest "$datestamp" )
    fi
    for tag in "${publish_tags[@]}"
    do
        if [ "$tag" != "ci" ]
        then
            podman tag "$IMAGE_NAME:ci" "$IMAGE_NAME:${tag}" || die 46 "Could not tag $IMAGE_NAME:ci to $IMAGE_NAME:$tag"
        fi
        echo "Publishing $tag"
        podman push "$IMAGE_NAME:${tag}" "$FQ_IMAGE_NAME:${tag}" || die 48 "Could not push $FQ_IMAGE_NAME:$tag to gitlab registry"
    done
    if [ -n "$DOCKER_USERNAME" ]
    then
        echo "$DOCKER_TOKEN" | podman login --username "$DOCKER_USERNAME" --password-stdin && die 55 "Could not log in to docker"
        for tag in "${publish_tags[@]}"
        do
            podman push "$IMAGE_NAME:${tag}" "$DOCKER_USERNAME"/nodetube:"$tag"
        done
    fi

    echo
    # Show us all the images built
    buildah images
fi # }}}

# vim: set foldmethod=marker et ts=4 sts=4 sw=4 :
