class PermissionList():
    permissionTypes = None   # e.g. type['upload'] = 3
    
    def __init__(self, permissionTypes):
        if permissionTypes is None:
            self.permissionTypes = {}
        else:
            self.permissionTypes = permissionTypes
        
    def add(self, ptype, level):
        self.permissionTypes[ptype] = level
        
    def remove(self, ptype, level):
        del self.permissionTypes[ptype]
        
    def reset(self):
        self.permissionTypes = {}
        
    def get(self, ptype):
        if ptype in self.permissionTypes:
            return self.permissionTypes[ptype]
        else:
            return 0
        
    def toObject(self):
        print self.permissionTypes
        return self.permissionTypes