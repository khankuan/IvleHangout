class Document():
    channame = None
    filename = None
    uploaderivleid = None
    time = None
    contenttype = None
    url = None
    
    def __init__(self, channame = "", filename = "", uploader = "", time = "", contenttype = "", url = ""):
        self.channame = channame
        self.filename = filename
        self.uploaderivleid = uploader
        self.time = time
        self.contenttype = contenttype
        self.url = url
        
    def toObject(self):
        output = {}
        output['channame'] = self.channame
        output['filename'] = self.filename
        output['uploaderivleid'] = self.uploaderivleid
        output['time'] = self.time
        output['contenttype'] = self.contenttype
        output['url'] = self.url
        return output