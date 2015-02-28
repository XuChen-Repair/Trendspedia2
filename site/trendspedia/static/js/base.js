//sidebar is disabled now; sidebarItem
//tweetbar: display tweets related to tags; tweetItem for each tweet

$(document).ready(function() { 
    initAll();
});


function initAll(){
	TG.baseZoom = 11;
	TG.baseZoom2 = 11;
	TG.preLevel = TG.baseZoom;
	TG.preLevel2 = TG.baseZoom;
	TG.biclusterdata = [];
	TG.biclusternodes = [];
	TG.biclusterdata2 = [];
	TG.biclusternodes2 = [];
	TG.zoomRendered2 = false;
//    TG.finalZoom = 7;
    currentLevel = 1;
	currentLevel2 = 1;
    topKcolor = ["#000"];
    topKcolorString = ["Black"];
    colorArray = ["#F00", "#567036", "#258dc8", "#F0F", "#3B0B0B", "#000EA8", "#0B6121", "#A5009A", "#FF5000", "#885501"];
    colorString = ["Red", "Green", "Blue", "Pink", "Brown", "DarkBlue", "DarkGreen", "Magenta", "Orange", "DarkYellow"];
    map = new google.maps.Map($('#map_canvas')[0], {
		zoom: 10,//TG.baseZoom,
		center: new google.maps.LatLng(1.36, 103.8),//sg, zoom:10
		//center: new google.maps.LatLng(40.5, -83),//ohio, zoom:7
		//center: new google.maps.LatLng(51.5, -0.2),//london, zoom:9
		mapTypeId: google.maps.MapTypeId.ROADMAP
    });

    google.maps.event.addListener(map, 'zoom_changed', function() {
		console.log("zoom_changed");
		$('#regionbound').text('region: (('+map.getBounds().getSouthWest().lat().toFixed(3)+','+map.getBounds().getSouthWest().lng().toFixed(3)+'),('+map.getBounds().getNorthEast().lat().toFixed(3)+','+map.getBounds().getNorthEast().lng().toFixed(3)+'))');
        //show markers
        var zoomLevel = map.getZoom();
        var zoomInterval = 1;
		
        if (TG.preLevel<zoomLevel && (zoomLevel-TG.baseZoom)%zoomInterval==0){
			renderZoomLevel((zoomLevel-TG.baseZoom)/zoomInterval+1);
		} else if(TG.preLevel>zoomLevel && (zoomLevel+1-TG.baseZoom)%zoomInterval==0){
			levelno = (zoomLevel+1-TG.baseZoom)/zoomInterval+1;
			$('.level'+levelno).hide();
			// if(levelno==2)
				// $('.textLabel.bicluster').css("font-size", "14px");
		}
		TG.preLevel = zoomLevel;
		
		
		if (TG.preLevel2<zoomLevel && globalSetID==2 && (zoomLevel-TG.baseZoom2)%zoomInterval==0){
				renderZoomLevel2((zoomLevel-TG.baseZoom2)/zoomInterval+1);
		} else if(globalSetID==2 && (zoomLevel+1-TG.baseZoom2)%zoomInterval==0){
			levelno = (zoomLevel+1-TG.baseZoom2)/zoomInterval+1;
			$('.level'+levelno).hide();
			// if(levelno==2)
				// $('.textLabel.bicluster').css("font-size", "14px");
		}
		TG.preLevel2 = zoomLevel;
    });
    initBoxListeners();
    //renderBaseLevel();
	
	// drawGrid(1.2441038858778741, 103.64501953125, 1.4603368582377747, 104.01031494140625);//DS1 sg
	// drawGrid(51.23096775701038, -0.63446044921875, 51.74403752566788, 0.3460693359375);//DS1 london
	// drawGrid(1.28, 103.74, 1.43, 103.96);//DS1 sg small
	//drawGrid(39.5, -84.8, 41.7, -80.6); //ohio
}

function refreshAll(){
	if(set1.rectangle)
		set1.rectangle.setMap(null);
	if(set1.top)
		set1.top.setMap(null);
	if(set1.bot)
		set1.bot.setMap(null);
		
	if(set2.rectangle)
		set2.rectangle.setMap(null);
	if(set2.top)
		set2.top.setMap(null);
	if(set2.bot)
		set2.bot.setMap(null);

	for (var ii in TG.biclusternodes) {
		TG.biclusternodes[ii].marker.setMap(null);
	}
	for (var ii in TG.biclusternodes2) {
		TG.biclusternodes2[ii].marker.setMap(null);
	}

	$('.textLabel').remove();
    $('#tweetbar .tweetItem').slideUp('fast');
    $('#tweetbar .tweetItem').remove();
    $('#tweetbar').slideUp('fast');
	$("#tooltip").attr('title', "");
	reloadTooltip();
	removeIndicator();
	
	//new tag cloud 
	d3.selectAll(".tagtxt").remove();
	d3.select("#svg2").remove();
	$('#top10').attr('disabled','disabled');
	$('#top20').attr('disabled','disabled');
	$('#top30').attr('disabled','disabled');
	TG.currentGroup = undefined;


	initForceCompletely();
	initForce2Completely();

	globalSetID = -1
	TG.baseZoom = 11;
	TG.baseZoom2 = 11;
	TG.preLevel = TG.baseZoom;
	TG.preLevel2 = TG.baseZoom;
	TG.biclusterdata = [];
	TG.biclusternodes = [];
	TG.biclusterdata2 = [];
	TG.biclusternodes2 = [];
	TG.allData = null;
	TG.allData2 = null;
    currentLevel = 1;
	currentLevel2 = 1;
    topKcolor = ["#000"];
    topKcolorString = ["Black"];
    colorArray = ["#F00", "#567036", "#258dc8", "#F0F", "#3B0B0B", "#000EA8", "#0B6121", "#A5009A", "#FF5000", "#885501"];
    colorString = ["Red", "Green", "Blue", "Pink", "Brown", "DarkBlue", "DarkGreen", "Magenta", "Orange", "DarkYellow"];
	labels = new Array();
	labels2 = new Array();
	
	var mapCenter = map.getCenter();
	var mapZoom = map.getZoom();
    map = new google.maps.Map($('#map_canvas')[0], {
		zoom: mapZoom,
		center: mapCenter,
		mapTypeId: google.maps.MapTypeId.ROADMAP
    });
	
	google.maps.event.clearListeners(map, 'zoom_changed');
	google.maps.event.addListener(map, 'zoom_changed', function() {
		console.log("zoom_changed");
		$('#regionbound').text('region: (('+map.getBounds().getSouthWest().lat().toFixed(3)+','+map.getBounds().getSouthWest().lng().toFixed(3)+'),('+map.getBounds().getNorthEast().lat().toFixed(3)+','+map.getBounds().getNorthEast().lng().toFixed(3)+'))');
        //show markers
        var zoomLevel = map.getZoom();
        var zoomInterval = 1;
		
        if (TG.preLevel<zoomLevel && (zoomLevel-TG.baseZoom)%zoomInterval==0){
			renderZoomLevel((zoomLevel-TG.baseZoom)/zoomInterval+1);
		} else if(TG.preLevel>zoomLevel && (zoomLevel+1-TG.baseZoom)%zoomInterval==0){
			levelno = (zoomLevel+1-TG.baseZoom)/zoomInterval+1;
			$('.level'+levelno).hide();
			// if(levelno==2)
				// $('.textLabel.bicluster').css("font-size", "14px");
		}
		TG.preLevel = zoomLevel;
		
		
		if (TG.preLevel2<zoomLevel && globalSetID==2 && (zoomLevel-TG.baseZoom2)%zoomInterval==0){
				renderZoomLevel2((zoomLevel-TG.baseZoom2)/zoomInterval+1);
		} else if(globalSetID==2 && (zoomLevel+1-TG.baseZoom2)%zoomInterval==0){
			levelno = (zoomLevel+1-TG.baseZoom2)/zoomInterval+1;
			$('.level'+levelno).hide();
			// if(levelno==2)
				// $('.textLabel.bicluster').css("font-size", "14px");
		}
		TG.preLevel2 = zoomLevel;
	});
    initBoxListeners();
    //renderBaseLevel();
}


function renderTopK(id) {
        for (i in TG.topkdata) {
            var pt = TG.topkdata[i];
            var node = TG.topknodes[i];
            var latLng = new google.maps.LatLng(latScale(node.y), lngScale(node.x));
            var zIn = parseInt(i)+1;

            var marker = new google.maps.Marker({
            icon:"pixel.png",
            position: latLng,
            draggable: false,
            map: map,
            zIndex:zIn
            });

            var label = new Label({
            map: map,
            pt:pt,
            class:'topk'
            });
            label.set('zIndex', 1234);
            label.bindTo('position', marker, 'position');
            label.set('text', pt.name);
            TG.topknodes[i].marker = marker;
        };
		if(id==1)
			TG.force.start();
		else 
			TG.force2.start();
};

function renderBaseLevel() {
        $('.sidebarItem').remove();
        for (var i in TG.biclusterdata) {
            var pt = TG.biclusterdata[i];
            var node = TG.biclusternodes[i];
			
			var latLng = new google.maps.LatLng(latScale(node.y), lngScale(node.x));
            var zIn = parseInt(i)+1;
            var marker = new google.maps.Marker({
				icon:"pixel.png",
				position: latLng,
				draggable: true,
				map: map,
				zIndex:zIn
            });

            // Add to the sidebar
            var sidebar = $("#sidebar");
            sidebar.append(createSidebarItem(pt));
            //continue;
            var label = new Label({
				map: map,
				pt:pt,
				color:colorArray[i],
				class: 'bicluster'  //class bicluster means pivot tag
            }); 
			label.set('zIndex', 1234);
            label.bindTo('position', marker, 'position');
            label.set('text', pt.name);
			labels[labels.length] = label;
//			$(label.div_.firstChild).css("text-decoration", "underline");
            if (!marker)
				console.log("scream!");
            node.marker = marker;
        };
		TG.force.start();

        $('.sidebarItem').addClass(function(i) {
                return 'gradient'+colorString[i];
        });
        //$('#sidebar').fadeIn();
};


function renderBaseLevel2() {
        $('.sidebarItem').remove();
        for (var i in TG.biclusterdata2) {
            var pt = TG.biclusterdata2[i];
            var node = TG.biclusternodes2[i];
			
			var latLng = new google.maps.LatLng(latScale2(node.y), lngScale2(node.x));
            var zIn = parseInt(i)+1;
            var marker = new google.maps.Marker({
				icon:"pixel.png",
				position: latLng,
				draggable: false,
				map: map,
				zIndex:zIn
            });

            // Add to the sidebar
            var sidebar = $("#sidebar");
            sidebar.append(createSidebarItem(pt));
            //continue;
            var label = new Label({
				map: map,
				pt:pt,
				color:colorArray[i],
				class: 'bicluster'  //class bicluster means pivot tag
            }); 
			label.set('zIndex', 1234);
            label.bindTo('position', marker, 'position');
            label.set('text', pt.name);
			labels2[labels2.length] = label;
            if (!marker)
				console.log("scream!");
            node.marker = marker;
        };
		compareTwoAreas();
		TG.force2.start();

        $('.sidebarItem').addClass(function(i) {
                return 'gradient'+colorString[i];
        });
        //$('#sidebar').fadeIn();
};

function compareTwoAreas(){
	var tags1 = [], tags2 = [], comm = [];
	for(var i in labels){
		tags1.push(labels[i].text);
	}
	for(var j in labels2){
		tags2.push(labels2[j].text);
	}
	for(var k in tags1){
		if(tags2.indexOf(tags1[k]) != -1 && comm.indexOf(tags1[k]) == -1)
			comm.push(tags1[k]);
	}
	console.log('common tags:', comm);
	for(var i in labels){
		if(-1!=comm.indexOf(labels[i].text)){
			$(labels[i].div_.firstChild).css("font-weight", "bold");
			$(labels[i].div_.firstChild).css("text-decoration", "underline");
			$(labels[i].div_.firstChild).css("font-style", "italic");
			$(labels[i].div_.firstChild).css("font-family", "Comic Sans MS");
		}
	}
	for(var i in labels2){
		if(-1!=comm.indexOf(labels2[i].text)){
			$(labels2[i].div_.firstChild).css("font-weight", "bold");
			$(labels2[i].div_.firstChild).css("text-decoration", "underline");
			$(labels2[i].div_.firstChild).css("font-style", "italic");
			$(labels2[i].div_.firstChild).css("font-family", "Comic Sans MS");
		}
	}
}

//tag clicked
function labelClicked(e) {
    pt = e.data['pt'];

//  map.setCenter(pt.node.marker.getPosition());
    var currentZoom = map.getZoom();
    
    if (!pt.tweets || TG.currentTweets === pt.tweets) return;
    TG.currentTweets = pt.tweets;
    $('#tweetbar').css('height', pt.tweets.length*70+"px");
    $('#tweetbar .tweetItem').slideUp(300);
//    $('#tweetbar .tweetText').remove();
//    $('#tweetbar').slideUp('fast');
    $('#tweetbar').append(pt.tweets.map(createTwitterSidebar));
    $('#tweetbar').slideDown('fast');
    
    // Open the selected sidebar
    $(".sidebarSubItem").parent().children(".sidebarItemText").each(function() {
            if($(this).text() === pt.name) {
                $(this).parent().children(".sidebarSubItem").slideDown('fast');
            } else {
                $(this).parent().children(".sidebarSubItem").slideUp('fast');
            }
    });

}


function labelHovered(pt) {

//  map.setCenter(pt.node.marker.getPosition());
    var currentZoom = map.getZoom();
    
    if (!pt.tweets || TG.currentTweets === pt.tweets) return;
    TG.currentTweets = pt.tweets;
//    $('#tweetbar').css('height', pt.tweets.length*70+"px");
    $('#tweetbar .tweetItem').slideUp(300);
//    $('#tweetbar .tweetText').remove();
//    $('#tweetbar').slideUp('fast');
    $('#tweetbar').append(pt.tweets.map(createTwitterSidebar));
    $('#tweetbar').slideDown('fast');
    
    // Open the selected sidebar
    $(".sidebarSubItem").parent().children(".sidebarItemText").each(function() {
            if($(this).text() === pt.name) {
                $(this).parent().children(".sidebarSubItem").slideDown('fast');
            } else {
                $(this).parent().children(".sidebarSubItem").slideUp('fast');
            }
    });

}


function createTwitterSidebar(tweet) {
    var div = document.createElement("div");
    var text = document.createElement("div");
    var image = document.createElement("a");
    var timestamp = document.createElement("div");
    // http://api.twitter.com/1/users/profile_image/username
    div.className = 'tweetItem';
    div.appendChild(image);
    div.appendChild(text);
    div.appendChild(timestamp);

    //var profile_image = "http://api.twitter.com/1/users/profile_image/"+ tweet.username+"?size=normal";
    $(image).append('<img class="tweetImage" src="'+tweet.profileImageUrl+'" />');

    text.innerHTML = tweet.tweet;
    text.className = 'tweetText';

    timestamp.className = 'tweetTimeText';
    timestamp.innerHTML = tweet.username + "&nbsp;&nbsp;&nbsp;" + tweet.time;

    return div;
}


function createSidebarItem(pt) {
    var div = document.createElement("div");
    var text = document.createElement("div");
    var image = document.createElement("div");

    div.appendChild(image);
    div.appendChild(text);

    div.className = 'sidebarItem';

    text.className = 'sidebarItemText';
    text.innerHTML = pt.name;

    var subItem = document.createElement("div");
    $(subItem).addClass("sidebarSubItem");
    for(i in pt.next) {
        var subSubItem = document.createElement("div");
        $(subSubItem).addClass("sidebarSubSubItem");
        $(subSubItem).text(pt.next[i].name);
        $(subItem).append(subSubItem);
    }
    $(div).append(subItem);

    $(div).hover(
            function() {
            $(".textLabel").filter(function(){return $(this).text() === pt.name || 
                $.inArray($(this).text(), pt.next.map(function(d){return d.name;})) != -1;}).fadeTo('fast',.7);
                $(subItem).slideDown('fast');
            },
            function() {
            $(".textLabel").filter(function(){return $(this).text() === pt.name ||
                $.inArray($(this).text(), pt.next.map(function(d){return d.name;})) != -1;}).fadeTo('fast',.4);
                $(subItem).slideUp('fast');
            }
    );
    $(text).click({pt:pt}, labelClicked);
    return div;
    }


function renderZoomLevel(level) {//level: 2,3,...
    $('.textLabel.bicluster').css("font-size", "20px");
	if(level>0){
		ftsize= (20-4*(level-1))+"px";
	}
    var links;
    var nodes;
    // if (level === 1) {
        // renderBaseLevel();
       // return;
    // }
    for (var i in TG.biclusterdata) {
        nodes = [];
        links = [];
        var nodeForceLayout = d3.layout.force().nodes(nodes)
             .charge(-40-(level-2)*50)
             .linkDistance(5)
             .links(links);
        nodes.push(TG.biclusternodes[i]);
        nodes[0].fixed = true;
        var parentData = TG.biclusterdata[i];
        var parentNode = parentData.node;
		console.log("parentData, parentNode:", parentData, parentNode);
        for (var j in parentData.next) {
            var pt = parentData.next[j];
			if(pt.weight!=level)
				continue;
			pt.tweets = parentData.tweets;//popup tweetbar when click small tags in a bicluster
			var latLng = new google.maps.LatLng(latScale(parentNode.y),lngScale(parentNode.x));
            var zIn = parseInt(i)+1;
            var marker = new google.maps.Marker({
				icon:"pixel.png",
				position: latLng,
				draggable: false,
				map: map,
				zIndex:zIn,
            });

			var label = new Label({
				map: map,
				pt:pt,
				color:colorArray[i],
				class: 'level'+level,
				fontsize: ftsize
			});
			var node = {name:pt.name, x:parentNode.x, y:parentNode.y, marker:marker};
			nodes.push(node);
			links.push({source:parentNode, target:node});
			console.log(parentNode.tag, node.name);
			label.set('zIndex', 1234);
			label.bindTo('position', marker, 'position');
			label.set('text', pt.name);
			labels[labels.length] = label;
		};
        nodeForceLayout.on("tick", function() {
                var subNodes = nodes;
                var parentNd = parentNode;
                return function(e) {
					subNodes.forEach(function(node) {
						var k = .3 * e.alpha;
						node.x += (parentNd.x - node.x)*k;
						node.y += (parentNd.y - node.y)*k;
						node.marker.setPosition(new google.maps.LatLng(latScale(node.y), lngScale(node.x)));
					});
                //e.start();
                };
        }());
        parentNode.force = {};
        parentNode.force.layout = nodeForceLayout;
        parentNode.force.nodes = nodes;
		parentNode.force.layout.start();
		$('.sidebarItem').addClass(function(i) {
				return 'gradient'+colorString[i];
		});
    }
}


function renderZoomLevel2(level) {
    //console.log("rendering ", level);
    $('.textLabel.bicluster').css("font-size", "20px");
	if(level>0){
		ftsize= (20-4*(level-1))+"px";
	}
    var links;
    var nodes;
    // if (level === 1) {
        // renderBaseLevel();
       // return;
    // }
    for (var i in TG.biclusterdata2) {
        nodes = [];
        links = [];
        var nodeForceLayout = d3.layout.force().nodes(nodes)
             //.charge(3)
             .linkDistance(5)
             .links(links);
        nodes.push(TG.biclusternodes2[i]);
        nodes[0].fixed = true;
        var parentData = TG.biclusterdata2[i];
        var parentNode = parentData.node;
        console.log(parentData, parentNode);
        for (var j in parentData.next) {
            var pt = parentData.next[j];
			if(pt.weight!=level)
				continue;
			pt.tweets = parentData.tweets;//popup tweetbar when click small tags in a bicluster
			var latLng = new google.maps.LatLng(latScale2(parentNode.y),lngScale2(parentNode.x));
            var zIn = parseInt(i)+1;
            var marker = new google.maps.Marker({
				icon:"pixel.png",
				position: latLng,
				draggable: false,
				map: map,
				zIndex:zIn
            });

			var label = new Label({
				map: map,
				pt:pt,
				color:colorArray[i],
				class: 'level'+level,
				fontsize: ftsize
			});
			var node = {name:pt.name, x:parentNode.x, y:parentNode.y, marker:marker};
			nodes.push(node);
			links.push({source:parentNode, target:node});
			console.log(parentNode.tag, node.name);
			label.set('zIndex', 1234);
			label.bindTo('position', marker, 'position');
			label.set('text', pt.name);
			labels2[labels2.length] = label;
		};
		
        nodeForceLayout.on("tick", function() {
                var subNodes = nodes;
                var parentNd = parentNode;
                return function(e) {
                subNodes.forEach(function(node) {
					var k = .3 * e.alpha;
					node.x += (parentNd.x - node.x)*k;
					node.y += (parentNd.y - node.y)*k;
					node.marker.setPosition(new google.maps.LatLng(latScale2(node.y), lngScale2(node.x)));
                });
                //e.start();
                };
            }());
        parentNode.force2 = {};
        parentNode.force2.layout = nodeForceLayout;
        parentNode.force2.nodes = nodes;
		parentNode.force2.layout.start();
		$('.sidebarItem').addClass(function(i) {
				return 'gradient'+colorString[i];
		});
	}
	compareTwoAreas();
}


function reloadTooltip(){
	$("#tooltip").tooltip({
				track: true,
				delay: 0,
				showURL: false,
				showBody: " - ", 
				top: 15, 
				left: 15 
	});
}
