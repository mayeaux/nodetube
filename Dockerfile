FROM node:8-alpine

RUN apk add --no-cache ffmpeg
RUN apk add --no-cache git
RUN apk add --no-cache tar

WORKDIR /app/

COPY package*.json /app/

RUN npm i

COPY . .

EXPOSE 8080

CMD ["npm", "start"]