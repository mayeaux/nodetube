// user has plus

function adminAuth(req, res, next){
  if(!req.user){
    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });
  }

  // kick out if not admin
  const userRole = req.user.role;
  if(userRole !== 'admin'){

    console.log('not an admin');

    res.status(404);
    return res.render('error/404', {
      title: 'Not Found'
    });

  }

  return next();
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

  return next();
}

function plusAuth(req, res, next){
  // redirect to login if it's not there already
  if(!req.user){
    return res.redirect('/login');
  }

  const userRole = req.user.role;
  const userPlan = req.user.plan;

  const userIsModOrAdmin = userRole == 'admin' || userRole == 'moderator';

  // kick out if no plus and not admin or moderator
  if(userPlan !== 'plus' && !userIsModOrAdmin ){
    res.status(404);
    return res.render('error/plus', {
      title: 'Not Authorized'
    });
  }

  return next();
}

module.exports = {
  adminAuth,
  moderatorAuth,
  plusAuth
};
