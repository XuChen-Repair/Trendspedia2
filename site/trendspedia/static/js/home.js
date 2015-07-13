/**
 * @author SONG QIYUE
 */
var hotCount = 0;

$(document).ready(function() {
	$('.carousel').carousel({
		interval : 4000
	});

	// Parse the URL and get title, handle for single parameter only === hack
	//var api = "http://idata-a.d1.comp.nus.edu.sg:8000/getWiki";
	//var api = "http://idata-a.d1.comp.nus.edu.sg/getWiki";
	var api = "/getWiki";
	var def = "?title=Main_Page";
	var finalAPI = "";
	var query = "";
	var para = window.location.search;
	var pathname = window.location.pathname;
	var pageTitle = "";
	var pageID = "";
	var lang = "";
	var since_id = "";
	var hotMaterials = new Array();
	var MaterialCount = 0;
	var materialLoadAmount = 50;
	//var hotCount = 0;

	// Determine language, default is en
	lang = pathname.split("/")[2];
	if (lang === undefined || lang === "" || lang === null) {
		lang = "en";
	}
	api += ("/" + lang + "/");
	// Add the lang to getWiki api

	//console.log('l is '+lang);
	if (para != "") {
		finalAPI = api + para;
		query = para.substring('7', para.length);
		if (query == "Main_Page") {
			query = "";
		}
	} else {
		finalAPI = api + def;
	}
	if (query == "") {
		$('#tweets').hide();
		$('#wikiArticle').removeClass('span9').addClass('span12');
		//$('#head-nav').hide();
	}

	/* Twitter stuff */
	var globalTweetCount = 0;
	var newTweets = 0;
	var AllTweets = new Array();

	//DY
	var getTweets = function(query) {
		console.log("getTweets " + query);
		$.getJSON('/twitter/getTweetsfromDB?query=' + query + '&pageID=' + pageID, function(data) {
			if (data.length > 0) {
				AllTweets = data.reverse();
				var tweetsfromDB = [];

				for (var i = 0; i < AllTweets.length; i++) {
					var tweetfromDB = {};
					var splitter = AllTweets[i].text.split(" ");
					var output = "";
					for (var j = 0; j < splitter.length; j++) {
						if (startsWith(splitter[j], "http://")) {
							output += ("<a href='" + splitter[j] + "'>" + splitter[j] + "</a> ");
						} else {
							output += (splitter[j] + " ");
						}
					}
					tweetfromDB.content = output;
					tweetfromDB.image_url = AllTweets[i].profileImageUrl;
					tweetfromDB.createTime = AllTweets[i].createdAt.$date;
					var localTime = new Date(tweetfromDB.createTime);
					var correctTime = new Date(localTime.getTime() + 28800 * 1000);
					tweetfromDB.createTime = correctTime.toString().replace("GMT+0800 (SGT)", "");
					tweetfromDB.name = AllTweets[i].name;
					tweetfromDB.id = AllTweets[i]._id;

					tweetsfromDB.push(tweetfromDB);
				}

				for (var i = 0; i < tweetsfromDB.length; i++) {
					$('#scroller').prepend('<li>' + '<img src = "' + tweetsfromDB[i].image_url + '">&nbsp;' + '<span>' + tweetsfromDB[i].name + ': </span>' + '<p style = "font-weight:100;font-size:12px;">' + tweetsfromDB[i].content + '</p>' + '<div style = "font-size:14px;">' + tweetsfromDB[i].createTime + '</div>' + '</li>');
				}
			} else {
				//If no tweets then call again in a short while so the crawler has time to index
				setTimeout(function(){
					getTweets(query);
				}, 10000);
			}
		});
	}
	var getTwitter = function(query) {
		$.getJSON('../../twitter/api/search/?q=' + query + '&pageID=' + pageID + "&result_type=recent&count=100", function(data) {
			var tweets = [];
			console.log("first batch of RAW new tweets:");
			console.log(data);
			$.each(data.statuses, function(index, element) {
				// Post raw data
				tweets[index] = {};
				if (index == "0") {
					since_id = element.id;
				}
				// Convert link to anchor
				var splitter = element.text.split(" ");
				var output = "";
				for (var j = 0; j < splitter.length; j++) {
					if (startsWith(splitter[j], "http://")) {
						output += ("<a href='" + splitter[j] + "'>" + splitter[j] + "</a> ");
					} else {
						output += (splitter[j] + " ");
					}
				}
				tweets[index].content = output;
				tweets[index].image_url = element.user.profile_image_url;
				tweets[index].createTime = element.created_at.replace('+0000', '');
				var localTime = new Date(tweets[index].createTime);
				var correctTime = new Date(localTime.getTime() + 28800 * 1000);
				tweets[index].createTime = correctTime.toString().replace("GMT+0800 (SGT)", "");
				tweets[index].name = element.user.name;
				tweets[index].id = element.id_str;
			});
			/*render new tweets into the tweets list*/
			for (var i = tweets.length - 1; i >= 0; i--) {
				if (AllTweets.length >= 100) {
					AllTweets.splice(0, 1);
				}
				AllTweets[AllTweets.length] = tweets[i];
			}
			for (var i = 0; i < AllTweets.length; i++) {
				$('#scroller').prepend('<li>' + '<img src = "' + AllTweets[i].image_url + '">&nbsp;' + '<span>' + AllTweets[i].name + ': </span>' + '<p style = "font-weight:100;font-size:12px;">' + AllTweets[i].content + '</p>' + '<div style = "font-size:14px;">' + AllTweets[i].createTime + '</div>' + '</li>');
			}
		});
	}

	var getFollowingTwitter = function(query) {
		// console.log("getFollowingTwitter " + query);
		$.getJSON('../../twitter/getTweetsfromDB?query=' + query + '&pageID=' + pageID + "&result_type=recent&count=20&since_id=" + since_id, function(data) {
			var tweets = [];
			// console.log("following batch of RAW new tweets:");
			// console.log(data);
			var proceed = true;
			$.each(data, function(index, element) {
				if(element._id == AllTweets[AllTweets.length - 1].id){
					proceed = false;
					// console.log("Ignoring all tweets from " + element.text)
				}
				if(proceed){
					tweets[index] = {};
					if (index == "0") {
						since_id = element.id;
					}
					// Convert link to anchor
					var splitter = element.text.split(" ");
					var output = "";
					for (var j = 0; j < splitter.length; j++) {
						if (startsWith(splitter[j], "http://")) {
							output += ("<a href='" + splitter[j] + "'>" + splitter[j] + "</a> ");
						} else {
							output += (splitter[j] + " ");
						}
					}
					tweets[index].content = output;
					tweets[index].image_url = element.profileImageUrl;
					tweets[index].createTime = element.createdAt.$date;
					var localTime = new Date(tweets[index].createTime);
					var correctTime = new Date(localTime.getTime() + 28800 * 1000);
					tweets[index].createTime = correctTime.toString().replace("GMT+0800 (SGT)", "");
					tweets[index].name = element.name;
					tweets[index].id = element._id;
					}
			});
			/*render new tweets into the tweets list*/
			loadMore(tweets);
		});
	}
	// var getFollowingTwitter = function(query) {
	// 	$.getJSON('../../twitter/getTweetsfromDB?query=' + query + '&pageID=' + pageID + "&result_type=recent&count=20&since_id=" + since_id, function(data) {
	// 		var tweets = [];
	// 		console.log("following batch of RAW new tweets:");
	// 		console.log(data);
	// 		var proceed = true;
	// 		$.each(data.statuses, function(index, element) {
	// 			if(element.id_str == AllTweets[AllTweets.length - 1].id){
	// 				proceed = false;
	// 			}
	// 			if(proceed){
	// 				tweets[index] = {};
	// 				if (index == "0") {
	// 					since_id = element.id;
	// 				}
	// 				// Convert link to anchor
	// 				var splitter = element.text.split(" ");
	// 				var output = "";
	// 				for (var j = 0; j < splitter.length; j++) {
	// 					if (startsWith(splitter[j], "http://")) {
	// 						output += ("<a href='" + splitter[j] + "'>" + splitter[j] + "</a> ");
	// 					} else {
	// 						output += (splitter[j] + " ");
	// 					}
	// 				}
	// 				tweets[index].content = output;
	// 				tweets[index].image_url = element.user.profile_image_url;
	// 				tweets[index].createTime = element.created_at.replace('+0000', '');
	// 				var localTime = new Date(tweets[index].createTime);
	// 				var correctTime = new Date(localTime.getTime() + 28800 * 1000);
	// 				tweets[index].createTime = correctTime.toString().replace("GMT+0800 (SGT)", "");
	// 				tweets[index].name = element.user.name;
	// 				tweets[index].id = element.id_str;
	// 				}
	// 		});
	// 		/*render new tweets into the tweets list*/
	// 		loadMore(tweets);
	// 	});
	// }
	// Dump the content of wiki pages using the URL
	var loadCounter = 0;
	var loadWiki = function(finalAPI) {
		if (loadCounter > 10) {
			$("#contentArea").html("Error loading. There might be no such page");
			$(".mw-body").css("margin-left", 0);
			return;
		}
		// console.log(finalAPI);
		$.getJSON(finalAPI, function(data) {
			// Update html
			console.log("wiki object:");
			console.log(data);
			$("#contentArea").html(data.text);
			$('.container-fluid').show();
			pageID = data.pageID;
			callGenerateTagCloud(pageID);
			pageTitle = data.title;
			$('#loadMore').click(function() {
				$('#loadMore').text('No New Tweets');
				newTweets = 0;
				$("#scroller li").remove();
				for (var i = 0; i < AllTweets.length; i++) {
					$('#scroller').prepend('<li>' + '<img src = "' + AllTweets[i].image_url + '">&nbsp;' + '<span>' + AllTweets[i].name + ': </span>' + '<p style = "font-weight:100;font-size:12px;">' + AllTweets[i].content + '</p>' + '<div style = "font-size:14px;">' + AllTweets[i].createTime + '</div>' + '</li>');
				}
			});
			// Update query for Twitter call
			query = pageTitle;

			/*load hot materials*/
			$.getJSON("../../twitter/hotMaterials?pageID=" + pageID, function(data) {
				// console.log("hot meterials === ", data);
				hotMaterials = data.hotMaterials;
				while(MaterialCount < materialLoadAmount){
					if(MaterialCount <= hotMaterials.length - 1){
						presentMaterialsContent(hotMaterials[MaterialCount]);
						MaterialCount++;
					}else{
						break;
					}
				}
			});
			$(".mw-body").css("margin-left", 0);
			if(query == "Main Page"){
				//$('#trendNav').hide();
				$("#articleNav").hide();
				$("#analysisNav").hide();
			}
			if (query != "" && query != "Main Page") {
				//$('#trendNav').show();
				$("#articleNav").show();
				$("#analysisNav").show();
				$('#wikiArticle').removeClass('span12').addClass('span9');
				$('#tweets').show();
				//$('#head-nav').show();

				//DY
				getTweets(query);

				//warning: testing
				initBubbles(pageTitle);
				setInterval(function() {
					getFollowingTwitter(query);
				}, 30000);
			} else {
				$('#firstHeading').html("<span dir='auto'>Trendspedia</span>");
			}
		}).error(function(e) {
			loadCounter++;
			console.log("Error! Try to load again");
			loadWiki(finalAPI);
		});
	};
	// StartWith for JS string
	var startsWith = function(source, target) {
		return source.indexOf(target) == 0;
	}
	var loadMore = function(tweets) {
		for (var i = tweets.length - 1; i >= 0; i--) {
			newTweets++;
			if (AllTweets.length > 100) {
				AllTweets.splice(0, 1);
			}
			AllTweets[AllTweets.length] = tweets[i];
		}
		if (tweets.length != 0) {
			$("#loadMore").text(newTweets + " New Tweets");
		}
	}
	var Enter = function() {
		var key = $('#wikiSearch input').val();
		getSearchResult(key);
	}
	var getSearchResult = function(keyword) {
		if (keyword.replace(" ", "") != "") {
			var lang = "";
			// Determine language, default is en
			lang = window.location.pathname.split("/")[2];
			if (lang === undefined || lang === "" || lang === null) {
				lang = "en";
			}
			var api = "/getSearchResult/" + lang + "/?query=" + encodeURIComponent(keyword);
			$.getJSON(api, function(data) {
				if (data.status == "OK") {
					$('#tweets').removeClass('span3');
					$('#tweets').hide();
					$('#wikiArticle').removeClass('span9').addClass('span12');
					if (data.results.length > 0) {
						$('.tabbable').hide();
						var resultTemplate = "<h1>Results</h1>" + "<ul>" + "{{#results}}" + "<li>" + "<b>Text</b>: {{text}} </br>" + "<b>Description</b>: {{description}} </br>" + "<a href={{url}}>Click here</a></br>" + "</li>" + "{{/results}}";
						var html = Mustache.to_html(resultTemplate, data);
						$('#searchResult').html(html);
						$('#searchResult').show();
						$('#contentArea').hide();
						$('#graphpage').hide();
						$('#tagDetailPage').hide();
					} else {
						$('.tabbable').hide();
						var noResult = "<h1>No result found</h1>";
						$('#searchResult').html(noResult);
						$('#searchResult').show();
					}
				}
			});
		}
	}
	var getRelatedWikiResult = function(keyword) {
		if (keyword.replace(" ", "") != "") {
			var lang = "";
			// Determine language, default is en
			lang = window.location.pathname.split("/")[2];
			if (lang === undefined || lang === "" || lang === null) {
				lang = "en";
			}
			var api = "/getSearchResult/" + lang + "/?query=" + encodeURIComponent(keyword);
			$.getJSON(api, function(data) {
				if (data.status == "OK") {
					if (data.results.length > 0) {
						var resultTemplate = "<h1>" + keyword + "</h1>" + "<ul>" + "{{#results}}" + "<li>" + "<b>Text</b>: {{text}} </br>" + "<b>Description</b>: {{description}} </br>" + "<a href={{url}}>Click here</a></br>" + "</li>" + "{{/results}}";
						var html = Mustache.to_html(resultTemplate, data);
						$('#wikipage').html(html);
						$('#wikipage').show();
						$("#wikipage").css('height', $("#contentArea").height());
					} else {
						var noResult = "<h1>No result found</h1>";
						$('#wikipage').html(noResult);
						$('#wikipage').show();
						$("#wikipage").css('height', $("#contentArea").height());
					}
				}
			});
		}
	}

	//DY
	var showGraph = function(pageID, pageTitle) {
		handleDeleteButton();
		// call function initializing the graph (in vis helper.js)
		if (nodes !== undefined) {
			showGraphRedraw();
			console.log("redraw");
		} else {
			showGraphDraw(pageID, pageTitle);
		}
	}

	//loading the page
	loadWiki(finalAPI);

	$('#wikiSearch').submit(function() {
		Enter();
		return false;
	});

	$("#brand").click(function() {
		window.location = "../../home";
	});

	$("#loadMaterials").click(function() {
		var limit = MaterialCount + materialLoadAmount;
		while (MaterialCount < limit){
			if(MaterialCount <= hotMaterials.length - 1){
				presentMaterialsContent(hotMaterials[MaterialCount]);
				MaterialCount++;
			}else
			{
				break;
			}
		}
	});

	$("#article").click(function() {
		$("#AnalysisArea").hide();
		$("#contentArea").show();
		return false;
	});

	$(".AnalysisPage").click(function(){
		$("#AnalysisArea").show();
		$("#contentArea").hide();
		return false;
	});

	$('#hot').click(function() {
		$('#tweets').show();
		$('#wikiArticle').addClass('span9').removeClass('span12');
		$('#hotpage').show();
		$('#summarypage').hide();
		$('#wikipage').hide();
		$('#bubblepage').hide();
		$('#eventpage').hide();
		$("#graphpage").hide();
		$('#tagDetailPage').hide();
		return false;
	});

	$('#wikis').click(function() {
		$('#tweets').show();
		$('#wikiArticle').addClass('span9').removeClass('span12');
		$('#hotpage').hide();
		$('#summarypage').hide();
		$('#wikipage').show();
		$('#bubblepage').hide();
		$('#eventpage').hide();
		$("#graphpage").hide();
		$('#tagDetailPage').hide();
		getRelatedWikiResult(query);
		return false;
	});

	$('#summary').click(function() {
		$('#tweets').show();
		$('#wikiArticle').addClass('span9').removeClass('span12');
		$('#hotpage').hide();
		$('#summarypage').show();
		$('#wikipage').hide();
		$('#bubblepage').hide();
		$('#eventpage').hide();
		$("#graphpage").hide();
		$('#tagDetailPage').hide();
		return false;
	});

	$("#bubble").click(function(){
		$('#tweets').show();
		$('#wikiArticle').addClass('span9').removeClass('span12');
		$('#hotpage').hide();
    $('#summarypage').hide();
    $('#wikipage').hide();
		$('#bubblepage').show();
		$('#eventpage').hide();
		$("#graphpage").hide();
		$('#tagDetailPage').hide();
		return false;
	});

	$("#event").click(function(){
		$('#tweets').show();
		$('#wikiArticle').addClass('span9').removeClass('span12');
		$('#hotpage').hide();
    $('#summarypage').hide();
    $('#wikipage').hide();
		$('#bubblepage').hide();
		$('#eventpage').show();
		$("#graphpage").hide();
		$('#tagDetailPage').hide();
		return false;
	});

	$("#graphQueryNavBarTab").click(function(){
		$('#tweets').show();
		$('#wikiArticle').addClass('span9').removeClass('span12');
		$('#hotpage').hide();
    $('#summarypage').hide();
    $('#wikipage').hide();
		$('#bubblepage').hide();
		$('#eventpage').hide();
		$("#graphpage").show();
		$('#tagDetailPage').hide();
		showGraph(pageID, pageTitle);
		return false;
	});

	$('#tagDetailNavBarTab').click(function(){
		$('#tweets').hide();
		// $('#wikiArticle').hide();
		$('#wikiArticle').addClass('span12').removeClass('span9');
		$('#hotpage').hide();
    $('#summarypage').hide();
    $('#wikipage').hide();
		$('#bubblepage').hide();
		$('#eventpage').hide();
		$("#graphpage").hide();
		$('#tagDetailPage').show();
		initTagDetailMap();
		return false;
	})

	if ($('#username').html() == "") {
		$('#username').html('Trendspedia');
	}

	$('#scroller').css('height', $(document).height() - 250);
	$("#contentArea").css('height', $(document).height() - 150);
	$("#hot-Materials").css('height', $(document).height() - 200);
});


function requestTitle(site, callback) {

	// If no url was passed, exit.
	if (!site) {
		alert('No site was passed.');
		return false;
	}
	// Take the provided url, and add it to a YQL query. Make sure you encode it!
	var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select content from html where url="' + site + '" and xpath = "//title"') + '&format=xml&callback=?';

	// Request that YSQL string, and run a callback function.
	// Pass a defined function to prevent cache-busting.
	$.getJSON(yql, cbFunc);

	function cbFunc(data) {
		//console.log(data);
		// If we have something to work with...
		if (data.results[0]) {
			// Strip out all script tags, for security reasons.
			// BE VERY CAREFUL. This helps, but we should do more.
			//data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

			// If the user passed a callback, and it
			// is a function, call it, and send through the data var.
			if ( typeof callback === 'function') {
				callback(data);
			}
		}
		// Else, Maybe we requested a site that doesn't exist, and nothing returned.
		else {
			//console.log("no title");
			callback("");
		}
	}
}

function requestDescription(site, callback) {

	// If no url was passed, exit.
	if (!site) {
		alert('No site was passed.');
		return false;
	}
	// Take the provided url, and add it to a YQL query. Make sure you encode it!
	var yql = 'http://query.yahooapis.com/v1/public/yql?q=' + encodeURIComponent('select * from html where url="' + site + '" and xpath = "//meta" and name="description"') + '&format=xml&callback=?';

	// Request that YSQL string, and run a callback function.
	// Pass a defined function to prevent cache-busting.
	$.getJSON(yql, cbFunc);

	function cbFunc(data) {
		//console.log(data);
		// If we have something to work with...
		if (data.results[0]) {
			// Strip out all script tags, for security reasons.
			// BE VERY CAREFUL. This helps, but we should do more.
			//data = data.results[0].replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '');

			// If the user passed a callback, and it
			// is a function, call it, and send through the data var.
			if ( typeof callback === 'function') {
				callback(data);
			}
		}
		// Else, Maybe we requested a site that doesn't exist, and nothing returned.
		else {
			///console.log("no description");
			callback("");
		}
	}
}

function presentMaterialsContent(hotMaterial){
	hotCount++;
	imagesHtml = "";
	var length = hotMaterial.images.length;
	//tempfix for images showing up weird
	if(length > 4)
		length = 4;
	for(var i = 0; i < length;i++){
		if(i%4 == 0){
			imagesHtml = imagesHtml + "<div class = 'row-fluid' style = 'margin-top:10px;'>";
		}
		imagesHtml = imagesHtml + '<div class = "span3"><a href = "'+hotMaterial.images[i]+'"><img src = "' + hotMaterial.images[i] + '" style = "height:120px;width = 198px"/></a></div>';
		if(i%4 == 3){
			imagesHtml = imagesHtml + "</div>";
		}
	}
	imagesHtml = "<div id = '"+hotMaterial.tweetID+"'>"+
						imagesHtml+
					"</div>";
	if(length == 0)
		imagesHtml = "";
	//remove empty lines
	if(hotMaterial.title == null || hotMaterial.description == null)
		return;
	var shortDescription = hotMaterial.description;
	if(hotMaterial.description.length > 500){
		shortDescription = hotMaterial.description.substring(0,500) + "...";
	}
	//tempfix for hoturl
	var seeMoreFunc = 'function(){ $("hot' + hotCount + '").css("max-height":"100em"); }';
	$("#hot-Materials").append("<dt id='hot" + hotCount + "style='font-weight:normal !important'>"+
					"<h4 style='font-weight:bold !important'><a href = '"+hotMaterial.url+"'>"+hotCount + ": " + hotMaterial.title+"</a></h4>"+
                                        "<p class='bigdesc hiddenContent'>"+hotMaterial.description+"</p>"+
                                        "<p class='smalldesc'>"+shortDescription+"</p>"+
          "<a class='hu-seemore'>See More</a><br>"+
					imagesHtml + "<br>"+
                                   "</dt>");

}

$(function(){
	$('#hot-Materials').on('click', '.hu-seemore', function(){
		if($(this).text() == "See More"){
			$(this).siblings('.bigdesc').removeClass('hiddenContent');
			$(this).siblings('.smalldesc').addClass('hiddenContent');
			$(this).text('See Less');
		}else{
			$(this).siblings('.bigdesc').addClass('hiddenContent');
			$(this).siblings('.smalldesc').removeClass('hiddenContent');
			$(this).text('See More');
		}
	});
});

function initTagDetailMap(){
	$('#tagDetailPage').css('height', parseInt($('body').css('height')) - 40);
	$('#tagDetailPage').css('width', parseInt($('body').css('width')));
	tweetMap = new google.maps.Map(document.getElementById('map-canvas'), {
		zoom: 11,
		center: {lat: -1.3144615, lng: 103.8188962},
		mapTypeId: "satellite"
	});
	for(var i=0; i<100; i++){
		var lat = Math.random()*120 - 60;
		var lng = Math.random()*360 - 180;
		randomCircle = new google.maps.Circle({
			strokeColor: '#FF0000',
			strokeOpacity: 0.8,
			strokeWeight: 2,
			fillColor: '#FF0000',
			fillOpacity: 0.35,
			map: tweetMap,
			center: new google.maps.LatLng(lat, lng),
			radius: 400*400,
		})
	}
}
google.maps.event.addDomListener(window, 'load', initTagDetailMap);
/*function presentMaterialsContent(hotMaterial){
	var url = hotMaterial.url;
	requestTitle(url, function(data) {
		if (data != "" && data.results.length != 0) {
			var title = data.results[0].replace(/<title>/g, "").replace(/<\/title>/g, "").replace(/<title\/>/g,"");
			if(title != ""){
				console.log("title is:"+title);
				requestDescription(url, function(desc) {
					if (desc != "" && desc.results.length != 0) {
						console.log("description is:"+desc);
						hotCount++;
						var d = desc.results[0].replace('<meta content=', '').replace('name="description"/>', '');
						if(d != ""){
							if(d.length > 250){
								d = d.substring(0,250)+"...";
							}
							$("#hot-Materials").append("<dt>"+
								"<font>"+hotCount+".</font><a href = '"+url+"'>"+title+"</a>"+
								"<br>"+
								"<p>"+d+"</p>"+
								"<br>"+
								"<div id = '"+hotMaterial.tweetID+"' class = 'row-fluid'></div>"+
							"</dt>");
						}else{
							$("#hot-Materials").append("<dt>"+
								"<font>"+hotCount+".</font><a href = '"+url+"'>"+title+"</a>"+
								"<br>"+
								"<div id = '"+hotMaterial.tweetID+"' class = 'row-fluid'></div>"+
							"</dt>");
						}
						var count = 0;
						if(hotMaterial.images.length < 4){
							count = hotMaterial.images.length;
						}else{
							count = 4;
						}
						for(var i = 0;i < count;i++){
							$("#"+hotMaterial.tweetID).append('<div class = "span3"><a href = "'+hotMaterial.images[i].url+'"><img src = "' + hotMaterial.images[i].url + '" style = "height:120px;width = 198px"/></a></div>');
						}
						$("#hot-Materials dt").last().append("<br>");
					} else {
						console.log("cannot get the description");
					}
				});
			}else{
				console.log("title is empty");
			}
		}else{
			console.log("cannot get the title");
		}
	});
}*/
