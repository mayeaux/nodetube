#!/bin/bash

# author is simply the maintainer tag in image/container metadata
: "${author:=at hey dot com @bougyman}"
# created_by will be the prefix of the images, as well. i.e. bougyman/voidlinux
: "${created_by:=bougyman}"
: "${ARCH:=x86_64}"
: "${container_cmd:=npm start}"
: "${node_package:=nodejs}"
: "${striptags:="stripped|tiny"}"
: "${glibc_locale_tags:="glibc-locales|tmux"}"

usage() { # {{{
    cat <<-EOT
    Usage: $0 <options>
        Options:
           -a ARCH - ARCH to use, (Default: x86_64)
                     See http://build.voidlinux.org for archs available
           -t TAG  - The name of the image. Defaults to latest
           -c CMD  - The command to use for the default container command (Default: $container_cmd)
           -n PKG  = THe node package to install, default is $node_package
EOT
} # }}}

die() { # {{{
    local -i code
    code=$1
    shift
    if [ -n "$*" ]
    then
        echo "Error! => $*" >&2
    else
        echo "Error! => Exit code: ${code}"
    fi
    echo >&2
    usage >&2
    # shellcheck disable=SC2086
    exit $code
} # }}}

bud() { # {{{
    : "${buildah_count:=0}"
    ((buildah_count++))
    buildah "$@"
    buildah_err=$?
    if [ $buildah_err -ne 0 ]
    then
        echo "Buildah command #${buildah_count} failed, Bailing" >&2
        die $buildah_err
    fi
} # }}}

optparse() { # {{{
    while getopts :ha:t:c: opt # {{{
    do
        case $opt in
            a)
                ARCH=$OPTARG
                ;;
            t)
                tag=$OPTARG
                ;;
            c)
                container_cmd=$OPTARG
                ;;
            h)
                usage
                exit
                ;;
            \?)
                echo "Invalid option '${OPTARG}'" >&2
                usage >&2
                exit 27
                ;;
            :)
                echo "Option ${OPTARG} requires an argument" >&2
                usage >&2
                exit 28
                ;;
        esac
    done # }}}
    shift $((OPTIND-1))
    : "${tag:=latest}"
    export tag author created_by REPOSITORY ARCH BASEPKG striptags glibc_locale_tags container_cmd
} # }}}

optparse "$@"

if [ -n "$CI_REGISTRY_PASSWORD" ]
then
    export STORAGE_DRIVER=vfs
fi

build=$(buildah from bougyman/voidlinux)
if [ -z "$BUILDAH_DEBUG" ]
then
    trap 'buildah rm "$build" 2>/dev/null; buildah rm "$final" 2>/dev/null; true' EXIT
fi
bud run "$build" -- xbps-install -Syu git tar python base-devel "$node_package"
bud copy "$build" app* package* .env.settings.sample .env.private.sample copySettingsAndPrivateFiles.js Procfile routes.js /app/
bud copy "$build" bin /app/bin/
bud copy "$build" caching /app/caching/
bud copy "$build" config /app/config/
bud copy "$build" controllers /app/controllers/
bud copy "$build" keys /app/keys/
bud copy "$build" lib /app/lib/
bud copy "$build" media /app/media/
bud copy "$build" middlewares /app/middlewares/
bud copy "$build" models /app/models/
bud copy "$build" public /app/public/
bud copy "$build" scripts /app/scripts/
bud copy "$build" views /app/views/

bud config --env "HOME=/app" "$build"
bud config --workingdir /app/ "$build"
bud run "$build" -- npm i --production && \
                    node ./copySettingsAndPrivateFiles.js && \
                    rm -rvf node_modules/ffprobe-static/bin/darwin && \
                    rm -rvf node_modules/ffprobe-static/bin/win32 && \
                    rm -rvf node_modules/ffprobe-static/bin/linux/ia32 && \
                    rm -rvf node_modules/webp-converter/bin/libwebp_win64 && \
                    rm -rvf node_modules/webp-converter/bin/libwebp_osx && \
                    rm -rvf .npm && \
                    strip node_modules/ngrok/bin/ngrok

stage_mount=$(buildah mount "$build")
final=$(buildah from bougyman/voidlinux)
bud copy "$final" "$stage_mount"/app/ /app/
bud config --env "HOME=/app" "$build"
bud run "$final" -- sh -c 'xbps-install -Syu tar python3 nodejs && \
                           rm -rf /var/cache/xbps && \
                           ln -s /app/node_modules/ffprobe-static/bin/linux/x64/ffprobe /app/node_modules/@ffmpeg-installer/linux-x64/ffmpeg /usr/local/bin/'
bud config --workingdir /app/ "$final"
bud config --created-by "$created_by" "$final"
bud config --author "$author" --label="name=nodetube" "$final"
bud commit --squash --rm "$final" "nodetube:${tag}"

# vim: set foldmethod=marker et ts=4 sts=4 sw=4 :
