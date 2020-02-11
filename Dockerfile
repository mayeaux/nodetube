FROM node:10-alpine

RUN apk add ffmpeg
RUN apk add git
RUN apk add tar

COPY package*.json /app/

WORKDIR /app/
#RUN rm -rf ./node_modules
#RUN npm cache clean --force
#RUN npm i --production
RUN npm i
#RUN npm rebuild node-sass

COPY . .

EXPOSE 8080

CMD ["npm", "start"]
