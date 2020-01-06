async function redirectDomainsMiddleware(req, res, next){

  if(req.hostname == 'nodetube-1.herokuapp.com'){
    return res.redirect('https://nodetube.live' + req.path);
  }

  next();

}

module.exports = redirectDomainsMiddleware;