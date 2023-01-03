// npm i passport passport-local passport-local-mongoose express-session for cookies
//passport local mongoose hash and salt our password automatically
//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
//encrypt using passport 
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
//Passport google oauth20
const GoogleStrategy = require("passport-google-oauth20").Strategy;
//mongoose findOrCreate
const findOrCreate = require("mongoose-findorcreate");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

//session 
app.use(session({
    secret:"Our little secret.",
    resave:false,
    saveUninitialized:false
}));

//passport
app.use(passport.initialize());
//tell passport to use session
app.use(passport.session());


mongoose.set('strictQuery', false);
// in place of 127.0.0.1 we can also use localhost but localhost cause problems relalted to collection 
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});

//Database Schema
const userSchema = new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:String
});
  
//passport local mongoose 
userSchema.plugin(passportLocalMongoose);
//mongoose findOrCreate
userSchema.plugin(findOrCreate);

//Database encryption must be added before creating model of database.

//Database model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
// used to serialize the user for the session
passport.serializeUser(function(user, done) {
    done(null, user.id); 
   // where is this user.id going? Are we supposed to access this anywhere?
});

// used to deserialize the user
passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});


passport.use(new GoogleStrategy({
    clientID:process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    console.log(profile);
    User.findOrCreate({ username: profile.emails[0].value, googleId: profile.id, }, function (err, user) {
        return cb(err, user);
    });
  }
));

app.get("/",function(req,res){
    res.render("home");
});

//register and login using google
app.get("/auth/google",
    passport.authenticate("google", { scope: ["profile","email"] })
);

app.get("/auth/google/secrets",
    passport.authenticate("google",{failureRedirect:"/login"}),
    function(req,res){
        res.redirect("/secrets");
    }
);

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    User.find({"secret":{$ne:null}},function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                res.render("secrets",{userWithSecrets:foundUser});
            }
        }
    });
});

app.get("/submit",function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
    }
    else{
        res.redirect("/login");
    } 
});

app.post("/submit",function(req,res){
    const submittedSecret = req.body.secret;

    User.findById(req.user.id, function(err,foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret = submittedSecret;
                foundUser.save(function(){
                    res.redirect("/secrets");
                });
            }
        }
    });
});

app.get("/logout",function(req,res){
    req.logout(function(err) {
        if (err) {
            console.log(err);
        }
        res.redirect("/");
    });
});

//new User register
app.post("/register",function(req,res){
    User.register({username:req.body.username},req.body.password,function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });
});

//login route
app.post("/login",function(req,res){
    const user = new User({
        username:req.body.username,
        password:req.body.password
    });

    req.logIn(user,function(err){
        if(err){
            res.render("login");
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
            });
        }
    });

});

app.listen(3000,function(){
    console.log("Server is running on port 3000");
});