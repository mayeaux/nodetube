FROM node:8-alpine
RUN apk add  --no-cache ffmpeg
RUN apk add  --no-cache git
RUN apk add  --no-cache tar

COPY . /app

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

#RUN npm i node-sass@latest
RUN npm i
#RUN npm run installDeps
# If you are building for production
# RUN npm install --only=production


# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]
