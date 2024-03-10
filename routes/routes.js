const express = require("express");
const router = express.Router();
const path = require("path");


router.get('/controllerxv1509',(req,res)=>{
    res.sendFile(path.join(__dirname,"..","html","index.html"))
})

router.get('/script.js',(req,res)=>{
    res.sendFile(path.join(__dirname,"..","public","scripts","script.js"))
});

router.get('/crypto.js',(req,res)=>{
    res.sendFile(path.join(__dirname,"..","public","scripts","crypto.js"))
})

router.get("*",(req,res)=>{
    const randomword = Math.random().toString(36).substring(2, 10);
    res.send(randomword||"1234");
})

module.exports =router