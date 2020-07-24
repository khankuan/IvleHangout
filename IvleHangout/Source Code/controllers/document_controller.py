from models import Document
import json
from boto.s3.key import Key
import boto
import hashlib
import time
import channel_controller
import user_controller
import mimetypes
import base64


# load form config
AWS_ACCESS_KEY_ID = None
AWS_SECRET_ACCESS_KEY = None
mainseed = None
bucket_name = None
documentlist = {}
preparelist = {}
preparelistname = {}
db = None
bucket = None
bucketurl = None
conn = None



def document_init(loadeddocumentlist, loadedDb):
    global db, documentlist, bucket, conn
    db = loadedDb
    conn = boto.connect_s3(AWS_ACCESS_KEY_ID,AWS_SECRET_ACCESS_KEY)
    bucket = conn.get_bucket(bucket_name)
    documentlist = loadeddocumentlist


    
def prepareupload(user, args, socket):   
    comma = args.find(",")
    channame = args[:comma]
    filename = args[(comma+1):]
    
    # Check if channel exists
    if channel_controller.channel_getChannel(channame) == None:
        user_controller.user_sendSocketMessage(socket, "notice", "document,prepareupload", channame + " does not exist.")
        return

    channel = channel_controller.channel_getChannel(channame)
    channelfolder = document_getChannelFolder(channel.name)
        
    # Check access level
    if(channel.accesscontrollist.get(user.ivleid) < channel.permissionlist.get("upload")):
        user_controller.user_sendSocketMessage(socket, "notice", "document,prepareupload", "Permission denied.")
        return
        
    # Check file length
    if (len(filename) <= 0 or len(filename) > 200):
        user_controller.user_sendSocketMessage(socket, "notice", "document,prepareupload", "The length of file name is invalid.")
        return

    # Clean preparelist
    if (channame+ "/" + filename) in preparelistname:
        if int(preparelistname[channame+ "/" + filename].time) + 600 < time.time()*1000:
            sesskey = preparelistname[channame+ "/" + filename].url.replace(bucketurl, "", 1)
            del preparelist[sesskey]
            del preparelistname[channame+ "/" + filename]

    # Check if filename is unique
    if filename in channelfolder or (channame+ "/" + filename) in preparelistname:
        user_controller.user_sendSocketMessage(socket, "notice", "document,prepareupload", "The file name is already used.")
        return

    # Create document
    document = Document.Document(channame, filename, user.ivleid, str(time.time()*1000), mimetypes.guess_type(filename)[0])
    
    m = hashlib.new(mainseed)
    m.update(document.channame)
    m.update("/")
    m.update(document.filename)
    m.update("/")
    m.update(document.uploaderivleid)
    m.update("/")
    m.update(document.time)
    
    sessionkey = m.hexdigest()
    document.url = bucketurl + sessionkey
    preparelist[sessionkey] = document
    preparelistname[document.channame + "/" + document.filename] = document
    
    # Send results
    user_controller.user_sendSocketMessage(socket, "document", "preparedupload", sessionkey)
    return



def retrievedirectory(user, args, socket):
    channame = args
    # Check if channel exists
    if channel_controller.channel_getChannel(channame) == None:
        user_controller.user_sendSocketMessage(socket, "notice", "document,retrievedirectory", channame + " does not exist.")
        return

    channel = channel_controller.channel_getChannel(channame)
        
    # Check access level
    if(channel.accesscontrollist.get(user.ivleid) < channel.permissionlist.get("download")):
        user_controller.user_sendSocketMessage(socket, "notice", "document,retrievedirectory", "Permission denied.")
        return

    # Get folder items
    channelfolder = document_getChannelFolder(channel.name)
    files = []
    for filename in sorted(channelfolder.iterkeys()):
        files.append(channelfolder[filename].toObject())

    # Send results
    output = {}
    output['files'] = files
    output['channame'] = channame
    user_controller.user_sendSocketMessage(socket, "document", "retrieveddirectory", json.dumps(output))
    return



def deletefile(user, args, socket):
    comma = args.find(",")
    channame = args[:comma]
    filename = args[(comma+1):]
    
    # Check if channel exists
    if channel_controller.channel_getChannel(channame) == None:
        user_controller.user_sendSocketMessage(socket, "notice", "document,deletefile", "Channel " + channame + " does not exist.")
        return
    else:
        channel = channel_controller.channel_getChannel(channame)
        
    # Check access level
    if(channel.accesscontrollist.get(user.ivleid) < channel.permissionlist.get("download")):
        user_controller.user_sendSocketMessage(socket, "notice", "document,deletefile", "Permission denied.")
        return
    
    # Check if file exists
    if filename not in document_getChannelFolder(channame):
        user_controller.user_sendSocketMessage(socket, "notice", "document,deletefile", "File " + filename + " does not exist.")
        return

    # Get file
    curfile = document_getChannelFolder(channame)[filename]
    
    # Delete file
    bucket.delete_key(curfile.url[len(bucketurl):])
    db.removeDocument(curfile)
    del document_getChannelFolder(channame)[filename]
    
    # Send results
    for u in channel.joined:
        if channel.accesscontrollist.get(u) >= channel.permissionlist.get("download"):
            user_controller.user_send(channel.joined[u], "document", "deletedfile", json.dumps(curfile.toObject()))
    return
    
    
    
def document_upload(sessionkey, data):
    try:
        # Check if document exists
        if (preparelist.has_key(sessionkey) == False):
            return False
        
        # Get document
        document = preparelist[sessionkey] 
        
        # Set file data
        k = Key(bucket)    
        k.key = sessionkey
        k.set_metadata("Content-Type", document.contenttype)
        k.set_metadata("Content-Disposition", str('attachment; filename="'+document.filename+'"'))
        k.set_contents_from_string(str(base64.decodestring(data[data.find("base64,")+len("base64,"):])))
        k.set_acl('public-read')
           
        # Update
        del preparelist[sessionkey]
        del preparelistname[document.channame + "/" + document.filename]
        channelfolder = document_getChannelFolder(document.channame)
        channelfolder[document.filename] = document
        db.createDocument(document)
        
    except:
        print "error uploading"
        try: 
            bucket.delete_key(sessionkey)
        except:
            pass
    
    # Send results
    channel = channel_controller.channel_getChannel(document.channame)
    for u in channel.joined:
        if channel.accesscontrollist.get(u) >= channel.permissionlist.get("download"):
            user_controller.user_send(channel.joined[u], "document", "uploadedfile", json.dumps(document.toObject()))
    user_controller.user_send(user_controller.user_getUser(document.uploaderivleid), "document", "useruploaded", json.dumps(document.toObject()))
    

    
def document_getChannelFolder(channame):
    if channame not in documentlist:
        documentlist[channame] = {}
    return documentlist[channame]