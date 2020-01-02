# NodeTube
An open-source YouTube alternative that also supports image and audio uploads. Powered by NodeJS 

A live NodeTube instance is available to test functionality at [https://nodetube.live](https://nodetube.live)

Join us for collaboration on, [Discord](https://discord.gg/ejGah8H), [Riot.Im](https://riot.im/app/#/room/#nodetube:matrix.org) and [Reddit](https://reddit.com/r/nodetube)

<br>

<img src="https://user-images.githubusercontent.com/7200471/71605820-40db7880-2b29-11ea-8fa0-b8628cfd55ad.png" width="800" >

## Get Your Instance Running:

You can get an instance up instantly using one-click deployment with Heroku below:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/mayeaux/nodetube)

## Running On Your Local Computer

### Required Software
- [Node.js 8.0+](https://nodejs.org/en/download/)
- [MongoDB](https://www.mongodb.org/downloads)
- [Redis](https://redis.io/download)
- [ffmpeg](https://www.ffmpeg.org/download.html)

See instructions on installing these prerequisities for both [OS X](https://github.com/mayeaux/nodetube/wiki/Installation-Instructions---OS-X) and [Linux](https://github.com/mayeaux/nodetube/wiki/Installation-Instructions---Linux). There are also [Docker](https://github.com/mayeaux/nodetube/wiki/Docker) instructions if that's your thing.

Once Prerequisites Are Installed
---------------

Now that the prerequisites are ready to go it's a few simple commands to get your instance up and running.

```bash
# Get the latest version of NodeTube
git clone https://github.com/mayeaux/nodetube

# Enter the nodetube folder that was just created
cd nodetube

# Install backend and frontend dependencies
npm run installDeps

# Then simply start your app
npm start

#If you're developing locally, you can boot the app with nodemon with:
npm run dev
```

And that's it! Your first user registered will automatically be an admin user and you will be able to see the admin and moderation functionality. Each additional user will be a regular user and will be able to upload video, audio or images up to 500MB.

For ease of local development I recommend using [Nodemon](https://github.com/remy/nodemon) to automatically restart the app while working on backend code.

### Using ngrok
NodeTube comes with [ngrok](https://www.https://ngrok.com) preinstalled with the setting in `.env.settings` to run for new instances automatically. This means that when you boot the app you will see a log come through with a link where you can access the app from the ngrok subdomain. Great you're live on the internet, that was simple!

Features
-----------------
Nodetube is packed with great features that offers a powerful media hosting experience straight out of the box:

- Videos, audio files and images are all supported by NodeTube and its media player page. The full list of supported file extensions are:
Video Extensions : ['.mp4', '.avi', '.flv', '.MOV', '.m4v', '.ogv', '.webm', '.wmv', '.mkv', '.mov', '.m2t', '.MTS', '.m2ts', '.MPG', '.AVI', '.mpg'], Audio Extension: ['.mp3', '.wav', '.ogg', '.m4a'];Image Extensions: ['.png', '.jpg', '.jpeg', '.gif', '.JPG', '.PNG']; Media is converted on the backend using `ffmpeg` to file formats that offer the best media browser and device compability.

You may also be interested in [videodownloader](https://github.com/mayeaux/videodownloader), a video downloader that supports 110 websites and is powered by Electron and youtube-dl.

License
-------

Licensed under the [MIT License](LICENSE.md). &copy; NodeTube Organization
