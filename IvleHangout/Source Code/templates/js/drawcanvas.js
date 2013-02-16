//	Canvas Objects
var canvas = new Object();
var canvasInit = new Object();


//	PaintBucket State
var PaintBucket = (function(){
	this.name = "paintbucket";
	
	this.mousedown = function(channelname, mouseX, mouseY){
		canvas[channelname].drawdata = canvas[channelname].createStroke(mouseX, mouseY, "paintbucket", this.name);
		canvas[channelname].sendMove(canvas[channelname].drawdata);
	};
	
	this.mousemove = function(channelname, mouseX, mouseY){
		return;
	};
	
	this.mouseup = function(channelname){
		canvas[channelname].sendMove(canvas[channelname].drawdata);
	};
	
	this.mouseleave = function(channelname){
		canvas[channelname].sendMove(canvas[channelname].drawdata);
	};
});
var paintBucket = new PaintBucket();


//	Marker State
var Marker = (function(){
	this.name = "marker";
	
	this.mousedown = function(channelname, mouseX, mouseY){
		canvas[channelname].paint = true;
		canvas[channelname].drawdata = canvas[channelname].createStroke(mouseX, mouseY, "stroke", this.name);
		canvas[channelname].upperDataArray.push(canvas[channelname].drawdata);
		canvas[channelname].appendUpper();
	}

	this.mousemove = function(channelname, mouseX, mouseY){
		if (!canvas[channelname].paint)
			return;
		canvas[channelname].drawdata.stroke.arrayX.push(mouseX);
		canvas[channelname].drawdata.stroke.arrayY.push(mouseY);
		canvas[channelname].appendUpper();
	};
	
	this.mouseup = function(channelname){
		canvas[channelname].sendMove(canvas[channelname].drawdata);
		canvas[channelname].paint = false;
	};
	
	this.mouseleave = function(channelname){
		canvas[channelname].sendMove(canvas[channelname].drawdata);
		canvas[channelname].paint = false;
	};
	
});
var marker = new Marker();


//	Eraser State
var Eraser = (function(){
	this.name = "eraser";
	
	this.mousedown = function(channelname, mouseX, mouseY){
		canvas[channelname].paint = true;
		canvas[channelname].drawdata = canvas[channelname].createStroke(mouseX, mouseY, "stroke", this.name);
		canvas[channelname].upperDataArray.push(canvas[channelname].drawdata);
		canvas[channelname].appendUpper();
	}
	
	this.mousemove = function(channelname, mouseX, mouseY){
		if (!canvas[channelname].paint)
			return;
		canvas[channelname].drawdata.stroke.arrayX.push(mouseX);
		canvas[channelname].drawdata.stroke.arrayY.push(mouseY);
		canvas[channelname].appendUpper();
	};
	
	this.mouseup = function(channelname){
		canvas[channelname].sendMove(canvas[channelname].drawdata);
		canvas[channelname].paint = false;
	};
	
	this.mouseleave = function(channelname){
		canvas[channelname].sendMove(canvas[channelname].drawdata);
		canvas[channelname].paint = false;
	};
	

});
var eraser = new Eraser();



/*
*	Object to store drawing data that is used to update other canvas
*
*/
var DrawData = (function () {
	
	this.datatype;
	this.isOwner;	//to check if this draw data is drawn by you.
	
	this.stroke = {
		arrayX: new Array(),
		arrayY: new Array(),
		drag: false,
		color: 0,
		size: 0
	};

	this.paintBucket = {
		coordX: 0,
		coordY: 0,
		color: 0
	};
	
	
});


//	Canvas object for UI
var Canvas = (function(channelname, ivleid) {
	this.lowerContext;
	this.upperContext;
	this.canvasWidth = 620;
	this.canvasHeight = 300;
	this.clickX = new Array();
	this.clickY = new Array();
	this.currentCountU = 0;
	this.currentCountL = 0;
	this.innerCount = 0;
	this.clickDrag = new Array();
	this.paint;
	this.colorLayerData;
	this.outlineLayerData;
	this.offsetLeft = 0;
	this.offsetTop = 0;
	this.colorLLayerData;
	this.colorULayerData;
	this.drawdata;
	this.lowerDataArray = new Array();
	this.upperDataArray = new Array();
	this.canvasDiv1;
	this.channelname = channelname;
	this.ivleid = ivleid;
	this.top;
	this.bottom;
	this.settings;
	this.isCreated = false;

	
	this.colorPurple = {
		name: "Purple",
		code: "#660099",
		r: 102,
		g: 0,
		b: 153
	};
	this.colorGreen = {
		name: "Green",
		code: "#00ff00",
		r: 0,
		g: 255,
		b: 0
	};
	this.colorRed = {
		name: "Red",
		code: "#ff0000",
		r: 255,
		g: 0,
		b: 0
	};
	this.colorBlue = {
		name: "Blue",
		code: "#0000ff",
		r: 0,
		g: 0,
		b: 255
	};
	this.colorYellow = {
		name: "Yellow",
		code: "#ffcf33",
		r: 255,
		g: 207,
		b: 51
	};
	this.colorBrown = {
		name: "Brown",
		code: "#986928",
		r: 152,
		g: 105,
		b: 40
	};
	this.colorOrange = {
		name: "Orange",
		code: "#ff6600",
		r: 255,
		g: 102,
		b: 0
	};
	this.colorPink = {
		name: "Pink",
		code: "#ff0080",
		r: 255,
		g: 0,
		b: 128
	};
	this.colorWhite = {
		name: "White",
		code: "#ffffff",
		r: 255,
		g: 255,
		b: 255
	};
	this.curColor = this.colorPurple;
	this.curSize = 4;
	this.curSizeName = "";
	this.curTool = marker;

	
	this.prepareCanvas = function() {
		this.top.setAttribute('width', this.canvasWidth);
		this.top.setAttribute('height', this.canvasHeight);
		this.bottom.setAttribute('width', this.canvasWidth);
		this.bottom.setAttribute('height', this.canvasHeight);
		this.lowerContext = this.bottom.getContext("2d"); // Grab the 2d canvas lowerContext
		this.upperContext = this.top.getContext("2d");
		this.colorLLayerData = this.lowerContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
		this.colorULayerData = this.upperContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
		

		//	MOUSE EVENTS
		var name = '#'+this.channelname.replace(".","\\.")+'-top';
		$(name).mousedown(function(e){
			//	Check access level
			if (!canvas[this.channelname].checkAcl())
				return;
				
			//	Re-get offset
			canvas[this.channelname].offsetLeft = HangoutFx.getX(canvas[this.channelname].top) - canvas[this.channelname].top.parentNode.scrollLeft + 1;
		  canvas[this.channelname].offsetTop = HangoutFx.getY(canvas[this.channelname].top) - canvas[this.channelname].top.parentNode.scrollTop + 1;
			
			//	Get canvas position
			var mouseX = e.pageX - canvas[this.channelname].offsetLeft;
			var mouseY = e.pageY - canvas[this.channelname].offsetTop;
			
			//	State draw
			canvas[this.channelname].curTool.mousedown(this.channelname, mouseX, mouseY);
		});
			
		$(name).mousemove(function(e){
			//	Check access level
			if (!canvas[this.channelname].checkAcl())
				return;
		  
			//	Get canvas position
			var mouseX = e.pageX - canvas[this.channelname].offsetLeft;
			var mouseY = e.pageY - canvas[this.channelname].offsetTop;
			
			//	Pointer position
			canvas[this.channelname].coordinates(mouseX, mouseY);
			
			//	State draw
			canvas[this.channelname].curTool.mousemove(this.channelname, mouseX, mouseY);
		});
		
		$(name).mouseup(function(e){
			//	Check access level
			if (!canvas[this.channelname].checkAcl())
				return;
				
			//	State draw
			canvas[this.channelname].curTool.mouseup(this.channelname);
		});
		
		$(name).mouseleave(function(e){
			//	Check access level
			if (!canvas[this.channelname].checkAcl())
				return;
				
			//	State draw
			canvas[this.channelname].curTool.mouseup(this.channelname);
		});
	};
	
	//	Checks if user can draw
	this.checkAcl = function(){
			var acl = HangoutApp.channelObjCollection.getChannel(this.channelname).getACL(HangoutApp.userObjCollection.get('loggedIn'));
			var required = HangoutApp.channelObjCollection.getChannel(this.channelname).getPermissions("draw");
			if (acl < required)
				return false;
			else
				return true;
	};

	//	Appends
	this.appendUpper = function() { 
	  this.upperContext.lineJoin = "round";	//stroke tip
	  this.upperContext.lineWidth = this.drawdata.stroke.size;		//stroke thickness
		
	  var i = 0;
	  for(i=0; i < this.drawdata.stroke.arrayX.length; i++){	//actual drawing code
			this.upperContext.beginPath();
			if(this.drawdata.stroke.drag && i){
				this.upperContext.moveTo(this.drawdata.stroke.arrayX[i-1],this.drawdata.stroke.arrayY[i-1]);
			 }else{
				 this.upperContext.moveTo(this.drawdata.stroke.arrayX[i]-1, this.drawdata.stroke.arrayY[i]);
			 }
			 this.upperContext.lineTo(this.drawdata.stroke.arrayX[i], this.drawdata.stroke.arrayY[i]);
			 this.upperContext.closePath();
			 this.upperContext.strokeStyle = this.drawdata.stroke.color.code;	//stroke color
			 this.upperContext.lineWidth = this.drawdata.stroke.size;
			 this.upperContext.stroke();
	  }
	  this.currentCount = i;
	  this.upperContext.globalAlpha = 1; // No IE support
	  this.colorULayerData = this.upperContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
	}
	
	//	Redraw the entire upper layer
	this.redrawUpper = function() {
		var k = 0;
		this.upperContext.clearRect(0, 0, this.upperContext.canvas.width, this.upperContext.canvas.height);
		for (k=0; k < this.upperDataArray.length; k++) {	//for every stroke in the drawdata array, draw it out (from where it left off)
			this.upperContext.lineJoin = "round";	//stroke tip		
			this.upperContext.lineWidth = this.upperDataArray[k].stroke.size;
			this.upperContext.strokeStyle = this.upperDataArray[k].stroke.color.code;
			
			var i = 0;
			if (this.upperDataArray[k].stroke.drag === false)
				this.innerCount = 0;

			for(i=0; i < this.upperDataArray[k].stroke.arrayX.length; i++)	//actual drawing code.
			{	
				this.upperContext.beginPath();
				if (this.upperDataArray[k].stroke.drag && i)
					this.upperContext.moveTo(this.upperDataArray[k].stroke.arrayX[i-1], this.upperDataArray[k].stroke.arrayY[i-1]);
				else
					this.upperContext.moveTo(this.upperDataArray[k].stroke.arrayX[i]-1, this.upperDataArray[k].stroke.arrayY[i]);
				
				this.upperContext.lineTo(this.upperDataArray[k].stroke.arrayX[i], this.upperDataArray[k].stroke.arrayY[i]);
				this.upperContext.closePath();
				this.upperContext.stroke();
			
			}
			this.innerCount = i;
		}
		this.currentCountU = k;
	  this.upperContext.globalAlpha = 1; // No IE support
	  this.colorULayerData = this.upperContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
	}

	//	Redraw the entire lower layer
	this.redrawLower = function() {
		var k = 0;
		
		for (k=this.currentCountL; k < this.lowerDataArray.length; k++) {	//for every stroke in the drawdata array, draw it out (from where it left off)
			if (this.lowerDataArray[k].datatype === "stroke") {
				this.lowerContext.lineJoin = "round";	//stroke tip		
				this.lowerContext.lineWidth = this.lowerDataArray[k].stroke.size;
				this.lowerContext.strokeStyle = this.lowerDataArray[k].stroke.color.code;
		
				var i = 0;
				for(i=0; i < this.lowerDataArray[k].stroke.arrayX.length; i++){	//actual drawing code.
					this.lowerContext.beginPath();
					if(this.lowerDataArray[k].stroke.drag && i){
						this.lowerContext.moveTo(this.lowerDataArray[k].stroke.arrayX[i-1], this.lowerDataArray[k].stroke.arrayY[i-1]);
					}else{
						this.lowerContext.moveTo(this.lowerDataArray[k].stroke.arrayX[i]-1, this.lowerDataArray[k].stroke.arrayY[i]);
					}
					this.lowerContext.lineTo(this.lowerDataArray[k].stroke.arrayX[i], this.lowerDataArray[k].stroke.arrayY[i]);
					this.lowerContext.closePath();
					this.lowerContext.stroke();
				}
			}
			else 
				this.paintAt(this.lowerDataArray[k].paintBucket.coordX, this.lowerDataArray[k].paintBucket.coordY, this.lowerDataArray[k].paintBucket.color);
			
			this.colorLLayerData = this.lowerContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
		}
		this.currentCountL = k;  
	  this.lowerContext.globalAlpha = 1; // No IE support
	}

	//	Create a stroke
	this.createStroke = function(x, y, type, tool) {
		var drawdata = new DrawData();
			
		drawdata.datatype = type;
		
		if (type === "stroke") {
			var arrayX = new Array();
			var arrayY = new Array();
			arrayX.push(x);
			arrayY.push(y);
			
			drawdata.stroke.arrayX = arrayX;
			drawdata.stroke.arrayY = arrayY;
			drawdata.stroke.drag = true;
			
			if (tool === "eraser")
				drawdata.stroke.color = this.colorWhite;
			else 
				drawdata.stroke.color = this.curColor;
				
			drawdata.stroke.size = this.curSize;
		}
		
		else if (type === "paintbucket") {
			drawdata.paintBucket.coordX = x;
			drawdata.paintBucket.coordY = y;
			drawdata.paintBucket.color = this.curColor;
		}
		
		return drawdata;
	}

	//	Set pointer coords
	this.coordinates = function(x, y) {
		if (x == -1 && y == -1)
			canvasPointer.set("content", "");
		else
			canvasPointer.set("content", x + ", " + y);
	}
	
	//	Send command to server
	this.sendMove = function(drawdata) {
		if (drawdata!= undefined && drawdata.datatype != undefined)
			HangoutApp.dataControls.serverSendDraw(this.channelname,drawdata);
		this.drawdata = undefined;
	}
	
	//	Send clear command to server
	this.sendClear = function() {
		HangoutApp.dataControls.serverClearCanvas(this.channelname);
	}
	
	//	Send undo command to server
	this.sendUndo = function() {
		if (this.lowerDataArray.length > 0)
			HangoutApp.dataControls.serverUndoCanvas(this.channelname);
	}

	//	Receive a command from server
	this.receiveMove = function(drawData, isOwner) {
		var type = drawData.datatype;
		if (type === "stroke") {
			this.lowerDataArray.push(drawData);
			this.redrawLower();
			this.upperDataArray.shift(drawData);
			this.redrawUpper();
		} else if (type === "paintbucket") {
			this.paintAt(drawData.paintBucket.coordX, drawData.paintBucket.coordY, drawData.paintBucket.color);
			this.lowerDataArray.push(drawData);
		}	
	}

	//	Clears the canvas
	this.clear = function() {
		this.lowerDataArray = new Array();
		this.drawdata = new DrawData();
		this.currentCountL = 0;
		this.lowerContext.clearRect(0, 0, this.lowerContext.canvas.width, this.lowerContext.canvas.height);
		this.colorLLayerData = this.lowerContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
		this.paintAt(0,0,this.colorWhite);
		this.colorLLayerData = this.lowerContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
	}
	
	//	Init canvas with draw data
	this.init = function(drawdataArray)  {
		if (drawdataArray == undefined)
			this.lowerDataArray = new Array();
		else
			this.lowerDataArray = drawdataArray;
		if ((this.lowerDataArray.length > 0) && (this.lowerDataArray[0].paintBucket.color != this.colorWhite)
			|| (this.lowerDataArray.length == 0)) {
			var fill = new DrawData();
			fill.datatype = "paintbucket";
			fill.paintBucket.color = this.colorWhite;
			this.lowerDataArray.unshift(fill);
		}
		this.redrawLower();
	}
	
	//	Undo command
	this.undo = function() {
		this.lowerDataArray.pop();
		this.currentCountL = 0;
		this.lowerContext.clearRect(0, 0, this.lowerContext.canvas.width, this.lowerContext.canvas.height);
			this.colorLLayerData = this.lowerContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
		this.paintAt(0,0,this.colorWhite);
		this.colorLLayerData = this.lowerContext.getImageData(0, 0, this.canvasWidth, this.canvasHeight);
		this.redrawLower();
	}
	
	//	Save canvas to file
	this.toSaveFile = function() {
		var data = HangoutFx.b64.decode(this.bottom.toDataURL().replace("data:image/png;base64,",""));
		return data;
	}
	
	this.changeColor = function(color) {
		switch (color) {
			case "purple":
				this.curColor = this.colorPurple;	
				break;
			case "green":
				this.curColor = this.colorGreen;
				break;
			case "brown":
				this.curColor = this.colorBrown;
				break;
			case "yellow":
				this.curColor = this.colorYellow;
				break;
			case "red":
				this.curColor = this.colorRed;
				break;
			case "blue":
				this.curColor = this.colorBlue;
				break;
			case "orange":
				this.curColor = this.colorOrange;
				break;
			case "pink":
				this.curColor = this.colorPink;
				break;
			default:
				break;
		}
	}

	//	Change tool
	this.changeTool = function(tool) {
		switch (tool) {
			case "eraser":
				this.curTool = eraser;	
				break;
			case "marker":
				this.curTool = marker;
				break;
			case "paintbucket":
				this.curTool = paintBucket;
				break;
			default:
				break;
		}
	}
	
	//	Change size
	this.changeSize = function(size) {
		switch (size) {
			case "small":
				this.curSize = 4;
				this.curSizeName = "Small";
				break;
			case "medium":
				this.curSize = 8;
				this.curSizeName = "Medium";
				break;
			case "large":
				this.curSizeName = "Large";
				this.curSize = 12;
				break;
			default:
				break;
		}
	}
	
	//	Paint at area
	this.paintAt = function(startX, startY, color) {
		var pixelPos = (startY * this.canvasWidth + startX) * 4,	//gets the red channel of the pixel	
			r = this.colorLLayerData.data[pixelPos],
			g = this.colorLLayerData.data[pixelPos + 1],
			b = this.colorLLayerData.data[pixelPos + 2],
			a = this.colorLLayerData.data[pixelPos + 3];

		if (r === color.r && g === color.g && b === color.b) {
			// Return because trying to fill with the same color
			console.log("trying to paint same color");
			return;
		}
		this.floodFill(startX, startY, r, g, b, color, a);
		this.lowerContext.putImageData(this.colorLLayerData, 0, 0);		
	}

	//	Flood fill algorithm for filling canvas
	this.floodFill = function(startX, startY, startR, startG, startB, color, alpha) {
		var newPos,
			x,
			y,
			pixelPos,
			reachLeft,
			reachRight,
			drawingBoundLeft = 0,
			drawingBoundTop = 0,
			drawingBoundRight = this.canvasWidth,
			drawingBoundBottom = this.canvasHeight,
			pixelStack = [[startX, startY]];
			
		var	wallArray = new Array();
			
			
		while (pixelStack.length) {
			//console.log("pixelstack while looping.");
			newPos = pixelStack.pop();
			x = newPos[0];
			y = newPos[1];

			// Get current pixel position
			pixelPos = (y * this.canvasWidth + x) * 4;

			// Go up as long as the color matches and are inside the canvas
			while (y >= drawingBoundTop) {
				if (this.matchStartColor(pixelPos, startR, startG, startB, color, alpha) === false) {
					wallArray.push(pixelPos);
					break;
				}
				else {
					y -= 1;
					pixelPos -= this.canvasWidth * 4;
				}
			}

			pixelPos += this.canvasWidth * 4;
			y += 1;
			reachLeft = false;
			reachRight = false;

			// Go down as long as the color matches and in inside the canvas
			while (y <= drawingBoundBottom) {
				if(this.matchStartColor(pixelPos, startR, startG, startB, color, alpha) === false) {
					wallArray.push(pixelPos);
					break;
				}
				else {
					y += 1;

					this.colorPixel(pixelPos, color.r, color.g, color.b);

					if (x > drawingBoundLeft) {
						if (this.matchStartColor(pixelPos - 4, startR, startG, startB, color, alpha)) {
							if (!reachLeft) {
								// Add pixel to stack
								pixelStack.push([x - 1, y]);
								reachLeft = true;
							}
						} else if (reachLeft) {
							reachLeft = false;
						}
					}

					if (x < drawingBoundRight) {
						if (this.matchStartColor(pixelPos + 4, startR, startG, startB, color, alpha)) {
							if (!reachRight) {
								// Add pixel to stack
								pixelStack.push([x + 1, y]);
								reachRight = true;
							}
						} else if (reachRight) {
							reachRight = false;
						}
					}

					pixelPos += this.canvasWidth * 4;
				}
			}
			for (var i=0; i<wallArray.length; i++)
				this.colorPixel(wallArray[i], color.r, color.g, color.b);
		}
	}

	//	Colorpixel
	this.colorPixel = function(pixelPos, r, g, b) {

		this.colorLLayerData.data[pixelPos] = r;
		this.colorLLayerData.data[pixelPos + 1] = g;
		this.colorLLayerData.data[pixelPos + 2] = b;
		this.colorLLayerData.data[pixelPos + 3] = 255;
	
	}

	//	Check if color matches
	this.matchStartColor = function(pixelPos, startR, startG, startB, color, alpha) {
		var r = this.colorLLayerData.data[pixelPos];
		var g = this.colorLLayerData.data[pixelPos + 1];
		var b = this.colorLLayerData.data[pixelPos + 2];
			
		var a = this.colorLLayerData.data[pixelPos + 3];
		if (r === startR && g === startG && b === startB)
			return true;
		return false;
	}
});