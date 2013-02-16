import channel_controller
import re
import json
import difflib

users = {}
nicknames = {} # self init
fullnames = {}
availablestatus = {}
db = None

def user_init(loadedusers, loadedDb):
    global users, nicknames, fullnames, db
    users = loadedusers
    db = loadedDb
    for u in users:
        nicknames[users[u].nickname.lower()] = users[u]
        fullnames[users[u].fullname.lower()] = users[u]


def printuser(user, args, socket):
    output = []
    for u in users:
        output.append(users[u].infoToObject())
    user_sendSocketMessage(socket, "user", "printuser", json.dumps(output))



# searchuser
def searchuser(user, args, socket):
    toSearch = []
    for ivleid in users:
        toSearch.append(ivleid)
    for fullname in fullnames:
        toSearch.append(fullname)
    for nickname in nicknames:
        toSearch.append(nickname)
        
    results = difflib.get_close_matches(args.lower(), toSearch, 10, 0.7)
    foundusers = []
    addedusers = {}
    for r in results:
        if r in users and users[r].ivleid not in addedusers:
            foundusers.append(users[r].infoToObject())
            addedusers[users[r].ivleid] = True
        if r in fullnames and fullnames[r].ivleid not in addedusers:
            foundusers.append(fullnames[r].infoToObject())
            addedusers[fullnames[r].ivleid] = True
        if r in nicknames and nicknames[r].ivleid not in addedusers:
            foundusers.append(nicknames[r].infoToObject())
            addedusers[nicknames[r].ivleid] = True
    user_sendSocketMessage(socket, "user", "searcheduser", json.dumps(foundusers))
    



# Change a user's nickname
def changenickname(user, args, socket):
    if not args and len(args) > 0:
        return

    # New nickname check
    newNickname = args
    if len(newNickname) == 0:
        user_sendSocketMessage(socket, "notice", "user,changenickname", "Nickname must not be empty.")
        return
    if len(newNickname) > 25:
        user_sendSocketMessage(socket, "notice", "user,changenickname", "Nickname must not be more than 25 characters.")
        return
    if not re.match("^[A-Za-z0-9.-]*$", newNickname):
        user_sendSocketMessage(socket, "notice", "user,changenickname", "Nickname can only contain alphabets, numbers, dash or period.")
        return
    if newNickname.lower() in nicknames:
        user_sendSocketMessage(socket, "notice", "user,changenickname", "Nickname is already in used.")
        return
    
    # Update data
    if user.nickname.lower() in nicknames:
        del nicknames[user.nickname.lower()]
    nicknames[newNickname.lower()] = user
    user.nickname = newNickname
    
    #global db
    db.updateUser(user)
    
    # Prepare to send
    ivleidToSend = {}
    for chan in user.joined:
        channel = user.joined[chan]
        for u in channel.joined:
            ivleidToSend[u] = channel.joined[u]
    
    for u in user.privatechat:
        ivleidToSend[u] = users[u]
        
    ivleidToSend[user.ivleid] = user
    
    # Notify
    for ivleid in ivleidToSend:
        user_send(ivleidToSend[ivleid], "user", "changednickname", user.ivleid + ","+newNickname)




# Add a user to mute list
def addmute(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # User check
    if not args in users:
        user_sendSocketMessage(socket, "notice", "user,addmute", args + " does not exist")
        return
    elif args == user.ivleid:
        user_sendSocketMessage(socket, "notice", "user,addmute", "You cannot mute yourself.")
        return
    elif args in user.mute:
        user_sendSocketMessage(socket, "notice", "user,addmute", args + " is already on your mutelist.")
        return
    
    toUser = users[args]
        
    # Update data 
    db.addMute(user, toUser)
    user.mute[toUser.ivleid] = toUser
    
    # Notify
    user_send(user, "user", "muted", toUser.ivleid);
    
    
    
# Add a user to mute list
def removemute(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # User check
    if not args in users:
        user_sendSocketMessage(socket, "notice", "user,removemute", args + " does not exist.")
        return

    toUser = users[args]

    if not toUser.ivleid in user.mute:
        user_sendSocketMessage(socket, "notice", "user,removemute", toUser.ivleid + " is not in your mute list.")
        return
        
    # Update data 
    db.removeMute(user, toUser)
    del user.mute[toUser.ivleid]
    
    # Notify
    user_send(user, "user", "removedmute", toUser.ivleid);    
    


# Add a channel to user's autojoin list
def addautojoin(user, args, socket):
    if not args and len(args) > 0:
        return
    
    chan = channel_controller.channel_getChannel(args)
    if chan is None:
        user_sendSocketMessage(socket, "notice", "user,addautojoin", args + " does not exist.");
        return
    
    # Update
    if chan.name not in user.autojoin:
        user.autojoin[chan.name] = chan
        db.addAJChannel(user, chan)
    else:
        user_sendSocketMessage(socket, "notice", "user,addautojoin", chan.name + " is already in your autojoin list.");
        return
    
    # Notify
    user_send(user, "user", "addedautojoin", chan.name);
    
    
    
# Remove a channel from user's autojoin list
def deleteautojoin(user, args, socket):
    if not args and len(args) > 0:
        return
    
    channame = args
    
    # Check if channel is in autojoin list
    if channame not in user.autojoin:
        user_sendSocketMessage(socket, "notice", "user,deleteautojoin", channame + " is not in your autojoin list.")
        return
    
    # Check if channel exist
    chan = channel_controller.channel_getChannel(channame)
    if chan is None:
        user_sendSocketMessage(socket, "notice", "user,deleteautojoin", args + " does not exist.");
        return
    
    # Update
    db.deleteAJChannel(user, chan)
    del user.autojoin[channame]
    
    # Notify
    user_send(user, "user", "deletedautojoin", channame);
    
    
    
# Retrieve autojoin lists of a user
def retrieveautojoin(user, args, socket):    
    # Notify
    user_sendSocketMessage(socket, "user", "retrieveautojoin", ','.join(user.autojoin))



# Request a private chat session with another user
def requestprivchat(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Input checking
    if user_ivleidExist(args):
        toUser = users[args]
    else:
        user_sendSocketMessage(socket, "notice", "user,requestprivchat", "Invalid user.");
        return
    
    if not user_ivleidOnline(toUser.ivleid):
        user_sendSocketMessage(socket, "notice", "user,requestprivchat", toUser.ivleid + " is not online.");
        return
    
    # Check if chat sessions already exist
    if toUser.ivleid in user.userprivatechat:
        user_sendSocketMessage(socket, "notice", "user,requestprivchat", toUser.ivleid + " already have a chat session with you.");
        return
    
    # Update
    if user.ivleid not in toUser.privatechat:
        toUser.privatechat[user.ivleid] = user

    user.userprivatechat[toUser.ivleid] = toUser
    
    # Notify
    user_send(user, "user", "requestedprivchat", toUser.ivleid)
    
    return



# Request a private chat session with another user
def leaveprivchat(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Input checking
    if user_ivleidExist(args):
        toUser = users[args]
    else:
        user_sendSocketMessage(socket, "notice", "user,leaveprivchat", "Invalid user.");
        return
    
    # Check if private chat exist
    if toUser.ivleid not in user.userprivatechat:
        user_sendSocketMessage(socket, "notice", "user,leaveprivchat", toUser.ivleid + " does not have a chat session with you.");
        return
    
    # Update
    del toUser.privatechat[user.ivleid]
    del user.userprivatechat[toUser.ivleid]
   
    # Notify
    user_send(user, "user", "leaveprivchat", toUser.ivleid)
    
    return



# Private chat between 2 users
def sendprivchat(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Input checking
    comma = args.find(",")
    if user_ivleidExist(args[:comma]):
        toUser = users[args[:comma]]
    else:
        user_sendSocketMessage(socket, "notice", "user,sendprivchat", "Invalid user.");
        return
    
    if not user_ivleidOnline(toUser.ivleid):
        user_sendSocketMessage(socket, "notice", "user,sendprivchat", toUser.ivleid + " is not online.");
        return
        
    # Check if private chat exist
    if toUser.ivleid not in user.userprivatechat:
        user_sendSocketMessage(socket, "notice", "user,sendprivchat", toUser.ivleid + " does not have a chat session with you.");
        return
        
    msg = args[comma+1:]
    if not msg or len(msg) == 0 or len(msg) > 1000:
        user_sendSocketMessage(socket, "notice", "user,sendprivchat", "Message is invalid or too long.");
        return
    
    # Notify
    if user.ivleid not in toUser.mute:
        if user.ivleid not in toUser.userprivatechat:
            requestprivchat(toUser, user.ivleid, None)
        user_send(toUser, "user", "privchat", user.ivleid + "," + toUser.ivleid +"," + msg)
    user_send(user, "user", "privchat", user.ivleid + "," + toUser.ivleid +"," + msg)



# Change a user's nickname
def updatestatus(user, args, socket):
    if not args and len(args) > 0:
        return

    # New nickname check
    newstatus = args
    if newstatus not in availablestatus:
        user_sendSocketMessage(socket, "notice", "user,updatestatus", "Status is not valid.");
        return
    
    # Update data
    user.status = newstatus
    
    # Prepare to send
    ivleidToSend = {}
    for chan in user.joined:
        channel = user.joined[chan]
        for u in channel.joined:
            ivleidToSend[u] = channel.joined[u]
    
    for u in user.privatechat:
        ivleidToSend[u] = users[u]
        
    ivleidToSend[user.ivleid] = user
    
    # Notify
    for ivleid in ivleidToSend:
        user_send(ivleidToSend[ivleid], "user", "updatedstatus", user.ivleid + ","+newstatus)




# Get user info
def getuserinfo(user, args, socket):
    if not args and len(args) > 0:
        return
    
    if not args in users:
        user_sendSocketMessage(socket, "notice", "user,getuserinfo", "Invalid user.",)
        return
    
    foundUser = users[args]
    string = json.dumps(foundUser.infoToObject())

    user_sendSocketMessage(socket, "user", "userinfo", string)


def sessionclose(user, args, socket):
    user.online -= 1
    for s in user.sockets:
        if s == socket:
            user.sockets.remove(s)
            break
    if user.online == 0:
        user_disconnect(user)
    print "One of " + socket.user.ivleid + " quitted"
    
    try:
        user_sendSocketMessage(socket, "user", "sessionclose", "Byebye.")
    except:
        pass
    socket.validated = False


# Send user command messages
def user_send(user, messageType, messageSubType, message, exclude=None):    
    if exclude is None:
        exclude = []
    for s in user.sockets:
        if s not in exclude:
            user_sendSocketMessage(s, messageType, messageSubType, message)    
    
    
# Send a specific socket notice messages
def user_sendSocketMessage(socket, messageType, messageSubType, message):
    try:
        socket.write_message(messageType+","+messageSubType+","+message)
    except:
        print "Socket is closed: "+messageType+","+messageSubType+","+message


# Check if user exist
def user_ivleidExist(ivleid):
    if ivleid in users:
        return True
    return False



# Check if user is online
def user_ivleidOnline(ivleid):
    if user_ivleidExist(ivleid):
        if users[ivleid].online:
            return True
        return False
    raise Exception('User does not exist.')


# Adds an user object
def user_addUser(ivleid, user):
    if ivleid in users:
        raise Exception("Ivleid already exist.")
    users[ivleid] = user
    nicknames[user.nickname.lower()] = user
    fullnames[user.fullname.lower()] = user
    


# Returns an user object
def user_getUser(ivleid):
    if ivleid in users:
        return users[ivleid]
    return None
    


# Disconnect
def user_disconnect(user):
    joinedchans = []
    for c in user.joined:
        joinedchans.append(c)
    for c in joinedchans:
        channel_controller.requestleave(user, c, None, True)