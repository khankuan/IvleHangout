class AccessControlList():
    accessControlList = None
    

    def __init__(self, accessControlList):
        self.accessControlList = {}
        
    def add(self, ivleid, level):
        self.accessControlList[ivleid] = level
        
    def remove(self, ivleid):
        if ivleid in self.accessControlList:
            del self.accessControlList[ivleid]
        
    def reset(self):
        self.accessControlList = {}
        
    def get(self, ivleid):
        if ivleid in self.accessControlList:
            return self.accessControlList[ivleid]
        else:
            return 0
        
    def toObject(self):
        return self.accessControlList