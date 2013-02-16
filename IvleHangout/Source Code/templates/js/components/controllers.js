/*
 *************************
 * Controllers
 *************************
 */
 
var canvas;
var canvasPointer = HangoutApp.cursorPosition.create({
					content: "",
				});
 





/* 
	Callback router for the websocket
	This controller determines the type of data before passing it
	to one of the route messages to execute
*/
HangoutApp.routingController = Ember.Object.create({
	
	init: function(){
		this._super();

	},
	
	msgRoute: function(data){
		
		//console.log(JSON.stringify(data));
		switch(data.type){
			case 'welcome':
				HangoutApp.msgRouteManagers.msgWelcome(data);
				break;
			case 'channel':
				HangoutApp.msgRouteManagers.msgChannel(data);
				break;
			case 'user':
				HangoutApp.msgRouteManagers.msgUser(data);
				break;
			case 'notice':
				HangoutApp.msgRouteManagers.msgNotice(data);
				break;
			case 'connection':
				HangoutApp.msgRouteManagers.msgConnection(data);
				break;
			case 'document':
				HangoutApp.msgRouteManagers.msgDocument(data);
				break;
			default: break;
		}	
		
	},
}) //end routing controller




/*
	Route Manager
	Each route manager manages a specific type of message.
	It's grouped into a Object for easier access
*/
HangoutApp.msgRouteManagers = Ember.Object.create({


	//Welcome Messages
	msgWelcome: function(data){
		switch(data.name){
			case 'userinfo':
				HangoutApp.dataControls.setUser(HangoutApp.modelsUser.create({
					fullname: data.selfuser.fullname,
					email: data.selfuser.email,
					nickname: data.selfuser.nickname,
					ivleId: data.selfuser.ivleid,
				}));
				HangoutApp.viewStateContent.transitionTo('dashboard');

				break;

			case 'userpreference':
			
				for (i=0; i < data.preferences.autojoin.length; i++){
					HangoutApp.dataControls.setAutoJoin(data.preferences.autojoin[i]);
				}
				for (i=0; i < data.preferences.mute.length; i++){
					HangoutApp.dataControls.setAutoJoin(data.preferences.autojoin[i]);
				}

				//console.log(HangoutApp.viewsDashboard.userDetails);
				break;
			
			case 'availablelevels':
				//"availableroles":{"Guest":1,"Admin":4,"Visitor":0,"Banned":-1,"Member":2,"Co-Admin":3}} 
				HangoutApp.appsettings.set("availableLevels", data.availableroles)
				break;

			case 'availablepermissions':
				//"availablepermissions":{"draw":0,"invite":0,"upload":0,"topic":0,"chat":0,"changeTopic":0,"download":0,"kick":0}} 
				HangoutApp.appsettings.set("availablePermissions", data.availablepermissions)
				break;

			default: break;	
		}
	}, //end msgWelcome





	//User messages
 	msgUser: function(data){
		
		switch(data.name){
			case 'changednickname':
				var prev = HangoutApp.userObjCollection.userList[data.ivleid].get("nickname");
			
				for (var i = 0; i < HangoutApp.channelObjCollection.content.length; i++){
					var channel = HangoutApp.channelObjCollection.content[i];
					var users = channel.channelUsers;
					
					for (var j = 0; j < users.length; j++){
						if (users[j] == data.ivleid){
							var chatEntry = HangoutApp.modelsChat.create({
								user: data.ivleid,
								content: prev + " is now known as \"" + data.nickname + "\"",
								timestamp: new Date(data.timestamp)
							})
							HangoutApp.dataControls.receiveChatSilent(channel.name, chatEntry, false);
							HangoutFx.scrollChat();
							break;
						}
					}

				}
				HangoutApp.dataControls.setNick(data);
				
				break;

			case 'requestedprivchat':			
				var channel = HangoutApp.modelsChannel.create({
	 					name: data.ivleid,
						isActive: false,
						isPrivateChat: true,
						channelUsers: [],
						content: [],
					});
				channel.channelUsers.pushObject(data.ivleid);
				HangoutApp.dataControls.addChannel(channel);
				break;

			case 'privchat':
				var privChannel = (data.fromIvleid == HangoutApp.userObjCollection.get('loggedIn')) ? data.toIvleid : data.fromIvleid;

				var chatEntry = HangoutApp.modelsChat.create({
	 				user: data.fromIvleid,
	 				content: data.message,
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(privChannel, chatEntry, false);
	 			break;
	 		case 'leaveprivchat':
	 			HangoutApp.dataControls.leavePrivChat(data.ivleid);
	 			HangoutFx.notify("Notice", "Left Private Chat with \"" + data.ivleid +"\"", false);
	 			break;

	 		case 'searcheduser':
	 			HangoutApp.searchResults.set("content", data.results);
	 			HangoutApp.actionControls.showSearchUserResults();

	 			break;	
	 		case 'addedautojoin':
	 			HangoutApp.dataControls.addAutoJoin(data.channelname);
	 			break;
	 		case 'deletedautojoin':
	 			HangoutApp.dataControls.removeAutoJoin(data.channelname);
	 			break;
			default: break;	
		}
	}, //end msgUser






	//Channel Messages
	msgChannel: function(data){
		
		switch(data.name){
	 		case 'joinedchannel':

	 			var channel = HangoutApp.modelsChannel.create({
	 					name: data.channel.name,
						isPublic: data.channel.isPublic,
						channelUsers: [],
						topic: data.channel.topic,
						isRegistered: data.channel.isRegistered,
						isActive: false,
						isFavourite: ($.inArray(data.channel.name, HangoutApp.userObjCollection.getLoggedInUser().get("autojoin")) >= 0) ? true : false,
						acl: [],
						content: [],
						permissions: data.channel.permissions,
					});

					
	 			for (item in data.channel.acl){
	 				channel.acl[item] = data.channel.acl[item];
	 			}

	 			HangoutApp.dataControls.addChannel(channel);
		 		HangoutApp.dataControls.addUserList(data.channel.joined, data.channel.name);
				
				var chatEntry = HangoutApp.modelsChat.create({
	 				user: "Channel Topic",
	 				content: channel.topic,
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChatSilent(data.channel.name, chatEntry, false);
				
	 			break;

	 		case 'leave':
	 			
	 			//var msg = 'user has left the channel';
	 			//msg += (data.isDisconnect) ? ' (disconnect)' : '';

	 			var chatEntry = HangoutApp.modelsChat.create({
	 				user: data.ivleid,
	 				content: 'user has left the channel',
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
	 			HangoutApp.dataControls.removeUser(data.ivleid, data.channelname);
	 			

	 			break;
	 		case 'join':
				HangoutApp.dataControls.addUser(data.user, data.channelname);

	 			var chatEntry = HangoutApp.modelsChat.create({
	 				user: data.user.ivleid,
	 				content: 'user has joined the channel',
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
					
	 			break;

	 		case 'kicked':

	 			var kickuser = (HangoutApp.userObjCollection.userList[data.toIvleid].nickname) ? HangoutApp.userObjCollection.userList[data.toIvleid].nickname : data.toIvleid;
	 			var chatEntry = HangoutApp.modelsChat.create({
	 				user: data.fromIvleid,
	 				content: ' has been kicked out of the channel',
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
	 			HangoutApp.dataControls.removeUser(data.toIvleid, data.channelname);
	 			break;

	 		case 'chat':
	 			var chatEntry = HangoutApp.modelsChat.create({
	 				user: data.ivleid,
	 				content: data.message,
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);

	 			break;

	 		case 'searchedchannel':
	 			HangoutApp.searchResults.set("content", data.results);
	 			HangoutApp.actionControls.showSearchChannelResults();
	 			break;

			case 'canvasdata':
				canvasInit[data.channelname] = data.canvasdata;
				break;
			
			case 'draw':
				if (canvas[data.channelname].isCreated)
					canvas[data.channelname].receiveMove(data.drawData,data.isOwner);
				else
					canvasInit[data.channelname].push(data.drawData);
				break;
			
			case 'clearedcanvas':
				if (canvas[data.channelname].isCreated)
					canvas[data.channelname].clear();
				else
					canvasInit[data.channelname].clear();
				break;
			
			case 'undidcanvas':
				if (canvas[data.channelname].isCreated)
					canvas[data.channelname].undo();
				else
					canvasInit[data.channelname].pop();
				break;
				
				
			case 'topic':
				var channel = HangoutApp.channelObjCollection.getChannel(data.channelname);
				channel.set("topic",data.topic);
				
				var chatEntry = HangoutApp.modelsChat.create({
	 				user: data.ivleid,
	 				content: "changed the topic to \"" + data.topic + "\"",
	 				timestamp: new Date(data.timestamp)
	 			})
				HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
	      HangoutFx.scrollChat();
				break;
				
				
			case 'invited':
				HangoutFx.notify("Notice", data.fromNickname + " (" + data.fromIvleid + ") " + "has invited you to " + data.channelname + ".", true);
				break;
				
				
			case 'registered':
			case 'deregistered':
				var chatEntry = HangoutApp.modelsChat.create({
	 				user: "Channel Notice",
	 				content: 'The channel is now registered',
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
				break;
				
				
			case 'privacy':
				var channel = HangoutApp.channelObjCollection.getChannel(data.channelname);
				var msg = "";
				if (data.isPublic){
					msg = "The channel is now public.";
					channel.set("isPublic", true);
				}
				else {
					msg = "The channel is now private.";
					channel.set("isPublic", false);
				}
				var chatEntry = HangoutApp.modelsChat.create({
	 				user: "Channel Notice",
	 				content: msg,
	 				timestamp: new Date(data.timestamp)
	 			})

	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
				break;
				
				
			case 'invite':
				var chatEntry = HangoutApp.modelsChat.create({
	 				user: "Channel Notice",
	 				content: HangoutApp.userObjCollection.getUserNick(data.fromIvleid) + " has invited " + data.toNickname + " to the channel.",
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
				break;
				
				
			case 'setaccess':
				var channel = HangoutApp.channelObjCollection.getChannel(data.channelname);
				channel.acl[data.ivleid] = data.level;
				channel.reloadUser(data.ivleid);
				
				var availableLevels = HangoutApp.appsettings.get("availableLevels");
				var found = "";
				for (var i in availableLevels){
					if (availableLevels[i] == data.level){
						found = i;
						break;
					}					
				}
				var chatEntry = HangoutApp.modelsChat.create({
	 				user: "Channel Notice",
	 				content: HangoutApp.userObjCollection.getUserNick(data.ivleid) + " is now a " + found + ".",
	 				timestamp: new Date(data.timestamp)
	 			})
	 			HangoutApp.dataControls.receiveChat(data.channelname, chatEntry, false);
				
				
			case 'permissions':
				var channel = HangoutApp.channelObjCollection.getChannel(data.channelname);
				channel.set("permissions", data.permissions);
				
	 		default: break;
	 	}
	 }, //end msgChannel





	 //Notice Messages
	 msgNotice:function(data){
	 	switch(data.name){
	 		case 'changenickname':
	 			if(data.commandtype == "user" ){
		 				HangoutApp.dataControls.resetNick();
		 				HangoutFx.notify("Notice", data.message, false);
		 		}
	 			break;
	 		default: 
	 			HangoutFx.notify("Notice", data.message, false);
	 			break;
	 	}

	 }, //end msgNotice



	 //Connection Messages
	 msgConnection:function(data){
	 	switch(data.name){
	 		case 'closed':
	 			HangoutFx.notify("Oops.. Connection Error", "Sorry.. Connection to the server cannot be established.", false);
	 			$("#disconnect").modal({backdrop: 'static'});
	 			break;
	 		default: break;
	 	}

	 }, //end msgConnection
	 
	 



	 //Document Messages 
	 msgDocument:function(data){
	 	switch(data.name){
	 		case 'preparedupload':
	 			HangoutFx.doUpload(data.sessionkey);
	 			break;
			case 'uploadedfile':
				HangoutApp.dataControls.uploadedFile(data.file);
				break;
			case 'deletedfile':
				HangoutApp.dataControls.deletedFile(data.channelname, data.file.filename);
				break;
			case 'retrieveddirectory':
				HangoutApp.dataControls.initDocumentRepo(data.channelname, data.files);
				break;
			case 'useruploaded':
				HangoutFx.uploading = undefined;
				break;
	 		default: break;
	 	}

	 }, //end msgConnection



	
	
	 

	

 })//end msgRouteManager



 
 
 






 
 
 

 
 
 
 
//Specific Data and Actions Controllers
//----------------------------------------------------------------------------- 



/*
	Action Controls
	These controls specify certain actions
	Most of these controls are attached to events within the template
*/  
HangoutApp.actionControls = Ember.Object.create({
	msgPostValue: "",


	login: function(){
		//HangoutApp.start('noivleauth', '.geraldbutler');
		window.location.href = 'https://ivle.nus.edu.sg/api/login/?apikey=lC5st1dWkIpSF9n6NX8kw&url=' + http + hostname + '/dashboard.html'; 
	},
	logout: function(){
		HangoutApp.logout();
		HangoutApp.viewStateContent.transitionTo('login');
		window.location.reload(true);
	},

	showSearch: function(){
		HangoutApp.channelObjCollection.setAllInactive();
		$("#channelsearch").show();
		$("#channelsearch .searchresults").hide();
		$("#channelsearch #search").fadeIn();
	},

	showSearchResults: function(){
		HangoutApp.channelObjCollection.setAllInactive();
		$("#channelsearch").show();
		$("#channelsearch #search, #channelsearch .searchresults").hide();
	},

	showSearchChannelResults: function(){
		this.showSearchResults();
		$("#channelsearch #searchresults-channel").fadeIn();
	},
	showSearchUserResults: function(){
		this.showSearchResults();
		$("#channelsearch #searchresults-user").fadeIn();
	},


	showChannel: function(){
		HangoutApp.channelObjCollection.setAllInactive();
		$("#channelsearch").hide();
	},

	findChannel: function(){
		HangoutApp.dataControls.serverSearchChannel(HangoutApp.searchResults.get("searchChannelTerm"));
		HangoutApp.searchResults.set("searchChannelTerm", null);
	},
	createChannel:function(){
		HangoutApp.dataControls.serverCreateChannel(HangoutApp.searchResults.get("createChannelTerm"));
		HangoutApp.searchResults.set("createChannelTerm",null);
	},

	findUser: function(){
		HangoutApp.dataControls.serverSearchUser(HangoutApp.searchResults.get("searchUserTerm"));
		HangoutApp.searchResults.set("searchUserTerm", null);
	},


	helpDialog: function(){
		$("#helpShortcuts").modal('toggle');
	}
}) 
 
 





/*
	Data Controls
	This object contains functions which manipulates the data
	Mostly logic based control not meant to be on the template
*/
HangoutApp.dataControls = Ember.Object.create({



  	//User Controls
  	setUser: function(user){
  		HangoutApp.userObjCollection.userList[user.ivleId] = user;
  		HangoutApp.userObjCollection.set("loggedIn", user.ivleId);
       	HangoutApp.userObjCollection.set("tempNickname", user.nickname);
  	},



  	setNick:function(user){
  		var prev = HangoutApp.userObjCollection.userList[user.ivleid].get("nickname");
			//HangoutFx.notify("Notice", "\"" + prev + "\" has changed nickname to \"" + user.nickname + "\"");


  		if(HangoutApp.userObjCollection.get('loggedIn') == user.ivleid){	
		    HangoutApp.userObjCollection.set("tempNickname", user.nickname);  
		}
		HangoutApp.userObjCollection.userList[user.ivleid].set("nickname", user.nickname);
		for (i=0; i < HangoutApp.channelObjCollection.content.length; i++){
			HangoutApp.channelObjCollection.content[i].reloadUser(user.ivleid);
		}
 	},




	resetNick:function(){
      	HangoutApp.userObjCollection.set("tempNickname", 
      		HangoutApp.userObjCollection.getLoggedInUser().get("nickname")
      		);
  	},


  	setAutoJoin: function(join){
      	HangoutApp.userObjCollection.getLoggedInUser().get("autojoin").pushObject(join);
  	},
  	setMute: function(mute){
      	HangoutApp.userObjCollection.getLoggedInUser().get("autojoin").mute.pushObject(mute);
  	},





  	addUserList:function(joined, channelName){
      	for (i=0; i<joined.length; i++){
        	var user = joined[i];

          	if (!HangoutApp.userObjCollection.userList[user.ivleid]){
            	msgUser = HangoutApp.modelsUser.create({
                	fullname: user.fullname,
                	nickname: user.nickname,
                	email: user.email,
                	ivleId: user.ivleid
              	});
              	HangoutApp.userObjCollection.userList[user.ivleid] = msgUser;
         	}

          	if(channelName){
	          	this.addUserToChannel(user, channelName);
	      	}
      	}
  	},


	addUserToChannel: function(user, channelName){
	    var channel = HangoutApp.channelObjCollection.getChannel(channelName);
	    if (channel != -1){
	  	    channel.addUser(user.ivleid);
	    }
	},



	  //Channel Controls
	addChannel: function(channel){
	    HangoutApp.channelObjCollection.addChannel(channel);
	},

	addChannelAutoJoin: function(channelName){
	    HangoutApp.channelObjCollection.channelAutoJoin.pushObject(channelName);
	    //HangoutApp.viewsWidgetUser.channelIdx.pushObject(channelName);
	},
	addChannelMute: function(channelName){
	    HangoutApp.channelObjCollection.channelMute.pushObject(channelName);
	},
	addAutoJoin: function(channelName){
	    var channel = HangoutApp.channelObjCollection.getChannel(channelName);
	    if (channel != -1){
			channel.set("isFavourite", true);
	    }
		HangoutFx.notify("Notice", "Added autojoin / favourite: " + channelName, false);
	},
	removeAutoJoin: function(channelName){
	    var channel = HangoutApp.channelObjCollection.getChannel(channelName);
	    if (channel != -1){
			channel.set("isFavourite", false);
	    }
  		HangoutFx.notify("Notice", "Removed autojoin / favourite: " + channelName, false);
	},



	  //channel > users
	addUser: function(user, channelName){
	  	this.addUserToChannel(user, channelName);
	      
	    var joined = [];
	    joined.push(user);
	    HangoutApp.dataControls.addUserList(joined);
	},





	removeUser: function(id, channelName){
	    var channel = HangoutApp.channelObjCollection.getChannel(channelName);
	    if (channel != -1){
	   	   channel.removeUser(id);
	    }
	      //console.log(HangoutApp.channelObjCollection.getChannel(channelName))
	      //HangoutApp.channelObjCollection.removeUser(id, channelName);
	},




  	//channel > chat
	receiveChatPusher: function(channelName, chat, growl, count){

	  	 var channel = HangoutApp.channelObjCollection.getChannel(channelName);

	     if (channel != -1){
	        var userExist = HangoutApp.userObjCollection.userList[chat.user];
	        chat.user = (userExist) ? userExist.nickname : chat.user;

	        channel.content.pushObject(chat);
	        HangoutFx.scrollChat();


	        //notification
	        if(growl){
	        	HangoutFx.notify(chat.user, chat.content, false)
	        }

	    	if(!channel.get("isActive") && count){
	        	channel.set("unreadCount", channel.get("unreadCount")+1 );
	       	}


		}
	},
	receiveChat: function(channelName, chat, growl){
		this.receiveChatPusher(channelName, chat, growl, true);
	},
	receiveChatSilent: function(channelName, chat, growl){
		this.receiveChatPusher(channelName, chat, growl, false);
	},

	leavePrivChat: function(userid){
	 	HangoutApp.channelObjCollection.removeChannel(userid);
	},

   
	//	on event upload
	uploadedFile: function(file){
			var curfile = HangoutApp.modelsDocument.create({
									channelname: file.channame,
									filename: file.filename,
									uploaderivleid: file.uploaderivleid,
									time: file.time,
									contenttype: file.contenttype,
									url: file.url,
								});
			HangoutApp.channelObjCollection.getChannel(curfile.channelname).documentsRepo.addDocument(curfile);
	},

	//	on event retrieveddirectory
	initDocumentRepo: function(channelname, files){
			//var curRepo = HangoutApp.modelsDocumentRepo.create({
			//						channelname: channelname,
			//					});
			//curRepo.initDocumentRepo(files);
			HangoutApp.channelObjCollection.getChannel(channelname).documentsRepo.initDocumentRepo(files);
			//HangoutApp.documentObjCollection.addDocumentRepo(curRepo);
			//HangoutApp.documentObjCollection
			
	},

	//	on event deletedfile
	deletedFile: function(channelname, filename){
			HangoutApp.channelObjCollection.getChannel(channelname).documentsRepo.removeDocument(filename);
	},










  	/*
    	Server Side Controls
    */

	serverSetNick:function(nickname){
		server.changenickname(nickname);
  	},

  	serverSetFav: function(channelName, fav){
  		if(fav){
  			server.addautojoin(channelName);
  			//HangoutFx.notify("Notice", "Added autojoin / favourite: " + channelName, false);
  		}else{
  			server.deleteautojoin(channelName);
  			//HangoutFx.notify("Notice", "Removed autojoin / favourite: " + channelName, false);
  		}
  	},

  	serverSendMessage:function(channelName, message){
				if (message.length == 0)
					return;
				if (message[0] == "/")
					server.sendcommand(message.substring(1));
				else
					server.sendchat(channelName, message);
  	},

  	serverSendPriv:function(userid, message){
				if (message[0] == "/")
					server.sendcommand(message.substring(1));
				else
					server.sendprivchat(userid, message);
  	},

  	serverChannelLeave: function (channelName){
  		server.requestleave(channelName);
  		HangoutApp.channelObjCollection.removeChannel(channelName);
  		HangoutFx.notify("Notice", "Left channel \"" + channelName + "\"", false)
  	},



  	serverSearchChannel: function(term){
  		server.searchchannel(term);
  	},

  	serverJoinChannel: function(channelName){
  		server.requestjoin(channelName);
  		HangoutFx.notify("Notice", "Join Channel: "+channelName, false);
  		HangoutFx.scrollChannel();
  	},

  	serverCreateChannel: function(channelName){
  		if (channelName){
  			this.serverJoinChannel(channelName);
  		}else{
  			HangoutFx.notify("Error", "Something went wrong while creating / joining channel", false);
  		}
  	},

  	serverSearchUser:function(term){
  		server.searchuser(term);
  	},

  	serverPrivChat:function(userid){
  		server.requestprivchat(userid);
  	},

  	serverPrivChatLeave:function(userid){
  		server.leaveprivchat(userid);
  	},
	
	//send, clear, undo canvas
	serverSendDraw:function(channelName, stroke) {
		server.draw(channelName, stroke);
	},
	
	serverClearCanvas:function(channelName) {
		server.clearcanvas(channelName);
	},
	
	serverUndoCanvas:function(channelName) {
		server.undocanvas(channelName);
	},
	
	
})

 














/*
 **************************************************
 *
 * Data Collections
 *
 **************************************************
 */
 





/*
	Local Database of Channels
	All channels are pushed into this collection for management
*/
HangoutApp.channelObjCollection = Ember.ArrayProxy.create({
    content: [],
    nameIdx: [],

    init: function(){
      this._super();
      this.set("content", []);
    },

    addChannel: function(channel){
    	var idx = $.inArray(channel.name, this.nameIdx);
    	if (idx < 0){
	      	this.content.pushObject(channel);
	     	this.nameIdx.pushObject(channel.name);
	     }
    },


    removeChannel: function(channelName){
    	var idx = $.inArray(channelName, this.nameIdx);
    	if (idx >= 0){
          	this.nameIdx.removeAt(idx, 1);
          	this.content.removeAt(idx, 1); 	
        } 
    },
    getChannel: function(channelName){
        var idx = $.inArray(channelName, this.nameIdx);
        if (idx >= 0){
          return this.content[idx];
        } else {
          return -1;
        }
    },

    setAllInactive: function(){
      for(var i=0; i< this.content.length; i++){
         	this.content[i].set("isActive", false);
      };
    }

});








/*
	User Database
	All users within this application, regardless of Channel are stored here
	Each user have their details logged here, with the Channel
	referencing them here.
*/
HangoutApp.userObjCollection = Ember.ArrayProxy.create({
	loggedIn: null,
	tempNickname: null,
    content: [],
    userList: [],



    //Logged In User Parameters
    getLoggedInUser: function(){
    	return this.userList[this.loggedIn];
    },
    getLoggedInUserFullname: function(){
    	return this.userList[this.loggedIn].get('fullname')
    }.property(),
    getLoggedInUserEmail: function(){
    	return this.userList[this.loggedIn].get('email')
    }.property(),   
		getLoggedInUserIvleid: function(){
    	return this.userList[this.loggedIn].get('ivleid')
    }.property(),		

    getUser:function(ivleid){
    	return this.userList[ivleid];
    },
    getUserNick:function(ivleid){
    	
    	if (this.userList[ivleid]){
	    	return this.userList[ivleid].nickname;
	    }else{
	    	return ivleid;
	    }
    }

});

 


//Collection of Documents
HangoutApp.documentObjCollection = Ember.ArrayProxy.create({
    content: [],
		

    init: function(){
      this._super();
      this.set("content", []);
    },

    addDocumentRepo: function(repo, files){
    	for (var i = 0; i < this.content.length; i++){
				if (this.content[i].channelname == repo.channelname)
          	return;
      } 
			this.content.pushObject(repo);
    },


    removeDocumentRepo: function(channelName){
    	for (var i = 0; i < this.content.length; i++){
				if (this.content[i].channelname == channelName){
          	this.content.removeAt(i, 1);
						break;
				}
      } 
    },
    getDocumentRepo: function(channelName){
      for (var i = 0; i < this.content.length; i++){
				if (this.content[i].channelname == channelName)
          	return this.content[i];
      } 
			return -1;
    },

});
 


 


/*
	Search Results
	This contains search results
	Variables used for search binding is also included
*/
HangoutApp.searchResults = Ember.ArrayProxy.create({
	content: [],


  	searchChannelTerm: null,
 	createChannelTerm: null,
  	searchUserTerm: null,

});



 
 

