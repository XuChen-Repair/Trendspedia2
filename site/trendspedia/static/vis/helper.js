/*
TODOs: 
when main canvas are stablized, focus on central node.
after node deleted from the right bar, refresh the main canvas to update the color.
on main canvas, seperate select/undelect function from click to right click.
on right click the main canvas, set the popup relative to the click position.

future TODOs:
on main canvas, when double click, collapse the node.

*/

/* 
node represent a wikipedia page, node-id being page_id
directed edge showing the pagelink relationship, edge id being a string with format: fromId.toString() + "to" + toId.toString()
nodes.childrenShown: -1 children completely hidden, 0 children partially hidden, 1 children all shown.
nodes.hasChildren: undefined before querying children. After querying for children from DB, set to 1 if have children and 0 if not.
*/

var nodes, edges, network;

var highlightActive = false;

var colorSet = {
    "highlight": {
        "border": "rgba(43,124,234,1)",
        "background" : "rgba(135,202,233,1)"
    },
    "original": {
        "border": "rgba(135,202,233,1)",
        "background" : "rgba(135,202,233,1)"
    },
    "2ndDegreeChild": {
        "border": "rgba(150,150,150,0.75)",
        "background" : "rgba(150,150,150,0.75)"
    },
    "unselected": {
        "border": "rgba(250,250,250,0.75)",
        "background" : "rgba(250,250,250,0.75)"
    },
    "selected": {
        "border": "rgba(70, 255, 28, 1)",
        "background" : "rgba(70, 255, 28, 1)"
    }
};

var options = {
    edges:{
        arrows: 'to'
    },
    physics:{
        enabled: true,
        barnesHut: {
            gravitationalConstant: -3000,
            centralGravity: 0.25,
            springLength: 150,
            springConstant: 0.15,
            damping: 0.6,
            avoidOverlap: 0
        },
        maxVelocity: 50,
        minVelocity: 0.2,
        solver: 'barnesHut',
        stabilization: {
            enabled: true,
            iterations: 1000,
            updateInterval: 100,
            onlyDynamicEdges: false,
            fit: true
        },
        timestep: 0.5
    }
}

// User selected nodes
var selectedNodesArray = [];

// convenience method to stringify a JSON object
function toJSONString(obj) {
	return JSON.stringify(obj, null, 4);
}

// return if a node's children is alreay loaded. boolean returned.
function isWithChildren(nodeId) {
	return nodes.get(nodeId)["hasChildren"] !== undefined;
}

// get children from database
// call python script. get children of a node as array of nodes
function getChildren(nodeId, callback) {
    var resp = null;
    $.ajax({
        type: "GET",
        // async: false,
        url: "/vis/getAllPLs?pageID=" + nodeId.toString(), 
        success: function( data ) {
            var nodesToReturn = [];
            var pagelinks = JSON.parse(data);
            var nodeToUpdate = nodes.get(nodeId);
            if (pagelinks.length > 0) {
                nodeToUpdate["hasChildren"] = 1;
                for (var i = 0; i < pagelinks.length; i++) {
                    pagelink = pagelinks[i]
                    nodeToReturn = {
                        id: pagelink[0],
                        label: pagelink[1]
                    };
                    nodesToReturn.push(nodeToReturn);
                }
            } else {
                nodeToUpdate["hasChildren"] = 0;
            }
            nodes.update(nodeToUpdate);
            resp = nodesToReturn;
            callback(resp);
            return;
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log(errorThrown);
            callback([]);
        }
    });
}

// add children nodes as well as edges
function addChildren(nodeId, children) {
	try {
		for (var i = children.length - 1; i >= 0; i--) {
            if (nodes.get(children[i]['id']) === null) {
                children[i]["color"] = colorSet["original"];
                children[i]["childrenShown"] = -1;
                nodes.add(children[i]);
            }

            edges.add({
              id: nodeId.toString() + "to" + children[i]['id'].toString(),
              from: nodeId,
              to: children[i]['id']
            });
        };
    }
    catch (err) {
    	alert(err);
    }
}

// get children, add children nodes as well as edges
function showChildren(nodeId) {
	var children = getChildren(nodeId, function(children){
        if (children.length > 0) {
            addChildren(nodeId, children);
        };
    });    	
}

// highlight first and second layers of neibors
function neighbourhoodHighlight(params) {
	allNodes = nodes.get({returnType:"Object"});

    if (params.nodes.length > 0) {
        var selectedNode = params.nodes[0];
        var options = {
            scale: 1.0,
            offset: {x:0, y:0},
            animation: {
                duration: 500,
                easingFunction: "easeInOutQuad"
            }
        };
        network.focus(selectedNode, options);

    	highlightActive = true;
    	var i,j;
    	var degrees = 2;

	    // mark all nodes as hard to read.
	    for (var nodeId in allNodes) {
            //allNodes[nodeId].hidden = true;
	    	allNodes[nodeId].color = colorSet["unselected"];
            //allNodes[nodeId].color = undefined;
            if (allNodes[nodeId].hiddenLabel === undefined) {
               allNodes[nodeId].hiddenLabel = allNodes[nodeId].label;
               allNodes[nodeId].label = undefined;
           }
       }
       var connectedNodes = network.getConnectedNodes(selectedNode);
       var allConnectedNodes = [];

	    // get the second degree nodes
	    for (i = 1; i < degrees; i++) {
	    	for (j = 0; j < connectedNodes.length; j++) {
	    		allConnectedNodes = allConnectedNodes.concat(network.getConnectedNodes(connectedNodes[j]));
	    	}
	    }

	    // all second degree nodes get a different color and their label back
	    for (i = 0; i < allConnectedNodes.length; i++) {            
	    	allNodes[allConnectedNodes[i]].color = colorSet["2ndDegreeChild"];
	    	if (allNodes[allConnectedNodes[i]].hiddenLabel !== undefined) {
	    		allNodes[allConnectedNodes[i]].label = allNodes[allConnectedNodes[i]].hiddenLabel;
	    		allNodes[allConnectedNodes[i]].hiddenLabel = undefined;
	    	}
	    }

		// all first degree nodes get their own color and their label back
		for (i = 0; i < connectedNodes.length; i++) {
			allNodes[connectedNodes[i]].color = colorSet["original"];
			if (allNodes[connectedNodes[i]].hiddenLabel !== undefined) {
				allNodes[connectedNodes[i]].label = allNodes[connectedNodes[i]].hiddenLabel;
				allNodes[connectedNodes[i]].hiddenLabel = undefined;
			}
		}

		// the main node gets its own color and its label back.
		allNodes[selectedNode].color = colorSet["highlight"];              
        if (allNodes[selectedNode].hiddenLabel !== undefined) {
           allNodes[selectedNode].label = allNodes[selectedNode].hiddenLabel;
           allNodes[selectedNode].hiddenLabel = undefined;
       }
    } else if (highlightActive === true) {
		// reset all nodes
		for (var nodeId in allNodes) {
			allNodes[nodeId].color = undefined;
			if (allNodes[nodeId].hiddenLabel !== undefined) {
				allNodes[nodeId].label = allNodes[nodeId].hiddenLabel;
				allNodes[nodeId].hiddenLabel = undefined;
			}
		}
		highlightActive = false
	}

    // transform the object into an array
    var updateArray = [];
    for (nodeId in allNodes) {
    	if (allNodes.hasOwnProperty(nodeId)) {
    		updateArray.push(allNodes[nodeId]);
    	}
    }

    try {
        nodes.update(updateArray);
    }
    catch (err) {
        alert(err);
    }
}

// change unselected node color to selected (but does not do the other way around)
function updateColorOfUserSelectedNodes() {
    try {
        for(var i = 0; i < selectedNodesArray.length; i++) {
            nodes.update({
                id: selectedNodesArray[i].id,
                label: selectedNodesArray[i].label,
                color: colorSet["selected"]
            });
        }
    } catch (err) {
        alert(err);
    }
}

function clearPopUp() {
  document.getElementById('addButton').onclick = null;
  document.getElementById('deleteButton').onclick = null;
  document.getElementById('expandButton').onclick = null;
  document.getElementById('collapseButton').onclick = null;
  document.getElementById('cancelButton').onclick = null;
  document.getElementById('network-popUp').style.display = 'none';
}

function cancelEdit() {
  clearPopUp();
}

/*for original code, refer to creative-list-effect*/

var lastdeletedID, lastdeletedTEXT, lastdeletedINDEX, count = 0;

function updateCounter(){
    $('.count').text(count);
    var deleteButton = $('.clear-all');
    if(count === 0){
        deleteButton.attr('disabled', 'disabled').addClass('disabled');
    }
    else{
        deleteButton.removeAttr('disabled').removeClass('disabled');
    }
}

//generates a unique id
function generateId(){
    return "reminder-" + +new Date();
}

//saves an item to localStorage
var saveReminder = function(id, content){
    localStorage.setItem(id, content);
};

var editReminder = function(id){
    var $this = $('#' + id);
    $this.focus()
    .append($('<button />', {
        "class": "icon-save save-button", 
        click: function(){

            $this.attr('contenteditable', 'false');

            var newcontent = $this.text(), saved = $('.save-notification');

            if(!newcontent) {
                var confirmation = confirm('Delete this item?');
                if(confirmation) {
                    removeReminder(id);
                }
            }
            else{
                localStorage.setItem(id, newcontent);
                saved.show();
                setTimeout(function(){
                    saved.hide();
                },2000);
                $(this).remove();
                $('.icon-pencil').show();
            }

        }

    }));
};

//removes item from localStorage
var deleteReminder = function(id, content){
    localStorage.removeItem(id);
    count--;
    updateCounter();
};

var UndoOption = function(){
    var undobutton = $('.undo-button');
    setTimeout(function(){
        undobutton.attr("display","block");

        undobutton.fadeIn(300).on('click', function(){
            createReminder(lastdeletedID, lastdeletedTEXT, lastdeletedINDEX);
            $(this).fadeOut(300);
        });
        setTimeout(function(){
            undobutton.fadeOut(1000);
        }, 3000);  
    },1000)
    updateColorOfUserSelectedNodes();
};

var removeReminder = function(id){
    var item = $('#' + id );
    lastdeletedID = id;
    lastdeletedTEXT = item.text();
    lastdeletedINDEX = item.index();

    item.addClass('removed-item').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
        $(this).remove();
    });

    deleteReminder(id);
    // delete from selectedNodesArray
    deleteSelectedNodeFromArray(id)
    // add undo option only if the edited item is not empty

    unselectedNodeColorUpdate(id);

    if(lastdeletedTEXT){
        UndoOption();
    }
};

var unselectedNodeColorUpdate = function(id){
    // change back color
    var currentColor = nodes.get(id)["color"];
    if (JSON.stringify(currentColor) === JSON.stringify(colorSet["selected"])) {
        nodes.update({
            id: id,
            label: nodes.get(id)["label"],
            color: colorSet["original"]
        });
    };
}

var removeReminderForDeleteAllButton = function(id){
    var item = $('#' + id );
    lastdeletedID = id;
    lastdeletedTEXT = item.text();
    lastdeletedINDEX = item.index();

    item.addClass('removed-item').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
        $(this).remove();
    });

    deleteReminder(id);
    // delete from selectedNodesArray
    deleteSelectedNodeFromArray(id);

    unselectedNodeColorUpdate(id);
};

var createReminder = function(id, content, index){
    var reminder = '<li id="' + id + '">' + content + '</li>',
    list = $('.reminders li');

    if(!$('#'+ id).length){

        if(index && index < list.length){
            var i = index +1;
            reminder = $(reminder).addClass('restored-item');
            $('.reminders li:nth-child(' + i + ')').before(reminder);
        }
        if(index === 0){
            reminder = $(reminder).addClass('restored-item');
            $('.reminders').prepend(reminder);
        }
        if(index === list.length){
            reminder = $(reminder).addClass('restored-item');
            $('.reminders').append(reminder);
        }
        if(index === undefined){
            reminder = $(reminder).addClass('new-item');
            $('.reminders').append(reminder); 
        }

        var createdItem = $('#'+ id);

        createdItem.append($('<button />', {
            "class" :"icon-trash delete-button",
            "contenteditable" : "false",
            click: function(){
                var confirmation = confirm('Delete this item?');
                if(confirmation) {
                   removeReminder(id);
               }
           }
        }));
        createdItem.on('keydown', function(ev){
            if(ev.keyCode === 13) return false;
        });

        saveReminder(id, content);
        count++;
        updateCounter();
    }
};

// handler for input
var handleInput = function(){
    $('#input-form').on('submit', function(event){
        var input = $('#text'),
        value = input.val();
        event.preventDefault();
        if (value){ 
            var text = value;
            var id = generateId();
            createReminder(id, text);
            input.val(''); 
        }
    });
};
  
var loadReminders = function(){
    if(localStorage.length!==0){
        for(var key in localStorage){
            var text = localStorage.getItem(key);
            if(key.indexOf('reminder') === 0){
                createReminder(key, text);
            }
        }
    }
};

//handler for the "delete all" button
var handleDeleteButton = function(){
    $('.clear-all').on('click', function(){
        if(confirm('Are you sure you want to delete all the items in the list? There is no turning back after that.')){
            //remove items from DOM
            var items = $('li[id ^= reminder]');
            items.addClass('removed-item').one('webkitAnimationEnd oanimationend msAnimationEnd animationend', function(e) {
                $(this).remove();
            });

            //look for items in localStorage and remove them
            for(var key in localStorage){
                removeReminderForDeleteAllButton(key);
            }
            count = 0;
            updateCounter();
        }
    });
};

/*for original code, refer to creative-list-effect. end*/

function insertSelectedNodeToArray(id, label) {
    selectedNodesArray.push({
        id: id,
        label: label
    });
}

function addSelectedNode(data, callback) {
  insertSelectedNodeToArray(data.id, data.label);
  // addToSelectedBox(data);
  createReminder(data.id, data.label);
  callback.apply(this,[]);
}

function deleteSelectedNodeFromArray(id) {
    for(var i = 0; i < selectedNodesArray.length; i++) {
        var obj = selectedNodesArray[i];
        if(obj.id == id) {
            selectedNodesArray.splice(i, 1);
        }
    }
}

function deleteSelectedNode(data, callback) {
    deleteSelectedNodeFromArray(data.id);
    //deleteFromSelectedBox(data);
    removeReminder(data.id)
    callback.apply(this,[]);    
}

function showEditSelectionForLinkedGraph(node, DOM) {
    
    // filling in the popup DOM elements
    document.getElementById('node-label').innerHTML = node.label;
    var selected = ($.grep(selectedNodesArray, function(e){ return e.id === node.id; }).length > 0);
    // set the pop up at the posisiton of the mouse
    /*var networkCanvasWidth = $("#network").width();
    var networkCanvasHeight = $("#network").height();*/
    $("#network-popUp").css("left", DOM["x"] + 5);
    $("#network-popUp").css("top", DOM["y"] + 5);
    
    if (selected) {
        document.getElementById('addButton').style.display = 'none';
        document.getElementById('deleteButton').style.display = 'inline';
        document.getElementById('deleteButton').onclick = function() {
            deleteSelectedNode(node, function() {
                updateColorOfUserSelectedNodes();
            });
            clearPopUp();
        }
    } else {
        document.getElementById('addButton').style.display = 'inline';
        document.getElementById('deleteButton').style.display = 'none';
        document.getElementById('addButton').onclick = function() {
            addSelectedNode(node, function() {
                updateColorOfUserSelectedNodes();
            });
            clearPopUp();
        }
    }
    document.getElementById('cancelButton').onclick = function() {
        cancelEdit();
    }
    
    if (node["hasChildren"] === 1 || node["hasChildren"] === undefined) {        
        if (node["childrenShown"] === 1) {
            document.getElementById('expandButton').style.display = 'none';
            document.getElementById('collapseButton').style.display = 'inline';            
            document.getElementById('collapseButton').onclick = function() {
                collapseNode(node);
                clearPopUp();
            };
        } else if (node["childrenShown"] === -1) {
            document.getElementById('expandButton').style.display = 'inline';
            document.getElementById('collapseButton').style.display = 'none';
            document.getElementById('expandButton').onclick = function() {
                expandNode(node);
                clearPopUp();
            };
        } else if (node["childrenShown"] === 0) {
            document.getElementById('expandButton').style.display = 'inline';
            document.getElementById('collapseButton').style.display = 'inline';
            document.getElementById('collapseButton').onclick = function() {
                collapseNode(node);
                clearPopUp();
            };
            document.getElementById('expandButton').onclick = function() {
                expandNode(node);
                clearPopUp();
            };
        }        
    } else {
        document.getElementById('expandButton').style.display = 'none';
        document.getElementById('collapseButton').style.display = 'none';
    }

    document.getElementById('network-popUp').style.display = 'block';
}

function collapseNode(node) {
    var allEgdes = edges.get();
    var branchLeftFlag = false;
    var branchFoldedFlag = false;

    for (var i = 0; i < allEgdes.length; i++) {
        if (allEgdes[i].from == node.id) {
            var flag = 0;
            var childToUpdate = nodes.get(allEgdes[i].to);            
            var edgeToUpdate = allEgdes[i];
            var edgesConnectedToChild = network.getConnectedEdges(allEgdes[i].to);
            if (edgesConnectedToChild.length > 1) {
                var edgeFromCentralToChildFlag = false;
                var edgeFromChildToCentralFlag = false;
                var connectedToOtherNodes = false;
                for (var j = edgesConnectedToChild.length - 1; j >= 0; j--) {
                    if (edgesConnectedToChild[j] == node.id + "to" + allEgdes[i].to && edges.get(edgesConnectedToChild[j])["hidden"] !== true) {
                        edgeFromCentralToChildFlag = true;
                    } else if (edgesConnectedToChild[j] == allEgdes[i].to + "to" + node.id && edges.get(edgesConnectedToChild[j])["hidden"] !== true) {
                        edgeFromChildToCentralFlag = true;
                    } else if (edgesConnectedToChild[j].includes(allEgdes[i].to) && edges.get(edgesConnectedToChild[j])["hidden"] !== true) {                       
                        connectedToOtherNodes = true;
                    }
                };

                if (edgeFromChildToCentralFlag && edgeFromCentralToChildFlag) {
                    flag = 1;
                } else if (connectedToOtherNodes) {
                    flag = 2;
                }
            };
            if (flag === 0) {
                childToUpdate["hidden"] = true;
                nodes.update(childToUpdate);
                edgeToUpdate["hidden"] = true;
                edges.update(edgeToUpdate);
                branchFoldedFlag = true;
            } else if (flag === 1) {
                edgeToUpdate["hidden"] = true;
                edges.update(edgeToUpdate);
                branchFoldedFlag = true;
            } else {
                branchLeftFlag = true;
            }
        };
    };

    if (!branchFoldedFlag) {
        node["childrenShown"] = 1;
    } else if (branchLeftFlag) {
        node["childrenShown"] = 0;
    } else {
        node["childrenShown"] = -1;
    }

    nodes.update(node);
}

function expandNode(node) {
    var nodeId = node.id;
    if (isWithChildren(nodeId)) {
        var allEgdes = edges.get();
        if (allEgdes.length > 0) {
            for (var i = allEgdes.length - 1; i >= 0; i--) {
                if (allEgdes[i].from == nodeId) {
                    if (edges.get(allEgdes[i].to.toString + "to" + node.id.toString) === null) {
                        var childId = allEgdes[i].to;
                        var childToUpdate = nodes.get(childId);
                        childToUpdate["hidden"] = false;
                        nodes.update(childToUpdate);
                        var edgeToUpdate = allEgdes[i];
                        edgeToUpdate["hidden"] = false;
                        edges.update(edgeToUpdate);
                    } else {
                        var edgeToUpdate = allEgdes[i];
                        edgeToUpdate["hidden"] = false;
                        edges.update(edgeToUpdate);
                    }
                };
            };
        };
    } else {
        if (nodes.get(nodeId)["label"] !== document.getElementById('node-label').innerHTML) {
            clearPopUp();
        }        
        showChildren(nodeId);        
    };
    updateColorOfUserSelectedNodes();
    node["childrenShown"] = 1;
    nodes.update(node);
}

// on click, show add or delete menu
function click(params) {
    reverseNeighbourhoodHighlight();
    var nodeId = params.nodes[0];
    if (nodeId != null) {
        selectedNode = nodes.get(nodeId);
        var DOM = params["pointer"]["DOM"];
        showEditSelectionForLinkedGraph(selectedNode, DOM);
    };
}

function reverseNeighbourhoodHighlight() {
    var allNodes = nodes.get();
    for (var i = 0; i < allNodes.length; i++) {
        allNodes[i]["color"] = colorSet["original"];
        if (allNodes[i]["hiddenLabel"] !== undefined) {
           allNodes[i]["label"] = allNodes[i]["hiddenLabel"];
           allNodes[i]["hiddenLabel"] = undefined;
        }
    }
    nodes.update(allNodes);
    updateColorOfUserSelectedNodes();
}

// add node to selected box
function addToSelectedBox(data) {
    try {
        selectedNodes.add({
            id: data.id,
            label: data.label,
            color: colorSet["selected"]
        }
        );
    }
    catch (err) {
        alert(err);
    }    
}

// delete node from selected box
function deleteFromSelectedBox(data) {
    try {
        selectedNodes.remove({id: data.id});
    }
    catch (err) {
        alert(err);
    }
}

function showGraphForLinkedPageDraw(pageID, pageTitle) {
    var windowHeight = window.innerHeight;
    $("#network").css("height", windowHeight);
    $("#selected").css("height", windowHeight);

    // create an array with nodes
    nodes = new vis.DataSet();

    nodes.add([
    {
        id: pageID,
        label: pageTitle, 
        color: colorSet["original"],
        childrenShown: -1
    }
    ]);

    // create an array with edges
    edges = new vis.DataSet();

    // create a network for user to select nodes
    var container = document.getElementById('network');

    var data = {
        nodes: nodes,
        edges: edges
    };

    network = new vis.Network(container, data, options);
    network.on("click", click);
    network.on("doubleClick", neighbourhoodHighlight);

    // disable the browser default right click menu
    $('#network').bind('contextmenu', function(e){
        return false;
    });
}

// for relatedNodesInCircle
var nodesForRelatedPage, edgesForRelatedPage, networkForRelatedPage;

var colorSetForRelatedPage = {
    "selected": {
        "border": "rgba(0,0,0,1)",
        "background" : "rgba(0,0,0,1)",
        "highlight" : {
            "border": "rgba(0,0,0,1)",
            "background" : "rgba(0,0,0,1)"
        }
    },
    "1stRelated": {
        "border": "rgba(51,74,148,0.75)",
        "background" : "rgba(51,74,148,0.75)",
        "highlight" : {
            "border": "rgba(51,74,148,0.75)",
            "background" : "rgba(51,74,148,0.75)"
        }
    },
    "2ndRelated": {
        "border": "rgba(107,158,223,0.75)",
        "background" : "rgba(107,158,223,0.75)",
        "highlight" : {
            "border": "rgba(107,158,223,0.75)",
            "background" : "rgba(107,158,223,0.75)"
        }
    }
};

var massSetForRelatedPage = {
    "selected": 0.01,
    "1stRelated": 1,
    "2ndRelated": 5
}

var optionsForRelatedPage = {
    nodes: {
        font: {
          color: '#ffffff',
          // size: 14, // px
          // face: 'arial',
          // background: 'none',
          // strokeWidth: 0, // px
          // strokeColor: '#ffffff',
          // align: 'horizontal'
        },
    },
    physics: {
        barnesHut: {
            avoidOverlap: 0.5
        },
        stabilization: {
            enabled: true,
            iterations: 400,
            updateInterval: 40,
            onlyDynamicEdges: false,
            fit: true
        },
        minVelocity: 0.2
    }
}

// array of nodes of the selected nodes.
var selectedNodesForRelatedGraph = [];

function isSelectedForRelatedGraph(node) {
    return ($.grep(selectedNodesForRelatedGraph, function(e){ return e.id == node.id; }).length > 0);
}

function deleteFromSelectedNodesForRelatedGraph(id) {
    for(var i = 0; i < selectedNodesForRelatedGraph.length; i++) {
        var obj = selectedNodesForRelatedGraph[i];
        if(obj.id == id) {
            selectedNodesForRelatedGraph.splice(i, 1);
        }
    }
}

// node contains id and label
// level is a string being one of "selected", "1stRelated", "2ndRelated"
var addNodeToRelatedGraph = function(node, level) {
    if (level === "selected" | level === "1stRelated" | level === "2ndRelated") {
        var nodeToUpdate = node;
        // nodeToUpdate["level"] = level;
        nodeToUpdate["mass"] = massSetForRelatedPage[level];
        nodeToUpdate["color"] = colorSetForRelatedPage[level];
        nodesForRelatedPage.update(nodeToUpdate);
        edgesForRelatedPage.update({from: 0, to: node.id, hidden: true});
    } else {
        console.log("wrong level provided:" + level)
    }
}

function clearPopUpForRelatedGraph(){
    document.getElementById('addButton-forRelatedGraph').onclick = null;
    document.getElementById('deleteButton-forRelatedGraph').onclick = null;
    document.getElementById('cancelButton-forRelatedGraph').onclick = null;
    document.getElementById('network-popUp-forRelatedGraph').style.display = 'none';
}

function showEditSelectionForRelatedGraph(node, DOM) {
    console.log("showEditSelectionForRelatedGraph");
    // filling in the popup DOM elements
    document.getElementById('node-label-forRelatedGraph').innerHTML = node.label;
    // set the pop up at the posisiton of the mouse
    $("#network-popUp-forRelatedGraph").css("left", DOM["x"] + 5);
    $("#network-popUp-forRelatedGraph").css("top", DOM["y"] + 5);
    
    if (isSelectedForRelatedGraph(node)) {
        document.getElementById('addButton-forRelatedGraph').style.display = 'none';
        document.getElementById('deleteButton-forRelatedGraph').style.display = 'inline';
        document.getElementById('deleteButton-forRelatedGraph').onclick = function() {
            deleteFromSelectedNodesForRelatedGraph(node.id);
            clearPopUpForRelatedGraph();
            updateRelatedGraph();
        }
    } else {
        document.getElementById('addButton-forRelatedGraph').style.display = 'inline';
        document.getElementById('deleteButton-forRelatedGraph').style.display = 'none';
        document.getElementById('addButton-forRelatedGraph').onclick = function() {
            selectedNodesForRelatedGraph.push({id: node.id, label: node.label});
            clearPopUpForRelatedGraph();
            updateRelatedGraph();
        }
    }
    document.getElementById('cancelButton-forRelatedGraph').onclick = function() {
        clearPopUpForRelatedGraph();
    }
    document.getElementById('network-popUp-forRelatedGraph').style.display = 'block';
}

function clickRelatedGraph(params) {
    console.log("clickRelatedGraph");
    var nodeId = params.nodes[0];
    if (nodeId != null) {
        var selectedNode = nodesForRelatedPage.get(nodeId);
        var DOM = params["pointer"]["DOM"];
        showEditSelectionForRelatedGraph(selectedNode, DOM);
    };    
}


// functions to complete:
// use current selectedNodesForRelatedGraph to update the related nodes graph
function updateRelatedGraph() {
    console.log("updateRelatedGraph");
    var windowHeight = window.innerHeight;
    $("#graphPageForRelatedPage").css("height", windowHeight);

    nodesForRelatedPage = new vis.DataSet([
        // the hidden node that all nodes should connect to.
        {id: 0, mass: 0.01, hidden: true}
    ]);
    nodesForRelatedPage.get(0)["fixed"] = true;

    edgesForRelatedPage = new vis.DataSet();

    for (var i = selectedNodesForRelatedGraph.length - 1; i >= 0; i--) {
        var selectedNode = selectedNodesForRelatedGraph[i];
        addNodeToRelatedGraph(selectedNode, "selected");
    };

    if (selectedNodesForRelatedGraph.length === 1) {
        addNodeToRelatedGraph({id: 11, label: "Chinese New Year"}, "1stRelated");
        addNodeToRelatedGraph({id: 12, label: "China Yuan"}, "1stRelated");
        addNodeToRelatedGraph({id: 13, label: "Mandarin"}, "1stRelated");
        addNodeToRelatedGraph({id: 14, label: "China Stock Market"}, "1stRelated");
        addNodeToRelatedGraph({id: 15, label: "Beijing"}, "1stRelated");
        addNodeToRelatedGraph({id: 16, label: "Shanghai"}, "1stRelated");
        addNodeToRelatedGraph({id: 17, label: "Singapore"}, "1stRelated");
        addNodeToRelatedGraph({id: 18, label: "Hotpot"}, "1stRelated");
    } else if (selectedNodesForRelatedGraph.length === 2) {
        addNodeToRelatedGraph({id: 11, label: "Chinese New Year"}, "1stRelated");
        addNodeToRelatedGraph({id: 12, label: "China Yuan"}, "1stRelated");
        addNodeToRelatedGraph({id: 13, label: "Asia"}, "1stRelated");
        addNodeToRelatedGraph({id: 14, label: "Hokkien"}, "1stRelated");
        addNodeToRelatedGraph({id: 15, label: "Chinatown"}, "1stRelated");
        addNodeToRelatedGraph({id: 16, label: "Tourism"}, "1stRelated");

        addNodeToRelatedGraph({id: 21, label: "Peking opera"}, "2ndRelated");
        addNodeToRelatedGraph({id: 22, label: "Alibaba"}, "2ndRelated");
        addNodeToRelatedGraph({id: 23, label: "Great Fire Wall"}, "2ndRelated");
        addNodeToRelatedGraph({id: 24, label: "Singapore Airlines"}, "2ndRelated");
        addNodeToRelatedGraph({id: 25, label: "SouthEast Asia"}, "2ndRelated");
        addNodeToRelatedGraph({id: 26, label: "ASEAN"}, "2ndRelated");
        addNodeToRelatedGraph({id: 27, label: "Peranakan"}, "2ndRelated");
        addNodeToRelatedGraph({id: 28, label: "National Capital"}, "2ndRelated");
        addNodeToRelatedGraph({id: 29, label: "Malaysia"}, "2ndRelated");

    }
    

    var container = document.getElementById('network-forRelatedGraph');
    var data = {
        nodes: nodesForRelatedPage,
        edges: edgesForRelatedPage
    };

    networkForRelatedPage = new vis.Network(container, data, optionsForRelatedPage);
    networkForRelatedPage.on("click", clickRelatedGraph);
}

var showGraphForRelatedPage = function(pageID, pageTitle) {
    selectedNodesForRelatedGraph = [{id: pageID, label: pageTitle}];
    updateRelatedGraph();
    var centralNode = nodesForRelatedPage.get(pageID);
    centralNode[""];
    // nodesForRelatedPage.update()    
}
