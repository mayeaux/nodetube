FROM node:8-alpine

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache git
RUN apk add --no-cache tar

WORKDIR /app/

COPY package*.json /app/
COPY bower.json /app/

RUN npm i
RUN npm i -g bower
RUN bower install --allow-root

COPY . .

EXPOSE 8080

CMD ["npm", "start"]