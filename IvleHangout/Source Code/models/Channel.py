from PermissionList import PermissionList
from AccessControlList import AccessControlList
from Canvas import Canvas

class Channel():
    accesscontrollist = None # ivleid : level
    joined = None # ivleid : User
    name = ""
    topic = ""
    public = True
    registered = False
    permissionlist = None # type: Permission
    canvas = None

    
    def __init__(self, name = "", topic = "", public = True, registered = False, permissionlist = None, accesscontrollist = None):
        self.name = name
        self.topic = topic
        self.public = public
        self.registered = registered
        if permissionlist is None:
            permissionlist = {}
            self.permissionlist = PermissionList(permissionlist)
        else:
            self.permissionlist = permissionlist
        if accesscontrollist is None:
            accesscontrollist = {}
            self.accesscontrollist = AccessControlList(accesscontrollist)
        else:
            self.accesscontrollist = accesscontrollist
        self.joined = {}
        self.users = {}
        self.canvas = Canvas()
        
        
    def infoToObject(self):
        output = {}
        output['name'] = self.name
        output['topic'] = self.topic
        output['isPublic'] = self.public
        output['isRegistered'] = self.registered
        output['joined'] = []
        for c in self.joined:
            output['joined'].append(self.joined[c].infoToObject())
        output['acl'] = self.accesscontrollist.accessControlList;
        output['permissions'] = self.permissionlist.permissionTypes;
            
        return output
    

    