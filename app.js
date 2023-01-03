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
    password:String
});
  
//passport local mongoose 
userSchema.plugin(passportLocalMongoose);

//Database encryption must be added before creating model of database.

//Database model
const User = mongoose.model("User", userSchema);

passport.use(User.createStrategy());
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

app.get("/secrets",function(req,res){
    //checking if the user is authentic then it will access this page
    if(req.isAuthenticated()){
        res.render("secrets");
    }
    else{
        res.redirect("/login");
    } 
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