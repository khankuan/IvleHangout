from models import Channel
from models import PermissionList
from models import AccessControlList
import user_controller
import re
import json
import difflib

levels = {}
permissionTypes = {}
channels = {}
db = None


def channel_init(loadedchans, loadedDb):
    global channels, db
    channels = loadedchans
    db = loadedDb


def printchan(user, args, socket):
    output = []
    for c in channels:
        output.append(channels[c].infoToObject())
    user_controller.user_sendSocketMessage(socket, "channel", "printchan", json.dumps(output))

# Search for a channel
def searchchannel(user, args, socket):
    toSearch = []
    for chan in channels:
        if channels[chan].public:
            toSearch.append(chan)
        elif channels[chan].accesscontrollist.get(user.ivleid) > 0:
            toSearch.append(chan)
    results = difflib.get_close_matches(args, toSearch, 10, 0.35)
    foundchannels = []
    for r in results:
        foundchannels.append(channels[r].infoToObject())
    user_controller.user_sendSocketMessage(socket, "channel", "searchedchannel", json.dumps(foundchannels))



# Register a channel
def registerchannel(user, args, socket):
    if not args and len(args) > 0:
        return
    
    channame = args
    
    # Check if channel is retrieved
    if channame.lower() in channels:
        chan = channels[channame.lower()]
    else:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,registerchannel", channame + " does not exist.")
        return
    
    # Check if too long
    if len(channame.lower()) > 30:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,registerchannel", "Channel name must not be more than 30 characters.")
        return
    
    # Check if channel is already registered
    if chan.registered:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,registerchannel", "The channel is already registered")
        return 
    
    # Check if user in channel
    if channame.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,registerchannel", "You need to be in the channel to register it.")
        return
    
    # Update
    chan.registered = True
    db.setChannelRegistration(chan)

    chan.accesscontrollist.add(user.ivleid,levels['Admin'])
    db.insertACLEntry(user, chan, levels['Admin'])
    
    
    # Notify
    # user_controller.user_sendSocketMessage(socket, "notice", "channel,registerchannel", You have successfully registered " + chan.name + ".")
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "setaccess", chan.name + "," + user.ivleid + "," + str(levels['Admin']))
        user_controller.user_send(chan.joined[u], "channel", "registered", chan.name)
    return



# Register a channel
def deregisterchannel(user, args, socket):
    if not args and len(args) > 0:
        return
    
    channame = args
    
    # Check if channel is retrieved
    if channame.lower() in channels:
        chan = channels[channame.lower()]
    else:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,deregisterchannel", channame + " does not exist.")
        return
    
    # Check if channel is registered
    if not chan.registered:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,deregisterchannel", "The channel is not registered at all.")
        return
    
    # Check if user in channel
    if channame.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,deregisterchannel", "You are not in "+ channame + ".")
        return
    
    # Check if user is admin
    if chan.accesscontrollist.get(user.ivleid) < levels['Admin']:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,deregisterchannel", "You are not the admin of "+ channame + ".")
        return
    
    # Update
    chan.registered = False
    chan.permissionlist.reset()
    db.setPermissions(chan)
    db.deleteACLList(chan)
    db.setChannelRegistration(chan)
    
    # Notify
    # user_controller.user_sendSocketMessage(socket, "notice", "channel", "You have successfully deregistered " + chan.name + ".")
    for j in chan.joined:
        user_controller.user_send(chan.joined[j], "channel", "deregistered", chan.name)
    for u in chan.accesscontrollist.accessControlList:
        for j in chan.joined:
            user_controller.user_send(chan.joined[j], "channel", "setaccess", chan.name + "," + u + ",0")

    chan.accesscontrollist.reset()
    
    return



# Request to join a channel
def requestjoin(user, args, socket): 
    if not args and len(args) > 0:
        return
    
    channame = args
    
    # Check if channel name is valid
    if not re.match("^[A-Za-z0-9.-]*$", channame):
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestjoin", "Channel name can only contain alphabets, numbers, dash or period.")
        return;
    
    if channame.lower() not in channels:
        chan = Channel.Channel(channame, "Topic not set.", True, False, None, None)
        db.createChannel(chan)
        channels[channame.lower()] = chan
    else:    
        chan = channels[channame.lower()]
    
    if user.ivleid in chan.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestjoin", "You are already in "+chan.name+".")
        return
    
    # Check user access
    access = chan.accesscontrollist.get(user.ivleid)
    if access == 0 and not chan.public or access < 0:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestjoin", "You do not have access to " + chan.name + ".")
        return
    
    # Notify and update
    user.joined[chan.name.lower()] = chan

    for u in chan.joined:
        if u != user.ivleid:
            user_controller.user_send(chan.joined[u], "channel", "join", chan.name + "," + json.dumps(user.infoToObject()))
         
    if user.ivleid not in chan.joined:
        chan.joined[user.ivleid] = user
    
    user_controller.user_send(user, "channel", "joinedchannel", json.dumps(chan.infoToObject()))
    user_controller.user_send(user, "channel", "canvasdata",chan.name +","+ json.dumps(chan.canvas.toObject()))
    return
    
    

# User leaves channel
def requestleave(user, args, socket=None, disconnect=None):
    if not args and len(args) > 0:
        return
    
    channame = args
    
    # Check if channel exist
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestleave", channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # Check if user in channel:
    if chan.name.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestleave", "You are not in " + chan.name + ".")
        return
    
    if disconnect:
        disconnect = ",disconnect"
    else:
        disconnect = ""
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "leave", chan.name+","+user.ivleid+disconnect)
    
    # Update
    del chan.joined[user.ivleid]
    del user.joined[chan.name.lower()]
        
    
    
# User invites another user to channel
def requestinvite(user, args, socket):
    if not args and len(args) > 0:
        return
    
    
    # Check if channel exist
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() in channels:
        chan = channels[channame.lower()]
    else:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestinvite", channame + " does not exist.")
        return

    # Check access  
    access = chan.accesscontrollist.get(user.ivleid)
    permission = chan.permissionlist.get("invite")
    if permission > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestinvite", "Insufficient access level.")
        return

    
    targetivleid = args[comma+1:]
    print "check"
    value, check = channel_verifyUser(targetivleid, socket)
    print value
    print check
    if not value:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestinvite", check)
        return
    print "asd" 
    # check if user is in channel
    if targetivleid in chan.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestinvite", targetivleid + " is already in " + chan.name + ".")
        return
    
    
    # Update
    accessToUpdate = False;
    if not chan.public:
        if chan.accesscontrollist.get(targetivleid) == 0:
            chan.accesscontrollist.add(targetivleid,1)
            db.insertACLEntry(user_controller.user_getUser(targetivleid), chan, 1)
            accessToUpdate = True
        
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "invite", user.ivleid + "," + targetivleid + "," + user_controller.user_getUser(targetivleid).nickname + "," + chan.name)
        if accessToUpdate:
            user_controller.user_send(chan.joined[u], "channel", "setaccess", chan.name + "," + targetivleid + "," + "1")

    user_controller.user_send(user_controller.user_getUser(targetivleid), "channel", "invited", user.ivleid + "," + user.nickname + "," + chan.name)

    
# User request to kick another user
def requestkick(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if channel exist
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestkick", "Channel "+ channame + " does not exist.")
        return   
    chan = channels[channame.lower()]
    
    targetivleid = args[comma+1:]

    check = channel_verifyUser(targetivleid, socket)
    if not check[0]:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestkick", check[1])
        return
    
    # Check if user is in channel
    if targetivleid not in chan.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestkick", targetivleid + " is not in " + chan.name + ".")
        return
    
    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if chan.permissionlist.get('kick') > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestkick", "Insufficient access level.")
        return
            
    # Check if user have higher access than kickedUser
    kickedaccess = chan.accesscontrollist.get(targetivleid)
    if kickedaccess > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestkick", "Insufficient access level.")
        return
    
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "kicked", user.ivleid + "," + targetivleid + "," + chan.name)

    # Update
    del chan.joined[targetivleid]
    del user_controller.user_getUser(targetivleid).joined[chan.name.lower()]
    
      
      
# User request to change channel topic
def changetopic(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if channel and topic is valid
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,changetopic", channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # Check if user in channel:
    if chan.name.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,changetopic", " You are not in " + chan.name + ".")
        return
    
    topic = args[comma+1:]
    if len(topic) == 0 or len(topic) > 1000:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,changetopic", "Invalid topic.")
        return

    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if chan.permissionlist.get('topic') > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,changetopic", "Insufficient access level.")
        return
    
    # Update
    chan.topic = topic
    db.setTopic(chan, topic)
      
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "topic", chan.name + "," + user.ivleid + "," + topic)
        


# User request to send chat messages in a channel
def sendchat(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if input is valid
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,sendchat", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    chatmsg = args[comma+1:]
    if len(chatmsg) == 0 or len(chatmsg) > 1000:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,sendchat", "Message is invalid or too long.")
        return
    
    # Check if user is in channel
    if chan.name.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,sendchat", "You are not in "+chan.name+".")
        return

    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if chan.permissionlist.get('chat') > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,sendchat", "Insufficient access level.")
        return
        
    # Notify
    for u in chan.joined:
        if user.ivleid not in chan.joined[u].mute:
            user_controller.user_send(chan.joined[u], "channel", "chat", chan.name + "," + user.ivleid + "," + chatmsg)



# User request to draw on canvas in a channel
def senddraw(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if input is valid
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,senddraw", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    drawjson = args[comma+1:]
    if len(drawjson) == 0 or len(drawjson) > 5000:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,senddraw", "Action is invalid or too long.")
        return
    
    # Check if user is in channel
    if chan.name.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,senddraw", "You are not in "+chan.name+".")
        return

    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if chan.permissionlist.get('draw') > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,senddraw", "Insufficient access level.")
        return
        
    # Check if canvas is full
    if len(chan.canvas.drawData) > 1000:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,senddraw", "Canvas is full. Please clear the canvas.")
        return

    # Store
    try:
        chan.canvas.draw(json.loads(drawjson))
    except Exception, err:
        print err
        user_controller.user_sendSocketMessage(socket, "notice", "channel,senddraw", "Action is invalid or too long.")
        return

    # Set data to send  
    output = {}
    output['channame'] = chan.name
    output['ivleid'] = user.ivleid
    output['drawjson'] = json.loads(drawjson)
    output['owner'] = True
    
    # Send to self socket
    user_controller.user_sendSocketMessage(socket, "channel", "draw", json.dumps(output))
    
    # Exclude self socket
    exclude = []
    exclude.append(socket)
    output['owner'] = False
    
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "draw", json.dumps(output), exclude)

    
    
    
    
# User request to clear canvas in a channel
def clearcanvas(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if input is valid
    channame = args
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,clearcanvas", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # Check if user is in channel
    if chan.name.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,clearcanvas", "You are not in "+chan.name+".")
        return

    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if chan.permissionlist.get('draw') > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,clearcanvas", "Insufficient access level.")
        return
        
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "clearedcanvas", chan.name + "," + user.ivleid)

    # Store
    chan.canvas.clear()
    




# User request to clear canvas in a channel
def undocanvas(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if input is valid
    channame = args
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,undocanvas", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # Check if user is in channel
    if chan.name.lower() not in user.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,undocanvas", "You are not in "+chan.name+".")
        return

    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if chan.permissionlist.get('draw') > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,undocanvas", "Insufficient access level.")
        return
        
    # Check if already empty
    if chan.canvas.isEmpty():
        return    
        
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "undidcanvas", chan.name + "," + user.ivleid)

    # Store
    chan.canvas.undo()




    
#    
## deprecated
## User request to get canvas data in a channel
#def requestcanvasdata(user, args, socket):
#    if not args and len(args) > 0:
#        return
#    
#    # Check if input is valid
#    channame = args
#    if channame.lower() not in channels:
#        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestcanvasdata", "Channel "+ channame + " does not exist.")
#        return
#    chan = channels[channame.lower()]
#    
#    # Check if user is in channel
#    if chan.name.lower() not in user.joined:
#        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestcanvasdata", "You are not in "+chan.name+".")
#        return
#
#    # Check if user have access
#    access = chan.accesscontrollist.get(user.ivleid)
#    if chan.permissionlist.get('draw') > access:
#        user_controller.user_sendSocketMessage(socket, "notice", "channel,requestcanvasdata", "Insufficient access level.")
#        return
#        
#    # Notify
#    user_controller.user_sendSocketMessage(socket, "channel", "requestedcanvasdata", json.dumps(chan.canvas.toObject()))

    


# User reqest to set access level of a user in a channel
def setaccess(user, args, socket):
    if not args and len(args) > 0:
        return
    
    args = args.split(",")
    if len(args) < 3:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setaccess", "Invalid input.")
        return
    
    # Check if input is valid
    channame = args[0]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setaccess", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # verify user
    targetivleid = args[1]
    if not user_controller.user_ivleidExist(targetivleid):
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setaccess", targetivleid + " does not exist.")
        return

    
    try:
        accesslevel = int(args[2])
    except:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setaccess", "Invalid input.")
        return

    # Check if  access is out of bound
    if accesslevel < -1 or accesslevel > levels['Admin']:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setaccess", "Access level out of bound.")
        return
    
    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    toAccess = chan.accesscontrollist.get(targetivleid)
    if access <= toAccess or accesslevel > access:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setaccess", "You have insufficient access level.")
        return
    
    # Update
    targetUser = user_controller.user_getUser(targetivleid)
    if accesslevel == 0:
        chan.accesscontrollist.remove(targetivleid)
        db.deleteACLEntry(targetUser, chan)
    else:
        if chan.accesscontrollist.get(targetivleid) == 0:
            chan.accesscontrollist.add(targetivleid,accesslevel)
            db.insertACLEntry(targetUser, chan, accesslevel)
        else:
            chan.accesscontrollist.add(targetivleid,accesslevel)
            db.updateACLEntry(targetUser, chan, accesslevel)
    
    # Notify
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "setaccess", chan.name + "," + targetivleid + "," + str(accesslevel))     
    


# Set the permission levels of a channel
def setpermissions(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if input is valid
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setpermissions", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]

    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if access < levels['Co-Admin']:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setpermissions", "You have insufficient access level."+str(access))
        return
    
    # Parse json
    try:
        perms = json.loads(args[comma+1:])
    except:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setpermissions", "Syntax error: " + args[comma+1:])
        return
    
    
    # Check if input levels are in range
    for p in perms:
        if p not in permissionTypes:
            user_controller.user_sendSocketMessage(socket, "notice", "channel,setpermissions", "Invalid permission type.")
            return
        aval = int(perms[p])
        if aval < -1 or aval > 4:
            user_controller.user_sendSocketMessage(socket, "notice", "channel,setpermissions", "Invalid level.")
            return

    # Update
    for p in perms:
        chan.permissionlist.add(p, perms[p])
    db.setPermissions(chan)
    
    # Notify
    string = json.dumps(chan.permissionlist.toObject())
    for u in chan.joined:     
        user_controller.user_send(chan.joined[u], "channel", "permissions", chan.name + "," + string);
    
    

def getpermissions(user, args, socket):
    if not args and len(args) > 0:
        return
    
    channame = args
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,getpermissions", "Channel "+ channame + " does not exist.")
        return
    
    chan = channels[channame.lower()]
    
    # Check if user is in channel
    if user.ivleid not in chan.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,getpermissions", "You are not in "+chan.name+".")
        return

    string = json.dumps(chan.permissionlist.toObject())
    
    user_controller.user_sendSocketMessage(socket, "channel", "permissions", chan.name + "," + string)

    



# Set the permission levels of a channel
def setprivacy(user, args, socket):
    if not args and len(args) > 0:
        return
    
    # Check if input is valid
    comma = args.find(",")
    channame = args[:comma]
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setprivacy", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # Check if user have access
    access = chan.accesscontrollist.get(user.ivleid)
    if access < levels['Co-Admin']:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setprivacy", "You have insufficient access level."+str(access))
        return
    
    public = args[comma+1:]
    if public == "public":
        chan.public = True
    elif public == "private":
        chan.public = False
        for p in permissionTypes:
            perm = chan.permissionlist.get(p)
            if perm == 0:
                chan.permissionlist.add(p,1)
    else:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,setprivacy", "Invalid option. Choose or public or private.")
        return
    
    db.setChannelPrivacy(chan)
    db.setPermissions(chan)
    
    # Notify
    user_controller.user_sendSocketMessage(socket, "notice", "channel,setprivacy", "Channel set to " + public + ".")
    for u in chan.joined:
        user_controller.user_send(chan.joined[u], "channel", "privacy", chan.name + "," + public)
    
    
def getaccesscontrols(user, args, socket):
    # check if channel exist
    channame = args
    if channame.lower() not in channels:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,getaccesscontrols", "Channel "+ channame + " does not exist.")
        return
    chan = channels[channame.lower()]
    
    # Check if user is in channel
    if user.ivleid not in chan.joined:
        user_controller.user_sendSocketMessage(socket, "notice", "channel,getaccesscontrols", "You are not in "+chan.name+".")
        return
    
    string = json.dumps(chan.accesscontrollist.toObject())
    user_controller.user_sendSocketMessage(socket, "channel", "getaccesscontrols", string)
    return





def channel_verifyUser(ivleid, socket):
    # check if user exist
    if not user_controller.user_ivleidExist(ivleid):
        return (False, "channel", ivleid + " does not exist.")

    # check if user is online
    if user_controller.user_ivleidOnline(ivleid) == 0:
        return (False, ivleid + " is not online.")

    return True, 'ok'




def channel_getChannel(channame):
    channame = channame.lower()
    if channame in channels:
        return channels[channame]
    else:
        return None