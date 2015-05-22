//var server = 'http://db128gb-b.ddns.comp.nus.edu.sg:8080';
//var server = 'http://db128gb-a.ddns.comp.nus.edu.sg:8080';
//var server = 'http://soccf-db1-030.ddns.comp.nus.edu.sg:8080';
var server = 'http://137.132.179.30:8080';
var wikiTagcloudURL = "/TagRESTServer_idata/api/twitter/wiki";
// var timerangeURL       = server+'/TagRESTServer_idata/api/twitter/timerange';
// var topKUrl            = server+'/TagRESTServer_idata/api/twitter/topk';
// var biclusterURL       = server+'/TagRESTServer_idata/api/twitter/bicluster';
// var biclusterUpdateURL = server+'/TagRESTServer_idata/api/twitter/biclusterupdate';
var biclusterGetTweetsURL = server+'/TagRESTServer_idata/api/twitter/biclustergettweets';

var TG = {}; //Tag Global
var map;
var latScale = d3.scale.linear();
var lngScale = d3.scale.linear();
var latScale2 = d3.scale.linear();
var lngScale2 = d3.scale.linear();
var globalSetID = -1;
var labels = new Array();
var labels2 = new Array();
var rectangleOptions = {
//  bounds: new google.maps.LatLngBounds(map.getCenter(), map.getCenter()),
    clickable: true,
//  editable: true,
    fillColor: '#00ff00',
    fillOpacity: 0.03,
    strokeColor: 'blue',
    strokeOpacity: 1.0,
    strokeWeight: 2
};

function makeSet(id) {
    var rectangle, topMarker, botMarker;
    rectangle = new google.maps.Rectangle(rectangleOptions);
    rectangle.setMap(map);
    return {rectangle:rectangle, top:topMarker, bot:botMarker, id:id};
}

var set1, set2;

function initBoxListeners() {

    set1 = makeSet(1);
    set2 = makeSet(2);
    google.maps.event.addListener(map, 'mousemove', function (mevent) {
        var lastPoint = mevent.latLng;
        if(set1.top && !set1.bot){
            drawRectangle(set1.rectangle, set1.top.position, mevent.latLng);
        }
        if(set2.top && !set2.bot){
            drawRectangle(set2.rectangle, set2.top.position, mevent.latLng);
        }
    });
	
	google.maps.event.addListener(set1.rectangle, 'mousemove', function (mevent) {
        var lastPoint = mevent.latLng;
        if(set1.top && !set1.bot){
            drawRectangle(set1.rectangle, set1.top.position, mevent.latLng);
        }
        if(set2.top && !set2.bot){
            drawRectangle(set2.rectangle, set2.top.position, mevent.latLng);
        }
    });
	
	google.maps.event.addListener(set2.rectangle, 'mousemove', function (mevent) {
        var lastPoint = mevent.latLng;
        if(set1.top && !set1.bot){
            drawRectangle(set1.rectangle, set1.top.position, mevent.latLng);
        }
        if(set2.top && !set2.bot){
            drawRectangle(set2.rectangle, set2.top.position, mevent.latLng);
        }
    });

    google.maps.event.addListener(map, 'click', function(event) {
        if(set1.top==null){
            set1.top = placeMarker(event.latLng);
        }
        if(set1.top && set1.bot && !set2.top) {
            set2.top = placeMarker(event.latLng);
        }
    });
    //clearRectangle(event);
    google.maps.event.addListener(set1.rectangle, 'click', rectangleClicked);
    google.maps.event.addListener(set2.rectangle, 'click', rectangleClicked);
	google.maps.event.addListener(set1.rectangle, 'rightclick', refreshAll);
    google.maps.event.addListener(set2.rectangle, 'rightclick', refreshAll);
	google.maps.event.addListener(map, 'rightclick', refreshAll);
	
	google.maps.event.addListener(map, 'mousemove', function (mevent) {
		document.getElementById('cursor').innerHTML = 'cursor: ('+mevent.latLng.lat().toFixed(3)+','+mevent.latLng.lng().toFixed(3)+')&nbsp;&nbsp;&nbsp;';
		$('#regionbound').text('region: (('+map.getBounds().getSouthWest().lat().toFixed(3)+','+map.getBounds().getSouthWest().lng().toFixed(3)+'),('+map.getBounds().getNorthEast().lat().toFixed(3)+','+map.getBounds().getNorthEast().lng().toFixed(3)+'))');
	});
}


function rectangleClicked(clickEvent) {
    var lastPoint = clickEvent.latLng;
    var set = set1.rectangle === this ? set1:set2;
	if(set.id==1){
		TG.baseZoom = map.getZoom();
		TG.preLevel = map.getZoom();
	}else if(set.id==2){
		TG.baseZoom2 = map.getZoom();
		TG.preLevel2 = map.getZoom();
	}

    if(set.top && !set.bot){
        set.bot = placeMarker(clickEvent.latLng);
        drawRectangle(set.rectangle, set.top.position, set.bot.position);
		
//		console.log("aaaaaaaaa");
		google.maps.event.addListener(set.top, 'drag', function (mevent) {
			drawRectangle(set.rectangle, mevent.latLng, set.bot.position);
		});
		google.maps.event.addListener(set.bot, 'drag', function (mevent) {
			drawRectangle(set.rectangle, set.top.position, mevent.latLng);
		});
		google.maps.event.addListener(set.top, 'dragend', function (mevent) {
			drawRectangle(set.rectangle, mevent.latLng, set.bot.position);
			var times = getTimeArray();
			query(set, times[0], times[1], 1);
		});
		google.maps.event.addListener(set.bot, 'dragend', function (mevent) {
			drawRectangle(set.rectangle, set.top.position, mevent.latLng);
			var times = getTimeArray();
			query(set, times[0], times[1], 1);
		});
		
        var times = getTimeArray();
        query(set, times[0], times[1], 0);
    }
}

function avg(x, y) {
    return (x+y)/2;
}

function scalesForLength(len) {
    return [1,2,3,4,5,6,7,8,9];
}

//callback function
function consumeBiclustersInSet(allData, box, update) { //allData is a hashmap returned from server
	var data = allData.result;
	var status = allData.status;
	var grids = allData.grids;
	initForceCompletely();
	initForce2Completely();
	$("#tooltip").attr('title', status);
	reloadTooltip();
	
	//draw grids on the map
	//for(i in grids){
		//drawGrid(grids[i][0],grids[i][1],grids[i][2],grids[i][3]);
		//console.log("grid:",grids[i][0],grids[i][1],grids[i][2],grids[i][3]);
	//}
	
	if(update==1){
		$('.textLabel').remove();
		if(box.id==1){
			TG.baseZoom = map.getZoom();
			currentLevel = 1;
		}
		else if(box.id==2){
			TG.baseZoom2 = map.getZoom();
			currentLevel2 = 1;
		}
	}
    removeIndicator();
    if (data.length > 10) {
        data.length = 10;
    }
	console.log("generated biclusters", data.length, data);
//    console.log(box);
    //TODO Remove below
    var scales = scalesForLength(9);
	if(box.id==1){
		TG.biclusterdata = [];  //all tags
		TG.biclusternodes = []; //pivot tag
	}
	else if(box.id==2){
		TG.biclusterdata2 = [];
		TG.biclusternodes2 = [];
	}
	
	//sort tags according to weight, ascending
	// for(i in data){
		// data[i].tags.sort(function(a,b){return a.weight-b.weight});
	// }

    for (i in data) {
        
		if(box.id==1){
			var dataI = {name:data[i].tags[0].name, weight:data[i].tags[0].weight, level:'1', next:data[i].tags.slice(1), scale:scales[i], tweets:data[i].tweets};
			TG.biclusterdata.push(dataI);
			var node = {tag:data[i].tags[0].name};
			dataI.node = node;
			TG.biclusternodes.push(node);
			
			TG.forceNodes.push(node);
			TG.nodeDataMap[node.tag] = dataI; //map pivot tag to all data in bicluster
		}
		else if(box.id==2){
			var dataI = {name:data[i].tags[0].name, weight:data[i].tags[0].weight, level:'1', next:data[i].tags.slice(1), scale:scales[i], tweets:data[i].tweets};
			TG.biclusterdata2.push(dataI);
			var node = {tag:data[i].tags[0].name};
			dataI.node = node;
			TG.biclusternodes2.push(node);
			
			TG.forceNodes2.push(node);
			TG.nodeDataMap2[node.tag] = dataI;
		}
    }
    if(box.id==1)
		renderBaseLevel();
	else if(box.id==2)
		renderBaseLevel2();

}

function consumeTopkInSet(data, box) {
    removeIndicator();
    if (data.length > 10) {
        data.length = 10;
    }
    console.log(data);
    //TODO Remove below
    var scales = scalesForLength(9);
    TG.topkdata = [];
    TG.topknodes = [];
    for (i in data) {
        var dataI = {name:data[i].name, level:'1', next:[], scale:scales[i]};
        TG.topkdata.push(dataI);
        var node = {tag:data[i].name};
        dataI.node = node;
        TG.topknodes.push(node);
		if(box.id==1)
			TG.forceNodes.push(node);
		else if(box.id==2)
			TG.forceNodes2.push(node);
        TG.nodeDataMap[node.tag] = dataI;
    }
    renderTopK(box.id);
}

function query(set, time1, time2, update) {
	// time1 = '2012/11/05';
	// time2 = '2012/11/05';
	globalSetID = set.id;

	var data = {lat1:set.top.position.lat(), long1:set.top.position.lng(),
				lat2:set.bot.position.lat(), long2:set.bot.position.lng(),
				time1:time1, time2:time2};
	console.log("args:", data);
	
	showIndicator();

	if(set.id==1){
		TG.nodeDataMap = {};
		latScale = d3.scale.linear().domain([-70, 70]).range([set.top.position.lat(), set.bot.position.lat()]).clamp(false);
		lngScale = d3.scale.linear().domain([-70, 70]).range([set.top.position.lng(), set.bot.position.lng()]).clamp(false);
	}
	else if(set.id==2){
		TG.nodeDataMap2 = {};
		latScale2 = d3.scale.linear().domain([-70, 70]).range([set.top.position.lat(), set.bot.position.lat()]).clamp(false);
		lngScale2 = d3.scale.linear().domain([-70, 70]).range([set.top.position.lng(), set.bot.position.lng()]).clamp(false);
	}
	
//    jQuery.getJSON(topKUrl, data, function(data) { consumeTopkInSet(data, set);});
	if(update==0){
		console.log("doing biclustering");
		jQuery.getJSON(biclusterURL, data, function(data) { generateTagCloud(data, set, 0);});
	} else if(update==1){
		console.log("doing biclustering update");
		jQuery.getJSON(biclusterUpdateURL, data, function(data) { generateTagCloud(data, set, 1);});
	}
}


function callGenerateTagCloud(pageID){
	//showIndicator();
	$.ajax({
		type:"GET",
		//url:server+wikiTagcloudURL+"?pageid="+pageID+"&callback=?", 
		//dataType:"jsonp",
		//corssDomain:true,		
		url:server+wikiTagcloudURL+"?pageid="+pageID, 
		dataType:"json",
		corssDomain:false,		
		success:function(data) {
			console.log("Tag Cloud ===", data);
	 		generateTagCloud(data, null, 0);
			},
		error:function(err,err2){
			console.log("Tag Cloud error: ", err);
			console.log("Tag Cloud error2: ", err2);
			//console.log(err2);			
			}	
		});
}


function generateTagCloud(allData, box, update){
	
//	if(box.id==1){
		TG.allData = allData;
		TG.regionNum = 1;
		//console.log("allData:", allData);
		input = allData.result;
	// }
	// else if(box.id==2){
		// TG.allData2 = allData;
		// TG.regionNum = 2;
		// console.log("allData2:", allData);
		// input2 = allData.result;
	// }
	
	// var status = allData.status;
	// var grids = allData.grids;
	// $("#tooltip").attr('title', status);
	// reloadTooltip();
	//removeIndicator();
	
	//draw grids on the map
	// for(i in grids){
		// drawGrid(grids[i][0],grids[i][1],grids[i][2],grids[i][3]);
		// console.log("grid:",grids[i][0],grids[i][1],grids[i][2],grids[i][3]);
	// }
	
	showTopTen();
}



function placeMarker(latLng) {
    var mkr = new google.maps.Marker({
        position: latLng,
        draggable:true, 
		map:map
    });
    return mkr;
}

function drawRectangle(rectangle, mkr1, mkr2) {
    var latLngBounds = new google.maps.LatLngBounds(mkr1, mkr2);
    rectangle.setBounds(latLngBounds);
}

function drawGrid(minlat, minlon, maxlat, maxlon){
  var triangleCoords = [
    new google.maps.LatLng(minlat, minlon),
    new google.maps.LatLng(maxlat, minlon),
    new google.maps.LatLng(maxlat, maxlon),
    new google.maps.LatLng(minlat, maxlon),
	new google.maps.LatLng(minlat, minlon),
  ];

  myGrid = new google.maps.Polygon({
    paths: triangleCoords,
    strokeColor:"#000000",
    strokeOpacity:1.0, //opacity, no need to change
    strokeWeight:0.5,  //thickness & opacity of line
    fillColor:"#00000F",
    fillOpacity:0.0
  });

  myGrid.setMap(map);
  google.maps.event.addListener(myGrid, 'rightclick', refreshAll);
}

function showIndicator(){
	var loadIndicator = document.createElement("div");
	loadIndicator.className = "indicator";
	$(loadIndicator).append('<img src="load_indicator.gif"/>');//.position();
	$("body").append(loadIndicator);
}

function removeIndicator(){
	$("body .indicator").remove();
}


// grid[i] = new google.maps.Rectangle(rectangleOptions);
// var latLngBounds = new google.maps.LatLngBounds(new google.maps.LatLng(grids[i][0],grids[i][1]), new google.maps.LatLng(grids[i][2],grids[i][3]));
// grid[i].setBounds(latLngBounds);
