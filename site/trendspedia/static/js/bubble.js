﻿//function bubbling(){
var root, texts;
root = typeof exports !== "undefined" && exports !== null ? exports : this;

var height = window.innerHeight-50;
var width = height+100;
var AWAYDIS =Math.max(width, height) / 3;
var center = {
    x : width / 2,
    y : height / 2,
    group : -1,
    scale : -1
};
var CATEGORIES=[];//["location","entities","adjective","adverb","actions","time","people"];
var GROUP=8;
var maxlevel, minlevel, scale;
var model,plot;
var current_page="Zhuzhou";
var x = d3.scale.linear()
        .domain([0, width])
        .range([0, width]);

var y = d3.scale.linear()
        .domain([0, height])
        .range([0,height]);
var querytags;
var BubbleEntity=function()
{
    var model={};
    var data=[];
    model.data=function(_)
    {
        if (!arguments.length)
            return data;
        else
            data=_;
        return model;

    };

    var focus=[];
    model.focus=function(_)
    {
        if (!arguments.length)
            return focus;
        else
            data=_;
        return model;
    };
    return model;
};



var Bubbleforce=function()
{
    var collisionPadding = 4;
    var bforce={};

    var groupCenter={};


    bforce.init=function()
    {
        var r = width/3;
        var HALF= Math.PI/GROUP;
        for (var i=0;i<GROUP;i++) {
            var c={};
            var th=HALF*i*2;
            c.x=center.x+r*Math.cos(th);
            c.y=center.y+r*Math.sin(th);
            groupCenter[CATEGORIES[i]]=c;
        }

    };




    bforce.focusIn = function(foc, d) {
        return d.tag;
//             return foc.some(function(d2) {
//                 return d2.group == d.group;
//             });
    };
    bforce.gravity = function(alpha) {
        var ax, ay, cx, cy;
        var focus=model.focus();
//            if (focus.length == 0) {
//                cx = center.x;
//                cy = center.y;
//            } else {
//                cx = cy = 0;
//                focus.forEach(function(d) {
//                    cx += d.x;
//                    cy += d.y;
//                });
//                cx = cx / focus.length;
//                cy = cy / focus.length;
//            }
        cx = center.x;
        cy = center.y;
        ax = alpha;
        ay = alpha;
        return function(d) {
            dx = cx - d.x;
            dy = cy - d.y;

            if (d.lock == true) {

                //not move
//                	return;
                //move quickly to the center;
                d.x += dx * ax;//*3
                d.y += dy * ay;//*3
            } else {
                var distance = Math.sqrt(dx * dx + dy * dy);
                if (bforce.focusIn(focus, d) || focus.length == 0) {
                    d.x += dx * ax;
                    d.y += dy * ay;
                } else {
                    if (distance < plot.distance()*(3.0-d.force)) {
                        d.x -= dx * ax;
                        d.y -= dy * ay;
                    } else if (distance>plot.distance()*(4.0-d.force)) {
                        d.x += dx * ax;
                        d.y += dy * ay;
                    }
                }
            }
        };
    };

    bforce.group=function(alpha)
    {
        return function(d)
        {
            var g=d.group;
            c=groupCenter[g];
            d.x += (c.x - d.x) * alpha;
            d.y += (c.y - d.y) * alpha;
        };
    };
    bforce.constrain = function()
    {

        var HALF= Math.PI/GROUP;

        return function(d) {
            var th=HALF*2*d.group;
            var r=width/2*Math.random();
            var dth=HALF*(1-2*Math.random());
            d.x=center.x+Math.cos(th+dth)*r;
            d.y=center.y+Math.sin(th+dth)*r;
            //     	d.x=d.x<0?0:d.x;
            //		d.x=d.x>width?width:d.x;
            //		d.y=d.y<0?0:d.x;
            // 		return d.y=d.y>height?height:d.y;
        };
    };
    bforce.clustering = function(alpha) {
        return function(d) {
            if (d.name==current_page) {
                d.ok=1;

            }
            return model.data().forEach(function(d2) {

                var distance, maxDistance, moveX, moveY, x, y;
                if (d !== d2 && d.group == d2.group) {
                    x = d.x - d2.x;
                    y = d.y - d2.y;
                    distance = Math.sqrt(x * x + y * y);
                    maxDistance = d.forceR + d2.forceR + collisionPadding;
                    if (distance > maxDistance) {
                        distance = (distance - maxDistance) / distance * alpha;
                        moveX = x * distance;
                        moveY = y * distance;
                        //            if (!d.lock) {
                        d.x -= moveX;
                        d.y -= moveY;
                        //           }
                        //           if (!d2.lock) {
                        d2.x += moveX;
                        d2.y += moveY;
//                            }
                    }

                    return;
                }
            });
        };
    };
    bforce.collide = function(jitter) {
        return function(d) {
//                if (d.lock == true)
//                    return;
            return model.data().forEach(function(d2) {
                var distance, minDistance, moveX, moveY, x, y;
                if (d !== d2) {
                    x = d.x - d2.x;
                    y = d.y - d2.y;
                    distance = Math.sqrt(x * x + y * y);
                    minDistance = d.forceR + d2.forceR + collisionPadding;
                    if (distance < minDistance) {
                        distance = (distance - minDistance) / distance * jitter;
                        moveX = x * distance;
                        moveY = y * distance;
//                            if (!d.lock) {
                        d.x -= moveX;
                        d.y -= moveY;
//                            }
//                            if (!d2.lock) {
                        d2.x += moveX;
                        d2.y += moveY;
//                            }
                    }
                    return;

                }
            });
        };
    };
    return bforce;
};


var BubbleEvent=function()
{
    var bEvent={};
    var mouseTarget;
    var groupScale={};
    bEvent.init= function()
    {
        for (var i=0;i<GROUP;i++) {

            groupScale[CATEGORIES[i]]=1;
        }
    };
    bEvent.filter = function filter()
    {

        if (Math.abs(old_scale - d3.event.scale) < 0.001) return;

        old_scale=scale;
        if (d3.event.scale > old_scale) {
            scale++;
            scale = scale > maxlevel ? maxlevel : scale;
        } else {
            scale--;
            scale = scale < minlevel ? minlevel : scale;
        }
        old_scale = d3.event.scale;

        console.log(scale + " " + old_scale);
        if (old_scale != scale)
            plot.update();

    };
    bEvent.svgMove =function svgMove()
    {
        var dx=d3.event.dx;
        var dy=d3.event.dy;
        var data=model.data();
        lockAll(data);
        data.forEach(function(d) {
            d.px+=dx;
            d.py+=dy;
        });
    };
    bEvent.svgDragend=function svgDragend()
    {
        console.log("svgdraggedn");
        model.data().forEach(function(d) {

            if (!d.lock&&d.fixed)d.fixed &= ~2;//!!!!!!!!!!!!
        });
    };
    var old_scale = 1;
    bEvent.zoomend= function()
    {
        //active(model.data());
        console.log("zoom end");
    };
    bEvent.zoomstart=function()
    {

        //lockAll(model.data());
    };
    bEvent.svgzoom=function()
    {
        console.log("svg zoom");

        plot.force().resume();
        d3.select("#bubble-nodes").attr("transform", "translate(" + d3.event.translate + ")"+"scale(" + d3.event.scale + ")");


    };
    bEvent.dbclick_backgroud=function()
    {

        console.log("background dbclick");
        var focus=model.focus();
        if (focus.length) {
            update();
        }
    };
    bEvent.bubblezoom=function()
    {
//        	arguments.callee.translate=d3.event.translate;
//        	arguments.callee.scale=d3.event.scale;
//       	scale=d3.event.scale;
//        	plot.update();
        if (d3.event.scale!=scale) {
            scale=d3.event.scale;

            plot.update(d3.event.sourceEvent.target);

        }

        console.log("bubble zoom: "+scale);
//          d3.select("#bubble-nodes").attr("transform", "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
//        	var data=model.data();
//        	var th=0.1;
//        	if(d3.event.scale-old_scale<0)
//        		th=-th;;
//
//        	var dx=d3.event.translate[0]-old_translate[0];
//        	var dy=d3.event.translate[1]-old_translate[1];
//        	console.log(d3.event.scale);
//        	console.log(d3.event.translate);
//        	data.forEach(function(d) {
//        		d.px+=th*dx;
//        		d.py+=th*dy;
//        	});
//        	console.log(th);
//        	if(old_scale!=scale)
//        		plot.update();
//
//        	old_scale=d3.event.scale;
//        	old_translate=d3.event.translate;
    };
//        bEvent.zoom.scale=1;
//        bEvent.zoom.translate=[0,0];
    var MAXSCALE=10;
    bEvent.mousewheel = function()
    {
        var g=d3.event.target.__data__.group;
        var old_scale=groupScale[g];
        var th=0.1;
        if (d3.event.wheelDelta<0)
            th=-th;
        var scale=old_scale+th;
        if (scale<1) {
            scale=1;
            th=0;
        }
        if (scale>MAXSCALE) {
            scale=MAXSCALE;
        };
        groupScale[g]=scale;
        plot.update(groupScale);

//        	var data=model.data();
//        	console.log(d3.event.scale);
//        	lockAll(data);
        //var pos=d3.mouses(document.getElementById("vis"));
//        	var x=d3.event.pageX;
//        	var y=d3.event.pageY;

//        	plot.force().stop();
        //d3.select("#test").html("zoom test " + c.group );
//        	data.forEach(function(d) {
//        		d.px+=th*(d.x-x);
//        		d.py+=th*(d.y-y);
//        	});
//
//        	if(old_scale!=scale)
//        		plot.update();
//        	d3.selectAll(".bubble-node").attr("transform",function(d){
//        		return "translate("+(d.x+th(d.x-x))+","+(d.y+th*(d.y-y))+")";
//        	});
//        	d3.selectAll(".bubble-label").attr("transform",function(d){
//        		return "translate("+x(d.x)+","+y(d.y)+")";
//        	});
        console.log(scale);
//        	plot.force().start();
//        	d3.event.preventDefault();
    };

    function freeAll(data) {
        data.forEach(function(d) {
            d.lock = false;
            d.tag=false;
//                if(d.fixed)d.fixed &= ~2;//!!!!!!!!!!!!
        });

    };
    function active(data)
    {
        data.forEach(function(d) {
            if (!d.lock&&d.fixed)d.fixed &=~2;
        });
    }
    function lockAll(data) {
        data.forEach(function(d) {

            if (!d.fixed)d.fixed |= 2;;//!!!!!!!!!!!!
        });
    };

    function update()
    {
        var focus=model.focus();

        if (focus.length==0)return;
        querytags=current_page;
        for (var i=0;i<focus.length;i++) {

            if (focus[i].name!=current_page)
                querytags+="|"+focus[i].name;

        }

//        	focus.forEach(function(d){
//        		querytags+="+"+d.name;
//        	});
        console.log("querytags: ",querytags);
        //	$.post("api/wiki/tagtag?page="+current_page+"&tags="+querytags,plot.updateData);
        d3.select("#status").html("<h3> Loading . . . </h3>");

        d3.json("http://trendspedia.com:8080/bubbles/api/wiki/pagetags?titles="+querytags,plot.updateData);
        
        plot.update();
    }
    function stateChange(d)
    {
        var focus=model.focus();
        if (!d.lock) {
            d.lock=true;
//      		  d.fixed |=2;
            focus.push(d);
//      		  location.hash="#"+d.group+"_"+d.name;
        } else {
            focus.slice(focus.indexOf(d),1);
            d.lock=false;
//    		  d.fixed &=~2;
        }

    }
    bEvent.dbclick = function()
    {
        d3.event.preventDefault();

        console.log("dbclick");

    };
    bEvent.dragStart= function dragStart()
    {

        console.log("start");
        var focus=model.focus();
        var evt=d3.event;
        if (evt.sourceEvent)evt=evt.sourceEvent;
        if (evt==null)return;



//      evt.preventDefault();

        var touches=evt.changedTouches;
        var d;
        if (touches) {
            d=touches[0].target.__data__;
        }
        else {
            d=evt.target.__data__;
            mouseTarget=d;
        }

        if (evt.ctrlKey) {

            return console.log("url: "+encodeURIComponent(d.name));
        }

        if (!focus.length||evt.shiftKey||touches) {
            stateChange(d);

        } else {

            if (d.lock) {
                freeAll(model.data());
                focus.splice(0,focus.length);
            } else {
                freeAll(model.data());
                focus.splice(0,focus.length);
                stateChange(d);
            }

        }

//	    d.fixed |=2;
//	    d3.select("#test").html("start "+focus.length);
        d3.select(".stat").append("div").attr("class","focused_page").append("a").attr("xlink:href", function() {
            return "#"+d.name;
        }).text(function() {
            return d.name;
        }).on("click",topage);


    };
    function topage()
    {
        var d=d3.event.target;

    }
    var gravity=0.7,group;
    bEvent.dragEnd=function dragEnd()
    {
        console.log("end");
        var focus=model.focus();
        var evt=d3.event.sourceEvent;
//        	if(evt.sourceEvent)evt=evt.sourceEvent;
//
//        	if(evt==null)return;
//
//        	evt.preventDefault();
//        	var touches=evt.changedTouches;
//    		var d;
//	        if(touches)
//	        {
//	          	d=touches[0].target.__data__;
//	        }
//	        else
//        	{
//        		d=mouseTarget;
//
//        	}
//        	if(d.fixed&&!d.lock)
//        	{
//        		d.fixed &=~2;
//        	}
        /*
         var touches=evt.changedTouches;

         for(var i=0;i<touches.length;i++)
         {
         	var d=touches[i].target.__data__;
         	if(!d.lock)
         	{
         		d.fixed |= 2;
         		focus.push(d);
         		d.lock=true;
         	}
         }
         */

        //free
//	    d.fixed &=~2;
        //set gravity force 0
//      if(focus.length)
//	        plot.gravity(0.1);
//	    else
//	        plot.gravity(0.0);

        plot.force().resume();
        d3.select("#test").html("end "+focus.length);
        //force.resume();
        // var query="pageTitle=";
        // focus.forEach(function(d){ query+="&"+d;});
        // d3.json("api/wiki/pagelinks?"+query,plot.updateData);

        if (!focus.length) {
            gravity=plot.gravity();
            group=plot.group();
//            	d3.select("#gravity_input").attr("value",0);
//            	d3.select("#gravity_output").text("0.0");
            plot.gravity(0.0);

        } else {

            if (plot.gravity()!=gravity) {

                plot.gravity(gravity);
//            		d3.select("#gravity_input").attr("value",parseInt(gravity*100));
//                	d3.select("#gravity_output").text(gravity);
            }


        }
        if (!evt.shiftKey&&focus.length) {
            update();
        } else {

            model.data().forEach(function(d) {
                d.tag=false;
            });
            d3.select("#status").html("Focus: "+current_page);
            plot.update();

        }






    };
    var movecnt=0;
    bEvent.dragMove=function dragMove()
    {
        var force=plot.force();
        var evt=d3.event;
        if (evt.sourceEvent)evt=evt.sourceEvent;
        if (evt==null)return;
        evt.preventDefault();
        var touches=evt.changedTouches;
        if (!touches)
        {

            var d=mouseTarget;
            //var d=evt.target.__data__;
            d.px = d3.event.x;
            d.py = d3.event.y;
            force.resume();
            return;
        }
        var pos=d3.touches(document.getElementById("vis"));

        for (var i=0;i<touches.length;i++)
        {
            var touch=touches[i];
            var d=touch.target.__data__;
            d.px = pos[i][0];//d3.event.x;
            d.py = pos[i][1];//d3.event.y;
            //d.px=d.x+d3.event.dx;//touch.pageX;
            //d.py=d.y+d3.event.dy;//touch.pageY;
            /*
            if(!d.lock)
            {
            	focus.push(d);
            	d.lock=true;
            	d.fixed &=~2;
            }
            */
        }
        force.resume();


        // console.log("move: "+d3.event.x+","+d3.event.y);
        d3.select("#test").html("move "+touches.length);
        // update();

    };

    bEvent.clear = function clear() {
        //return location.replace("#");
    };
    bEvent.click = function click(d) {

        location.replace("#" + encodeURIComponent(idValue(d)));
        // return d3.event.preventDefault();
    };
    bEvent.mouseover = function mouseover(d) {
        return node.classed("bubble-hover", function(p) {
            return p === d;
        });
    };
    bEvent.mouseout = function mouseout(d) {
        return node.classed("bubble-hover", false);
    };


    return bEvent;
};
var Bubbles = function() {

    var nodes_group, labels_group, filtered;
    var bforce=Bubbleforce();
    var bEvent=BubbleEvent();

    var cluster = 0.0,
        gravity = 0.7,
        group = 0.0,
        distance=100; ///initial distance to the central bubble
    var data = [];
    var node = null;
    var label = null;
    var margin = {
        top : 0,
        right: 0,
        bottom : 0,
        left : 0
    };

    var fill = d3.scale.category10();
    var maxRadius = 50;
    var log10 = Math.log(10);
    var colormap={
        "people" : "#ff69b4",//pink
        "location" : "#377eb8",//blue
        "organization" : "#4daf4a",//green
        "event" : "#984ea3",//purple
        "entity" : "#ffa500",///orange, not used?
        "null" : "#ffffbb", //yellow
        "focus" : "#ff0000" //red
    };
    var rScale = d3.scale.linear().range([0, maxRadius]);
//  var rScale=function(r)
//  {
//      return r*maxRadius;
//  };
//  rScale=function(d){return d;};

    var rValue = function(d) {

//      return tmp = parseInt(5 + d.value * 100 );
//      return d.value;
        return d.value;
    };


    function idValue(d) {
        return d.name;
    };
    function textValue(d) {
        return d.name;//.substring(0,Math.min(15,d.name.length));
    };

    var minCollisionRadius = 12;
    var jitter = 0.5;

    function transformData(rawData) {
        rawData.forEach(function(d) {

            return rawData.sort(function() {
                return 0.5 - Math.random();
            });
        });
        return rawData;
    };

    function tick(e) {

        var gravityAlpha = e.alpha * gravity;
        var clusterAlpha = e.alpha * cluster;
        var groupAlpha=e.alpha*group;

        node.each(bforce.group(groupAlpha))
        .each(bforce.gravity(gravityAlpha))
        .each(bforce.collide(jitter))
        .each(bforce.clustering(clusterAlpha));

        node.attr("transform", function(d) {

            return "translate(" + d.x + "," + d.y + ")";
//          return "translate(" + x(d.x) + "," + y(d.y) + ")";
        });
//      var labels=node.selectAll(".bubble-label")
//          .style("left", function(d) {
//              return ((margin.left+d.x ) - d.dx / 2) + "px";
//          }).style("top", function(d) {
//              return ((margin.top+d.y ) - d.dy / 2) + "px";
//          });

    };


    var force = d3.layout.force().gravity(0).charge(0).size([width, height]).on("tick", tick);
    var focusOn=null;
    function connectEvents(d) {
        //if(!drag)
        var drag=force.drag()//d3.behavior.drag()
            .origin(function(d) {
                return d;
            })
            .on("dragstart",bEvent.dragStart)
            //.on("drag",bEvent.dragMove)
            .on("dragend",bEvent.dragEnd);
            
//			var zoom=d3.behavior.zoom().x(x).y(y).scaleExtent([1, 2])
//				.on("zoom", bEvent.zoom)
//				.on("zoomend",bEvent.zoomend)
//				.on("zoom.dbclick",null)
//				.on("zoom",bEvent.bubblezoom);
//				;



        d.on("mousewheel",bEvent.mousewheel)
        .on("dblclick",bEvent.dbclick)
        .on("mouseover",function(f) {

            d3.select(this).select(".bubble-label").style("fill","#f00");
            if (d3.event.shiftKey)return;


            if (!focusOn||focusOn.name!=f.name) {

                focusOn=f;
                console.log("moveover: "+f.name);
                d3.json("http://trendspedia.com:8080/bubbles/api/wiki/pagelinks?title="+focusOn.name+"&center="+querytags, function(root) {

                    if (root==null)return;
                    var list=root.links;
                    if (list) {
                        var map={};
                        list.forEach(function(d) {
                            map[d]=true;
                        });
                        d3.selectAll("circle").attr("stroke-width","2px").attr("stroke", function(d) {
                            if (map[d.name])
                                return "#00f"; //blue
                            else if (d.lock==true)
                                return "#ff0000";
                            else
                                return null;

                        });
                    }
                });
            }
        }).on("mouseout",function() {
            d3.select(this).select(".bubble-label").style("fill","#000");
            if (d3.event.shiftKey)return;
            focusOn=null;
            if (!focusOn) {
                d3.selectAll("circle").attr("stroke", function(d) {
                    return nodeStroke(d);

                });
                focusOn=null;
            }


        });
        d.call(drag);//.call(zoom);

    };
    var chart = function(selection) {
        bforce.init();
        bEvent.init();
        return selection.each(function(rawData) {
            var maxDomainValue, svg, svgEnter;
            data = rawData;//transformData(rawData);
            maxlevel = d3.max(data, function(d) {
                return d.force;
            });
            minlevel = d3.min(data, function(d) {
                return d.force;
            });
            scale = 1;
            maxDomainValue = d3.max(data, function(d) {
                return rValue(d);
            });
            rScale.domain([0, maxDomainValue]);
            svg = d3.select(this).append("svg")
                  .attr("width", width + margin.left + margin.right)
                  .attr("height", height + margin.top + margin.bottom);

            // svgEnter = svg.enter().append("svg");
            // svg.call(d3.behavior.drag().on("drag",bEvent.svgMove).on("dragend", bEvent.svgDragend));

            //  svg.on("zoom", bEvent.zoom);
            svg.append("rect")
                .attr("id", "bubble-background")
                .attr("width", width)
                .attr("height", height)
                .on("click", bEvent.clear)
                .call(d3.behavior.zoom().x(x).y(y).scaleExtent([-1, 5]).on("zoom", bEvent.svgzoom))//
                .on("dblclick",bEvent.dbclick_backgroud);
            nodes_group = svg.append("g").attr("id", "bubble-nodes").attr("transform", "translate(" + margin.left + "," + margin.top + ")");

//          labels_group = d3.select(this).selectAll("#bubble-labels").data([data]).enter().append("div").attr("id", "bubble-labels");
            update();
//          hashchange();

            //nodes_group.call(connectEvents);
            //labels_group.call(connectEvents);


//                return d3.select(window).on("hashchange", hashchange);
        });
    };



    function hashchange() {
        var id;
        id = decodeURIComponent(location.hash.substring(1)).trim();
        return updateActive(id);
    };
    function updateActive() {

        var focus=model.focus();
//        	node.classed("bubble-selected", function(d) {
//                return id === idValue(d);
//            });
//
//
        //	   d3.select("#status").html("<p3>"+tags+"</p3>");
        if (focus.length > 0) {
            var tags="<h3>Focused Pages:  "+"<span class=\"active\">"+focus[0].name+"</span>";
            for (var i=1;i<focus.length;i++) {
                tags+=" & "+"<span class=\"active\">"+focus[i].name+"</span>";
            }
            tags+="</h3>";
            return d3.select("#status").html(tags);
        } else {
            return d3.select("#status").html("<h3>Bubble: <span class=\"active\">"+current_page+"</span></h3>");
        }
    };

    function nodeStroke(d) {
        if (d.lock == undefined || d.lock == false) {
            return null;
        } else if (d.linked) {
            return "#00f";
        } else {
            return "#ff0000";
        }

    };
    function nodeFill(d)
    {
//        	if(d.lock){
//        		return colormap["focus"];
//
//        	}
        //return fill(d.group);
        return colormap[d.group]?colormap[d.group]:"#ffffff";

    }
    function isFocused(name)
    {
        return model.focus().some(function(d) {
            return d.name==name;
        });

    }
    function isContained(col,name)
    {
        return col.some(function(d) {
            return d.name==name;
        });
    }
    function updateData(root,center)
    {

//        	var tags=root.tags;
//        	var map={};
//        	console.log(tags.length);
//        	tags.forEach(function(d){
//        		map[d]=1;
//        	});
//
//        	data.forEach(function(d){
//        		d.tag=false;
//        		if(map[d.name]!=undefined){
//        			d.tag=true;
//        		}
//
//        	});
//        	var data = [];
        var leftForce=3.0;
        var dataB=data.filter(function(d) {
            if (d.lock) {
                return true;
            } else if (d.force>leftForce) {
                d.force-=1.0;
                d.tag=false;
                return true;
            }
            return false;
        });
        CATEGORIES=[];
        var input = root.catelist;
        for (var i = 0; i < input.length; i++) {
            CATEGORIES.push(input[i].category);
            var cat=input[i].list;
            for (var j=0;j<cat.length;j++) {

                var push_data = {
                name : cat[j].pageTitle,/////big bug use i instead of j, then only display four(category number) bubbles; oh, my god;
                group : input[i].category,
                value : cat[j].tf,
                force : parseInt(cat[j].weight*100)/100.0,///cannot use d.weight because d3 has its inner weight prop.
                };
                if (!isContained(dataB,push_data.name))
                    dataB.push(push_data);
            };
        }
//            model.focus().forEach(function(d){
//            	data.push(d);
//            });
        data=dataB;
        data.forEach(function(d) {

            d.tag=false;
            if (d.force>2.5) {
                d.tag=true;
            }
//	    		if(arguments>1&&center==d.name){
////	    			push_data.fix |=2;
//                	push_data.lock=true;
//                	push_data.x=center.x;
//					push_data.y=center.y;
//	    		}
        });
        GROUP=CATEGORIES.length;
        bforce.init();

        updateActive();
        update();

    };
    
    //update
    var SHOWR=13;
    var FILTER_VALUE=0.01;
    var TOP=200;
    
    function update() {

        data.sort(function(d1,d2) {
            if (d1.force<d2.force)
                return 1;
            else return -1;
        });
        var top=0;
        filtered = data.filter(function(d) {
//          return d.force>FILTER_VALUE;
            return top++<TOP;
        });
        filtered.forEach(function(d, i) {
            d.showR = rScale(rValue(d));
            return d.forceR = Math.max(minCollisionRadius,d.showR);
        });
        model.data(filtered);
        force
        .nodes(filtered)
        .start();

        filtered= filtered.filter(function(d) {
            return d.force*scale>FILTER_VALUE;
        });
//            updateNodes();
//            return updateLabels();

        return updateBubbles();
    };

    function updateBubbles() {

        nodes_group.selectAll(".bubble-node").remove();
        node = nodes_group.selectAll(".bubble-node").data(filtered, function(d) {
            return idValue(d);
        });
        node.exit().remove();
        var nodeEnter=node.enter().append("a").attr("xlink:href", function(d) {
            return "#" + (encodeURIComponent(idValue(d)));
        }).attr("class", "bubble-node")
                      .call(connectEvents);


        nodeEnter.append("circle").attr("r", function(d) {//
            return d.showR>10?d.showR:10; //make sure min radius of a bubble is 10
        }).attr("stroke", function(d) {
            return nodeStroke(d);
        }).attr("stroke-width","3")
        .attr("fill", function(d) {
            return nodeFill(d);
        });

        var label=nodeEnter.append("g").attr("class","bubble-label")
        .attr("width",function(d) {
            return d.showR*2;
        })
        .attr("height",function(d) {
            return d.showR*2;
        })
                  ;
        label.append("text").attr("class", "bubble-label-name").text(function(d) {
            return textValue(d);
        });

        ///comment the following to hide the PageRank value in each bubble
//      label.append("text").attr("class", "bubble-label-value").text(function(d) {
//          return parseInt(d.force*100)/100.0;
//      }).attr("y",function(d) {
//          return Math.max(8, 2+rScale(rValue(d) / 2));
//      });


        label.style("font-size", function(d) {
            return Math.max(8, rScale(rValue(d) / 2)) + "px";
        }).style("width", function(d) {
            return 2.5 * rScale(rValue(d)) + "px";
        }).style("fill",function(d) {
            return "#000000";
        }).style("text-anchor","middle");

//            label.append("span").text(function(d) {
//                return textValue(d);
//            }).each(function(d) {
//                return d.dx = Math.max(2.5 * rScale(rValue(d)), this.getBoundingClientRect().width);
//            }).remove();
//            label.style("width", function(d) {
//                return d.dx + "px";
//            });
//            return label.each(function(d) {
//                return d.dy = this.getBoundingClientRect().height;
//            });
//            hashchange();
    };

    chart.update=function(groupScale)
    {
        data=model.data();

//    	  if(arguments.length){
//    		  var current_group=target.__data__.group;
//    		  data.forEach(function(d, i) {
//    			  	if(d.group==current_group)
//    			  		d.showR = scale*rScale(rValue(d));
//    	              return d.forceR = Math.max(minCollisionRadius,d.showR);
//    	          });
//    	  }

        force.nodes(data)
            .start();

        if (arguments.length) {
            filtered= data.filter(function(d) {
                return d.force*groupScale[d.group]>FILTER_VALUE;
            });
        }

//          updateNodes();
//          return updateLabels();
        updateBubbles();
    };

    chart.updateData=function(_)
    {
        return updateData(_);
    };
    chart.force = function(_) {
        if (!arguments.length) {
            return force;
        }
        force = _;
        return chart;
    };

    chart.jitter = function(_) {
        if (!arguments.length) {
            return jitter;
        }
        jitter = _;
        force.start();
        return chart;
    };
    chart.cluster = function(_) {
        if (!arguments.length) {
            return cluster;
        }
        cluster = _;
        force.start();
        return chart;
    };
    chart.gravity = function(_) {
        if (!arguments.length) {
            return gravity;
        }
        gravity = _;
        force.resume();
        return chart;
    };
    chart.group = function(_) {
        if (!arguments.length) {
            return group;
        }
        group = _;

        force.start();
        return chart;
    };
    chart.distance = function(_)
    {
        if (!arguments.length) {
            return distance;
        }
        distance = _;
        force.resume();
        return chart;
    };
    chart.height = function(_) {
        if (!arguments.length) {
            return height;
        }
        height = _;
        return chart;
    };
    chart.width = function(_) {
        if (!arguments.length) {
            return width;
        }
        width = _;
        return chart;
    };
    chart.r = function(_) {
        if (!arguments.length) {
            return rValue;
        }
        rValue = _;
        return chart;
    };

    return chart;
};

root.plotData = function(selector, data, plot) {
    return d3.select(selector).datum(data).call(plot);
};
var stat_width=300;
function other_initial()
{
    d3.select(".stat").append("rect")
        .attr("class","stat-background")
        .attr("width",stat_width).attr("height",500)
        .style("stroke",'none')
        .style("fill","#DBE8FF");

    d3.select("#distance").on("input", function() {
        return plot.distance(parseFloat(this.output.value));
    });
    d3.select("#gravity").on("input", function() {
        return plot.gravity(parseFloat(this.output.value));
    });
    $("#group").on("input",function() {
        return plot.group(parseFloat(this.output.value));
    });
    d3.select("#display").style("display","none");
    $("#details").fadeOut();
    $("#history").fadeOut();


//       d3.select("#bubble-nodes").on("keydown",function(e){
//    	   var key=e;
//    	   console.log("key pressed");
//       });
//        $("document").keyup(function(e){
//
//        });
    $("#tools .show-control").click(function() {

        var history=$("#history");
        var widget=$(".show-control");
        if (history.is(':visible')) {
            history.fadeOut();
            widget.text("Show");
        } else {
            history.fadeIn();
            widget.text("Hide");
        }
//        	$("#history").fadeIn();
//        	$(".show-control").text("Hide");
    });
}


//warning: testing
function initBubbles(pageTitle) {
    current_page = pageTitle;
    var display, key, text;
    model=BubbleEntity();
    plot = Bubbles();
    if (location.hash.length>2) {
        current_page=decodeURIComponent(location.hash.substring(1)).trim();
    }
//  else
//      location.hash="#"+current_page;

    d3.select("#status").html("<h3>Home: <span class=\"active\">"+current_page+"</span></h3>");
    querytags=current_page;

    display = function(root) {
        console.log("returned from: ", "bubble java servlet");
        var data = [];
        var input = root.catelist;
        console.log("catelist===", root.catelist);
        var log10 = Math.log(10);

        for (var i = 0; i < input.length; i++) {
            CATEGORIES.push(input[i].category);
            var cat=input[i].list;
            for (var j=0;j<cat.length;j++) {
                var push_data = {
                    name : cat[j].pageTitle,
                    group : input[i].category,
                    force : parseInt(cat[j].weight*100)/100.0,
                    value : cat[j].tf
                };
                data.push(push_data);

            }
        }
        data.forEach(function(d) {

            d.tag=false;
            if (d.force>2.5) {
                d.tag=true;
            }
            if (current_page==d.name) {
                d.lock=true;
                //d.value=20;
                model.focus().push(d);
            }
        });
        GROUP=CATEGORIES.length;
        return d3.select("#vis").datum(data).call(plot);

    }; //display

    other_initial();
    //return d3.json("http://127.0.0.1:8080/bubbles/api/wiki/pagetags?titles="+pageTitle, display);
    return d3.json("http://trendspedia.com:8080/bubbles/api/wiki/pagetags?titles="+pageTitle, display);
}

