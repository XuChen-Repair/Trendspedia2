/* TODOs: 
on stablized, focus on central node.

require Jquery to work
node represent a wikipedia page, node-id being page_id
directed edge showing the pagelink relationship, edge id being a string with format: fromId.toString() + "to" + toId.toString()
*/

var nodes, edges, network;

var options = {
    configure: {
        enabled: true,
        filter: 'nodes,edges',
        //container: undefined,
        showButton: true
    },
    /*nodes: {
        borderWidth: 0,
        borderWidthSelected: 3,
        color: colorSet["original"]
    },*/
    physics: {
        maxVelocity: 10,
        minVelocity: 0.1,
        solver: 'barnesHut',
        stabilization: {
          enabled: true,
          iterations: 1000,
          updateInterval: 100,
          onlyDynamicEdges: false,
          fit: true
        },
        timestep: 0.2
    }/*,
    manipulation: {
        editNode: function (data, callback) {
            console.log("data:");
            console.log(data);
            // filling in the popup DOM elements
            document.getElementById('operation').innerHTML = "select";
            document.getElementById('node-id').value = data.id;
            document.getElementById('node-label').value = data.label;
            document.getElementById('addButton').onclick = addData.bind(this, data, callback);
            document.getElementById('cancelButton').onclick = cancelEdit.bind(this,callback);
            document.getElementById('network-popUp').style.display = 'block';
        },
    }*/
}

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
        "border": "rgba(38, 148, 15, 1)",
        "background" : "rgba(38, 148, 15, 1)"
    }
};

// Nodes whose children is already loaded 
var withChildren = [];

// User selected nodes
var selectedNodes = [];

// convenience method to stringify a JSON object
function toJSONString(obj) {
	return JSON.stringify(obj, null, 4);
}

// return if a node's children is alreay loaded. boolean returned.
function isWithChildren(nodeId) {
	return (withChildren.indexOf(nodeId) != -1);
}

// get children from database
// call python script. get children of a node as array of nodes
function getChildren(nodeId) {
    var resp = null;
    $.ajax({
        type: "GET",
        async: false,
        url: "/vis/getAllPLs?pageID=" + nodeId.toString(), 
        success: function( data ) {
            var nodes = [];
            var pagelinks = JSON.parse(data);
            if (pagelinks.length > 0) {
                for (var i = 0; i < pagelinks.length; i++) {
                    pagelink = pagelinks[i]
                    node = {
                        id: pagelink[0],
                        label: pagelink[1]
                    };
                    nodes.push(node);
                }
            }
            getChildrenFlag = true;
            resp = nodes;
        },
        error: function (xhr, textStatus, errorThrown) {
            console.log(errorThrown);
        }
    });
    return resp; 
}

// add children nodes as well as edges
function addChildren(nodeId, children) {
	try {
		for (var i = children.length - 1; i >= 0; i--) {
            if (nodes.getIds().indexOf(children[i]['id']) == -1) {
                children[i]["color"] = colorSet["original"];
                nodes.add(children[i]);                
            };
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
	var children = getChildren(nodeId);
	if (children.length > 0) {
		addChildren(nodeId, children);
	};
    withChildren.push(nodeId);
}

// highlight first and second layers of neibors
function neighbourhoodHighlight(params) {
	allNodes = nodes.get({returnType:"Object"});
    // if something is selected:
    if (params.nodes.length > 0) {
    	highlightActive = true;
    	var i,j;
    	var selectedNode = params.nodes[0];
    	var degrees = 2;

	    // mark all nodes as hard to read.
	    for (var nodeId in allNodes) {
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
	}
	else if (highlightActive === true) {
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
    //console.log(updateArray);
    nodes.update(updateArray);
}

function updateUserSelectedNodes() {
    console.log("updateUserSelectedNodes");
    // user selected nodes get special color
    for(var i = 0; i < selectedNodes.length; i++) {
        nodes.update({
            id: selectedNodes[i].id,
            label: selectedNodes[i].label,
            color: colorSet["selected"]
        });
    }
}
// focus on a node with animation
function focus(nodeId) {
	var options = {
        // position: {x:positionx,y:positiony}, // this is not relevant when focusing on nodes
        scale: 1.0,
        offset: {x:0, y:0},
        animation: {
        	duration: 500,
        	easingFunction: "easeInOutQuad"
        }
    };
    network.focus(nodeId, options);
}

function clearPopUp() {
  document.getElementById('addButton').onclick = null;
  document.getElementById('deleteButton').onclick = null;
  document.getElementById('cancelButton').onclick = null;
  document.getElementById('network-popUp').style.display = 'none';
}

function cancelEdit() {
  clearPopUp();
  console.log("cleared.")
}

function addSelectedNode(data, callback) {
  clearPopUp();
  // to do
  // add to right sidebar
  selectedNodes.push(data);
  callback.apply(this,[]);
  //updateUserSelectedNodes();
  
}

function deleteSelectedNode(data, callback) {
    clearPopUp();
    // to do
    // delete from right sidebar
    for(var i = 0; i < selectedNodes.length; i++) {
        var obj = selectedNodes[i];
        if(obj.id == data.id) {
            selectedNodes.splice(i, 1);
        }
    }
    callback.apply(this,[]);
    
}

function showEditSelection(data) {
    // filling in the popup DOM elements
    document.getElementById('node-label').innerHTML = data.label;
    var result = $.grep(selectedNodes, function(e){ return e.id === data.id; });
    if (result.length > 0) {
        document.getElementById('addButton').style.display = 'none';
        document.getElementById('deleteButton').style.display = 'inline';
        document.getElementById('deleteButton').onclick = function() {
            deleteSelectedNode(data, function() {
                    updateUserSelectedNodes();
                });
            }
    } else {
        document.getElementById('addButton').style.display = 'inline';
        document.getElementById('deleteButton').style.display = 'none';
        document.getElementById('addButton').onclick = function() {
            addSelectedNode(data, function() {
                    updateUserSelectedNodes();
                });
            }
    }
    document.getElementById('cancelButton').onclick = function() {
        cancelEdit();
    }    
    document.getElementById('network-popUp').style.display = 'block';
}

// on click
function clickNode(params) {
    var nodeId = params.nodes[0];
    if (nodeId != null) {
        if (!isWithChildren(nodeId)) {
            showChildren(nodeId);
        };
        neighbourhoodHighlight(params);
        // network.on("stabilized", focus(nodeId));
        focus(nodeId);
        selectedNode = nodes.get(nodeId);
        showEditSelection(selectedNode);
    };
    updateUserSelectedNodes();
}

function draw() {
    // create an array with nodes
    nodes = new vis.DataSet();
    /*nodes.on('*', function () {
        document.getElementById('nodes').innerHTML = toJSONString(nodes.get());
    });*/
    nodes.add([
        {
            id: '25',
            label: 'Autism', 
            color: colorSet["original"]
        }
    ]);
    //console.log(nodes);

    // create an array with edges
    edges = new vis.DataSet();
    /*edges.on('*', function () {
        document.getElementById('edges').innerHTML = toJSONString(edges.get());
    });*/

    // create a network
    var container = document.getElementById('network');

    var data = {
        nodes: nodes,
        edges: edges
    };
    /*console.log(container);
    console.log(data);
    console.log(options);*/

    network = new vis.Network(container, data, options);

    network.on("click",clickNode);
}
