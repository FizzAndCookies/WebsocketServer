//module imports
const websocket = require('ws'); //websocket
const express = require("express"); //express
const http = require('http'); //http
const path = require('path'); //path
require('dotenv').config(); // Load environment variables from .env file

const commands = require('./commands.json'); //commands json file
const routes = require("./routes/routes");
const websocketHandler = require("./websockets/socket");

//custom values
const  PORT = process.env.PORT || 3000 //websocket port
const password = process.env.PASS//sha256 hash password

//initializations
const app = express(); //express init
const server = http.createServer(app); //http server

///static resource folders
app.use(express.static('public'));
//manage routes
app.use('/',routes);

websocketHandler(server)

server.listen(PORT,()=>{
    console.log(`Server started on port : ${PORT}`)
})