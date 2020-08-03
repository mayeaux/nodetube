# Useful tools

# show data usage
vnstat -i eth0

# show live bandwidth connections
nload eth0

# show live connections on port 80
netstat -anp | grep :80 | wc -l