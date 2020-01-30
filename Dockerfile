FROM node:8-alpine

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache git
RUN apk add --no-cache tar

WORKDIR /app/

ARG user_uid=1000
RUN adduser -u $user_uid nodetube
USER nodetube

COPY package*.json /app/

RUN npm i

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
