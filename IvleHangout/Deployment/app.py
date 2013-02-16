import os.path
import tornado.web
from controllers import hangout_socket
from controllers import hangout_uploader

handlers = [   
	(r"/socket", hangout_socket.ClientListener), 
	(r"/hangout/upload", hangout_uploader.UploadHandler),
	(r"/(.*)", tornado.web.StaticFileHandler, {"path": "./templates"}),
]


settings = dict(
	template_path=os.path.join(os.path.dirname(__file__), "templates"),
)


app = tornado.web.Application(handlers, **settings)


if __name__ == "__main__":   
	app.listen(8888)
	tornado.ioloop.IOLoop.instance().start()
	
	

	