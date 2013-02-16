/*
 *************************
 * Models
 *************************
 */
 
 
HangoutApp.modelsChat = Ember.Object.extend({
	user: null,
	content: null,
	timestamp: null
});


HangoutApp.modelsUser = Ember.Object.extend({
	fullname: null,
	email: null,
	nickname: null,
	ivleId: null,
	autojoin: [],
	mute: []
});


HangoutApp.modelsAcl = Ember.Object.extend({
	name: null,
	level: 0,
});



HangoutApp.modelsChannel = Ember.Object.extend({
	content: [], //chats
  documentsRepo: null,
	canvasPointer: null,	
		
	contentMute: [],
	channelAutoJoin: [],
	channelUsers: Ember.ArrayProxy.create({content: []}),

	acl: [], //acl model
	permissions: [],


	id: -1,
	name: null,	
	topic: "",
	unreadCount: 0,

	msg: null,

	isPublic: false,
	isRegistered: false,
	isActive: false,
	isFavourite: false,
	isPrivateChat: false,

	init: function(){
		this._super();
		this.documentsRepo = HangoutApp.modelsDocumentRepo.create({
									channelname: this.name,
								});
		this.canvasPointer = canvasPointer;
	},

	addMsg: function(message){
		this.content.pushObject(message);
	},	
	
	getPermissions: function(type){
		if (this.permissions != undefined && type in this.permissions)
			return this.permissions[type];
		return 0;
	},

	addUser: function(id){
		//if (!this.channelUsers[id])
		//	this.channelUsers.push(1);

		//this.channelUsers[id] = true;
		this.channelUsers.pushObject(id);
	},

	removeUser: function(id){
		/*if (this.channelUsers[id]){
			this.channelUsers.splice(id, 1);
			this.channelUsers.pop(1);
		};*/
		//this.channelUsers.splice($.inArray(id, this.channelUsers));

		this.channelUsers.removeObject(id);
	},
	
	reloadUser: function(id){

		if ($.inArray(id, this.channelUsers.content)){
			this.removeUser(id);
			this.addUser(id);
		}
	},
	

	sendMsg: function(){
		if (this.msg){
			if (this.isPrivateChat){
				HangoutApp.dataControls.serverSendPriv(this.name, this.msg);
			}else{
				HangoutApp.dataControls.serverSendMessage(this.name, this.msg);
			}
		}
		this.set('msg', null);		
	},
	
	getACL: function(ivleid){
		if (ivleid in this.acl)
			return this.acl[ivleid];
		return 0;
	}


})



//	Document Repo model
HangoutApp.modelsDocumentRepo = Ember.Object.extend({
		channelname: null,
		content: [],
		isInit: false,
		
		init: function(){
			this._super();
			this.content = [];
		},
		
		addDocument: function(documentObj){
			this.content.pushObject(documentObj);
		},
		
		removeDocument: function(filename){
			for (var i = 0; i < this.content.length; i++){
					if (this.content[i].filename == filename){
							this.content.removeObject(this.content[i]);
							break;
					}
			}
		},
		
		initDocumentRepo: function(files){
			var count = this.content.length;
			for (var i = 0; i < count; i++)
				this.content.popObject();
			for (var i = 0; i < files.length; i++){
				var curfile = HangoutApp.modelsDocument.create({
									channelname: files[i].channame,
									filename: files[i].filename,
									uploaderivleid: files[i].uploaderivleid,
									time: files[i].time,
									contenttype: files[i].contenttype,
									url: files[i].url,
								});
				this.content.pushObject(curfile);
			}
		},
});


//	Document model
HangoutApp.modelsDocument = Ember.Object.extend({
		channelname: null,
    filename: null,
    uploaderivleid: null,
    time: null,
    contenttype: null,
    url: null,
});




//	Document model
HangoutApp.cursorPosition = Ember.Object.extend({
		content: "",
		setContent: function(v){
			this.set("content", v);
		},
});











