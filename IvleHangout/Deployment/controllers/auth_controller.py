from utils import ivlehelper
import channel_controller
import user_controller
from models import User
import threading
import json

db = None


def auth_init(loadedDb):
    global db
    db = loadedDb


def handleAuth(key, socket):
    t = threading.Thread(target=auth_ivleauth, args=(key, socket))
    t.daemon = False
    t.start()


def auth_ivleauth(key, socket):
    try:
        ivleid, email, fullname = ivlehelper.getUserIvleInfo(key)
        if len(ivleid) == 0:
            socket.write_message("Invalid login.")
            socket.on_close()
            return
    
        # First login
        if not user_controller.user_ivleidExist(ivleid):
            socket.user = User.User(ivleid, email, fullname, "ivle/"+ivleid)
            user_controller.user_addUser(socket.user.ivleid, socket.user)
            db.insertUser(socket.user)
        else:
            socket.user = user_controller.user_getUser(ivleid)
            socket.user.fullname = fullname
            socket.user.email = email
            db.updateUser(socket.user)
            
        socket.user.sockets.append(socket)
        socket.validated = True
        socket.write_message("welcome,userinfo,"+json.dumps(socket.user.infoToObject()))
        socket.write_message("welcome,userpreference,"+json.dumps(socket.user.welcomeInfoToObject()))
        socket.write_message("welcome,availablelevels,"+json.dumps(channel_controller.levels))
        socket.write_message("welcome,availablepermissions,"+json.dumps(channel_controller.permissionTypes))
        
        # if user does not have a new session
        if user_controller.user_ivleidOnline(ivleid):
            for c in socket.user.joined.keys():
                socket.write_message("channel,joinedchannel," + json.dumps(socket.user.joined[c].infoToObject()))
                socket.write_message("channel,canvasdata,"+c+","+json.dumps(socket.user.joined[c].canvas.toObject()))
        
        # Normal login, update with new ivle data
        else: 
            db.updateUser(socket.user)
            # Autojoin channels
            for chan in socket.user.autojoin:
                channel_controller.requestjoin(socket.user, chan, socket)
        
        # Resume private chat
        for u in socket.user.userprivatechat:
            socket.write_message("user,requestedprivchat,"+u);
        
        socket.user.online += 1       
        
    except Exception, e:
        print e
        pass
    
    
def auth_no_ivleauth(noivleid, socket):
    try:
        if noivleid[0] != '.' or user_controller.user_getUser(noivleid) is None:
            socket.write_message("Invalid login.")
            socket.on_close()
            return
        
        socket.user = user_controller.user_getUser(noivleid);
        socket.user.sockets.append(socket)
        socket.validated = True
        socket.write_message("welcome,userinfo,"+json.dumps(socket.user.infoToObject()))
        socket.write_message("welcome,userpreference,"+json.dumps(socket.user.welcomeInfoToObject()))
        socket.write_message("welcome,availablelevels,"+json.dumps(channel_controller.levels))
        socket.write_message("welcome,availablepermissions,"+json.dumps(channel_controller.permissionTypes))
        
        # if user does not have a new session
        if user_controller.user_ivleidOnline(noivleid):
            for c in socket.user.joined.keys():
                socket.write_message("channel,joinedchannel," + json.dumps(socket.user.joined[c].infoToObject()))
                socket.write_message("channel,canvasdata,"+c+","+json.dumps(socket.user.joined[c].canvas.toObject()))
        
        # Normal login, update with new ivle data
        else: 
            # Autojoin channels
            for chan in socket.user.autojoin:
                channel_controller.requestjoin(socket.user, chan, socket)
        
        # Resume private chat
        for u in socket.user.userprivatechat:
            socket.write_message("user,requestedprivchat,"+u);
        
        socket.user.online += 1     
        socket.user.updateLastSeen()
        
    except Exception, e:
        print e
        print noivleid
        pass
    
