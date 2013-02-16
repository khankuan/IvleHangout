class Canvas():
    drawData = None
    
    def __init__(self):
        self.drawData = []
           
        
    def draw(self, drawData):
        self.drawData.append(drawData)
        return
    
    
    def clear(self):
        self.drawData = []
        return
        
    def undo(self):
        self.drawData.pop()
        
        
    def toObject(self):
        return self.drawData
    
    def isEmpty(self):
        if len(self.drawData) == 0:
            return True
        return False
    