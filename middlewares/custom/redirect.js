async function redirectDomainsMiddleware(req, res, next){

  // console.log(req.hostname);

  // if(req.hostname == 'pewtube-staging.herokuapp.com'){
  //   res.redirect('https://pew.tube' + req.path);
  // };

  if(req.hostname == 'pewtubestaging.com'){
    return res.redirect('https://pew.tube' + req.path);
  }

  if(req.hostname == 'nodetube-1.herokuapp.com'){
    return res.redirect('https://nodetube.live' + req.path);
  }

  // if(req.hostname == 'uploads.pew.tube'){
  //   return res.redirect('https://pew.tube' + req.path);
  // };

  next();

}

module.exports = redirectDomainsMiddleware;