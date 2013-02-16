/*

	Title: HangoutApp Core 
	Version 0.1

*/





/*
 *************************
 * Application
 *************************
 */
 var ws;
 var http = 'http://';
 var protocol = "ws://";
 var hostname = "ec2-122-248-200-91.ap-southeast-1.compute.amazonaws.com";
 //var hostname = "localhost";
 var port = ':8888';
 var server = null



var HangoutApp = Ember.Application.create({
	version: 0.1,
	token: null,

	ready: function(){
		this.checkSession();
	},
	
	start: function(auth, key){
		server = new HangoutServer(protocol+hostname+port+'/socket', auth, key);
		server.setCallback(HangoutApp.routingController, "msgRoute");
	},


	checkSession: function(){
		var tkn = HangoutFx.getParameterByName("token");
		if (tkn != undefined){
			this.set("token", tkn);
			HangoutFx.setCookie("token", tkn, 365);
			window.location.replace("dashboard.html");
		} else {
			tkn = HangoutFx.getCookie("token");
			if (tkn != undefined && tkn.length > 0)
				this.start("auth", tkn);
		}		
	},


	logout: function(){
		HangoutFx.delCookie("token");
		this.set("token", null);
	}
});





//Misc App Settings
HangoutApp.appsettings = Ember.Object.create({
	availablePermissions: [],
	availableLevels: []
})





console.log("HangoutApp.start('noivleauth','.geraldbutler');"); 
console.log("HangoutApp.start('noivleauth','.Yamada');"); 
console.log("HangoutApp.start('noivleauth','.Legendary');"); 
console.log("HangoutApp.start('noivleauth','.angrybirds');"); 
console.log("HangoutApp.start('noivleauth','.pebbles');"); 
console.log("HangoutApp.start('noivleauth','.pedobear');"); 
console.log("HangoutApp.start('noivleauth','.ieway');"); 
console.log("HangoutApp.start('noivleauth','.bunnehwunneh');"); 
console.log("HangoutApp.start('noivleauth','.3230ta');"); 