// redirect to social media sites based on path

async function middleware(req, res, next){
  if(req.path == '/reddit'){
    res.redirect('https://reddit.com/r/nodetube');
  }

  if(req.path == '/twitter'){
    res.redirect('https://twitter.com/nodetube_org');
  }

  if(req.path == '/riot'){
    res.redirect('https://riot.im/app/#/room/#nodetube:matrix.org');
  }

  if(req.path == '/discord'){
    res.redirect('https://discord.gg/ejGah8H');
  }

  if(req.path == '/fosstodon'){
    res.redirect('https://fosstodon.org/@nodetube');
  }

  next();
}

module.exports = middleware;