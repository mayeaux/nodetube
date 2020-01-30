FROM node:8-alpine

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache git
RUN apk add --no-cache tar


COPY package*.json /app/

WORKDIR /app/
RUN rm -rf ./node_modules
RUN npm cache clean --force
RUN npm i
RUN npm rebuild node-sass

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
