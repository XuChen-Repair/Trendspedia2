(function(window) {

var x, y, delta;

function Track(width, height, step){
	x = -step/2;
	y = -step/2;
	delta = [0, -step];
	this._width = width;
	this._height = height;
	this._step = step;
	this._array0 = []; //left top
	this._array1 = []; //right top
	this._array2 = []; //left bottom
	this._array3 = []; //right bottom
	this.array = [this._array0, this._array1, this._array2, this._array3];
}

Track.prototype.generate = function(){
	for (var i = Math.pow(Math.max(this._width, this._height), 2); i>0; i--) {
		if ((-this._width/2 <= x && x <= this._width/2) 
				&& (-this._height/2 <= y && y <= this._height/2)) {
			//console.debug(x, y);
			if (x<=0 && y<=0) this._array0.push({x:x, y:y});
			else if (x<=0 && y>0) this._array3.push({x:x, y:y});
			else if (x>0 && y<0) this._array1.push({x:x, y:y});
			else if (x>0 && y>=0) this._array2.push({x:x, y:y});
		}
		// 1
		if (x === y || (x < 0 && x === -y) || (x > 0 && x === this._step-y)){
			// change direction
			delta = [-delta[1], delta[0]];      
		}
		
		x += delta[0];
		y += delta[1];
	}
}
window.Track = Track;

}(window));