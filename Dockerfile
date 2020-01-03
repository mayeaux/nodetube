FROM node:8-alpine
RUN apk add  --no-cache ffmpeg
RUN apk add  --no-cache git
RUN apk add  --no-cache tar
#RUN set -ex && apk --no-cache add sudo

COPY . /app

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./
COPY bower.json ./
#COPY .bowerrc ./

#RUN npm i node-sass@latest
RUN npm i
RUN npm i -g bower
RUN bower install --allow-root
#RUN npm run installDeps
# If you are building for production
# RUN npm install --only=production


# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]
