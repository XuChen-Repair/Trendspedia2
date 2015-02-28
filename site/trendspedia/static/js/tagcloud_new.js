var input = [];
var input2 = [];
var highestlevel;
var groupcount;
TG.showedBicNo = 30;

var fill;

var width;
var height;
	
var centerX;
var centerY;
var radius;
//var perRadius = 2*Math.PI/(groupcount-1);
var my = new Array();
var x, y;
var zm;
var svg;
var cha;
var cha2;


	var width = window.innerWidth;
	var height = window.innerHeight;

	var zoom = 1;
	var wordSendList = [];
	var wordPosition = [];
	
	var wordList = [];
	
	var ui = {
		stage: null,
		scale: 1,
		zoomFactor: 1.1,
		origin: {
			x: 0,
			y: 0
		}
	};
	
	var stage;
	
	var layer;
	
	var track = new Spiral(200, 200, 10);
	track.generate();

	var bounds = {
		x:0,
		y:0,
		width:width,
		height:height
	}
	
	var quad = new QuadTree(bounds, true);

    function insertSpiritToTree(spirit, x, y, width, quad){
        var _x = x;
        var _y = y;

        for(var i=1; i<=spirit.length; i++){
            if (spirit[i-1]>0) {
				quad.insert({x:_x+(i-1)%width, y:_y});
			}
			if (i%width==0) {
				_y++;
			}
        }
    }
	
	function testAgainstIndex(spirit, x, y, width, quad, buffer){
		var _x = x;
        var _y = y;
		
        for(var i=1; i<=spirit.length; i++){
	
            if (spirit[i-1]!=0) {
				var sigx = _x + (i-1)%width;
				var potential = quad.retrieve({x:sigx, y:_y});
				for(var k=0; k<potential.length; k++){
					if (Math.abs(potential[k].x-sigx)<=buffer && Math.abs(potential[k].y-_y)<=buffer){
						return false;
					}
				}
			}
			
			if (i%width==0) {
				_y++;
			}
        }
		return true;
	}
	
	
	$(document).mousedown(function (e)
	{
		var container = $("#sidr");

		if (!container.is(e.target) // if the target of the click isn't the container...
			&& container.has(e.target).length === 0) // ... nor a descendant of the container
		{
			$.sidr('close', 'sidr');
		}
	});
	
	var color = d3.scale.category10();
	
	var lvl2 = [];
	var lvl3 = [];
	var lvl4 = [];
	
	function occurrences(string, substring){
		var n=0;
		var pos=0;

		while(true){
			pos=string.toLowerCase().indexOf(substring.toLowerCase(),pos);
			if(pos!=-1){ n++; pos+=substring.length;}
			else{break;}
		}
		return(n);
	}
	
	function drawWord(text, size, x, y, position, lvl){	
		var opacity;
		if (lvl == 1) opacity = 1;
		else opacity = 0;
		
		var simpleText = new Kinetic.Text({
			x: x,
			y: y+size/5,
			text: text,
			fontSize: size,
			fontFamily: 'serif',
			fill: color(position),
			opacity: opacity
		});
		
		simpleText.on('mouseover', function() {
			this.setStroke('black');
			this.setStrokeWidth(1);
			layer.draw();
		});
		
		simpleText.on('mouseout', function() {
			this.setStroke('none');
			this.setStrokeWidth(1);
			layer.draw();
		});
		
		simpleText.on('mousedown', function(event){
			if (this.attrs.opacity == 0){
				return;
			}
		
			var url = 'http://idata-a.d1.comp.nus.edu.sg:8080/sentiment/rest/worker/sentiment?';
			var tids = {tids:input[position].tids};
			var tidsString = new String(input[position].tids);
			var tweetData;
			var tno = 100; //how many tweets to retrieve, max no is 360////////////////////////////////////////
			var chr = tidsString.charAt(19*tno);
			if(chr==","){
				tidsString = tidsString.substring(0, 19*tno-1).concat(")");		
			}
			
			tids = {tids:tidsString};
			jQuery.getJSON(biclusterGetTweetsURL, tids, function(tweetData) { 
				$("#tweet-list").empty();
				
				for(var i=0; i<tweetData.length; i++){
					tweetData[i].count = occurrences(tweetData[i].tweet, text);
				}
				
				tweetData = tweetData.sort(function(a,b){return a.count<b.count ? 1 : a.count>b.count ? -1 : 0});;
				
				for(var i = 0; i<tweetData.length; i++){
					url += "tweets="+tweetData[i].tweet.replace(/.*?:\/\//g, "") + "&";
				}
				
				$.ajax({
					dataType: "json",
					url: url,
					success: function(data){
						for(var i=0; i<data.sentiment.length; i++){
							tweetData[i].sentiment = data.sentiment[i];
						}
					},
					async: false
				});
				
				for(var i=0; i<tweetData.length; i++){
					var r = new RegExp('(' + text + ')', 'gi')
					var color;
				
					if (tweetData[i].sentiment==2) color =  '#437C17';
					else if (tweetData[i].sentiment==0) color = '#FF6666';
					else color = '#666362';
					tweetData[i].tweet = tweetData[i].tweet.replace(r,"<span style=\"padding: 0; background-color:rgb(134, 134, 31); display: inline;\">$1</span>");
					$("#tweet-list").append("<li class=\"row-fluid\"><img class=\"span3\" width=\"100\" height=\"100\" src=\""+tweetData[i].profileImageUrl+"\"></img><p class=\"span1\" style=\"margin:0; height:88px; background-color:"+color+"\"></p><p class=\"span8\">"+tweetData[i].tweet+"</p></li>");
				}
				$.sidr('open', 'sidr');
			});
			
			event.stopPropagation();
		});
		
		layer.add(simpleText);
		wordList.push(simpleText);
		
		var tween = new Kinetic.Tween({
			node: simpleText, 
			duration: 0.5,
			opacity: 1
		});
		
		if (lvl == 2) lvl2.push({node:simpleText, tween:tween});
		else if (lvl == 3) lvl3.push({node:simpleText, tween:tween});
		else if (lvl == 4) lvl4.push({node:simpleText, tween:tween});
	}

    var spiritDict = {};

	function getSpirit(text, size){
        if (!!spiritDict[text+size]) return spiritDict[text+size];
		var canvas = document.createElement("canvas");
		var width = size * text.length ;
		var height = size + 7;
		canvas.width = width;
		canvas.height = height;
		var ctx = canvas.getContext("2d");
		ctx.clearRect(0, 0, width, height);
		ctx.strokeStyle = "#f00";
		ctx.font = size+"px serif";
		
		ctx.fillText(text, 0, height - 5);
		
		var pixels = ctx.getImageData(0, 0, width, height).data,
			sprite = [];
			
		for (var i = (width)*(height); --i >= 0;) sprite[i] = pixels[(i << 2) + 3];		
        spiritDict[text+size] =  sprite;
		return sprite;
	}
	
	function drawCluster(list, position){
		for (var i=0; i<list.length; i++){
			var word = list[i].name;
			var size = (5-list[i].weight)*10;
			var spirit = getSpirit(word, size);
			var j = 0, x, y;
			
			while(true){
			
				switch(position){
					case 0:
						x = track.array[j].x+270;
						y = track.array[j].y+300;
						break;
					case 1:
						x = track.array[j].x+420;
						y = track.array[j].y+300;
						break;
					case 2:
						x = track.array[j].x+300;
						y = track.array[j].y+120;
						break;
					case 3:
						x = track.array[j].x+450;
						y = track.array[j].y+120;
						break;
					case 4:
						x = track.array[j].x+300;
						y = track.array[j].y+430;
						break;
					case 5:
						x = track.array[j].x+450;
						y = track.array[j].y+430;
						break;
					case 6:
						x = track.array[j].x+150;
						y = track.array[j].y+200;
						break;
					case 7:
						x = track.array[j].x+150;
						y = track.array[j].y+350;
						break;
					case 8:
						x = track.array[j].x+550;
						y = track.array[j].y+200;
						break;
					case 9:
						x = track.array[j].x+550;
						y = track.array[j].y+350;
						break;
				}
				if (testAgainstIndex(spirit, x, y, size*word.length, quad, 3)){
					wordPosition.push({x:x, y:y, word:word, size:size, position:position});
					insertSpiritToTree(spirit, x, y, size*word.length, quad);
				
					drawWord(word, size, x, y, position, list[i].weight);
					break;
				}else{
					j++;
				}
			}
		}
	}
	
	function appear(wordsList){
		for(var i=0; i<wordsList.length; i++){
			wordsList[i].node.setOpacity(1);
			//wordsList[i].tween.play();
		}
	}
	
	function disappear(wordsList){
		for(var i=0; i<wordsList.length; i++){
			wordsList[i].node.setOpacity(0);
			/*var tween = new Kinetic.Tween({
				node: wordsList[i], 
				duration: 0.5,
				opacity: 0
			});*/
		}
	}
	
function onload(topno){
	stage = ui.stage = new Kinetic.Stage({
        container: "graph",
        width: width,
        height: height,
		draggable: true
    });
	
	layer = new Kinetic.Layer();
	
	drawCluster(input[0].tags, 0);
	drawCluster(input[1].tags, 1);
	drawCluster(input[2].tags, 2);
	drawCluster(input[3].tags, 3);
	drawCluster(input[4].tags, 4);
	drawCluster(input[5].tags, 5);
	drawCluster(input[6].tags, 6);
	drawCluster(input[7].tags, 7);
	drawCluster(input[8].tags, 8);
	drawCluster(input[9].tags, 9);
	//drawCluster(inputtest[4].tags, 4);
	stage.add(layer);
	$(stage.content).on('mousewheel', function(event) {
		event.preventDefault();
		var evt = event.originalEvent,
			mx = evt.clientX - 300 /* - canvas.offsetLeft */
			,
			my = evt.clientY /* - canvas.offsetTop */
			,
			wheel = evt.wheelDelta / 120; //n or -n
		var zoom = (ui.zoomFactor - (evt.wheelDelta < 0 ? 0.2 : 0));
		var newscale = ui.scale * zoom;
		ui.origin.x = mx / ui.scale + ui.origin.x - mx / newscale;
		ui.origin.y = my / ui.scale + ui.origin.y - my / newscale;
		
		if (newscale>1.5) appear(lvl2);
		else disappear(lvl2);
		
		if (newscale>2) appear(lvl3);
		else disappear(lvl3);
		
		if (newscale>2.5) appear(lvl4);
		else disappear(lvl4);

		ui.stage.setOffset(ui.origin.x, ui.origin.y);
		ui.stage.setScale(newscale);
		ui.stage.draw();

		ui.scale *= zoom;
	});
}




function onload_bak(topno){
	if(typeof topno == "undefined")
		topno = 10;
	var data = [];
	TG.boxid = 1;
//	TG.groupTweets = [];
	TG.groupTids = [];
	TG.showedTags = [];
	highestlevel = 4;
	groupcount = 10<input.length?10:input.length;

	fill = d3.scale.category10();

	width = window.innerWidth*0.62;
	height = window.innerHeight*0.7;
	
	centerX = width/2;
	centerY = height/2;
	radius = 400;
//	perRadius = 2*Math.PI/(groupcount-1);
	my = new Array();
	//tweetnos = [];
	
	var showedBicNo = TG.showedBicNo<input.length?TG.showedBicNo:input.length;
	for(var i=0; i<showedBicNo; i++){
		for(var j in input[i].tags)
			TG.showedTags.push(input[i].tags[j].name);
	}

	var start = topno - 10;
	var end = topno - 1;
	if((input.length-1)>=start && (input.length-1)<end)
		end = (input.length-1);
	else if ((input.length-1)<start){
		start = 0;
		end = -1;
	}
	
	for(var i=start; i<=end; i++){
		var group = topno;
		for(var j=0; j<input[i].tags.length; j++){
			var push_data = {
				text: input[i].tags[j].name,
				size: highestlevel+1-input[i].tags[j].weight,
				group: group - i
			};
			data.push(push_data);
		}
//		TG.groupTweets[group-i] = input[i].tweets;
		TG.groupTids[group-i] = input[i].tids;
		var tno = getTweetNo(input[i].tids);
		//tweetnos.push(tno);
	}
	
	console.log("here is data "+data);
	
	//-----------coverage------------
	// console.log("tweet no per bic", tweetnos);
	// if(TG.allData!=null){
		// console.log("tweetno_all", TG.allData.tweetno_all);
		// var coverage = 0;
		// for(i in tweetnos){
			// coverage += tweetnos[i];
			// tweetnos[i] = (tweetnos[i]/TG.allData.tweetno_all).toFixed(5);
		// }
		// console.log("coverage per bic", tweetnos);
		// console.log("total coverage", coverage/TG.allData.tweetno_all);
	// }
	
	
//	data.reverse();
	
	x = d3.scale.linear()
		.domain([0, width])
		.range([0-50, width-280]);
		
	y = d3.scale.linear()
		.domain([0, height])
		.range([-80, height-270]);

	zm = d3.behavior.zoom().x(x).y(y).scaleExtent([1, 8]).on("zoom", zoom);
		 
	svg = d3.select("#graph").append("svg")
		.attr("id", "svg")
		.attr("width", width)
		.attr("height", height)
		.attr("style", "")
		.append("g")
		.attr("id", "ggg")
		.attr("transform", "translate("+width/3+","+height/2+")")
		.call(zm);
				
	svg.append("rect")
		.attr("class", "overlay")
		.attr("style", "fill:rgb(240,255,240);stroke:green;stroke-width:1;")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate("+-width/3+","+-height/2+")");
		
	d3.layout.cloud().size([width, height])
		  .words(data.map(function(d) {
			return {text: d.text, size: 5 + d.size*10, group: d.group, layer: d.size};
		  }))
		  .rotate(function() { return ~~(Math.random() * 2) * 0; })////////////////rotate tags
		  .font("Impact")
		  .fontSize(function(d) { return d.size; })
		  .on("end", draw)
		  .start();
	
}//onload()


function onload2(topno){
	if(typeof topno == "undefined")
		topno = 10;
	var data = [];
	TG.boxid = 2;
//	TG.groupTweets = [];
	TG.groupTids2 = [];
	TG.showedTags2 = [];
	TG.showedCommonTags = [];
	highestlevel = 4;
	groupcount = 10<input2.length?10:input2.length;

	fill = d3.scale.category10();

	width = window.innerWidth*0.62;
	height = window.innerHeight*0.7;
	
	centerX = width/2;
	centerY = height/2;
	radius = 400;
//	perRadius = 2*Math.PI/(groupcount-1);
	my = new Array();
	//tweetnos = [];
	
	var showedBicNo = TG.showedBicNo<input2.length?TG.showedBicNo:input2.length;
	for(var i=0; i<showedBicNo; i++){
		for(var j in input2[i].tags)
			TG.showedTags2.push(input2[i].tags[j].name);
	}
	TG.showedCommonTags = intersect(TG.showedTags, TG.showedTags2);

	var start = topno - 10;
	var end = topno - 1;
	if((input2.length-1)>=start && (input2.length-1)<end)
		end = (input2.length-1);
	else if ((input2.length-1)<start){
		start = 0;
		end = -1;
	}
	
	for(var i=start; i<=end; i++){
		var group = topno;
		for(var j=0; j<input2[i].tags.length; j++){
			var push_data = {
				text: input2[i].tags[j].name,
				size: highestlevel+1-input2[i].tags[j].weight,
				group: group - i
			};
			data.push(push_data);
		}
//		TG.groupTweets[group-i] = input2[i].tweets;
		TG.groupTids2[group-i] = input2[i].tids;
		var tno = getTweetNo(input2[i].tids);
		//tweetnos.push(tno);
	}
	
	//-----------coverage------------
	// console.log("tweet no per bic", tweetnos);
	// if(TG.allData!=null){
		// console.log("tweetno_all", TG.allData.tweetno_all);
		// var coverage = 0;
		// for(i in tweetnos){
			// coverage += tweetnos[i];
			// tweetnos[i] = (tweetnos[i]/TG.allData.tweetno_all).toFixed(5);
		// }
		// console.log("coverage per bic", tweetnos);
		// console.log("total coverage", coverage/TG.allData.tweetno_all);
	// }
	
	
//	data.reverse();
	
	x2 = d3.scale.linear()
		.domain([0, width])
		.range([0-50, width-280]);
		
	y2 = d3.scale.linear()
		.domain([0, height])
		.range([-80, height-270]);

	zm2 = d3.behavior.zoom().x(x2).y(y2).scaleExtent([1, 8]).on("zoom", zoom2);
		 
	svg = d3.select("#graph2").append("svg")
		.attr("id", "svg2")
		.attr("width", width)
		.attr("height", height)
		.attr("style", "")
		.append("g")
		.attr("id", "ggg2")
		.attr("transform", "translate("+width/3+","+height/2+")")
		.call(zm2);
				
	svg.append("rect")
		.attr("class", "overlay")
		.attr("style", "fill:rgb(240,255,240);stroke:green;stroke-width:1;")
		.attr("width", width)
		.attr("height", height)
		.attr("transform", "translate("+-width/3+","+-height/2+")");
		
	d3.layout.cloud().size([width, height])
		  .words(data.map(function(d) {
			return {text: d.text, size: 5 + d.size*10, group: d.group, layer: d.size};
		  }))
		  .rotate(function() { return ~~(Math.random() * 2) * 0; })////////////////rotate tags
		  .font("Impact")
		  .fontSize(function(d) { return d.size; })
		  .on("end", draw)
		  .start();
		  
	//show common tags in italic 
	var alltext = d3.select("#svg").selectAll("text")[0];
	//$(".tagtxt").attr("style", "font-style:italic");
	for(var i in alltext){
		var tag = alltext[i].textContent;
		if(TG.showedCommonTags.indexOf(tag)!=-1){
			var oldstyle = $(alltext[i]).attr("style");
			var newstyle = oldstyle+"font-style:italic;text-decoration:underline;";
			$(alltext[i]).attr("style", newstyle);
		}
	}
	var alltext = d3.select("#svg2").selectAll("text")[0];
	for(var i in alltext){
		var tag = alltext[i].textContent;
		if(TG.showedCommonTags.indexOf(tag)!=-1){
			var oldstyle = $(alltext[i]).attr("style");
			var newstyle = oldstyle+"font-style:italic;text-decoration:underline;";
			$(alltext[i]).attr("style", newstyle);
		}	
	}
	
}//onload2()

	
 
function draw(words) {
	words.reverse();//make the first level topmost
	
	var cha_tmp = svg.selectAll("text")
		.data(words)
		.enter().append("text")
		.attr("class", function(){if(TG.boxid==1) return "tagtxt"; else if(TG.boxid==2) return "tagtxt2";})
		.style("font-size", function(d) { return d.size + "px"; })
		.style("font-family", "Impact")
		.style("fill", function(d, i) {return fill(d.group); })
		.style("opacity", function(d){ if (d.layer < highestlevel) return "0";} )
		// .style("position", "absolute")
		// .style("z-index", function(d){ if (d.weight < highestlevel) return "1"; else return "2"})
		//.css("z-index", function(d){ if (d.weight < highestlevel) return "1"; else return "2"})
		.attr("text-anchor", "middle")
		.attr("transform", transform)
		.text(function(d) { return d.text; })
		.on("mouseover", function(d) {
				d3.select(this).style("stroke", "black");
		})
		.on("mouseout", function(d) {       
			d3.select(this).style("stroke", "none");  
		})
		.on("click", function(d) {
			var tagclicked = d3.select(this).text();
			//if visiable
			if(d3.select(this).style("opacity")!=0){
				var classtype = d3.select(this).attr("class");
				var boxid = -1;
				if(classtype=="tagtxt")
					boxid = 1;
				else if(classtype=="tagtxt2")
					boxid = 2;
				var childrenNo = $('#tweetbar').children().length;
				if(childrenNo==0)
					fetchTweets(d.group, tagclicked, boxid);
				else if(childrenNo!=0){
					if(TG.currentGroup===d.group && TG.currentBoxid==boxid)
						removeTweets();
					else{
						removeTweets();
						fetchTweets(d.group, tagclicked, boxid);
					}
				}
			}
		});
	
	if(TG.boxid==1){
		cha_tmp.attr("transform", transform);
		cha = cha_tmp;
	}else if(TG.boxid==2){
		cha_tmp.attr("transform", transform2);
		cha2 = cha_tmp;
	}
}
  

function zoom() {
	//circle.attr("transform", transform);
	cha.attr("transform", transform);
}

function zoom2() {
	//circle.attr("transform", transform);
	cha2.attr("transform", transform2);
}

function transform(d) {
	//console.log(xz(d.x));
	//console.log(d3.event.scale);
	var alltxt = d3.select("#svg").selectAll(".tagtxt");
	alltxt.transition()
		.duration(500)
		.style("opacity", function(d){
			if ((highestlevel-d.layer)*0.25+1<=zm.scale()) return "1";
			else return "0";
		});
		return "translate(" + x(d.x) + "," + y(d.y) + ")rotate(" + d.rotate + ")";
}

function transform2(d) {
	//console.log(xz(d.x));
	//console.log(d3.event.scale);
	var alltxt2 = d3.select("#svg2").selectAll(".tagtxt2");
	alltxt2.transition()
		.duration(500)
		.style("opacity", function(d){
			if ((highestlevel-d.layer)*0.25+1<=zm2.scale()) return "1";
			else return "0";
		});
		return "translate(" + x2(d.x) + "," + y2(d.y) + ")rotate(" + d.rotate + ")";
}

function fetchTweets(group, tagclicked, boxid) {
	
	if (typeof TG.currentGroup!="undefined" || TG.currentGroup === group) return;
    TG.currentGroup = group;
	TG.currentBoxid = boxid;
	var mytids;
	if(boxid==1)
		mytids = TG.groupTids[group];
	else if(boxid==2)
		mytids = TG.groupTids2[group];
	var tno = 100; //how many tweets to retrieve, max no is 360////////////////////////////////////////
	var chr = mytids.charAt(19*tno);
	if(chr==","){
		mytids = mytids.substring(0, 19*tno-1).concat(")");
	}
	
	var tids = {tids:mytids};
	var tweetdata;
	showIndicator();
	jQuery.getJSON(biclusterGetTweetsURL, tids, function(tweetdata) { showTweets(tweetdata, tagclicked); removeIndicator();});
}

function showTweets(tweets, tagclicked) {
	tweets.sort(function(a,b){
		var aval = a.tweet.toLowerCase().indexOf(tagclicked);
		var bval = b.tweet.toLowerCase().indexOf(tagclicked);
		if(aval!=-1)
			aval=0;
		if(bval!=-1)
			bval=0;
		return bval-aval;
	});
    
    $('#tweetbar').css('height', tweets.length*67+"px");

    $('#tweetbar').append(tweets.map(createTwitterSidebar));
    $('#tweetbar').slideDown(500);
    
    // Open the selected sidebar
    // $(".sidebarSubItem").parent().children(".sidebarItemText").each(function() {
            // if($(this).text() === pt.name) {
                // $(this).parent().children(".sidebarSubItem").slideDown('fast');
            // } else {
                // $(this).parent().children(".sidebarSubItem").slideUp('fast');
            // }
    // });

}

function removeTweets(){
//	$('.textLabel').remove();
    $('#tweetbar .tweetItem').slideUp(50);
    $('#tweetbar .tweetItem').remove();
    $('#tweetbar').slideUp(50);
	$('#tweetbar').css('height', "0px");
//	$('#tweetbar').children().remove();
	TG.currentGroup = undefined;
}

// $(function() {
	// window.scrollTo(1000,1000);
// });

function showTopTen(){
	$('#top10').attr('disabled','disabled');
	$('#top20').removeAttr('disabled');
	$('#top30').removeAttr('disabled');
	removeTweets();
	d3.select("#svg").remove();
	d3.select("#svg2").remove();
	onload(10);
	if(TG.regionNum==2)
		onload2(10);
}

function showTopTwenty(){
	$('#top20').attr('disabled','disabled');
	$('#top10').removeAttr('disabled');
	$('#top30').removeAttr('disabled');
	removeTweets();
	d3.select("#svg").remove();
	d3.select("#svg2").remove();
	onload(20);
	if(TG.regionNum==2)
		onload2(20);
}

function showTopThirty(){
	$('#top30').attr('disabled','disabled');
	$('#top20').removeAttr('disabled');
	$('#top10').removeAttr('disabled');
	removeTweets();
	d3.select("#svg").remove();
	d3.select("#svg2").remove();
	onload(30);
	if(TG.regionNum==2)
		onload2(30);
}

function getTweetNo(tids){
	var no = 0;
	for(var i=0; i<tids.length; i++){
		if(tids[i]==',')
			no++;
	}
	no++;
	return no;
}


//return new array storing common values in a and b, without duplicates
function intersect(a, b) {
    var d = {};
    var results = [];
    for (var i = 0; i < b.length; i++) {
        d[b[i]] = true;
    }
    for (var j = 0; j < a.length; j++) {
        if (d[a[j]]) 
            results.push(a[j]);
    }
	results = jQuery.unique(results);
    return results;
}

