var express = require("express");
var bodyParser = require("body-parser");
var exphbs = require("express-handlebars");
var expressValidator = require('express-validator');
var passport = require('passport')
var mysql = require('mysql');

//Authentication Package
var session = require('express-session');
var password = require('passport');
var LocalStrategy = require('passport-local').Strategy;
var MySQLStore = require('express-mysql-session')(session);
var bcrypt = require('bcrypt');

// Sets up the Express App
// =============================================================
var app = express();
var PORT = process.env.PORT || 8080;

// require('dotenv').config();

// Sets up the Express app to handle data parsing

// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));
// parse application/json
app.use(bodyParser.json());

// Static directory
app.use(express.static("public"));

// sessions
var options = {
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "signondb"
};

var connection = mysql.createConnection(options); // or mysql.createPool(options);
var sessionStore = new MySQLStore({}/* session store options */, connection);

//Session  part of express-session, secret could use a random key generator for now I assign a string of characters
app.use(session({
  secret: 'iuytrfghjkl',
  resave: false,
  store: sessionStore,
  saveUninitialized: false,
  // cookie: { secure: true }
}))
//initialize passports - integrate with session
app.use(passport.initialize());
app.use(passport.session());

app.use(function (req,res,next){
  res.locals.isAuthenticated =req.isAuthenticated();
  next()
})

var db = require("./config/connection.js");

//Passport Local Strategy
passport.use(new LocalStrategy(
  function(username,password,done){
    
    db.query('SELECT id,password FROM users WHERE username = ?', [username],function (err,results,fields){
      if (err) {done(err)};

      if (results.length === 0){
        done(null, false, {message: ' Invalid Email or Password'});
      } else{
          const hash = results[0].password.toString();

          bcrypt.compare(password, hash, function(err,response){
            if (response === true){
              return done(null, {user_id: results[0].id})
            }else{
              return done(null,false, {message:'Bad Password'});
            }
          });
        }
    }) 
  }
));


app.use(expressValidator());

// Set Handlebars as the default templating engine.
app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Routes
// =============================================================
require("./routes/signon.js")(app);

// Syncing our sequelize models and then starting our Express app
// =============================================================

  app.listen(PORT, function() {
    console.log("App listening on PORT " + PORT);
  });

