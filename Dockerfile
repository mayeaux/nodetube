FROM bougyman/voidlinux as void
RUN xbps-install -Syu xbps git tar python nodejs-lts base-devel
COPY app* package* .env.settings.sample .env.private.sample copySettingsAndPrivateFiles.js Procfile routes.js /app/
COPY bin /app/bin/
COPY caching /app/caching/
COPY config /app/config/
COPY controllers /app/controllers/
COPY keys /app/keys/
COPY lib /app/lib/
COPY media /app/media/
COPY middlewares /app/middlewares/
COPY models /app/models/
COPY public /app/public/
COPY scripts /app/scripts/
COPY views /app/views/

FROM void as builder
WORKDIR /app/
RUN npm i --production && \
    node ./copySettingsAndPrivateFiles.js && \
    rm -rf /app/node_modules/ffprobe-static/bin/darwin && \
    rm -rf /app/node_modules/ffprobe-static/bin/win32 && \
    rm -rf /app/node_modules/ffprobe-static/bin/linux/ia32 && \
    rm -rf /app/node_modules/webp-converter/bin/libwebp_win64 && \
    rm -rf /app/node_modules/webp-converter/bin/libwebp_osx && \
    strip /app/node_modules/ngrok/bin/ngrok

FROM bougyman/voidlinux
WORKDIR /app/
COPY --from=builder /app/ /app/
RUN xbps-install -Syu xbps tar python nodejs-lts && rm -rf /var/cache/xbps && \
    ln -s /app/node_modules/ffprobe-static/bin/linux/x64/ffprobe /app/node_modules/@ffmpeg-installer/linux-x64/ffmpeg /usr/local/bin/
EXPOSE 8080
CMD ["npm", "start"]
