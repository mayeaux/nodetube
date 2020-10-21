# NodeTube
NodeTube is an open-source YouTube alt that offers video, audio and image uploads, livestreaming and built-in monetization

A live NodeTube instance is available to interact with at [https://newtube.app](https://newtube.app)

You can join the open-source community actively developing NodeTube on [Discord](https://discord.gg/ejGah8H), [Riot.im](https://riot.im/app/#/room/#nodetube:matrix.org) and [Reddit](https://reddit.com/r/nodetube)

<br>

<a href="https://newtube.app" />
<img src="https://user-images.githubusercontent.com/7200471/73618225-630e5d80-45e3-11ea-8772-9f10f5b9ef16.png" width="800" >

## Get Your Instance Running:

You can get an instance up instantly using one-click deployment with Heroku below:

[![Deploy](https://www.herokucdn.com/deploy/button.png)](https://heroku.com/deploy?template=https://github.com/mayeaux/nodetube)

## Running On Your Local Computer

### Required Software
- [Node.js 8.0+](https://nodejs.org/en/download/)
- [MongoDB](https://www.mongodb.org/downloads)
- [Redis](https://redis.io/download)
- [ffmpeg](https://www.ffmpeg.org/download.html)

See instructions on installing these prerequisites for both [OS X](https://github.com/mayeaux/nodetube/wiki/Installation-Instructions---OS-X) and [Linux](https://github.com/mayeaux/nodetube/wiki/Installation-Instructions---Linux). There are also [Docker](https://github.com/mayeaux/nodetube/wiki/Docker) instructions if that's your thing.

Once Prerequisites Are Installed
---------------

Now that the prerequisites are ready to go it's a few simple commands to get your instance up and running.

```bash
# Get the latest version of NodeTube
git clone https://github.com/mayeaux/nodetube

# Enter the nodetube folder that was just created
cd nodetube

# Install Node modules
npm install

# Then simply start your app
npm start

#If you're developing locally, you can boot the app with nodemon with:
npm run dev
```

And that's it! Your first user registered will automatically be an admin user and you will be able to see the admin and moderation functionality. Each additional user will be a regular user and will be able to upload video, audio or images up to 500MB.

For ease of local development I recommend using [Nodemon](https://github.com/remy/nodemon) to automatically restart the app while working on backend code.

### Using ngrok
NodeTube comes with [ngrok](https://ngrok.com) preinstalled with the setting in `.env.settings` to run for new instances automatically. This means that when you boot the app you will see a log come through with a link where you can access the app from the ngrok subdomain. Great you're live on the internet, that was simple!

## Technical Details

NodeTube is an Express application powered by NodeJS, with MongoDB as a database, with Redis for caching and `ffmpeg` for converting and compressing video content. It uses Pug as a templating engine and loads process variables through the `.env.settings` and `.env.private` files.

NodeTube uses `resumable.js` on the frontend as a library to allow stable and resumable uploads allowing for the upload process to not be broken during a system reboot.

NodeTube has the functionality to act as an authentication app for an nginx-rtmp server which allows NodeTube to facilitate livestreaming. NodeTube also has a built in livestreaming frontend with a live chat, live viewer count and which uses      [hls.js](https://github.com/video-dev/hls.js/)  to stream the files being created by [nginx-rtmp](https://github.com/arut/nginx-rtmp-module)


[This section is being expanded rapidly so please Watch this repo so you can easily see when more documentation is available]

## Reasons To Use NodeTube
### Reasons to use NodeTube as an Instance Host:
- Built in monetization for instance administrators: Users can optionally pay a monthly fee through Stripe to gain certain privileges which are able to be adjusted by the administrator but by default allow private and unlisted uploads, an increased maximum file-size limit from 500MB to 2GB, and livestreaming capabilities
- You can run an instance either with a cloud provider, a VPS or dedicated server or even locally using a built-in `ngrok` integration.
- Follow a few short steps and get setup on top of cloud providers and run for pennies a day with built-in Heroku and BackBlaze integrations, even with little technical knowledge
- Own your own data: data is happier when it's not in the hands of a multi-billion dollar corporation and plus Google knows enough about us already
- Built in features to get you started on Day 1 including moderation abilities, built-in analytics, administration interface, built-in reCAPTCHA
- Support open-source software, help decentralize and open the internet.
- Improve your software and server administration skills
- Build and foster a community

### Reasons to use NodeTube as a Free User:
- No email necessary for registration. Optionally add an email to have password recovery functionality
- No ads
- Not tracked by a multibillion dollar corporation
- Public IP stays private, unlike some other YouTube alts
- Upload all forms of content (video, audio, image)
- 500 MB max upload size
- Able to load your account with credit and support creators directly [Note: This functionality exists in the NodeTube source tube but finding a payment processor to support this/legal implications are more difficult to pull off in practice.]
- Support open-source software, help decentralize and open the internet.
- Engage with and help grow a community

### Reasons To Use NodeTube as a Paid User:
- Ability to monetize your account and be paid directly by the instance users [Note: This functionality exists in the NodeTube source tube but finding a payment processor to support this/legal implications are more difficult to pull off in practice.]
- Larger upload size, up to 2GB
- Private and unlisted uploads
- Livestreaming
- Plus Badge to show your support
- Support open-source software with your hard earned money, helping out in a big way to decentralize and open the internet
- Allow others to receive the benefits of using NodeTube as a free user including not being tracked by a multibillion dollar corporation and receiving their media ad free

## Additional Info

You may also be interested in [videodownloader](https://github.com/mayeaux/videodownloader), a video downloader that supports 110 websites and is powered by Electron and youtube-dl.

Don't forget to join the open-source community developing NodeTube on [Discord](https://discord.gg/ejGah8H), [Riot.im](https://riot.im/app/#/room/#nodetube:matrix.org) and [Reddit](https://reddit.com/r/nodetube)

## Live NodeTube Instances

Domain | Registrations Open | Ratings Allowed 
:---: | :---: | :---: 
https://newtube.app | Yes | SFW Only
https://allwat.ch| Yes | SFW/NSFW/Sensitive
https://vid8.poal.co| Yes | SFW/NSFW/Sensitive


License
-------

Licensed under the [MIT License](LICENSE.md). &copy; NodeTube Organization
