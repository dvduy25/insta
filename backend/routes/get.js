const bodyParser = require('body-parser');
const userModel = require('../user/userModel');
const mongoose =require('mongoose');
const dotenv = require("dotenv");
const bcrypt =require("bcrypt");
const jwt=require("jsonwebtoken");
const path = require("path");
// const  fetchAllUser  = require('../services/UserServices');
const cookieParser = require('cookie-parser');
dotenv.config();
const uri =process.env.mongodb_url;
const auth={
    login: async (req,res) =>{
        res.sendFile(path.join(__dirname,'../../fronend/public','singin.html'))
    },
    add: async (req,res) =>{
        res.sendFile(path.join(__dirname,'../../fronend/public','singin.html'))
    },
    duy: async (req,res)=>{
        try {
           
           await mongoose.connect(uri);
           let use = await userModel.find();
        //    localStorage.setItem('jwt',cookies)
           res.render(path.join(__dirname,'../../fronend/public','index.ejs')
           ,{
            use : use
           }) 
        //    console.log(req.cookies)
        // res.json(use)
        } catch (err) {
          res.status(500).json(err)
        }
     
    },
}
module.exports=auth;
