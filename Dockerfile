FROM node:8

COPY . /app

# Create app directory
WORKDIR /app

# Install app dependencies
# A wildcard is used to ensure both package.json AND package-lock.json are copied
# where available (npm@5+)
COPY package*.json ./

RUN npm install
# If you are building for production
# RUN npm install --only=production


# Bundle app source
COPY . .

EXPOSE 8080

CMD [ "npm", "start" ]
