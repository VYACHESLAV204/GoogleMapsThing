var cssId = 'myCss';  // you could encode the css path itself to generate id..
if (!document.getElementById(cssId))
{
    var head  = document.getElementsByTagName('head')[0];
    var link  = document.createElement('link');
    link.id   = cssId;
    link.rel  = 'stylesheet';
    link.type = 'text/css';
    link.href = 'styles.css';
    link.media = 'all';
    head.appendChild(link);
}
// получить id из url
let scriptSource = (function() {
    var scripts = document.getElementsByTagName('script'),
        script = scripts[scripts.length - 1];

    if (script.getAttribute.length !== undefined) {
        return script.getAttribute('src')
    }

    return script.getAttribute('src', 2)
}());
scriptSource = scriptSource.slice(8,scriptSource.length-1)
console.log(scriptSource)
// Создать визуал виджета
const container = document.createElement('div');
container.innerHTML = 
    `<div class="position-container">
    <div class="headercontainer"><h3>Your ID: <span id="ws-id"></span></h3></div>
    <div id='messages' ></div>
    <div class="form-container">
        <form action="" onsubmit="sendMessage(event)">
            <label class="fileInputLabel" for="fileInput"><img src="./free-icon-add-file-1090923.svg" alt=""/></label>
                <input  type="text" id="messageText" autocomplete="off" placeholder="Enter your message"/>
                <button class="sendButton"><img src="./Send-256x256.svg" alt=""/></button>
            <input type="file" name="fileInput" id="fileInput" onchange="handleFileSelect(event)" /> 
        </form>
    </div>
</div>`
    document.body.appendChild(container)
    // Получить id, может заменить на куки
    let client_id = null
    if(localStorage.getItem('Id')!=null){
         client_id = localStorage.getItem('Id') 
    }
    else{
        client_id = Date.now()
        localStorage.setItem('Id', client_id)
    }
    let myId =document.querySelector("#ws-id")
    myId.textContent = client_id;
    let ws = new WebSocket('ws://localhost:8000/chat/ws/client/' + client_id);
    
    // Действия при получении сообщении. 
    ws.onmessage = function(event) {
    let fileData = event.data.split(': ');
    let fileName = fileData[1];
    let messages = document.getElementById('messages');
    let message = document.createElement('div');
    message.className="MyMessage"
    let content = document.createTextNode(event.data);
    let clientId = fileData[0].split(' ')[1];
    if (event.data.includes("'text':")){
        if (myId.textContent === clientId.slice(1)){
        content = document.createTextNode(event.data.substring(event.data.indexOf("'text': ")+9,event.data.indexOf("'}")))
        message.className="MyMessage"
        }
        else{
            content = document.createTextNode(event.data.substring(event.data.indexOf("'text': ")+9,event.data.indexOf("'}")))
            message.className="OthereMessage"
        }
    }
if (event.data.includes('file:')) {
    if (myId.textContent === clientId.slice(1)){
        content = document.createTextNode(event.data.substring(event.data.indexOf(': ')+2))
        message.className="MyMessage"
    }
    else{
        content = document.createTextNode(event.data.substring(event.data.indexOf(': ')+2))
        message.className="OthereMessage"
    }
    let downloadBtn = document.createElement('button');
    downloadBtn.textContent = 'Download';
    downloadBtn.addEventListener('click', function() {
        fetch('http://127.0.0.1:8000/chat/download/'+fileName )
            .then(response => response.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(new Blob([blob]));
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
            })
            .catch(error => console.error('Error:', error));
    });
    message.appendChild(content);  
    message.appendChild(downloadBtn);
} else {
    message.appendChild(content);
}
messages.appendChild(message);
messages.scrollTop = messages.scrollHeight - messages.clientHeight;
};
    function sendMessage(event) {
        let input = document.getElementById("messageText")
        ws.send(JSON.stringify(input.value))
        input.value = ''
       
        event.preventDefault()
    }
    function handleFileSelect(event) {
let file = event.target.files[0];
event.preventDefault()
if (file) {
    const ext = file.name;
    fetch('http://127.0.0.1:8000/chat/filename', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            Accept: '*/*',
        },
        body: JSON.stringify({
            filename: ext,
        }),
    })
    .then(response => response.json())
    .then(data => {
        let reader = new FileReader();
        reader.onload = function(e) {
            let fileContent = e.target.result;
            ws.send(fileContent); // Отправка содержимого файла по WebSocket
        };
        reader.readAsArrayBuffer(file);
    })
    .catch(error => console.error('Error:', error));
}
}
