tpSampleUI = function(args){
	var tp_player  = args.tpPlayer,
		webgl_container_id = args.webGLContainerID,
		assembly_container = document.getElementById(args.assemblyTreeContainerID),
		selected_msg_cotainer = document.getElementById(args.selectedMsgContainerID),
		stat_container = document.getElementById(args.statContainerID),
		width = args.width,
		height = args.height,
		fps_stats,
		num_picked = 0,
		model_name,
		model_unit,
		model_type,
		model_min,
		model_max,
		saved_view_stack = [];
		explode_amount = 0,
		explode_inc = 0.2,
		explode_max = 5,
		rubber_bands = [], // 2 rubberband lines
		spheres = [], // 3 spheres markers
		floors = [], // 3 floors for shadow casting
		top_model_id = '',
		selected_id = '',
		ui_calllback_hover = null,
		ui_calllback_leftpick = null,
		span_s = "<span>",
		span_e = "</span>",
		next_line = " </br>",
		part_selection_msg = 'Select a part of sub-assembly';
		
	
	this.start = function(dataURL, textureURL){
		tp_player = new TPVIEWER.player();
		var support = tp_player.detectBrowserSupport();
		if(!support.webgl){
			showInfo("Your browser doesn't support WebGL");
			return false;
		}
		if (!support.webglEnabled) {
			showInfo("WebGL is disabled in your browser.");
			return false;
		}
		if(stat_container){
			fps_stats = new Stats();
			stat_container.appendChild( fps_stats.domElement );
	  	}
		tp_player.init({
		      containerID:webgl_container_id,
		      width:width,
		      height:height
		});
		
		tp_player.load({
		  format: dataURL.indexOf('tptx.m') > -1 ? 'CTM' : 'TPTX',
			URL:dataURL,
			textureURL:textureURL,
			onLoadFinished:function onLoadFinished(loadedObj){
				var obj_info,
					msg;
				
				tp_player.startScene({
					hoverOnObjects:true,
		    		hoverHighlightColor:0x000088,
		    		onMouseMove: eventLoop,
					onMouseDown: eventLoop,
					onMouseUp: eventLoop,
					onMouseWheel: eventLoop
				});
				model_unit = (loadedObj.unit===undefined) ? "" : loadedObj.unit;
				model_type = loadedObj.type;
				top_model_id = loadedObj.objectID;
				selectID(top_model_id);
				obj_info = tp_player.getObjectInfo(top_model_id);
				model_name = (obj_info.name===undefined) ? "" : obj_info.name;
				model_min = obj_info.min;
				model_max = obj_info.max;
				
				msg = getObjectInfoString();
				showInfo(msg);
				if(isAssembly()){
					buildAssemblyTree(obj_info, assembly_container);
				}
				init_ui_objects();
			},
			onLoadFailed:function onLoadFailed(errMsg){
				showInfo (errMsg);
			}
		});
	}
	
	var setUICallback = this.setUICallback = function(mode, callBack){
		if(callBack!==undefined){
			switch(mode){
			case "LEFT_PICK":
			ui_calllback_leftpick = callBack;
			break;
			case "HOVER":
			ui_calllback_hover = callBack;
			break;
			}
		}
	}
	this.setCamera = function(args){
		tp_player.setCamera(args);
	}
	this.saveViews = function(){
		var cam_info = tp_player.getCameraInfo();
		printObject(cam_info);
		saved_view_stack.push(cam_info);
	}
	this.restoreViews = function(){
		var n = saved_view_stack.length;
		if(n<1){
			showInfo("No saved view found. Run Save View menu first");
			return;
		}
		tp_player.setCamera({
			viewDirection:TPVIEWER.VIEW_DIR.CUSTOM,
			camera:saved_view_stack[n-1],
			animate:true, // animation is optional
			numFrames:12
		});
		// remove the last one
		saved_view_stack.splice(n-1,1);
	}
	this.trackballOption = function(cb) {
		if (cb.checked) {
			tp_player.setTrackballOperations({
				rotateEnabled: true,
				zoomEnabled: true,
				panEnabled: true
			});
			showInfo("Trackball enabled");
		} else {
			tp_player.setTrackballOperations({
				rotateEnabled: false,
				zoomEnabled: false,
				panEnabled: false
			});
			showInfo("Trackball disabled");
		}
	}
	this.axisOption = function(cb) {
		if (cb.checked) tp_player.showAxis();
		else tp_player.hideAxis();
	}
	this.floorOption = function(cb, axis) {
		if (cb.checked) tp_player.showCustomObject(floors[axis]);
		else tp_player.hideCustomObject(floors[axis]);
	}
	this.shadowOption = function(cb) {
		if (cb.checked) tp_player.enableShadowCast(top_model_id);
		else tp_player.disableShadowCast(top_model_id);
	}
	this.hoverOption = function(cb) {
		if (cb.checked) tp_player.startHover();
		else tp_player.stopHover();
	}
	
	this.resizeWin = function(w, h){
		var dom_elm = document.getElementById(webgl_container_id);
			
		if(dom_elm){
			dom_elm.style.width = w + 'px';
			dom_elm.style.height = h + 'px';
			tp_player.resizeScene({width:w,height:h});
		}
	}
	
	this.objectInfo = function() {
		if (selected_id != "") {
			showInfo(getObjectInfoString(selected_id));
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				showInfo(getObjectInfoString(evtObj.objectID));
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	
	function getObjectInfoString(objID){
		var msg = '';
		
		if(objID===undefined || !objID){
			msg += "Name: " + span_s + model_name + span_e + next_line;
		}else{
			msg += "ID: " + span_s + objID + span_e + next_line;
			msg += "Name: " + span_s + tp_player.getObjectInfo(objID).name + span_e + next_line;
		}
		msg += "Unit: " + span_s + model_unit + span_e + next_line;
		msg += "Type: " + span_s + getModelTypeString(model_type) + span_e;
		function getModelTypeString(model_type){
			switch(model_type){
				case TPVIEWER.MODEL_TYPE.CAD_PART:
				return "CAD PART";
				case TPVIEWER.MODEL_TYPE.CAD_ASSEMBLY:
				return "CAD ASSEMBLY";
				case TPVIEWER.MODEL_TYPE.MESH:
				return "MESH";
				default:
				return "UNKNOWN";
			}
		};
		
		return msg;
	}
	
	this.objectOpacity = function(op) {
		if (selected_id != "") {
			tp_player.setObjectOpacity(selected_id, op);
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				tp_player.setObjectOpacity(evtObj.objectID, op);
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	this.resetObjectOpacity = function(){
		if (selected_id != "") {
			tp_player.resetObjectOpacity(selected_id);
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				tp_player.resetObjectOpacity(evtObj.objectID);
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	this.objectMaterial = function(op) {
		if (selected_id != "") {
			tp_player.setObjectMaterial(selected_id, {materialIndex:op});
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				tp_player.setObjectMaterial(evtObj.objectID, {materialIndex:op});
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	this.objectMaterialCustom = function() {
		$('#materialModalInput').modal({
			keyboard: true
		});
		$('#materialModalInput #okButton').click(function(){
			var max_col = 0xFFFFFF,
				diffuse_color = $('#materialModalInput #inputDiffuse').val(),
				ambient_color = $('#materialModalInput #inputAmbient').val(),
				specular_color = $('#materialModalInput #inputSpecular').val(),
				shininess_value = $('#materialModalInput #inputShininess').val(),
			
			// Validate each value. If not, assign null 
			diffuse_color = validate_input(diffuse_color, "int", 0, max_col)
			ambient_color = validate_input(ambient_color, "int",0, max_col)
			specular_color = validate_input(specular_color,"int", 0, max_col)
			shininess_value = validate_input(shininess_value, "float", 0, 128)
			
			function validate_input(v, t, min, max){
				if(!$.isNumeric(v))
					return null;
				
				var num = (t=="int") ? parseInt(v) : parseFloat(v);
				return (num>=min && num<=max) ? num : null;
			}
			
			$('#materialModalInput').modal('hide');
			
			var material_data = {
				diffuse:diffuse_color,
				ambient:ambient_color,
				specular:specular_color,
				shininess:shininess_value,
				//reflectivity:reflectivity_value,
			}
			
			if (selected_id != "") {
				tp_player.setObjectMaterial(selected_id, {
					materialIndex:TPVIEWER.MATERIAL.CUSTOM,
					material:material_data
				});
			} else {
				showGuide(part_selection_msg);
				setUICallback("LEFT_PICK", function(evtObj) {
					hideGuide();
					tp_player.setObjectMaterial(evtObj.objectID, {
						materialIndex:TPVIEWER.MATERIAL.CUSTOM,
						material:material_data
					});
					unselect();
					setUICallback("LEFT_PICK", null);
				});
			}
		});
	}
	this.resetObjectMaterial = function() {
		if (selected_id != "") {
			tp_player.resetObjectMaterial(selected_id);
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				tp_player.resetObjectMaterial(evtObj.objectID);
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	this.setColorBlack = function(){
		if (selected_id != "") {
			tp_player.setObjectColor(selected_id, 0x000000);
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				tp_player.setObjectColor(evtObj.objectID, 0x000000);
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	this.objectVisibility = function(cmd) {
		switch (cmd) {
		case "HIDE":
			if (selected_id != "") {
				tp_player.hideObject(selected_id);
			} else {
				showGuide(part_selection_msg);
				setUICallback("LEFT_PICK", function(evtObj) {
					hideGuide();
					tp_player.hideObject(evtObj.objectID);
					unselect();
					setUICallback("LEFT_PICK", null);
				});
			}
			break;
		case "HIDE_OTHERS":
			if (selected_id != "") {
				tp_player.hideOtherObjects(selected_id);
			} else {
				showGuide(part_selection_msg);
				setUICallback("LEFT_PICK", function(evtObj) {
					hideGuide();
					tp_player.hideOtherObjects(evtObj.objectID);
					unselect();
					setUICallback("LEFT_PICK", null);
				});
			}
			break;
		case "HIDE_ALL":
			tp_player.hideAllObject();
			break;
		case "SHOW_ALL":
			tp_player.showAllObject();
			break;
		}
	}

	this.setRotationCenter = function() {
		if (selected_id != "") {
			tp_player.setRotationCenter(selected_id);
		} else {
			showGuide(part_selection_msg);
			setUICallback("LEFT_PICK", function(evtObj) {
				hideGuide();
				tp_player.setRotationCenter(evtObj.objectID);
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}

	this.resetRotationCenter = function() {
		tp_player.resetRotationCenter();
	}

	this.captureScreen = function() {
		var dataURI = tp_player.captureScreen("png");
		var imgWin = window.open('', 'captured image');
		imgWin.document.write("<body style='font-family:Lucida Grande, Verdana, Helvetica, Arial;'>");
		imgWin.document.write("<p align='center'>Screen Captured Image</p>");
		imgWin.document.write("<div style='text-align:center;'><img style='border:1px solid black;' src=" + '\"' + dataURI + '\"' + "</img></div>");
	}
	this.changeTextureSource = function(){
		 openModalInput(
			"Path of the texture image in PNG or JPEG format",	// title
			"It should be a relative path like 'textures/xyz.png'" + next_line + "Absolute path may cause the Cross-Origin exception.",	// label
			function(textureURL){	//success callback
				var res;
				if (selected_id != "") {
					res = tp_player.changeTextureSource(selected_id, textureURL);
					showErrorCode(res);
				} else {
					showInfo(part_selection_msg);
					setUICallback("LEFT_PICK", function(evtObj) {
						var res;
						hideGuide();
						res = tp_player.changeTextureSource(evtObj.objectID, textureURL);
						unselect();
						setUICallback("LEFT_PICK", null);
						showErrorCode(res);
					});
				}
			});
	}
	this.downloadAsSTL = function() {
		var file_name;
		if (selected_id != "") {
			file_name = tp_player.getObjectInfo(selected_id).name + ".stl";
			tp_player.saveAsSTL(selected_id, file_name);
		} else {
			showGuide(part_selection_msg);
			sample_ui.setUICallback("LEFT_PICK", function(evtObj) {
				var file_name;
				file_name = tp_player.getObjectInfo(evtObj.objectID).name + ".stl";
				tp_player.saveAsSTL(evtObj.objectID, file_name);
				unselect();
				setUICallback("LEFT_PICK", null);
			});
		}
	}
	
	window.onresize = function(){
		var c=document.getElementById(webgl_container_id);
		tp_player.resizeScene(c.clientWidth, c.clientHeight);
	}
	
	var openModalInput = this.openModalInput = function(title, label, callback){
		$('#textModalInput .modal-title').html (title);
		$('#textModalInput #textModalValueLabel').html (label);
		$('#textModalInput').modal({
			keyboard: true
		});
		$('#textModalInput #okButton').click(function(){
			$('#textModalInput').modal('hide');
			callback( $('#textModalInput #textModalValue').val() );
		});
		
	}
	var resetNumPicked = this.resetNumPicked = function(n){
		num_picked = 0;
	}
	
	var getNumPicked = this.getNumPicked = function(){
		return num_picked;
	}
	var isAssembly = this.isAssembly = function(){
		return (model_type == TPVIEWER.MODEL_TYPE.CAD_ASSEMBLY);
	}
	var showErrorCode = this.showErrorCode = function(err){
		if(err==TPVIEWER.ERROR_CODE.NO_DATA)
			showInfo("Object doesn't have UV data.");
	}
	this.explodeAssembly = function(inc){
		if(!isAssembly()){
      		showInfo("No multiple objects - it only works with an assembly");
      		return;
		}
		explode_amount += (inc) ? explode_inc : -explode_inc;
		if(explode_amount>explode_max)
			explode_amount = explode_max;
		if(explode_amount<0)
			explode_amount = 0;
		
		tp_player.explodeObjects(explode_amount);
	}
	this.treeNodeSelected = function(id) {
		if (id != selected_id) {
			unselect();
			selectID(id);
			tp_player.setObjectEmissiveColor(selected_id, 0x0000ff);
			if(ui_calllback_leftpick!=null)
				ui_calllback_leftpick({objectID:selected_id});
		}
	}
	this.unselectPart = function(){
		if (!isAssembly()){
			showInfo("No multiple objects - it only works with an assembly");
      		return;
		}
		unselect();
	}
	var unselect = this.unselect = function() {
		if (isAssembly() && selected_id && selected_id != "") {
			tp_player.resetObjectEmissiveColor(selected_id);
			selectID("");
		}
	}
	var selectID = this.selectID = function(id){
		selected_id = id;
		selected_msg_cotainer.innerHTML = selected_id;
	}
	
	this.measureDist = function() {
		var first_point, second_point;

		resetNumPicked();
		setUICallback("HOVER", null);
		showGuide("Pick the first point");
		setUICallback("LEFT_PICK", function(evtObj) {
			var npicked = getNumPicked();
			if (npicked == 1) {
				first_point = evtObj.objectPoint;
				startRubberband(0, first_point);
				showSphere(0);
				moveSphere(0, first_point);
				unselect();
				showSphere(1);
				moveSphere(1, first_point);
				showGuide("Pick the second point");

				setUICallback("HOVER", function(evtObj) {
					second_point = evtObj.objectPoint;
					printDistance(first_point, second_point);
					updateRubberband(0, second_point);
					moveSphere(1, second_point);
				});
			} else if (npicked == 2) {
				hideGuide();
				endRubberband(0);
				hideSphere(0);
				hideSphere(1);
				unselect();
				setUICallback("LEFT_PICK", null);
				setUICallback("HOVER", null);
				resetNumPicked();
			}
		});
	}
	this.measureAngle = function() {
		var first_point, second_point, third_point;
		resetNumPicked();
		setUICallback("HOVER", null);
		showGuide("Pick the first point");
		setUICallback("LEFT_PICK", function(evtObj) {
			var npicked = sample_ui.getNumPicked();
			if (npicked == 1) {
				first_point = evtObj.objectPoint;
				startRubberband(0, first_point);
				showSphere(0);
				moveSphere(0, first_point);
				unselect();
				
				showSphere(1);
				moveSphere(1, first_point);
				showGuide("Pick the second point");

				setUICallback("HOVER", function(evtObj) {
					second_point = evtObj.objectPoint;
					printDistance(first_point, second_point);
					updateRubberband(0, second_point);
					moveSphere(1, second_point);
				});
			} else if (npicked == 2) {
				third_point = evtObj.objectPoint;
				startRubberband(1, second_point);
				showSphere(2);
				moveSphere(2, second_point);
				unselect();
				
				showGuide("Pick the third point");
				setUICallback("HOVER", function(evtObj) {
					third_point = evtObj.objectPoint;
					printAngle(first_point, second_point, third_point);
					updateRubberband(1, third_point);
					moveSphere(2, third_point);
				});
			} else if (npicked == 3) {
				hideGuide();
				endRubberband(0);
				endRubberband(1);
				hideSphere(0);
				hideSphere(1);
				hideSphere(2);
				unselect();
				setUICallback("LEFT_PICK", null);
				setUICallback("HOVER", null);
				resetNumPicked();
			}
		});
	}

	var startRubberband = this.startRubberband = function(which,pt){
		tp_player.updateCustomLineObject(rubber_bands[which],{
			sx : pt.x,
    		sy : pt.y,
    		sz : pt.z,
    		ex : pt.x,
    		ey : pt.y,
    		ez : pt.z
    	});
		tp_player.showCustomObject(rubber_bands[which]);
	}
	var updateRubberband = this.updateRubberband = function(which,pt){
		tp_player.updateCustomLineObject(rubber_bands[which],{
			ex : pt.x,
    		ey : pt.y,
    		ez : pt.z
    	});
	}
	var endRubberband = this.endRubberband = function(which){
		tp_player.hideCustomObject(rubber_bands[which]);
	}
	
	var showSphere = this.showSphere = function (which){
		tp_player.showCustomObject(spheres[which]);
	}
	
	var hideSphere = this.hideSphere = function (which){
		tp_player.hideCustomObject(spheres[which]);
	}
	var moveSphere = this.moveSphere = function (which, pt){
		tp_player.moveCustomObject(spheres[which], pt.x, pt.y, pt.z);
	}
	var printDistance = this.printDistance = function(p1, p2){
		var distx, disty, distz, dist,
			msg;
		
		distx = (p1.x-p2.x);
        disty = (p1.y-p2.y);
        distz = (p1.z-p2.z);
        dist = Math.sqrt(distx*distx+disty*disty+distz*distz);
        msg = "X distance: " + span_s + distx.toFixed(2)+" " + model_unit + span_e + next_line;
        msg += "Y distance: " + span_s + disty.toFixed(2)+" " + model_unit + span_e + next_line;
        msg += "Z distance: " + span_s + distz.toFixed(2)+" " + model_unit + span_e + next_line;
        msg += "3D distance: " + span_s + dist.toFixed(2)+" " + model_unit;

		printMessage(msg);
	}
	var printAngle = this.printAngle = function(p1, p2, p3){
		var v1 = {},
			v2 = {},
			d1, d2, x, y, z,
			ang,
			msg;
		
		// v1 = p1-p2
		// v2 = p3-p2
		v1.x = p1.x-p2.x; v1.y = p1.y-p2.y; v1.z = p1.z-p2.z;
		v2.x = p3.x-p2.x; v2.y = p3.y-p2.y; v2.z = p3.z-p2.z;
		
		// Normalize v1, v2
		v1.len = Math.sqrt((v1.x*v1.x)+(v1.y*v1.y)+(v1.z*v1.z));
		v1.x /= v1.len; v1.y /= v1.len; v1.z /= v1.len;
		
		v2.len = Math.sqrt((v2.x*v2.x)+(v2.y*v2.y)+(v2.z*v2.z));
		v2.x /= v2.len; v2.y /= v2.len; v2.z /= v2.len;
		
		// d1 = v1 dot v2
		d1 = v1.x*v2.x + v1.y*v2.y + v1.z*v2.z;
		
		// d2 = (v1 cross v2).length
		x = v1.y * v2.z - v1.z * v2.y;
		y = v1.z * v2.x - v1.x * v2.z;
		z = v1.x * v2.y - v1.y * v2.x;
		d2 = Math.sqrt(x*x+y*y+z*z);
		
		ang = Math.atan2(d2,d1)*180/Math.PI;
		msg = "Angle:" + span_s + ang.toFixed(2) + span_e + " degree";
		
		printMessage(msg);
	}
	var printMessage = this.printMessage = function(msg){
		$("#screenMessage").html($("#screenMessage").html() + next_line + msg);
	}
	var printObject = this.printObject = function(obj, depthLimit){
		var dl = (depthLimit == undefined) ? 1 : depthLimit,
			out = '';
		
		out = printObjectInfo(obj,'',dl);
		
		function printObjectInfo(obj,upperIndent,dl){
			var indent = '-';
			indent = indent + upperIndent;
			for (var p in obj) {
				out += indent + p + ': ' + obj[p] + '<br>';
				if (typeof obj[p] == "object" && indent.length <= dl)
					out = printObjectInfo(obj[p],indent,dl);
			}
			
			return out;
		}
		printMessage(out);
	}
	
	var showGuide = this.showGuide = function(msg){
		$("#guideMessage").html(msg);
		$("#infobox").hide();
		$("#guidebox").show();
	}
	
	var hideGuide = this.hideGuide = function(){
		$("#infobox").hide();
		$("#guidebox").hide();
	}
	
	var showInfo = this.showInfo = function(msg){
		$("#infoMessage").html(msg);
		$("#guidebox").hide();
		$("#infobox").show();
	}
	
	var showMouseEvent = this.showMouseEvent = function(evtObj){
		var stored_name, msg = '';
		
		msg += "Mouse event: " + span_s + getMouseEventString(evtObj.eventType) + span_e + next_line;	
		msg += "Screen x: " + span_s + evtObj.screenPoint.x + span_e
				+ " y: " + span_s + evtObj.screenPoint.y + span_e + next_line;
		
		if(evtObj.objectID){
			stored_name = tp_player.getObjectInfo(evtObj.objectID).name;
			stored_name = (stored_name===undefined) ? "(no name)" : stored_name;
			msg += "On Object: " + span_s + stored_name + span_e + next_line;
		}
		if(evtObj.objectPoint)
			msg += 	"Object x: " + span_s + evtObj.objectPoint.x.toFixed(2) + span_e 
					+ " y: " + span_s + evtObj.objectPoint.y.toFixed(2) + span_e 
					+ " z: " + span_s + evtObj.objectPoint.z.toFixed(2) + span_e + next_line;
		if(evtObj.objectNormal)
			msg += "Object Normal x: " + span_s + evtObj.objectNormal.x.toFixed(2) + span_e 
					+ " y: " + span_s + evtObj.objectNormal.y.toFixed(2) + span_e 
					+ " z: " + span_s + evtObj.objectNormal.z.toFixed(2) + span_e + next_line;
		
		$("#screenMessage").html(msg);
	}
	
	function getMouseEventString(evt){
		switch(evt){
			case TPVIEWER.EVENT_TYPE.MOUSE_MOVE:
			return "MOUSE_MOVE";
			case TPVIEWER.EVENT_TYPE.LEFT_UP:
			return "LEFT_UP";
			case TPVIEWER.EVENT_TYPE.LEFT_DOWN:
			return "LEFT_DOWN";
			case TPVIEWER.EVENT_TYPE.RIGHT_UP:
			return "RIGHT_UP";
			case TPVIEWER.EVENT_TYPE.RIGHT_DOWN:
			return "RIGHT_DOWN";
			case TPVIEWER.EVENT_TYPE.MOUSE_WHEEL:
			return "MOUSE_WHEEL";
			default:
			return "UNKNOWN";
		}
	};
		 
	function eventLoop(evtObj){
		showMouseEvent(evtObj);
		fps_stats.update();
		
		switch(evtObj.eventType){
		case TPVIEWER.EVENT_TYPE.MOUSE_MOVE:
			if(ui_calllback_hover)
				ui_calllback_hover(evtObj);
		break;
		case TPVIEWER.EVENT_TYPE.LEFT_UP :
			unselect();
			if(evtObj.objectPoint){
				if(isAssembly()){
					selectID(evtObj.objectID);
					tp_player.setObjectEmissiveColor(evtObj.objectID, 0x0000ff);
				}
				num_picked++;
				if(ui_calllback_leftpick)
					ui_calllback_leftpick(evtObj);
			}
		break;	
		}
	}
	
	function buildAssemblyTree(objInfo, dom){
		var tree = "",
		tree =
			"<ul><li><input type='checkbox' id='"
			+ objInfo.objectID 
			+ "' onclick=sample_ui.treeNodeSelected('" + objInfo.objectID + "') /><label for='"+objInfo.objectID+"'>"
			+ objInfo.name + " Assembly Tree</label>";
			
		buildAssemblyChildren(objInfo);
		
		dom.innerHTML = tree+"</li></ul>";
		
		function buildAssemblyChildren(objInfo){
			var i,il,
				child,
				className;
			tree += "<ul>";
			for(i=0, il=objInfo.childrenIDs.length;i<il;i+=1){
				child = tp_player.getObjectInfo(objInfo.childrenIDs[i]);
				if(child.isContainer){
					tree += "<ul>";
					tree +=
					"<li><input type='checkbox' id='"
					+ child.objectID 
					+ "' onclick=sample_ui.treeNodeSelected('" + child.objectID + "') /><label for='"+child.objectID+"'>"
					+ child.name + "</label>";
					buildAssemblyChildren(child);
					tree += "</li></ul>"
				}else{
					tree +=
					"<li><a href = '#' onclick=sample_ui.treeNodeSelected('" + child.objectID + "')>"+child.name +"</a></li>"
					
				}
			}
			tree += "</ul>";
		}
	}
	
	function init_ui_objects(){
		var i,
			custom_obj,
			diag;
		
		//
		// Compute the diagonal length of the model min-max box
		//
		diag = 	(model_max.x-model_min.x)*(model_max.x-model_min.x)+
				(model_max.y-model_min.y)*(model_max.y-model_min.y)+
				(model_max.z-model_min.z)*(model_max.z-model_min.z);
		diag = Math.sqrt(diag);
		
		//
		// Create two rubberband lines used for dimension measuring
		//
		for(i=0;i<2;i+=1){
			rubber_bands.push(custom_obj = tp_player.addCustomLineObject({
				sx : 0,
	    		sy : 0,
	    		sz : 0,
	    		ex : 0,
	    		ey : 0,
	    		ez : 0,
	    		color : 0xff0000,
	    		width : 3,
	    		opacity: 1.0
			}));
			tp_player.hideCustomObject(custom_obj);
		}
		
		//
		// Create three spheres used as markers for dimension measuring
		//
		for(i=0;i<3;i+=1){
			spheres.push(custom_obj = tp_player.addCustomSphereObject({
				cx:0,
	    		cy:0,
	    		cz:0,
	    		rad:diag/100,
	    		numSegments:6,
	    		color: 0xff0000
			}));
			tp_player.hideCustomObject(custom_obj);
		}
		
		//
		// Create shadow floors
		//
		var scale = 1.2;
		// x-plane (normal vector is [1,0,0])	
		floors['x'] = tp_player.addCustomShadowFloorObject({
			position:{
				x:model_min.x-diag/3, 
				y:(model_max.y+model_min.y)/2,
				z:(model_max.z+model_min.z)/2},
			axis:'x',
			width: diag*scale,
			height: diag*scale,
			checkboardNumSegW: 1,	// passing 1 means no checkboard in the direction
			checkboardNumSegH: 1,
			opacity:0.4,	// floor opacity ranging [0~1]
			color:0xfaa500,	// floor color
			lightColor:0xffffff,	// shadow light color
			darkness:0.5	// shadow darkness ranging [0~1]
		});
		
		// y-plane (normal vector is [0,1,0])
		floors['y'] = tp_player.addCustomShadowFloorObject({
			position:{
				x:(model_max.x+model_min.x)/2, 
				y:model_min.y-diag/3,
				z:(model_max.z+model_min.z)/2},
			axis:'y',
			width: diag*scale,
			height: diag*scale,
			checkboardNumSegW: 10,
			checkboardNumSegH: 10,
			opacity:0.4,
			color:0x00ff00,
			lightColor:0xffffff,
			darkness:0.5
		});
		
		// z-plane (normal vector is [0,0,1])
		floors['z'] = tp_player.addCustomShadowFloorObject({
			position:{
				x:(model_max.x+model_min.x)/2, 
				y:(model_max.y+model_min.y)/2,
				z:model_min.z-diag/3},
			axis:'z',
			width: diag*scale,
			height: diag*scale,
			checkboardNumSegW: 1,
			checkboardNumSegH: 10,
			opacity:0.4,
			color:0x00a5ff,
			lightColor:0xffffff,
			darkness:0.5
		});
		
		// Enable shadow casting from objects to the floors
		tp_player.enableShadowCast(top_model_id);
	}
	
	// Bootstrap UI
	$('.close').click(function() {
		$('.alert').hide();
	})
	$('.alert').click(function() {
		$('.alert').hide();
	})
};
