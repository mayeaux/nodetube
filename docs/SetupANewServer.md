Setup A New Ubuntu 16.04 Installation

Your Terminal:

ssh root@YOURIP

yes

enter your root password

---
Root Machine:

# use a strong password, everything else blank
sudo adduser fred

# allow fred to use sudo
sudo usermod -aG sudo fred

# switch to new user
su - fred

# move to home directory
cd ~

sudo apt update

# install dependencies for nodetube
# may take a few minutes
sudo apt-get -y install \
    git build-essential nginx youtube-dl nload nano python-setuptools python-dev build-essential tcptrack  vnstat nethogs redis-server build-essential libssl-dev libcurl4-gnutls-dev libexpat1-dev gettext unzip vnstat nload ffmpeg

sudo apt-get update
sudo apt-get upgrade

# install and start mongodb
# these instructions are for 16.04 taken from: https://docs.mongodb.com/manual/tutorial/install-mongodb-on-ubuntu/
wget -qO - https://www.mongodb.org/static/pgp/server-4.4.asc | sudo apt-key add -
echo "deb [ arch=amd64,arm64 ] https://repo.mongodb.org/apt/ubuntu xenial/mongodb-org/4.4 multiverse" | sudo tee /etc/apt/sources.list.d/mongodb-org-4.4.list
sudo apt-get update
sudo apt-get install -y mongodb-org
sudo systemctl start mongod


# install nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.35.3/install.sh | bash

# setup nvm
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"  # This loads nvm
[ -s "$NVM_DIR/bash_completion" ] && \. "$NVM_DIR/bash_completion"  # This loads nvm bash_completion

#


# install and switch to node v8
nvm install 8
nvm use 8

# replace with https
git clone https://github.com/mayeaux/nodetube.git
cd nodetube

#
npm install

#  start
npm start

# or start with pm2
npm install -g pm2

pm2 start npm -- start


# NGINX

cd /etc/nginx/
sudo mv nginx.conf nginx.conf1
# copy to nginx.conf

cd /etc/nginx/sites-available
sudo mv default default1
# copy to default

sudo nano default
# Paste in nginx setup # 


# test setup
sudo nginx -t

# restart nginx with new setup
sudo service nginx restart





