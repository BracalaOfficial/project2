import os
import json

from flask import Flask, session, render_template, url_for, request, redirect, jsonify
from flask_socketio import SocketIO, emit
from flask_session import Session

from datetime import datetime

app = Flask(__name__)
app.config["SECRET_KEY"] = os.getenv("SECRET_KEY")
socketio = SocketIO(app)

app.config["SESSION_PERMANENT"] = False
app.config["SESSION_TYPE"] = "filesystem"
Session(app)

chatrooms = []

class ChatRoom(object):
    def __init__(self, name):
        self.title = name
        self.messages = []

class Message(object):
    def __init__(self, username, message):
        self.user = username
        self.message = message
        self.time = datetime.now()

maincr = ChatRoom("main")
maincr.messages.append(Message("admin", "You are successfully connected!"))
chatrooms.append(maincr)

test1cr = ChatRoom("test1")
test1cr.messages.append(Message("admin", "Welcome! You are successfully connected!"))
chatrooms.append(test1cr)

def isUserLogged():
    if session.get('username'):
        loggeduser = True
    else:
        loggeduser = False

    return loggeduser


@app.route("/")
def index():
    loggeduser = isUserLogged()

    if loggeduser:
        roomnumber = int(session.get('chatroom'))
    else:
        roomnumber = 0

    return render_template('index.html', loggeduser=loggeduser, roomnumber=roomnumber, chatrooms=chatrooms)

@app.route("/login", methods=['GET', 'POST'])
def login():
    loggeduser = isUserLogged()

    if request.method == 'GET':
        if loggeduser:
            return redirect(url_for('index'))
        
        return render_template('login.html', loggeduser=loggeduser)

    if request.method == 'POST':
        username = request.form.get('username')
        session['username'] = username
        session['chatroom'] = 0
        return redirect(url_for('index'))

@app.route("/logout")
def logout():
    session.clear()
    return redirect(url_for('index'))

@app.route("/loadmessages", methods=["POST"])
def loadmessages():
    roomindex = request.form.get('roomindex')

    if chatrooms[int(roomindex)] is None:
        return jsonify({'success': False})

    cr = chatrooms[int(roomindex)]
    mdict = []
    for element in cr.messages:
        mdict.append({'user': element.user, 'message': element.message, 'time': str(str(element.time.hour) + ':' + str(element.time.minute))})
    return jsonify({'success': True, 'title': cr.title, 'messages': mdict})

@app.route("/loadinfos", methods=["POST"])
def loadinfos():
    loggeduser = isUserLogged()
    if loggeduser:
        return jsonify({'username': session['username'], 'roomindex': session['chatroom']})
    else:
        return jsonify({'username': 'Guest', 'roomindex': 0})

@app.route("/setri", methods=["POST"])
def setri():
    roomindex = request.form.get('roomindex')
    loggeduser = isUserLogged()

    if loggeduser:
        session['chatroom'] = roomindex
        return jsonify({'username': session['username'], 'roomindex': session['chatroom']})
    else:
        return jsonify({'username': 'Guest', 'roomindex': roomindex})

@socketio.on('send message')
def msg(data):
    nmsg = data['message']
    roomindex = data['roomindex']
    username = session['username']

    newMessage = Message(username, nmsg)
    chatrooms[int(roomindex)].messages.append(newMessage)

    emit('receive message', int(roomindex), broadcast=True)

@socketio.on('create chatroom')
def createchatroom(data):
    title = data['title']
    username = session['username']

    newChatRoom = ChatRoom(title)
    createionMessage = Message(username, f"{username} created new chat named {title}.")

    newChatRoom.messages.append(createionMessage)
    chatrooms.append(newChatRoom)

    createdcr = {'title': title, 'number': chatrooms.index(newChatRoom)}

    emit('created chatroom', createdcr, broadcast=True)




