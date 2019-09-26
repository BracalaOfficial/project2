document.addEventListener('DOMContentLoaded', () => {

    var socket = io.connect(location.protocol + '//' + document.domain + ':' + location.port);

    socket.on('connect', () => {
        document.querySelector('#nmsgf').onsubmit = () => {
            const msg = document.querySelector('#nmsgtext').value;
            const roomindex = document.querySelector('#crtitle').dataset.number;
            socket.emit('send message', {'message': msg, 'roomindex': roomindex});

            document.querySelector('#nmsgtext').value('');

            return false;
        }

        document.querySelector('#ncrf').onsubmit = () => {
            const title = document.querySelector('#cncr').value;

            socket.emit('create chatroom', {'title': title});

            return false;
        }
    });

    socket.on('receive message', data => {
        if (document.querySelector('#crtitle').dataset.number == data) {
            loadChat(data);
        }
    });

    socket.on('created chatroom', data => {
        let newbutton = document.createElement('input');
        newbutton.type = 'button';
        newbutton.classList.add('btn');
        newbutton.classList.add('cr');
        newbutton.dataset.number = data.number;
        newbutton.value = `#${data.title}`;
        newbutton.style.color = 'white';
        newbutton.style.width = '100%';
        newbutton.style.textAlign = 'left';
        newbutton.onclick = () => loadChat(newbutton.dataset.number);

        let aside = document.querySelector('aside');
        let lofa = aside.childNodes.length; // length of aside
        
        // let testel = document.createElement('p');
        // let testtext = document.createTextNode('Zivot u kavezu nie navikla na to');
        // testel.appendChild(testtext);
        // aside.appendChild(testel);

        aside.insertBefore(newbutton, aside.childNodes[lofa - 2]);
        // aside.appendChild(newbutton);
    });

    loadInfos();

    document.querySelectorAll('.cr').forEach(button => {
        button.onclick = () => {
            const roomindexs = button.dataset.number;

            loadChat(roomindexs);
        }
    });

    cncr = document.querySelector('#cncr');
    cncr.onfocus = () => {
        cncr.type = 'text';
        cncr.classList.add('form-control');
        cncr.classList.toggle('btn');
        cncr.value = '';
        cncr.style.color = 'black';
    }
    cncr.onblur = () => {
        cncr.type = 'button';
        cncr.classList.remove('form-control');
        cncr.classList.toggle('btn');
        cncr.value = '+ Create new chat'
        cncr.style.color = 'white';
    }
    // document.querySelector('#mc').appendChild(document.createTextNode(infos));
});

function loadMessages(roomnumber) {
    const request = new XMLHttpRequest();
    const roomindex = roomnumber;

    request.open('POST', '/loadmessages');
    request.onload = () => {
        const data = JSON.parse(request.responseText);
        let mc = document.querySelector('#mc');
        let crtitle = document.querySelector('#crtitle');
        
        mc.innerHTML = '';
        

        if (data.success) {
            crtitle.innerHTML = data.title;
            crtitle.dataset.number = roomindex;

            data.messages.forEach(element => {
                let divMessage = document.createElement('div');
                divMessage.classList.add('message');

                let pUser = document.createElement('p');
                let bUser = document.createElement('b');
                let textUser = document.createTextNode(element.user);
                
                bUser.appendChild(textUser);
                pUser.appendChild(bUser);
                divMessage.appendChild(pUser);

                let pMessage = document.createElement('p');
                let textMessage = document.createTextNode(element.message + ' ');
                let iTime = document.createElement('i');
                let textTime = document.createTextNode(element.time);

                pMessage.appendChild(textMessage);
                iTime.appendChild(textTime);
                pMessage.appendChild(iTime);
                divMessage.appendChild(pMessage);

                mc.appendChild(divMessage);
            });
        }
        else {
            mc.innerHTML = 'There something wrong...'+data;
            crtitle.innerHTML = 'Error';
        }
    }

    const data = new FormData();
    data.append('roomindex', roomindex);

    request.send(data);
}

function loadInfos() {
    const request = new XMLHttpRequest();

    request.open('POST', '/loadinfos');
    request.onload = () => {
        const data = JSON.parse(request.responseText);

        const username = data.username;
        const roomindex = data.roomindex;

        if (username == 'Guest') {
            document.querySelectorAll('.foe').forEach(element => {
                element.disabled = true;
            });

            document.querySelector('#cncr').disabled = true;
        }

        // document.querySelector("#mc").innerHTML = roomindex;        
        loadMessages(roomindex);
    }

    request.send();
}

function loadChat(roomindexs) {
    const request = new XMLHttpRequest();

    request.open('POST', '/setri')
    request.onload = () => {
        const data = JSON.parse(request.responseText);

        const username = data.username;
        const roomindex = data.roomindex;

        loadMessages(roomindex);
    }

    const data = new FormData();
    data.append('roomindex', roomindexs);

    request.send(data);
}