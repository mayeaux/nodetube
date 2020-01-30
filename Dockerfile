FROM node:8-alpine

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache git
RUN apk add --no-cache tar

ARG user_uid=1000
RUN adduser -D -u $user_uid nodetube || true
RUN mkdir /app/ && chown $user_uid -R /app/
USER $user_uid
WORKDIR /app/

COPY --chown=$user_uid copySettingsAndPrivateFiles.js /app/
COPY --chown=$user_uid package*.json /app/

RUN npm i

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
