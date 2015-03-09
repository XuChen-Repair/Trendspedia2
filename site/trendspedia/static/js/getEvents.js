$(document).ready(function() {
	$("#event").on("click", function(){
	  $(".analysis-page").hide();
	  $("#eventpage").show();
	});
		var params = parseURL(document.URL);
		console.log(window.location.pathname);
		if(window.location.pathname == "/home/en/") {
		var eventsUrl = "../../twitter/getEvents/" + params.params.title.toLowerCase();
		$("#eventTable").empty();
		$.get(eventsUrl, function( data ) {
		console.log("events data = ", data);	
                /*for(var i=0; i<data.length; i++){
				var base_dt = new Date('2013-3-25');
				var dt = parseInt(data[i].split(":")[0]);
				base_dt.setDate(base_dt.getDate() + dt);
				var dateMsg = base_dt.getDate()+'/'+ (base_dt.getMonth()+1) +'/'+base_dt.getFullYear();
				$("#eventTable").append("<tr><td><p>"+dateMsg+"</p></td><td><div class='wordcloud' style='border:1px solid #f00;height:150px;width:300px;'>");
				
				var tags = data[i].split(":")[1];
				tags = tags.split("|");
				for(var j=0; j<tags.length-1; j++){
					var tag = tags[j].replace("(","").replace(")","");
					var word = tag.split(" ")[0];
					var count = tag.split(" ")[1];
					$(".wordcloud:last").append('<span data-weight="'+parseInt(count)/10+'">'+word+'</span>');
				}
				$("#eventTable").append("</div></td></tr>");
			}*/
for (var i = 0; i < data.length; i++) {
  dateMsg = data[i][0];
  //console.log(dateMsg);
  $("#eventTable").append("<tr><td><p>"+dateMsg+"</p></td><td><div id='wordcloud" + String(i)  + "' style='border:1px solid #f00;height:230px;width:350px;'>");
  var largestCount = parseFloat(data[i][2][0][1]);
  
  for (var j = 0; j < data[i][2].length; j++) {
    word = data[i][2][j][0];
    count = data[i][2][j][1];
    //console.log(word, count);
    //var normalizedCount = count * 1.0 / largestCount;
   // $("#wordcloud" + String(i)).append('<span data-weight="'+parseInt(count)/10+'">'+word+'</span>');
   $("#wordcloud" + String(i)).append('<span data-weight="'+ (100 - j * 9)  +'">'+word+'</span>'); 
  }
  $("#eventTable").append("</div></td></tr>");

}
for(var i = 0; i < data.length; i++) {
  //var elementClassName = "wordcloud" + String(i);
  //document.getElementsByClassName(elementClassName)[0].awesomeCloud(settings);	
  var classSelector = "#wordcloud" + String(i);
  //console.log(classSelector);
  $(classSelector).awesomeCloud(settings);
			//$( ".wordcloud" + String(i)).awesomeCloud(settings);
}
		});
		var settings = {
			"size" : {
				"grid" : 6
			},
			"options" : {
				"color" : "random-dark",
				"printMultiplier" : 3
			},
			"font" : "Futura, Helvetica, sans-serif",
			"shape" : "square"
		}
		//$(".analysis-page").hide();
		//$("#eventpage").show();
	//});
}
});



function parseURL(url) {
    var a =  document.createElement('a');
    a.href = url;
    return {
        source: url,
        protocol: a.protocol.replace(':',''),
        host: a.hostname,
        port: a.port,
        query: a.search,
        params: (function(){
            var ret = {},
                seg = a.search.replace(/^\?/,'').split('&'),
                len = seg.length, i = 0, s;
            for (;i<len;i++) {
                if (!seg[i]) { continue; }
                s = seg[i].split('=');
                ret[s[0]] = s[1];
            }
            return ret;
        })(),
        file: (a.pathname.match(/\/([^\/?#]+)$/i) || [,''])[1],
        hash: a.hash.replace('#',''),
        path: a.pathname.replace(/^([^\/])/,'/$1'),
        relative: (a.href.match(/tps?:\/\/[^\/]+(.+)/) || [,''])[1],
        segments: a.pathname.replace(/^\//,'').split('/')
    };
}
