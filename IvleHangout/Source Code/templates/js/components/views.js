/*
 *************************

 * Main Views

 *************************
 */

HangoutApp.viewsLogin = Ember.View.create({
  classNames: ['dhoa-login'],
  templateName: 'login'
});




HangoutApp.viewsDashboard = Ember.View.create({
  classNames: ['dhoa-dashCollection'],
  templateName: 'dashboard',

  userDetails: null,
  tempNickname: null,

  didInsertElement: function(){
      HangoutFx.dashboardBinds();
  }
})




HangoutApp.channelSearch = Ember.View.extend({
  templateName: 'channelSearch',



})


















/*
 *************************

 * Components

 *************************
 */



HangoutApp.usernameFieldText = Ember.TextField.extend();
HangoutApp.usernameFieldText.reopen({
    _elementValueDidChange: function(){
        var val = this.$().val();

        if (val !== undefined) {
            this.set("value", val);
        } else {}
    }
});




HangoutApp.usernameField = Ember.View.extend({
	  classNames: ['in-place', 'in_place_text'],
  	tagName: 'span',
    
  	value: null,

  	isActive: false,


  	init: function(){
  		this._super();
  		//this.set("prevValue", this.get("value"));
  	},
  	updateState:function(){
      var loggedIn = HangoutApp.userObjCollection.get('loggedIn');

  		if(this.get("isActive") &&
          (this.get("value") != HangoutApp.userObjCollection.userList[loggedIn].get("nickname"))
      ){
            HangoutApp.dataControls.serverSetNick(this.get("value"));
      }
  		this.set("isActive", !this.get('isActive'));
  	},


  	doubleClick: function() {
  		this.updateState();
  	},


  	keyPress: function(e){
  		switch(e.which){
        case 13:
    			this.updateState();
          break;
        default: break;
      }
  	},


    keyDown: function(e){
      switch(e.which){
        case 27:
          this.updateState();
          break;
        default: break;
      }
    },
});














HangoutApp.channelItem = Ember.View.extend({
  
  templateName: 'channelItem',

  value: null,


  init: function(){
      this._super();
	  
	  //	Canvas elements
	  var top = document.createElement("canvas");
	  top.setAttribute("id" , this.value.get("name") + "-top");
	  top.channelname = this.value.get("name");
		top.className = "canvasLayerTop";
	  var bottom = document.createElement("canvas");
	  bottom.setAttribute("id" , this.value.get("name") + "-bottom");
	  bottom.channelname = this.value.get("name");
		bottom.className = "canvasLayerBtm";
	  var settings = document.createElement("div");
	  settings.channelname = this.value.get("name");
	  settings.setAttribute("style" , "margin-top:320px; overflow:hidden;");
	  settings.setAttribute("id" , this.value.get("name") + "-settings");

		
	  //	Create canvas and set elements
	  canvas[this.value.get("name")] = new Canvas(this.value.get("name"), HangoutApp.userObjCollection.getLoggedInUser().ivleid);
	  canvas[this.value.get("name")].top = top;
	  canvas[this.value.get("name")].bottom = bottom;
	  canvas[this.value.get("name")].settings = settings;
  },
  click: function(){
      HangoutApp.actionControls.showChannel();
      this.value.set("isActive", true);
      this.value.set("unreadCount", 0);

      HangoutFx.chatHeight();
  },

});












HangoutApp.channelChat = Ember.View.extend({
    templateName: 'channelChat',


    value: null,
    isActive: false,

    sendMsg: function(){
      this.value.sendMsg();
    }
});





HangoutApp.chatArea = Ember.View.extend({
});

HangoutApp.chatField = Ember.TextField.extend({
    classNames: ['hoa-msgfield'],

    insertNewline: function(){
        this.get('parentView').sendMsg();
    }
})





HangoutApp.userListArea = Ember.View.extend({
    templateName: 'userListArea',

    init: function(){
        this._super();
    }
});



HangoutApp.documentRepo = Ember.View.extend({
    templateName: 'channelDocumentRepo',
		value: null,
});

HangoutApp.documentRepoContents = Ember.View.extend({
    templateName: 'channelDocumentRepoContents',

		value: null,
});








HangoutApp.buttonUserList = Ember.View.extend({
  classNames: ['buttonUserList customBtn'],
  tagName: 'button',

  attributeBindings: ['title', 'rel'],
  title: 'Channel User List',
  rel: 'tooltip',

  click:function(){
      var id = this.get("elementId");
      var grp = $("#"+id).parents(".hoa-chatgroup");
      var bar = grp.find(".secondbar");
      var chat = grp.find(".hoa-chatarea");

      if (bar.width() == '0'){
          chat.animate({width: "74%"})
          bar.animate({width: "25%"})
          
      }else{
          bar.animate({width: '0'})
          chat.animate({width:"100%"})
          
      }
    }
});


HangoutApp.buttonClose  = Ember.View.extend({
  classNames: ['buttonClose customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Close',

  click: function () {
      if (this.value.get("isPrivateChat")){
          HangoutApp.dataControls.serverPrivChatLeave(this.value.get("name"));
      }else{
          HangoutApp.dataControls.serverChannelLeave(this.value.get("name"));
      }  
      HangoutApp.actionControls.showSearch();
  }
});


HangoutApp.buttonSettings  = Ember.View.extend({
  classNames: ['buttonSettings customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],

  title: 'Settings',

  click: function () {
      var id = this.get("elementId");
      $("#"+id).parents(".options").siblings(".hoa-chattoggles:not(.hoa-settings)").slideUp(); 
      $("#"+id).parents(".options").siblings(".hoa-settings").slideToggle();
  }
});



HangoutApp.buttonFavourite  = Ember.View.extend({
  classNames: ['buttonFavourite customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Favourite',

  click: function () {
      var fav = !this.value.get('isFavourite');
      HangoutApp.dataControls.serverSetFav(this.value.get("name"), fav);
      //this.value.set("isFavourite", fav);
  },

});

HangoutApp.buttonCanvasPurple = Ember.View.extend({
  classNames: ['buttonCanvasPurple customBtn canvasColor canvasSelected'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Purple',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('purple');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasYellow = Ember.View.extend({
  classNames: ['buttonCanvasYellow customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Yellow',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('yellow');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasGreen = Ember.View.extend({
  classNames: ['buttonCanvasGreen customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Green',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('green');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasBrown = Ember.View.extend({
  classNames: ['buttonCanvasBrown customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Brown',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('brown');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasRed = Ember.View.extend({
  classNames: ['buttonCanvasRed customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Red',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('red');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasBlue = Ember.View.extend({
  classNames: ['buttonCanvasBlue customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Blue',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('blue');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasOrange = Ember.View.extend({
  classNames: ['buttonCanvasOrange customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Orange',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('orange');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasPink = Ember.View.extend({
  classNames: ['buttonCanvasPink customBtn canvasColor'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Pink',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			return;
		canvas[this.value.get('name')].changeColor('pink');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});


HangoutApp.buttonCanvasSave = Ember.View.extend({
  classNames: ['buttonCanvasSave customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Save Drawing',
  
  click: function () {
		HangoutFx.saveFile("canvas.png", canvas[this.value.get('name')].toSaveFile());
  }
});

HangoutApp.buttonCanvasSizeSmall = Ember.View.extend({
  classNames: ['buttonCanvasSizeSmall customBtn canvasPaintSize canvasSelected'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Small',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "paintbucket")
			return;
		canvas[this.value.get('name')].changeSize('small');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasPaintSize").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});


HangoutApp.buttonCanvasSizeMedium = Ember.View.extend({
  classNames: ['buttonCanvasSizeMedium customBtn canvasPaintSize'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Medium',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "paintbucket")
			return;
		canvas[this.value.get('name')].changeSize('medium');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasPaintSize").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasSizeLarge = Ember.View.extend({
  classNames: ['buttonCanvasSizeLarge customBtn canvasPaintSize'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Large',
  
  click: function () {
		if (canvas[this.value.get('name')].curTool.name == "paintbucket")
			return;
		canvas[this.value.get('name')].changeSize('large');
		var id = this.get("elementId");
		$("#"+id).siblings(".canvasPaintSize").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});


HangoutApp.buttonCanvasClear = Ember.View.extend({
  classNames: ['buttonCanvasClear customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Clear Canvas',
  
  click: function () {
		canvas[this.value.get('name')].sendClear();
  }
});

HangoutApp.buttonCanvasMarker = Ember.View.extend({
  classNames: ['buttonCanvasMarker customBtn canvasToolType canvasSelected'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Marker',
  
  click: function () {
		var id = this.get("elementId");
		if (canvas[this.value.get('name')].curTool.name == "paintbucket")
			$("#"+id).siblings(".buttonCanvasSize"+canvas[this.value.get('name')].curSizeName).addClass("canvasSelected");
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			$("#"+id).siblings(".buttonCanvas"+canvas[this.value.get('name')].curColor.name).addClass("canvasSelected");
		
		canvas[this.value.get('name')].changeTool('marker');
		
		$("#"+id).siblings(".canvasToolType").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasEraser = Ember.View.extend({
  classNames: ['buttonCanvasEraser customBtn canvasToolType'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Eraser',
  
  click: function () {
		var id = this.get("elementId");
		if (canvas[this.value.get('name')].curTool.name == "paintbucket")
			$("#"+id).siblings(".buttonCanvasSize"+canvas[this.value.get('name')].curSizeName).addClass("canvasSelected");
		
		canvas[this.value.get('name')].changeTool('eraser');
		
		$("#"+id).siblings(".canvasToolType").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
		$("#"+id).siblings(".canvasColor").removeClass("canvasSelected");
  }
});

HangoutApp.buttonCanvasPaintBucket = Ember.View.extend({
  classNames: ['buttonCanvasPaintBucket customBtn canvasToolType'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Paint Bucket',
  
  click: function () {
		var id = this.get("elementId");
		if (canvas[this.value.get('name')].curTool.name == "eraser")
			$("#"+id).siblings(".buttonCanvas"+canvas[this.value.get('name')].curColor.name).addClass("canvasSelected");
		canvas[this.value.get('name')].changeTool('paintbucket');
		
		$("#"+id).siblings(".canvasToolType").removeClass("canvasSelected");
		$("#"+id).addClass("canvasSelected");
		$("#"+id).siblings(".canvasPaintSize").removeClass("canvasSelected");
  }
});


HangoutApp.buttonCanvasUndo = Ember.View.extend({
  classNames: ['buttonCanvasUndo customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Undo Move',
  
  click: function () {
		canvas[this.value.get('name')].sendUndo();
  }
});



HangoutApp.settingCanvas = Ember.View.extend({
  classNames: ['settingCanvas'],
  tagName: 'div',

  attributeBindings: [],
  channelname: null,

  
});

HangoutApp.buttonDraw = Ember.View.extend({
  classNames: ['buttonDraw customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Drawing Canvas',


  click: function () {
     var id = this.get("elementId");
      
	  if (canvas[this.value.get("name")].isCreated == false){
			var draw = $("#"+id).parents(".options").siblings(".hoa-drawsomething");
			draw.append(canvas[this.value.get("name")].top);
			draw.append(canvas[this.value.get("name")].bottom);
			draw.append(canvas[this.value.get("name")].settings);
			canvas[this.value.get("name")].isCreated = true;
	  }
	  
	  if (canvasInit[this.value.get("name")] != undefined){
			canvas[this.value.get("name")].prepareCanvas();
			canvas[this.value.get("name")].init(canvasInit[this.value.get("name")]);
			delete canvasInit[this.value.get("name")];
	  }
	  
		$("#"+id).parents(".options").siblings(".hoa-chattoggles:not(.hoa-drawsomething)").slideUp(); 
    $("#"+id).parents(".options").siblings(".hoa-drawsomething").slideToggle();
  }
});


//Archive for the channel
HangoutApp.buttonArchive = Ember.View.extend({
  classNames: ['buttonArchive customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],
  title: 'Archive',


  click: function () {
  
  	var chatLog = "";
  	
  	if(this.value.get("isPrivateChat") == false) {
  		chatLog = chatLog + "Channel Name: " + this.value.get("name") + "\r\n\r\n";
  	} else {
  		chatLog = chatLog + "Fullname: " + HangoutApp.userObjCollection.userList[this.value.get("name")].get("fullname") + "\r\n";
  		chatLog =chatLog + "User's Nickname: " + this.value.get("name") + "\r\n";
  		chatLog = chatLog + "Email: " + HangoutApp.userObjCollection.userList[this.value.get("name")].get("email") + "\r\n";
  		chatLog = chatLog + "IVLE ID: " + HangoutApp.userObjCollection.userList[this.value.get("name")].get("ivleId") + "\r\n\r\n";
  	}

  	
    var contentArray  = this.value.get("content");
  	for (var i = 0; i < contentArray.length; i++) {
      	chatLog = chatLog + contentArray[i].get("user") + "\t[" + contentArray[i].get("timestamp") + "]\t" + contentArray[i].get("content") + "\r\n";
  	}
  	HangoutFx.saveFile(this.value.get("name") +".txt", chatLog);	
      //console.log("Archive");
    }
});


HangoutApp.buttonFiles  = Ember.View.extend({
  classNames: ['buttonFiles customBtn'],
  tagName: 'button',

  attributeBindings: ['title'],

  title: 'Files',

  click: function () {
      var id = this.get("elementId");
      $("#"+id).parents(".options").siblings(".hoa-chattoggles:not(.hoa-files)").slideUp(); 
      $("#"+id).parents(".options").siblings(".hoa-files").slideToggle();
			var repo = HangoutApp.channelObjCollection.getChannel(this.value.get("name")).documentsRepo;
	
			if (repo.isInit == false){
					server.retrievedirectory(this.value.get("name"));
					repo.isInit = true;
			}
  }
});


//	Choose File Button
HangoutApp.buttonChooseFile = Ember.View.extend({
  classNames: ['buttonChooseFile btn'],
  tagName: 'button',

  click: function(){
		var id = this.get("elementId");
		var fileToUpload = $("#"+id).siblings(".fileToUpload");
  	var fileName = fileToUpload.siblings(".fileToUploadName");
		fileToUpload.change(function() {
				fileName.val(this.files[0].name);
		}); 
		
		fileToUpload.click();

  }
})


//	File Button uploads
HangoutApp.buttonFileUpload = Ember.View.extend({
  classNames: ['btn btn-primary buttonFileUpload'],
  tagName: 'button',

  click: function(){
  	
  	var id = this.get("elementId");
  	var file = $("#"+id).siblings(".fileToUpload");
  	
  	HangoutFx.prepareFileUpload(this.value.get("name"), file[0].files[0]);
		var fileName = $("#"+id).siblings(".fileToUploadName");
		fileName.val("");
  }
})


//	Delete File Button
HangoutApp.buttonDeleteFile = Ember.View.extend({
  classNames: ['buttonDeleteFile customBtn'],
  tagName: 'button',

	attributeBindings: ['title'],

  title: 'Delete File',
	
  click: function(){
  	server.deletefile(this.value.get("channelname"), this.value.get("filename"));
  }
})









HangoutApp.searchChannelFieldText = Ember.TextField.extend({
    insertNewline: function(){
        HangoutApp.actionControls.findChannel();
    }
});
HangoutApp.createChannelFieldText = Ember.TextField.extend({
    insertNewline: function(){
        HangoutApp.actionControls.createChannel();
    }
});

HangoutApp.searchUserFieldText = Ember.TextField.extend({
    insertNewline: function(){
        HangoutApp.actionControls.findUser();
    }
});








HangoutApp.buttonJoin  = Ember.View.extend({
  classNames: ['btn btn-success'],
  tagName: 'button',
  value: null,

  click: function () {
      HangoutApp.dataControls.serverJoinChannel(this.value);
  }
});


HangoutApp.buttonPrivChat = Ember.View.extend({
  classNames: ['btn btn-success'],
  tagName: 'button',
  value: null,

  click: function () {
      HangoutApp.dataControls.serverPrivChat(this.value);
  }
});





HangoutApp.TopicFieldArea = Ember.TextArea.extend({
	classNames: ['topic_field'],
});
HangoutApp.TopicFieldArea.reopen({
    _elementValueDidChange: function(){
        var val = this.$().val();

        if (val !== undefined && val.length > 0) {
            this.set("value", val);
        } else {
						this.set("value", "Topic not set.");
				}
    }
});



HangoutApp.TopicField = Ember.View.extend({
	  classNames: ['in-place', 'in_place_textarea', 'topic_field'],
  	tagName: 'p',
    
  	value: null,
		oldvalue: null,
  	isActive: false,
		channelView: null,

  	init: function(){
			this._super();
  	},
  	updateState:function(){
  		if(this.get("isActive") &&
          (this.get("value") != this.oldvalue)
      ){
            server.changetopic(this.channelView.name, this.get("value").replace("\n",""));
						HangoutApp.channelObjCollection.getChannel(this.channelView.name).set("topic", this.oldvalue);
						//console.log(HangoutApp.channelObjCollection.getChannel(this.channelView.name).topic);
      }
  		this.set("isActive", !this.get('isActive'));
  	},


  	doubleClick: function(e) {
  		this.updateState();
			this.oldvalue = this.get("value");
  	},


  	keyPress: function(e){
  		switch(e.which){
        case 13:
					this.updateState();
          break;
        default: break;
      }
  	},


    keyDown: function(e){
      switch(e.which){
        case 27:
          this.updateState();
          break;
        default: break;
      }
    },
		
});














/*
 *************************

  View Init

 *************************
 */

//HangoutViewContent = Ember.ContainerView.create();
HangoutApp.viewStateContent =  Ember.StateManager.create({
    rootElement: '#hoa-content',  
    //rootView: HangoutViewContent,
  
    login: Ember.ViewState.create({
        view: HangoutApp.viewsLogin
    }),
  
    dashboard: Ember.ViewState.create({
        view: HangoutApp.viewsDashboard
    })
  
})
//Start the App
HangoutApp.viewStateContent.transitionTo('login');




