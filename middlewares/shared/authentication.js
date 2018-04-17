function adminAuth(req, res, next){
  console.log('not an admin');

  if(!req.user){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

// kick out if not admin
  const userRole = req.user.role;
  if(userRole !== 'admin'){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  return next()
}

function moderatorAuth(req, res, next){
  if(!req.user){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  // kick out if not admin or moderator
  const userRole = req.user.role;
  if(!(userRole == 'admin' || userRole == 'moderator')){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  return next()
}


function plusAuth(req, res, next){
  if(!req.user){
    // TODO: redirect to login page first, then redirect
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  // kick out if not admin or moderator
  const userRole = req.user.role;
  const userPlan = req.user.plan;
  if(userPlan !== 'plus' && ( userRole !== 'admin' || userRole !== 'moderator') ){
    // TODO: redirect where they came from, flash 'sorry only plus users can access this'
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  return next()
}

module.exports = {
  adminAuth,
  moderatorAuth,
  plusAuth
};