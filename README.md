## NodeTube
An open-source YouTube alternative that also supports image and audio uploads. Powered by NodeJS 

A live NodeTube instance is available to test functionality at [https://nodetube-1.herokuapp.com](https://nodetube-1.herokuapp.com)

Join us for collaboration on, [Discord](https://discord.gg/ejGah8H), [Riot.Im](https://riot.im/app/#/room/#nodetube:matrix.org) and [Reddit](https://reddit.com/r/nodetube)

<br>
<br>

<img src="https://user-images.githubusercontent.com/7200471/71605820-40db7880-2b29-11ea-8fa0-b8628cfd55ad.png" width="800" >

***Deployment Options***

One-Click Install For Heroku

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/mayeaux/nodetube)

Prerequisites
-------------

- [MongoDB](https://www.mongodb.org/downloads)
- [Node.js 8.0+](https://nodejs.org/en/download/)
- [Redis](https://redis.io/download)
- [ffmpeg](https://www.ffmpeg.org/download.html)
- [bower](https://bower.io/#install-bower)

Please also check the [Wiki](https://github.com/mayeaux/nodetube/wiki) for additional information on getting site functionality running

Getting Started
---------------

The easiest way to get started is to clone the repository:

```bash
# Get the latest snapshot
git clone https://github.com/mayeaux/nodetube

# Change directory
cd nodetube

# Install backend and frontend dependencies
npm run installDeps

# Then simply start your app
npm start

#If you're developing locally, you can boot the app with nodemon with:
npm run dev
```

For local development I recommend to use [Nodemon](https://github.com/remy/nodemon) to automatically restart the app.



Docker
------

The project has an experimental [Docker](https://www.docker.com/what-docker) setup, using [Docker Compose](https://docs.docker.com/compose/overview/).  It is entirely optional, so if you don't want to use Docker, feel free to ignore it.

If you have Docker installed, there's a non-zero chance that running `docker-compose up` is all you need to do to build and start 3 docker containers (one each for the app itself, Redis, and MongoDB). From there, you should be able to connect to http://localhost:49160 and see the app running.

Features
-----------------
Nodetube is packed with great features to help you get an instance up and running instantly. This includes:

- [ngrok](https://www.https://ngrok.com) ngrok is a utility that allows you to serve NodeTube via your local machine using ngrok's http tunnels. NodeTube is setup to run with ngrok automatically, to turn it off you can change the `NGROK_ON` flag to `false` in `.env.settings`. When you fire up the app for the first time, take a look at the boot logs and you will see a URL come through which will allow you to access your instance on the public internet. The URL will be impermanent and change if you reboot your application, to get around this you can either use ngrok as a command line tool or purchase a permanent subdomain from `ngrok`, but this will allow you to get your app to the public internet in seconds with no effort.

- Videos, audio files and images are all supported by NodeTube and its media player page. The full list of supported file extensions are:
Video Extensions : ['.mp4', '.avi', '.flv', '.MOV', '.m4v', '.ogv', '.webm', '.wmv', '.mkv', '.mov', '.m2t', '.MTS', '.m2ts', '.MPG', '.AVI', '.mpg'], Audio Extension: ['.mp3', '.wav', '.ogg', '.m4a'];Image Extensions: ['.png', '.jpg', '.jpeg', '.gif', '.JPG', '.PNG']; Media is converted on the backend using `ffmpeg` to file formats that offer the best media browser and device compability.


Reminder to join us for collaboration on, [Discord](https://discord.gg/ejGah8H), [Riot.Im](https://riot.im/app/#/room/#nodetube:matrix.org) and [Reddit](https://reddit.com/r/nodetube)








License
-------

The MIT License (MIT)

Copyright (c) 2014-2016 Anthony Mayfield

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
