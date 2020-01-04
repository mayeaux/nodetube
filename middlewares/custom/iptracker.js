const SiteVisit = require('../../models').SiteVisit;
const arraysEqual = require('../../lib/helpers/js-helpers').arraysEqual;
const ipstack = require('ipstack');
const dotenv = require('dotenv');

/** Load environment variables from .env file, where API keys and passwords are configured. **/
dotenv.load({path: '../.env.settings'});
dotenv.load({path: '../.env.private'});

function getIpDataAsync(ip){
  return new Promise(function(resolve, reject){
    ipstack(ip, process.env.IPSTACK_API_KEY, function(err, data){
      if(err !== null) reject(err);
      else resolve(data);
    });
  });
}

async function iptracker(req, res, next){

  const trueStatements = Object.keys(req.useragent).filter(function(x){
    return req.useragent[x] == true;
  });

  let ip = req.headers['x-forwarded-for'] ||
    req.connection.remoteAddress ||
    req.socket.remoteAddress ||
    req.connection.socket.remoteAddress;

  // console.log(ip);

  ip = ip.split(',')[0];

  // const response = await getIpDataAsync(ip);
  //
  // console.log(response);

  const header = req.headers.referer;
  const reqUrl = req.protocol + '://' + req.get('host') + req.originalUrl;

  // console.log('ip: ' + ip);
  // console.log('header: ' + header);
  // console.log('req url: ' + reqUrl + '
  console.log('ip: ' + ip + '      req url: ' + reqUrl + '    header: ' + header);

  let previousVisits;
  let matched = false;

  // grab user if it exists
  let user = undefined;
  if(req.user){
    user = req.user;
    previousVisits = await SiteVisit.find({user: req.user._id});

    // if user has previously visited, see if they're using a matching setup
    if(previousVisits.length > 0){
      // console.log("Found by user");
      for(const previousVisit of previousVisits){
        if(ip == previousVisit.ip && arraysEqual(trueStatements, previousVisit.siteUserData) && matched == false){
          // console.log('       user has existing matching setup');

          // save ref url and increment visit
          previousVisit.refs.push(header);
          previousVisit.history.push(reqUrl);
          previousVisit.visits = previousVisit.visits + 1;
          await previousVisit.save();

          // only allow one matching
          matched = true;

          // attach siteVisitor to request
          req.siteVisitor = previousVisit;

          // call next middleware
          // console.log('next:user');
          next();
        }
      }
    }
  } else {
    previousVisits = await SiteVisit.find({ip});
    if(previousVisits.length > 0){
      // console.log("Found by ip");
      for(const previousVisit of previousVisits){
        if(ip == previousVisit.ip && arraysEqual(trueStatements, previousVisit.siteUserData) && matched == false){
          // console.log('matched old visit setup of ip');
          previousVisit.refs.push(header);
          previousVisit.history.push(reqUrl);
          previousVisit.visits = previousVisit.visits + 1;
          await previousVisit.save();
          matched = true;

          req.siteVisitor = previousVisit;

          // console.log('next:ip ');
          next();

        }
      }

    }
  }

  if(matched == false){
    // console.log('Didnt match anything');

    // otherwise, create a new siteVisit
    const visit = new SiteVisit({
      user,
      ip,
      siteUserData: trueStatements,
      history: [reqUrl],
      refs: [header]
    });

    await visit.save();

    req.siteVisitor = visit;

    // console.log('next:no-match')
    next();
  }

  res.locals.siteVisitor = req.siteVisitor;
}

module.exports = iptracker;