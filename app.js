
/**
 * Module dependencies.
 */

var express = require('express')
  , http = require('http')
  , path = require('path');

var pass = require('pwd');

var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

// redirect to signup form
app.get('/', function(req, res) {
  res.redirect('/signup');
});

// dummy db
var dummyDb = [
  {username: 'john', email: 'john@email.com'},
  {username: 'jack', email: 'jack@email.com'},
  {username: 'jim', email: 'jim@email.com'},
];

// reder signup page
app.get('/signup', function(req, res) {
  res.render('signup');
});

// ajax target for checking username
app.post('/signup/check/username', function(req, res) {
  var username = req.body.username;
  // check if username contains non-url-safe characters
  if (username !== encodeURIComponent(username)) {
    res.json(403, {
      invalidChars: true
    });
    return;
  }
  // check if username is already taken - query your db here
  var usernameTaken = false;
  for (var i = 0; i < dummyDb.length; i++) {
    if (dummyDb[i].username === username) {
      usernameTaken = true;
      break;
    }
  }
  if (usernameTaken) {
    res.json(403, {
      isTaken: true
    });
    return
  }
  // looks like everything is fine
  res.send(200);
});

// target for form submit
app.post('/signup', function(req, response) {

  var username = req.body.username;
  var email = req.body.email;
  var password = req.body.password;
  var verification = req.body.verification;

  var error = null;
  // regexp from https://github.com/angular/angular.js/blob/master/src/ng/directive/input.js#L4
  var EMAIL_REGEXP = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,6}$/;

  // check for valid inputs
  if (!username || !email || !password || !verification) {
    error = 'All fields are required';
  } else if (username !== encodeURIComponent(username)) {
    error = 'Username may not contain any non-url-safe characters';
  } else if (!email.match(EMAIL_REGEXP)) {
    error = 'Email is invalid';
  } else if (password !== verification) {
    error = 'Passwords don\'t match';
  }
  
  if (error) {
    response.status(403);
    response.render('signup', {
      error: error
    });
    return
  }

  // check if username is already taken
  for (var i = 0; i < dummyDb.length; i++) {
    if (dummyDb[i].username === username) {
      response.status(403);
      response.render('signup', {
        error: 'Username is already taken'
      });
      return;
    }
  }

  // create salt and hash password
  pass.hash(password, function(err, salt, hash){
    if (err) console.log(err);
    
    // yeah we have a new user
    var user = {
      username: username,
      email: email,
      salt: salt,
      hash: hash,
      createdAt: Date.now()
    };
    
    // for fully featured example check duplicate email, send verification link and save user to db
    
    response.json(200, user)
    
  });

});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
