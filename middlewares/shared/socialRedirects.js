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

  if(req.path == '/github'){
    res.redirect('https://github.com/mayeaux/nodetube');
  }

  if(req.path == '/wiki'){
    res.redirect('https://github.com/mayeaux/nodetube/wiki');
  }

  next();
}

module.exports = middleware;