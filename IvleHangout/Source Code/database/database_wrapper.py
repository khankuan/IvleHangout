#import MySQLdb
from mysql import connector
import json
from Queue import Queue
import time
import threading
from models.User import User
from models.Channel import Channel
from models.PermissionList import PermissionList
from models.Document import Document


class DbWrapper():
    host = None
    user = None
    database = None
    password = None
    
    
    db = None
    cursor = None
    sqlQueue = None
        
        
     
    # Connect DB:
    def __init__(self, host= "", user= "", password= "", database= ""):
        self.host = host
        self.user = user
        self.password = password
        self.database = database
        self._conDB_()
        self.sqlQueue = Queue()
        self._runDBThread_()
        
    
    def _conDB_(self):
        self.db = connector.Connect(host=self.host,user=self.user,passwd=self.password,database=self.database)
        self.cursor = self.db.cursor()
     
        
        
    def _dbThread_(self):
        while True:
            while self.sqlQueue.empty():
                time.sleep(1)
            
            sql = self.sqlQueue.get()
            while True:
                try:
                    x = 1
                    self.cursor.execute(sql)
                    self.db.commit()   
                    break
#               except (AttributeError, connector.OperationalError):
#                        self._conDB_()
#                        self.cursor = self.db.cursor()
#                        self.cursor.execute(sql)
#                        self.db.commit()
                except Exception, e:
                    self._conDB_()
                    log = open('log/hangouterrors.txt', 'a')
                    log.write("Exception in dbms: " + str(e) + ".. SQL: "+sql + " .... Sleep for: "+str(x))
                    log.close()
                    time.sleep(x)
                    x = x * 2
    
    
    def _runDBThread_(self):
        t = threading.Thread(target=self._dbThread_, args=())
        t.daemon = False
        t.start()    
        
    
     
    #For login success
    def insertUser(self, user):    #parameter will be changed to User
        sql = """INSERT INTO _User(IVLE_ID, Name, Email, Nickname) VALUES('%s', '%s', '%s', '%s')""" % (user.ivleid, user.fullname, user.email, user.nickname)
        self.sqlQueue.put(sql)
        return
    
    
    def updateUser(self, user):
        sql = """UPDATE _User SET Email = '%s', Name = '%s', Nickname = '%s' WHERE IVLE_ID = '%s'""" % (user.email, user.fullname, user.nickname, user.ivleid)
        self.sqlQueue.put(sql)
        return
        
    #initDB()
    #if updateUser('IVLE111', 'TSK@gmail.com', 'Tan Swee Khoon', 'tsk'):
    #    print "True"
    #else:
    #    print "false"
    
    #For logout success
    def removeUser(self, user):
        sql = """DELETE FROM _User WHERE IVLE_ID = '%s'""" % (user.ivleid)
        self.sqlQueue.put(sql)
        return
    
    def addAJChannel(self, user, channel):
        sql = """INSERT INTO _AutoJoin(IVLE_ID, ChannelName) VALUES('%s', '%s')""" % (user.ivleid, channel.name)
        self.sqlQueue.put(sql)
        return
        
    #addAJChannel('IVLE111', 1)      #result: false
    #addAJChannel('IVLE444', 2)      #result: true
    
    def deleteAJChannel(self, user, channel):
        sql = """DELETE FROM _AutoJoin WHERE IVLE_ID = '%s' AND ChannelName = '%s'""" % (user.ivleid, channel.name)
        self.sqlQueue.put(sql)
        return
    
    #deleteAJChannel('IVLE555', 1)   #result: false
    #deleteAJChannel('IVLE111', 2)   #result: false
    #deleteAJChannel('IVLE111', 1)   #result: true
    
    def createChannel(self, channel):
        permission = json.dumps(channel.permissionlist.permissionTypes)
        if channel.public & channel.registered:
            sql = """INSERT INTO _Channel(ChannelName, Topic, Public, Registered, Permissions) VALUES('%s', '%s', '%s',  '%s', '%s')"""   % (channel.name, channel.topic, 1, 1, permission)
        elif (not channel.public) & channel.registered:
            sql = """INSERT INTO _Channel(ChannelName, Topic, Public, Registered, Permissions) VALUES('%s', '%s', '%s',  '%s', '%s')"""   % (channel.name, channel.topic, 0, 1, permission)
        elif (not channel.registered) & channel.public:    
            sql = """INSERT INTO _Channel(ChannelName, Topic, Public, Registered, Permissions) VALUES('%s', '%s',  '%s', '%s', '%s')"""   % (channel.name, channel.topic, 1, 0, permission)
        else:
            sql = """INSERT INTO _Channel(ChannelName, Topic, Public, Registered, Permissions) VALUES('%s', '%s', '%s',  '%s', '%s')"""   % (channel.name, channel.topic, 0, 0, permission)
        
        self.sqlQueue.put(sql)
        return
    
    #initDB()
    #channel = Channel("CS3213","hello world",False,True,None,None)
    #createChannel(channel)
    
    def removeChannel(self,channel):     #Does not check if channel was originally registered.
        sql = """DELETE FROM _Channel WHERE ChannelName = '%s'""" % (channel.name)
        self.sqlQueue.put(sql)
        return
    
    #deregisterChannel(2)
    
    def setChannelPrivacy(self,channel):
        if channel.public:
            sql = """UPDATE _Channel SET Public = '%d' WHERE ChannelName='%s'""" % (1, channel.name)
        else:
            sql = """UPDATE _Channel SET Public = '%d' WHERE ChannelName='%s'""" % (0, channel.name)
        self.sqlQueue.put(sql)
        return
    
    #initDB()
    #channel = Channel("New Channel","hello world",True,False,{})
    #setChannelPrivacy(channel)
    
    def setChannelRegistration(self,channel):
        if channel.registered:
            sql = """UPDATE _Channel SET Registered = '%d' WHERE ChannelName='%s'""" % (1, channel.name)
        else:
            sql = """UPDATE _Channel SET Registered = '%d' WHERE ChannelName='%s'""" % (0, channel.name)
        self.sqlQueue.put(sql)
        return
    
    def setTopic(self, channel, topic):
        sql = """UPDATE _Channel SET Topic = '%s' WHERE ChannelName='%s'""" % (topic, channel.name)
        self.sqlQueue.put(sql)
        return
        
    #initDB()
    #channel = Channel("New Channel","hello world",True,False,{})
    #setTopic(channel, "Lets code mei mei!")
    
    def insertACLEntry(self, user, channel, level):
        sql = """INSERT INTO _ACL(ChannelName, IVLE_ID, Level) VALUES('%s','%s','%d')""" % (channel.name, user.ivleid, level)
        self.sqlQueue.put(sql)
        return
        
    def updateACLEntry(self, user, channel, level):
        sql = """UPDATE _ACL SET Level = '%d' WHERE ChannelName='%s' AND IVLE_ID='%s'""" % (level, channel.name, user.ivleid)
        self.sqlQueue.put(sql)
        return
    
    def deleteACLEntry(self, user, channel):
        sql = """DELETE FROM _ACL WHERE IVLE_ID='%s' AND ChannelName='%s'""" % (user.ivleid, channel.name)
        self.sqlQueue.put(sql)
        return
    #deleteACLEntry('IVLE111', 1)
    
    def deleteACLList(self, channel): 
        sql = """DELETE FROM _ACL WHERE ChannelName='%s'""" % (channel.name)
        self.sqlQueue.put(sql)
        return
    #deleteACLList(1)
    
    def setPermissions(self, channel):
        permission = json.dumps(channel.permissionlist.permissionTypes)
        sql = """UPDATE _Channel SET Permissions = '%s' WHERE ChannelName='%s'""" % (permission, channel.name)
        self.sqlQueue.put(sql)
        return
            
    #level = []
    #for i in range(7):
    #    level.append(5)
    #setAllPermissions(1, level)
    
    def addMute(self, user, target):
        sql = """INSERT INTO _Mute(UserID, Muted_UserID) VALUES('%s','%s')""" % (user.ivleid, target.ivleid)
        self.sqlQueue.put(sql)
        return
    
    #addMute('IVLE111', 'IVLE222')
    #addMute('IVLE888', 'IVLE222')
    #addMute('IVLE222', 'IVLE888')
    
    def removeMute(self, user, target):
        sql = """DELETE FROM _Mute WHERE UserID = '%s' and Muted_UserID = '%s'""" % (user.ivleid, target.ivleid)
        self.sqlQueue.put(sql)
        return
    
    #removeMute('IVLE111', 'IVLE333')
    #removeMute('IVLE111', 'IVLE444')
        
    def createDocument(self, document):
        sql = """INSERT INTO _Document(channel_name, filename, ivleid, time, content_type, url) VALUES('%s', '%s', '%s', '%s', '%s', '%s')"""   % (document.channame, document.filename, document.uploaderivleid, document.time, document.contenttype, document.url)
        self.sqlQueue.put(sql)
        return
    
    def removeDocument(self, document):
        sql = """DELETE FROM _Document WHERE channel_name= '%s' AND filename= '%s' """ % (document.channame, document.filename)
                
        self.sqlQueue.put(sql)
        return
    
    def loadDB(self):
    #- Load all data of DB into globalusers and globalchannels
    #- Follow models to see how to store them
    #- Suggested order: 
    #users: Load ivleid, email, fullname, nickname and create User objects
    #mute: Load to user.mute
    #channel: Load channel name, topic, public, registered
    #permission: Load chan.permissions
    #acl: Load chan.users and chan.userslevels
    #autojoin: Load user.autojoin
    #- two objects are returned, (channels, users)
    #- channels maps channel.name to channel object
    #- users map user.ivleid to user object
    #- all the data in DB are initialised to all these objects
        try:
            usersql="SELECT * FROM _User"
            self.cursor.execute(usersql)
            userslist = self.cursor.fetchall()
            self.db.commit()
            userobjlist= {}
            #Storing user objects into user-map.
            for user in userslist:
                userobjlist[user[0]] = User(user[0], user[2], user[1], user[3])
            
            mutesql="SELECT * FROM _Mute"
            self.cursor.execute(mutesql)
            mutelist = self.cursor.fetchall()
            self.db.commit()
            #storing mute-d users data to the respective users
            for mute in mutelist:
                userobjlist[mute[0]].mute[mute[1]] = userobjlist[mute[1]]
        
            channelsql="SELECT * FROM _Channel"
            self.cursor.execute(channelsql)
            channellist = self.cursor.fetchall()
            self.db.commit()
            channelobjlist= {}
            #permissions = PermissionList()
            #Storing channel objects into channel-map (includes permissions)    
            for channel in channellist:
                #permissions.permissionTypes = json.loads(channel[4])
                permissions = PermissionList(json.loads(channel[4]))
                if channel[2]=='1' and channel[3]=='1':
                    channelobjlist[channel[0].lower()] = Channel(channel[0], channel[1], True, True, permissions, None)
                elif channel[2]=='0' and channel[3]=='1':
                    channelobjlist[channel[0].lower()] = Channel(channel[0], channel[1], False, True, permissions, None)
                elif channel[3]=='0' and channel[2]=='1':
                    channelobjlist[channel[0].lower()] = Channel(channel[0], channel[1], True, False, permissions, None)
                else:
                    channelobjlist[channel[0].lower()] = Channel(channel[0], channel[1], False, False, permissions, None)
                    
                    
            aclsql="SELECT * FROM _ACL"
            self.cursor.execute(aclsql)
            acllist = self.cursor.fetchall()
            self.db.commit()
            #Storing ACL into channel object and populating users in a channel into channel object
            for acl in acllist:
                channelobjlist[acl[1].lower()].accesscontrollist.add(acl[0], acl[2])
            
            autojoinsql="SELECT * FROM _AutoJoin"
            self.cursor.execute(autojoinsql)
            autojoinlist = self.cursor.fetchall()
            self.db.commit()
            #Storing autojoin into user object
            for autojoin in autojoinlist:
                userobjlist[autojoin[0]].autojoin[autojoin[1]] = channelobjlist[autojoin[1].lower()]
                
            foldersql="SELECT * FROM _Document"
            self.cursor.execute(foldersql)
            doclist = self.cursor.fetchall()
            self.db.commit()
            hangoutfolderlist= {}    
            
            for doc in doclist:
                documentobj = Document(doc[0], doc[1], doc[2], doc[3], doc[4], doc[5])
                if doc[0] not in hangoutfolderlist:
                    hangoutfolderlist[doc[0]] = {}
                hangoutfolderlist[doc[0]][doc[1]] = documentobj
                
            return (channelobjlist, userobjlist, hangoutfolderlist)
        except Exception, e:
            print "Error connecting db, sleeping for 5 secs:"
            print e
            time.sleep(5)
            self._conDB_()
            return self.loadDB()
    
    #initDB()
    #objlist = loadDB()
    #print "Channels:"
    #for channel in objlist[0]:
    #    print objlist[0][channel].infoToJson()
    #    for user in objlist[0][channel].users:
    #        print "User joined:     " + objlist[0][channel].users[user].infoToJson()
    #print "\nUsers:"
    #for user in objlist[1]:
    #    print objlist[1][user].infoToJson()
        
        
    #Disconnect from DB
    def closeDB(self):
        self.db.close()
        