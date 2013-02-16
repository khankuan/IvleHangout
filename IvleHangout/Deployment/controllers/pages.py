import tornado.web
from base import BaseHandler

class MainHandler(BaseHandler):   
    def get(self):       
        self.write("Hello, world")


class StaticRouteHandler(BaseHandler):
    def get(self, page):
        print self.get_template_path() + "/" + page
        self.render(page)