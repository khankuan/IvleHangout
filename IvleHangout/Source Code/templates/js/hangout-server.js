/*
 *************************
 * Hangout server interface for Client
 *************************
 */
var HangoutServer = (function(socketURL, authType, key){
	/*
	 *************************
	 * Private Variables
	 *************************
	 */
 
						//	Main socket with server
						this.ws = new WebSocket(socketURL);
						
						var self = this;
							
						this.ws.onopen =
							function(event) {
								self.login(authType, key);
							};
						
						
						
						this.ws.onmessage = 
							function(event) {
								self.notifyController(event.data, event.timeStamp);
							};

						
						this.ws.onclose = 
							function(event) {       
								event.data = "connection,closed";
								self.notifyController(event.data, event.timeStamp);
							};

						
						//	Callback to controller
						this.eventHandlerFunction = undefined;
						
						//	Queue for buffer
						this.queue = [];

	/*
	 *************************
	 * Methods for controllers to call
	 *************************
	 */
	 this.ready = function(){
		 return ws.readyState;
	 }
	 
						this.setCallback = function(self, callback){
								this.eventHandlerFunction = self[callback];
								for (var i = 0; i < this.queue.length; i++)
									this.eventHandlerFunction(this.queue[i]);
								this.queue = [];
						};
	 
	 
						//	Login method
						this.login = function(type, key){
								this.ws.send("auth,"+type+","+key);
						};
						
						//	Logout
						this.logout = function(){
								this.ws.send("user,sessionclose");
								clearTimeout(this.pingVariable);
						};
					
						//	Raw commands to server
						this.sendcommand = function(command){
								this.ws.send(command);
						};

						//	Request to send a chat to a channel
						this.sendchat = function(channelname, text){
								this.ws.send("channel,sendchat,"+channelname+","+text);
						};	
							
						//	Request to register a channel
						this.registerchannel = function(channelname){
								this.ws.send("channel,registerchannel,"+channelname);
						};

						//	Request to deregister a channel
						this.deregisterchannel = function(channelname){
								this.ws.send("channel,deregisterchannel,"+channelname);
						};

						//	Request to join a channel
						this.requestjoin = function(channelname){
								this.ws.send("channel,requestjoin,"+channelname);
						};

						//	Request to leave a channel
						this.requestleave = function(channelname){
								this.ws.send("channel,requestleave,"+channelname);
						};

						//	Request to invite a user to a channel
						this.requestinvite = function(channelname, ivleid){
								this.ws.send("channel,requestinvite,"+channelname+","+ivleid);
						};

						//	Request to kick a user in a channel
						this.requestkick = function(channelname, ivleid){
								this.ws.send("channel,requestkick,"+channelname+","+ivleid);
						};

						//	Request to change topic of a channel
						this.changetopic = function(channelname, topic){
								this.ws.send("channel,changetopic,"+channelname+","+topic);
						};

						//	Request to set a channel's privacy
						this.setprivacy = function(channelname, publicBit){
								if (publicBit)
									this.ws.send("channel,setprivacy,"+channelname+",public");
								else
									this.ws.send("channel,setprivacy,"+channelname+",private");
						};

						//	Request to set access of a user of a channel
						this.setaccess = function(channelname, ivleid, level){
								this.ws.send("channel,setaccess,"+channelname+","+ivleid+","+level);
						};

						//	Set permissions of a channel
						this.setpermissions = function(channelname, permissions){
								this.ws.send("channel,setpermissions,"+channelname+","+JSON.stringify(permissions));
						};

						//	Search a channel with a query string
						this.searchchannel = function(query){
								this.ws.send("channel,searchchannel,"+query);
						};
						
						//	Draw on a channel's canvas
						this.draw = function(channelname, stroke){
								this.ws.send("channel,senddraw,"+channelname+","+JSON.stringify(stroke));
						};
						
						//	Clear canvas of a channel
						this.clearcanvas = function(channelname){
								this.ws.send("channel,clearcanvas,"+channelname);
						};
						
						//	Undo canvas of a channel
						this.undocanvas = function(channelname){
								this.ws.send("channel,undocanvas,"+channelname);
						};

						//	Change user's nickname
						this.changenickname = function(nickname){
								this.ws.send("user,changenickname,"+nickname);
						};

						//	Mute a user
						this.addmute = function(ivleid){
								this.ws.send("user,addmute,"+ivleid);
						};

						//	Unmute a user
						this.unmute = function(ivleid){
								this.ws.send("user,removemute,"+ivleid);
						};

						//	Request to start private chat with a user
						this.requestprivchat = function(ivleid){
								this.ws.send("user,requestprivchat,"+ivleid);
						};
						
						//	Request to end private chat with a user
						this.leaveprivchat = function(ivleid){
								this.ws.send("user,leaveprivchat,"+ivleid);
						};
						
						//	Request to send a private chat to a user
						this.sendprivchat = function(ivleid, text){
								this.ws.send("user,sendprivchat,"+ivleid+","+text);
						};

						//	Adds a channel to autojoin list
						this.addautojoin = function(channelname){
								this.ws.send("user,addautojoin,"+channelname);
						};

						//	Deletes a channel from autojoin list
						this.deleteautojoin = function(channelname){
								this.ws.send("user,deleteautojoin,"+channelname);
						};

						//	Search for a user by nickname
						this.searchuser = function(query){
								this.ws.send("user,searchuser,"+query);
						};

						//	Request for specific user's info
						this.getuserinfo = function(ivleid){
								this.ws.send("user,getuserinfo,"+ivleid);
						};
						
						//	Request to update status
						this.updatestatus = function(status){
								this.ws.send("user,updatestatus,"+status);
						};
						
						//	Prepare to upload a document
						this.prepareupload = function(channelname, filename){
								this.ws.send("document,prepareupload,"+channelname+","+filename);
						}
						
						//	Retrieve document directory
						this.retrievedirectory = function(channelname){
								this.ws.send("document,retrievedirectory,"+channelname);
						}
						
						//	Upload a file after it is prepared
						this.upload = function(){
							//	Undecided
						}
						
						//	Upload a file after it is prepared
						this.deletefile = function(channelname, filename){
								this.ws.send("document,deletefile,"+channelname+","+filename);
						}

	
	/*
	 *************************
	 * Methods to notify controller
	 *************************
	 */
						this.notifyController = function(message, timestamp){
							//	Event object to send to controller
							var event = new Object();
						
							try {
								//	Break message
								comma = message.indexOf(",");
								event.type = message.substring(0, comma);
								message = message.substring(comma+1, message.length);
								
								comma2 = message.indexOf(",");
								if (comma2 == -1)
									comma2 = message.length;
								event.name = message.substring(0, comma2);
								
								var args;
								if (comma2+1 < message.length)
									args = message.substring(comma2+1, message.length);
								else
									args = "";
								
								event.timestamp = timestamp;
									
								//	Case of user type
								if (event.type == "user"){	
									switch (event.name)
									{
										case "userinfo":
											event.user = JSON.parse(args);
											break;
										
										case "changednickname":
											args = args.split(",");
											event.ivleid = args[0];
											event.nickname = args[1];
											break;
											
										case "addedautojoin":
											event.channelname = args;
											break;
											
										case "deletedautojoin":
											event.channelname = args;
											break;
											
										case "muted":
											event.ivleid = args;
											break;
											
										case "removedmute":
											event.ivleid = args;
											break;
											
										case "requestedprivchat":
											event.ivleid = args;
											break;
											
										case "leaveprivchat":
											event.ivleid = args;
											break;
											
										case "privchat":
											args = args.split(",");
											event.fromIvleid = args[0];
											event.toIvleid = args[1];
											event.message = args[2];
											break;
											
										case "searcheduser":
											event.results = JSON.parse(args);
											break;
														
										case "sessionclose":				
											break;
										
										case "updatedstatus":
											args = args.split(",");
											event.ivleid = args[0];
											event.status = args[1];
											break;
										
										default:
											break;
									}
								} 
								//	Case of channel type
								else if (event.type == "channel"){
									switch (event.name)
									{
										case "chat":
											var split = args.indexOf(",");
											event.channelname = args.substring(0,split);
											args = args.substring(split+1);
											var split2 = args.indexOf(",");
											event.ivleid = args.substring(0,split2);
											event.message = args.substring(split2+1);
											break;
										
										case "join":
											var split = args.indexOf(",");
											event.channelname = args.substring(0,split);
											event.user = JSON.parse(args.substring(split+1,args.length));
											break;
											
										case "leave":
											args = args.split(",");
											if (args[2] == "undefined")
												event.isDisconnect = false;
											else
												event.isDisconnect = true;
											event.channelname = args[0];
											event.ivleid = args[1];
											break;
											
										case "joinedchannel":
											event.channel = JSON.parse(args);
											break;
											
										case "topic":
											var split = args.indexOf(",");
											event.channelname = args.substring(0,split);
											args = args.substring(split+1,args.length);
											var split2 = args.indexOf(",");
											event.ivleid = args.substring(0,split2);
											event.topic = args.substring(split2+1,args.length);
											break;
											
										case "permissions":
											var split = args.indexOf(",");
											event.channelname = args.substring(0,split);
											event.permissions = JSON.parse(args.substring(split+1,args.length));
											break;
											
										case "setaccess":
											args = args.split(",");
											event.channelname = args[0];
											event.ivleid = args[1];
											event.level =args[2];
											break;
										
										case "registered":
											event.channelname = args;
											break;
											
										case "deregistered":
											event.channelname = args;
											break;
											
										case "privacy":
											args = args.split(",");
											event.channelname = args[0];
											if (args[1] == "public")
												event.isPublic = true;
											else
												event.isPublic = false;
											break;
											
										case "invite":
											args = args.split(",");
											event.fromIvleid = args[0];
											event.toIvleid = args[1];
											event.toNickname = args[2];
											event.channelname = args[3];
											break;
											
										case "invited":
											args = args.split(",");
											event.fromIvleid = args[0];
											event.fromNickname = args[1];
											event.channelname = args[2];
											break;
											
										case "kicked":
											args = args.split(",");
											event.fromIvleid = args[0];
											event.toIvleid = args[1];
											event.channelname = args[2];
											break;
											
										case "searchedchannel":
											event.results = JSON.parse(args);
											break;
										
										case "draw":
											var data = JSON.parse(args);
											event.channelname = data.channame;
											event.ivleid = data.ivleid;
											event.drawData = data.drawjson;
											event.isOwner = data.owner;
											break;
										
										case "clearedcanvas":
											args = args.split(",");
											event.channelname = args[0];
											event.ivleid = args[1];
											break;
											
										case "canvasdata":
											var split = args.indexOf(",");
											event.channelname = args.substring(0,split);
											args = args.substring(split+1,args.length);
											event.canvasdata = JSON.parse(args);
											break;
											
										case "undidcanvas":
											args = args.split(",");
											event.channelname = args[0];
											event.ivleid = args[1];
											break;
										
										default:
											break;
									}
								} 
								//	Case of documents
								else if (event.type == "document"){
										switch (event.name)
										{
											case "preparedupload":
												event.sessionkey = args;
												break;
												
											case "retrieveddirectory":
												var args = JSON.parse(args);
												event.channelname = args.channame;
												event.files = args.files;
												break;
												
											case "uploadedfile":
												event.file = JSON.parse(args);
												event.channelname = event.file.channame;
												break;
												
											case "deletedfile":
												event.file = JSON.parse(args);
												event.channelname = event.file.channame;
												break;
												
											case "useruploaded":
												event.file = JSON.parse(args);
												event.channelname = event.file.channame;
												break;
												
											default:
												break;
										}
								}
								//	Case of notices (Needs to change according to UI)
								else if (event.type == "notice"){
										args = args.split(",");
										event.commandtype = event.name	//	Change commandtype to channel/user, name is used for command name
										event.name = args[0];
										event.message = args[1];
								} 
								//	First login message (Needs to change according to UI)
								else if (event.type == "welcome"){
									switch (event.name)
									{
										case "userinfo":
											event.selfuser = JSON.parse(args);
											break;
										case "userpreference":
											event.preferences = JSON.parse(args);
											break;
										case "availablelevels":
											event.availableroles = JSON.parse(args);
											break;
										case "availablepermissions":
											event.availablepermissions = JSON.parse(args);
											break;
										default:
											break;
									}
								}
								
								
								//	Self pinging timer to auto ping server preiodically
								if (event.type == "welcome" && event.name == "userinfo")
									this.pingFunction(this.pingPeriod);
							} catch (err) {
									try {
										this.logout();
									} catch (err){}
									event.type = "connection";
									event.name = "error";
									event.error = err;
							}
								
							//this.events.push(event);
							if (this.eventHandlerFunction != undefined)
								this.eventHandlerFunction(event);
							else
								queue.push(event);
						};					
	

	
	
	/*
	 *************************
	 * Private methods 
	 *************************
	 */
						//	Server ping alive
						this.pingVariable;												//	To be able to stop ping messages on disconnect
						this.pingPeriod = 120*1000;					
						this.pingFunction = 
							function(x){					//	Looping function to send ping to server
								self.pingVariable = setTimeout(function(){
									self.sendping();
									self.pingFunction(x);
								},x)
						}	;
						
						this.sendping = function (){
								this.ws.send("ping");
						}
						
});