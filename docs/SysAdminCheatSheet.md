# Useful tools

## start webapp with pm2
`pm2 start --name=webapp npm -- start`

## start caching with pm2
`pm2 start --name=caching npm -- run cache --`

## show data usage
`vnstat -i eth0`

## show live bandwidth connections
`nload eth0`

## show live connections on port 80
`netstat -anp | grep :80 | wc -l`

## start caching with forever
`forever start -c "npm run cache" ./`

## show incoming tcp connections
`sudo tcptrack -i eth0`






Bootstrap version: public/css/lib/bootstrap/bootstrap.scss
