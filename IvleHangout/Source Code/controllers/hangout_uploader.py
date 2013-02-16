import document_controller
import tornado.web

class UploadHandler(tornado.web.RequestHandler):
    def get(self):
        self.write("Hello upload")
        
    def post(self):
        try:
            sessionkey = self.request.arguments['sessionkey'][0]
            filedata = self.request.arguments['filedata'][0]
            document_controller.document_upload(sessionkey, filedata)
        except Exception, err:
            print "error : " + str(err)
            return 'error'
        print "done" + sessionkey
        return 'done'
