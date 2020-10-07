FROM node:10-alpine

RUN apk add ffmpeg
RUN apk add git
RUN apk add tar
# For youtube-dl
RUN apk add python

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

WORKDIR /app/
#RUN rm -rf ./node_modules
#RUN npm cache clean --force
#RUN npm i --production
RUN npm i && nodejs ./copySettingsAndPrivateFiles.js
#RUN npm rebuild node-sass

EXPOSE 8080

CMD ["npm", "start"]
