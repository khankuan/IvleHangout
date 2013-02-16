import time

class User():
    mute = None # ivleid : User
    joined = None # channelnames: Channel
    autojoin = None   # channelnames : Channel
 
    ivleid = None
    email = None
    fullname = None
    nickname = None
    online = 0
    sockets = None
    privatechat = None
    userprivatechat = None
    status = None
    lastseen = None
    
    def __init__(self, ivleid, email, fullname, nickname):
        self.ivleid = ivleid
        self.email = email
        self.fullname = fullname
        self.nickname = nickname
        self.online = 0
        self.sockets = []
        self.mute = {}
        self.joined = {}
        self.autojoin = {}
        self.privatechat = {}   # Others to self
        self.userprivatechat = {}   # Self to others
        self.status = "Available"
        
    def infoToObject(self):
        output = {}
        output['ivleid'] = self.ivleid
        output['email'] = self.email
        output['fullname'] = self.fullname
        output['nickname'] = self.nickname
        output['online'] = self.online
        chans = []
        for c in self.joined:
            if self.joined[c].public:
                chans.append(c)
        output['joined'] = chans
        output['status'] = self.status
        output['lastseen'] = self.lastseen
        return output

    def welcomeInfoToObject(self):
        output = {};
        output['mute'] = self.mute.keys()
        output['autojoin'] = self.autojoin.keys()
        return output
    
    def updateLastSeen(self):
        self.lastseen = time.time()