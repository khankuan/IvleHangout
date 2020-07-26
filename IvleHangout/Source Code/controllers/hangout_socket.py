import tornado.web
from tornado import websocket
from utils import ivlehelper
from models import User
import user_controller
import channel_controller
import auth_controller
import document_controller
import datetime
import time
from database.database_wrapper import DbWrapper
import json

# Variables used
commands = {}
controller = {}

config = {}
db = None

# init db and standard variables needed
def init():    
    commands['user'] = {}
    controller['user'] = user_controller
    for c in user_controller.__dict__:
        if hasattr(user_controller.__dict__[c], '__call__')  and c.find('user_') != 0:
            commands['user'][c] = c
        
    commands['channel'] = {}
    controller['channel'] = channel_controller  
    for c in channel_controller.__dict__:
        if hasattr(channel_controller.__dict__[c], '__call__') and c.find('channel_') != 0:
            commands['channel'][c] = c
            
    commands['document'] = {}
    controller['document'] = document_controller  
    for c in document_controller.__dict__:
        if hasattr(document_controller.__dict__[c], '__call__') and c.find('document_') != 0 and c != "Key":
            commands['document'][c] = c
    
    # Load config
    configfile = open('config/HangoutConfig.txt', 'r')
    lines = configfile.readlines()
    for l in lines:
        equal = l.find("=")
        config[l[:equal]] = l[equal+1:].strip()
    
    channel_controller.levels = json.loads(config['levels'])
    channel_controller.permissionTypes = json.loads(config['permissionTypes'])
    user_controller.availablestatus = json.loads(config['status'])
    document_controller.AWS_ACCESS_KEY_ID = config['AmazonS3Key']
    document_controller.AWS_SECRET_ACCESS_KEY = config['AmazonS3Secret']
    document_controller.bucket_name = config['AmazonS3Bucket']
    document_controller.bucketurl = config['AmazonS3BucketURL']
    document_controller.mainseed = config['DocumentMainSeed']
    
    # Load from database
    global db
    db = DbWrapper(config['dbHost'], config['dbUser'], config['dbPasswd'], config['dbName'])
    channels, users, docs = db.loadDB()
    channel_controller.channel_init(channels, db)
    user_controller.user_init(users, db)
    auth_controller.auth_init(db)
    document_controller.document_init(docs, db)
    
    
    # Load config for ivleHelper
    ivlehelper._ivleAPIKey = config['ivleAPIKey']
    ivlehelper._ivleURL = config['ivleURL']

    return

    
init()


# Handle all user sockets
class ClientListener(websocket.WebSocketHandler):   
    user = None
    validated = False
    lastactive = None;
    timeoutLimit = 300
    
    
    def checkActive(self):
        if self.lastactive + self.timeoutLimit < time.time():
            self.on_close()
        else:
            tornado.ioloop.IOLoop.instance().add_timeout(datetime.timedelta(seconds=self.timeoutLimit), self.checkActive)
            

    
    def open(self):
        self.allow_draft76()
        tornado.ioloop.IOLoop.instance().add_timeout(datetime.timedelta(seconds=self.timeoutLimit), self.checkActive)
        self.lastactive = time.time()
        pass


    def on_close(self):
        if not self.validated:
            return
        user_controller.sessionclose(self.user, "", self)
        
        
    # if not validated, send to auth_controller
    # else, check commands
    
    def on_message(self,message):
        # handle ping
        try:
            self.lastactive = time.time()
            if message == "ping":
                print "ping from: "+ self.user.ivleid
                return
            
            if message[0:9] == "auth,auth":
                print message[0:12]
            else:
                print message
                
            # convert message to commands and args
            comma = message.find(",")
            if comma == -1:
                comma = len(message)
                
            comma2 = message[comma+1:].find(",") + comma + 1
            if comma2 == comma:
                comma2 = len(message)
                
            commandtype = message[:comma]
            command = message[comma+1:comma2]
            args = message[comma2+1:]  
            
            
            # Not validated
            if not self.validated:
                if commandtype == "auth":
                    if command == "auth":
                        auth_controller.handleAuth(args, self)
                        return
                    elif command == "noivleauth":
                        auth_controller.auth_no_ivleauth(args, self)
                        return
                else:
                    self.write_message("Invalid login")
                    return
    
            # validated
            self.user.updateLastSeen()
            if commandtype in commands and command in commands[commandtype]: 
                methodToCall = getattr(controller[commandtype], command)
                methodToCall(args=args, user=self.user, socket=self)
            else:
                self.write_message("notice,command,Invalid command,Invalid command.")
                print "error: " + message
        except:
            self.close()

        return
        