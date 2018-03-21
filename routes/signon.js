var expressValidator = require('express-validator');
var passport = require('passport');
var bcrypt = require('bcrypt');
const saltRounds = 10;

var db = require("../config/connection.js");

module.exports = function(app) {

    app.get("/", function(req, res) {
      res.render('login',{title: 'Login'});
      // res.render('index');
    });

    app.get("/home", authenticationMiddleware(),
      function(req, res) {
        res.render('home');
    });

    app.get("/login", function(req, res) {
      res.render('login', {title: 'Login'});
  });

    app.post("/login", passport.authenticate(
            'local', {
            successRedirect: '/home',
            failureRedirect: '/login'
          }));

    app.get('/logout', function(req,res){
      req.logout();
      req.session.destroy();
      res.redirect('/')
            
    });
      
    app.get("/register",function(req,res){
      res.render('register',{title: 'Registration'});
    });

    app.post("/register", function(req, res) {
        req.checkBody('username','Username field cannot be empty.').notEmpty();
        req.checkBody('username','Username must be between 4-15 characters long.').len(4,15);
        req.checkBody('email','The email you entered is invalid, Try Again.').isEmail();
        req.checkBody('email','Email address must be between 4-100 characters long').len(8,100);
        req.checkBody('password','Password must be at least 8 characters long.').len(8,100);
        // req.checkBody('password','Password must include one lowercase character, one uppercase character, a number, and a special character.').matches(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?!.*)(?=.*[^a-zA-Z0-9]).{8,}$/,"i");
        // req.checkBody('passwordMatch','Password must be at least 8 characters long.').len(8,100);
        // req.checkBody('passwordMatch','Password does not match, try again.').equals(password);
        
        const errors = req.validationErrors();
        if (errors){
          //  console.log(`errors: ${JSON.stringify(errors)}`);
           res.render('register',{
             title: "Registration Error",
             errors: errors
            });
        }else{
          const username = req.body.username;
          const email = req.body.email;
          const password= req.body.password;
          // Store hash in your password DB.
          bcrypt.hash(password, saltRounds, function(err, hash) {
            db.query('INSERT INTO users (username, email, password) VALUES (?,?,?)',[username,email,hash],
              function(error,results,fields){
                if (error) throw error;
              
                //query the db the user that has just been created
                db.query('SELECT LAST_INSERT_ID() as user_id',function(error,results,fields) {
                  if (error) throw error;

                  const user_id = results[0];

                  console.log(results[0]);
                  req.login(user_id, function(err){
                    res.redirect('/home');
                  });           
                });
              })
          })
        }
  });
  
    passport.serializeUser(function(user_id,done){
      done(null,user_id);
    });
    passport.deserializeUser(function(user_id,done){
      done(null,user_id);
    });

    function authenticationMiddleware(){
      return (req,res,next) =>{
        console.log(`
           req.session.passport.user: ${JSON.stringify(req.session.passport)}`);
           if (req.isAuthenticated()) return next();
           res.redirect('/login')
      }
    }
}