	var HangoutAppFx = (function(){





		/*
			ACTION functions
			-------------------------
		*/


		//pop up file dialog.
		this.saveFile = function(filename, content) {
		  var blob = new Blob([content]);
		  var evt = document.createEvent("HTMLEvents");
		  evt.initEvent("click");
		  $("<a>", {
			download: filename,
			href: webkitURL.createObjectURL(blob)
		  }).get(0).dispatchEvent(evt);
		};
		

		//	Request server for file upload
		this.prepareFileUpload = function(channame,file){
			server.prepareupload(channame, file.name);
			this.uploading = file;
			//document.getElementById("pendingUpload").innerHTML = "Pending..";
		};
		
		
		//	Get element position
		this.getX = function(oElement)
		{
			var iReturnValue = 0;
			while( oElement != null ) {
					iReturnValue += oElement.offsetLeft;
			oElement = oElement.offsetParent;
			}
			return iReturnValue;
		};
		
		this.getY = function(oElement)
		{
			var iReturnValue = 0;
			while( oElement != null ) {
					iReturnValue += oElement.offsetTop;
			oElement = oElement.offsetParent;
			}
			return iReturnValue;
		};

		
		//	Prepare to upload a file
		this.doUpload = function(sessionkey){
			var reader;
			if ( window.FileReader ) {  
				reader = new FileReader();
				reader.onloadend = function (e) {
					HangoutFx.uploadFile(sessionkey, e.target.result);  
				}; 
				reader.readAsDataURL(this.uploading);
			}
		};

		//	Upload file
		this.uploadFile = function(sessionkey, blob){
		var formdata = new FormData();
		
		formdata.append("sessionkey", sessionkey);
		formdata.append("filedata", blob);
		var myurl = "/hangout/upload";
		$.ajax({  
				crossDomain: true,
				url: myurl, 			
				type: "POST",
				data: formdata,
				processData: false,  
				contentType: false,  
				success: function (res) {  
						//document.getElementById("pendingUpload").innerHTML = "";
						HangoutFx.notify("Notice", "Uploading done.", false);
				}
			});
		};
		






		/*
			LAYOUT functions
			-------------------------
		*/
		//resize the component container height.
		this.componentHeight = function(){
			$("#hoa-dashboard .content").height( ($(window).height()-90) + "px");
		};
		
		//bindings for channels
		this.channelBinds = function(){
		}

		//resize chat area height and other releated dependencies to optimal
		this.chatHeight = function(){
			var winh = $(window).height();
			$("#hoa-dashboard .hoa-chathistory").height( (winh-190) + "px");
			$("#hoa-dashboard .hoa-chattoggles").height( (winh-220) + "px");
			$("#channelsearch, #hoa-dashboard .secondbar").height( (winh-120) + "px");
		};

		//call to scroll chat to the bottom
		this.scrollChat = function(){
			$("#hoa-dashboard .hoa-chathistory").each(function() {
				$(this).animate({
					scrollTop: $(this).children('.hoa-chatlist').height(),
				}, 300)
			});
			
			$.livequery.run();
		};

		//call to scroll channel to the bottom
		this.scrollChannel = function(){
			$("#hoa-dashboard #channelbar").animate({
					scrollTop: $('#hoa-dashboard #channelList').height(),
			}, 300)
		 
		};

		//bindings for during dashboard initialization
		this.dashboardBinds = function(){
			this.componentHeight();
			//this.channelBinds();
			//this.toggleDrawing();
			//this.toggleSettings();


			//tooltip for channel buttons
			$('.ttip').tooltip();
			$(".customBtn").tooltip({'placement': 'bottom'});


			//user dropdown
			$("#hoa-dashhead header").bind("click", function(){
				$("#hoa-dashhead .details").slideToggle("slow");
			});



			$(document).bind('keydown',function(e){
       			if ($(":input").is(":focus")){
            	}else{
                	switch(e.which){
 						case 191: //?
                      		if (e.shiftKey)
                            	HangoutApp.actionControls.helpDialog();                             
                           	break;
                         default: break;
                	}
          		}
         	})



		};






		/*
			MISC functions
			-------------------------
		*/


		//Growl-like notification settings
		this.notify = function(title, message, sticky){
			$.gritter.add({
				title: title,
				text: message,
				sticky: sticky,
				time: 1500
			});
		}






		/*
			LOGIN and COOKIE functions
			-------------------------
		*/



		//  Function to get query GET parameter for ivle token
		this.getParameterByName = function(name){
		  name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
		  var regexS = "[\\?&]" + name + "=([^&#]*)";
		  var regex = new RegExp(regexS);
		  var results = regex.exec(window.location.search);
		  if(results == null)
			return undefined;
		  else
			return decodeURIComponent(results[1].replace(/\+/g, " "));
		}




		//  To store cookie, used for ivle token
		this.getCookie = function(cookiename){
			var i,x,y,ARRcookies=document.cookie.split(";");
			for (i=0;i<ARRcookies.length;i++)
			{
				x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
				y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
				x=x.replace(/^\s+|\s+$/g,"");
				if (x==cookiename){
					return unescape(y);
				}
			}
			return undefined;
		}


		//  To set cookie, used for ivle token
		this.setCookie = function(cookiename,value,exdays){
			var exdate=new Date();
			exdate.setDate(exdate.getDate() + exdays);
			var c_value=escape(value) + ((exdays==null) ? "" : "; expires="+exdate.toUTCString());
			document.cookie=cookiename + "=" + c_value;
		}


		// to delete the cookie
		this.delCookie = function(cookiename){
			this.setCookie(cookiename, "", 1);
		}


		
		// library for base64 encode and decode
		this.b64 = (function() {
			var hash = {'=': 0};

			Array.prototype.forEach.call(
					'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/',
					function(c, i){hash[c] = i});


			function b64decode(s) {
					var h = hash,
							i = 0,
							j = 0,
							n = s.length,
							bytes = new Uint8Array(n * 6 / 8),
							a1, a2, a3, a4;

					for(;i < n; i += 4, j += 3) {
							a1 = h[s[i]];
							a2 = h[s[i + 1]];
							a3 = h[s[i + 2]];
							a4 = h[s[i + 3]];

							bytes[j] = (a1 << 2) | (a2 >> 4);
							bytes[j + 1] = (a2 << 4) | (a3 >> 2);
							bytes[j + 2] = (a3 << 6) | a4;
					}

					return bytes.subarray(0, j - (s[n - 1] === '=' ? 1 : 0) - (s[n - 2] === '=' ? 1 : 0));
			}

			var b64encode = typeof importScripts === 'function' ?
			//worker
			function(bytes) {
					var dataURL = new FileReaderSync().readAsDataURL(new Blob([bytes])),
							startPos = dataURL.indexOf(',') + 1;

					return dataURL.slice(startPos);
			} :
			//browser
			function(bytes, callback) {
					var dataURL, startPos,
							fr = new FileReader;

					fr.onloadend = function() {
							dataURL = fr.result;
							startPos = dataURL.indexOf(',') + 1;
							callback(dataURL.slice(startPos));
					};
					fr.readAsDataURL(new Blob([bytes]));
			};

			return {
					encode: b64encode,
					decode: b64decode
			};

		})();
		
		


		//Combination of codes from
		//- jquery emoticons
		//--- http://users.dcc.uchile.cl/~skreft/emoticon/		
		//- emoji package on github.
		//--- https://github.com/fengmk2/emoji
		this.emoticons = function(content){

		    var emotes = {	"1f60b": Array("\\*smile\\*", "\\:\\-\\)","\\:\\)","\\=\\]","\\=\\)", "\\:\\}"),
		    				"1f61c": Array("\\*oops\\*", "\\:\\P", "\\:\\p"),
		                  	"1f61e": Array("\\*sad\\*", "\\:\\(", "\\:\\-\\(","\\=\\(","\\:\\["),
		                  	"1f613": Array("\\*diao\\*", '\\-\\_\\-\\"'),	
		                  	"1f609": Array("\\*wink\\*", "\\;\\-\\)","\\;\\)","\\;\\]","\\*\\)"),
		                 	"1f601": Array("\\*grin\\*", "\\:D","\\=D","XD","BD","8D","xD"),
		                 	"1f621": Array("\\*angry\\*"),
		                  	"1f632": Array("\\*surprise\\*","\\:O","\\=O","\\:\\-O","\\=\\-O"),
		                  	"1f47f": Array("\\*devil\\*", "\\(6\\)"),
		                  	"1f47c": Array("\\*angel\\*","\\(A\\)"),
		                  	"1f622": Array("\\*sob\\*", "\\:\\'\\(","\\:\\'\\-\\("),
		                  	"1f612": Array("\\:\\|"),
		                  	"1f618": Array("\\*kiss\\*", "\\(K\\)","\\:\\-\\*"),
		                  	"1f435": Array("\\*monkey\\*", "\\(M\\)"),
		                  	"1f635": Array("&gt;&lt;", "&gt;.&lt;"),
		                  	"2764" : Array("\\*heart\\*", "&lt;3"),
		                  	"1f494": Array("\\*broken\\*", "&lt;\\/3"),
		                  	"1f631": Array("\\*horror\\*")
		              	};

	        for(var emoticon in emotes){
	            for(var i = 0; i < emotes[emoticon].length; i++){
		            content = content.replace(new RegExp(emotes[emoticon][i], "g" ), '<span class="emoji emoji' + emoticon + '"></span>');
	            }
	        }
	        return content;

		}





	}); //end HangoutAppFX




	   


	//Initialize a new Hangout FX
	var HangoutFx = new HangoutAppFx();



	//Binding a window resize event ot resize all the components
	$(window).bind("resize", function(){
		HangoutFx.componentHeight();
		HangoutFx.chatHeight();
	});


	//reload btn
	$("#disconnect .reload").bind('click', function(){
		//HangoutApp.actionControls.logout();
		window.location.replace("dashboard.html");
	})




	//call to set default growl-like notification placements
	$.extend($.gritter.options, { 
		position: 'bottom-right',
		fade_in_speed: 'medium', 
		fade_out_speed: 2000, 
		time: 3000 
	});



	//Handlebars

	Handlebars.registerHelper("idToName", function(id){
	    //console.log(id.data.view.content);
	    return HangoutApp.userObjCollection.getUserNick(id.data.view.content);
	});


	Handlebars.registerHelper("idToRoleIcon", function(id){
		parent = id.data.view.get("parentView").get('parentView').value;
		user = id.data.view.content;

		if ( (parent.get('acl')[user] == HangoutApp.appsettings.get("availableLevels")['Admin'])
			|| (parent.get('acl')[user] == HangoutApp.appsettings.get("availableLevels")['Co-Admin'])
			){
			return "icon-eye-open";

		} else if (parent.get('acl')[user] == HangoutApp.appsettings.get("availableLevels")['Member']) {
			return "icon-user"

		} else {
			return "";
		}
		
	});

	Handlebars.registerHelper('isPrivateChannel', function(isPrivateChat, isPublic) {
		if (isPrivateChat)
			return false;
		else if (isPublic)
			return false;
		return true;
	});



	Handlebars.registerHelper("contentParser", function(value){
		var content = value.data.view.content.content;
	    //return HangoutFx.emoticons(content);

	  	return content;
	});


	$(".message").livequery(function(){ 
		var content = $(this).html();
		content =  HangoutFx.emoticons(content);
		$(this).html(content);
	})
