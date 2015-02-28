(function(window) {

var x, y, delta, array;

function Spiral(width, height, step){
	this.x = 0;
	this.y = 0;
	delta = [0, -step];
	//delta = [step, 0];
	this._width = width;
	this._height = height;
	this._step = step;
	this.array = [];
}

Spiral.prototype.generate = function(){
	for (var i = Math.pow(Math.max(this._width, this._height), 2); i>0; i--) {
		if ((-this._width/2 < this.x <= this._width/2) && (-this._height/2 < this.y <= this._height/2)) {
			this.array.push({x:this.x, y:this.y});
		}

		if (this.x === this.y || (this.x < 0 && this.x === -this.y) || (this.x > 0 && this.x === this._step-this.y)){
			// change direction
			delta = [-delta[1], delta[0]]            
		}

		this.x += delta[0];
		this.y += delta[1];        
	}
	
	//console.log(this._array);
}
window.Spiral = Spiral;

}(window));