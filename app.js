//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const md5 = require("md5");

const app = express();

app.use(express.static("public"));
app.set('view engine','ejs');
app.use(bodyParser.urlencoded({extended:true}));

mongoose.set('strictQuery', false);
// in place of 127.0.0.1 we can also use localhost but localhost cause problems relalted to collection 
mongoose.connect("mongodb://127.0.0.1:27017/userDB",{useNewUrlParser:true});

//Database Schema
const userSchema = new mongoose.Schema({
    email:String,
    password:String
});
  
//Database encryption must be added before creating model of database.



//Database model
const User = mongoose.model("User", userSchema);


app.get("/",function(req,res){
    res.render("home");
});

app.get("/login",function(req,res){
    res.render("login");
});

app.get("/register",function(req,res){
    res.render("register");
});

//new User register
app.post("/register",function(req,res){
    //creating object of new user
    const newUser = new User({
        email:req.body.username,
        password:md5(req.body.password)
    });
    //saving newUser object into database
    newUser.save(function(err){
        if(!err){
            res.render("secrets");
        }
        else{
            console.log(err);
        }
    })
});

//login route
app.post("/login",function(req,res){
    const username = req.body.username;
    const password = md5(req.body.password);
    User.findOne({email:username},function(err,foundUser){
        if(err){
            console.log(err);
        }
        else if(foundUser && foundUser.password === password){
            res.render("secrets");
        }
        else{
            console.log("Error 404");
        }
     });
});

app.listen(3000,function(){
    console.log("Server is running on port 3000");
});