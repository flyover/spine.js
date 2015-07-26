/**
 * Copyright (c) Flyover Games, LLC 
 *  
 * Isaac Burns isaacburns@gmail.com 
 *  
 * Permission is hereby granted, free of charge, to any person 
 * obtaining a copy of this software and associated 
 * documentation files (the "Software"), to deal in the Software 
 * without restriction, including without limitation the rights 
 * to use, copy, modify, merge, publish, distribute, sublicense, 
 * and/or sell copies of the Software, and to permit persons to 
 * whom the Software is furnished to do so, subject to the 
 * following conditions: 
 *  
 * The above copyright notice and this permission notice shall 
 * be included in all copies or substantial portions of the 
 * Software. 
 *  
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY 
 * KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE 
 * WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR 
 * PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR 
 * COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER 
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR 
 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE 
 * SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE. 
 */

/**
 * A JavaScript API for the Spine JSON animation data format.
 */
goog.provide('spine');

/**
 * @return {boolean} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {boolean=} def 
 */
spine.loadBool = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return (value === 'true') ? true : false;
	case 'boolean': return value;
	default: return def || false;
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {boolean} value 
 * @param {boolean=} def 
 */
spine.saveBool = function (json, key, value, def)
{
	if ((typeof(def) !== 'boolean') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {number} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number=} def 
 */
spine.loadFloat = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return parseFloat(value);
	case 'number': return value;
	default: return def || 0;
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number} value 
 * @param {number=} def 
 */
spine.saveFloat = function (json, key, value, def)
{
	if ((typeof(def) !== 'number') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {number} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number=} def 
 */
spine.loadInt = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return parseInt(value, 10);
	case 'number': return 0 | value;
	default: return def || 0;
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {number} value 
 * @param {number=} def 
 */
spine.saveInt = function (json, key, value, def)
{
	if ((typeof(def) !== 'number') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @return {string} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {string=} def 
 */
spine.loadString = function (json, key, def)
{
	var value = json[key];
	switch (typeof(value))
	{
	case 'string': return value;
	default: return def || "";
	}
}

/**
 * @return {void} 
 * @param {Object.<string,?>|Array.<?>} json 
 * @param {string|number} key 
 * @param {string} value 
 * @param {string=} def 
 */
spine.saveString = function (json, key, value, def)
{
	if ((typeof(def) !== 'string') || (value !== def))
	{
		json[key] = value;
	}
}

/**
 * @constructor
 */
spine.AtlasPage = function ()
{
	this.name = "";
	this.w = 0;
	this.h = 0;
}

/**
 * @constructor
 */
spine.AtlasSite = function ()
{
	this.page = -1;
	this.x = 0;
	this.y = 0;
	this.w = 0;
	this.h = 0;
	this.rotate = false;
	this.offset_x = 0;
	this.offset_y = 0;
	this.original_w = 0;
	this.original_h = 0;
}

/**
 * @constructor
 */
spine.Atlas = function ()
{
	this.pages = [];
	this.sites = {};
}

/**
 * @return {spine.Atlas}
 * @param {string} text
 */
spine.Atlas.prototype.import = function (text)
{
	var atlas = this;

	atlas.pages = [];
	atlas.sites = {};

	function trim (s) { return s.replace(/^\s+|\s+$/g, ""); }

	var page = null;
	var site = null;

	var lines = text.split(/\n|\r\n/);
	var match = null;

	lines.forEach(function (line)
	{
		if (trim(line).length === 0)
		{
			page = null;
			site = null;
		}
		else if (match = line.match(/^size: (.*),(.*)$/))
		{
			page.w = parseInt(match[1], 10);
			page.h = parseInt(match[2], 10);
		}
		else if (match = line.match(/^format: (.*)$/))
		{
			var format = match[1];
		}
		else if (match = line.match(/^filter: (.*),(.*)$/))
		{
			var filter_x = match[1];
			var filter_y = match[2];
		}
		else if (match = line.match(/^repeat: (.*)$/))
		{
			var repeat = match[1];
		}
		else if (match = line.match(/^orig: (.*)[,| x] (.*)$/))
		{
			var orig_x = parseInt(match[1], 10);
			var orig_y = parseInt(match[2], 10);
		}
		else if (page === null)
		{
			page = new spine.AtlasPage();
			page.name = line;
			page.w = 0;
			page.h = 0;
			atlas.pages.push(page);
		}
		else
		{
			if (match = line.match(/^  rotate: (.*)$/))
			{
				site.rotate = (match[1] !== 'false');
			}
			else if (match = line.match(/^  xy: (.*), (.*)$/))
			{
				site.x = parseInt(match[1], 10);
				site.y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  size: (.*), (.*)$/))
			{
				site.w = parseInt(match[1], 10);
				site.h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  orig: (.*), (.*)$/))
			{
				site.original_w = parseInt(match[1], 10);
				site.original_h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  offset: (.*), (.*)$/))
			{
				site.offset_x = parseInt(match[1], 10);
				site.offset_y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  index: (.*)$/))
			{
				var index = parseInt(match[1], 10);
			}
			else
			{
				site = new spine.AtlasSite();
				site.page = atlas.pages.length - 1;
				atlas.sites[line] = site;
			}
		}
	});

	return atlas;
}

/**
 * @constructor
 */
spine.Color = function ()
{
}

/** @type {number} */
spine.Color.prototype.rgba = 0xffffffff;
/** @type {number} */
spine.Color.prototype.r = 1;
/** @type {number} */
spine.Color.prototype.g = 1;
/** @type {number} */
spine.Color.prototype.b = 1;
/** @type {number} */
spine.Color.prototype.a = 1;

/**
 * @return {spine.Color} 
 * @param {spine.Color} other 
 */
spine.Color.prototype.copy = function (other)
{
	var color = this;
	color.rgba = other.rgba;
	color.r = other.r;
	color.g = other.g;
	color.b = other.b;
	color.a = other.a;
	return color;
}

/**
 * @return {spine.Color} 
 * @param {Object.<string,?>} json 
 */
spine.Color.prototype.load = function (json)
{
	var color = this;
	switch (typeof(json))
	{
	case 'string': color.rgba = parseInt(json, 16); break;
	case 'number': color.rgba = 0 | json; break;
	default: color.rgba = 0xffffffff; break;
	}
	color.r = ((color.rgba >> 24) & 0xff) / 255;
	color.g = ((color.rgba >> 16) & 0xff) / 255;
	color.b = ((color.rgba >> 8) & 0xff) / 255;
	color.a = (color.rgba & 0xff) / 255;
	return color;
}

/**
 * @return {string} 
 */
spine.Color.prototype.toString = function ()
{
	var color = this;
	return "rgba(" + (color.r * 255).toFixed(0) + "," + (color.g * 255).toFixed(0) + "," + (color.b * 255).toFixed(0) + "," + color.a + ")";
}

// from: http://github.com/arian/cubic-bezier
/**
 * @return {function(number):number} 
 * @param {number} x1 
 * @param {number} y1 
 * @param {number} x2 
 * @param {number} y2 
 * @param {number=} epsilon 
 */
spine.BezierCurve = function (x1, y1, x2, y2, epsilon)
{
	epsilon = epsilon || 1e-6;

	/*
	function orig_curveX(t){
		var v = 1 - t;
		return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
	};

	function orig_curveY(t){
		var v = 1 - t;
		return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
	};

	function orig_derivativeCurveX(t){
		var v = 1 - t;
		return 3 * (2 * (t - 1) * t + v * v) * x1 + 3 * (- t * t * t + 2 * v * t) * x2;
	};
	*/

	/*
	 
	B(t) = P0*(1-t)^3 + 3*P1*(1-t)^2*t + 3*P2*(1-t)*t^2 + P3*t^3
	B'(t) = P0 - 3*(P0 - P1)*t + 3*(P0 - 2*P1 + P2)*t^2 - (P0 - 3*P1 + 3*P2 - P3)*t^3
	
	if P0:(0,0) and P3:(1,1)
	B(t) = 3*P1*(1-t)^2*t + 3*P2*(1-t)*t^2 + t^3
	B'(t) = 3*P1*t - 3*(2*P1 - P2)*t^2 + (3*P1 - 3*P2 + 1)*t^3
	
	*/
	
	function curveX(t)
	{
		var t2 = t*t;
		var t3 = t2*t;
		var v = 1-t;
		var v2 = v*v;
		return 3*x1*v2*t + 3*x2*v*t2 + t3;
	};

	function curveY(t)
	{
		var t2 = t*t;
		var t3 = t2*t;
		var v = 1-t;
		var v2 = v*v;
		return 3*y1*v2*t + 3*y2*v*t2 + t3;
	};

	function derivativeCurveX(t)
	{
		var t2 = t * t;
		var t3 = t2 * t;
		return 3*x1*t - 3*(2*x1-x2)*t2 + (3*x1-3*x2+1)*t3;
	};

	return function (percent)
	{
		var x = percent, t0, t1, t2, x2, d2, i;

		// First try a few iterations of Newton's method -- normally very fast.
		for (t2 = x, i = 0; i < 8; ++i)
		{
			x2 = curveX(t2) - x;
			if (Math.abs(x2) < epsilon) return curveY(t2);
			d2 = derivativeCurveX(t2);
			if (Math.abs(d2) < 1e-6) break;
			t2 = t2 - (x2 / d2);
		}

		t0 = 0, t1 = 1, t2 = x;

		if (t2 < t0) return curveY(t0);
		if (t2 > t1) return curveY(t1);

		// Fallback to the bisection method for reliability.
		while (t0 < t1)
		{
			x2 = curveX(t2);
			if (Math.abs(x2 - x) < epsilon) return curveY(t2);
			if (x > x2) t0 = t2;
			else t1 = t2;
			t2 = (t1 - t0) * 0.5 + t0;
		}

		// Failure
		return curveY(t2);
	};
}

// from: spine-libgdx/src/com/esotericsoftware/spine/Animation.java
/**
 * @return {function(number):number} 
 * @param {number} cx1 
 * @param {number} cy1 
 * @param {number} cx2 
 * @param {number} cy2 
 */
spine.StepBezierCurve = function (cx1, cy1, cx2, cy2)
{
	var bezierSegments = 10;
	var subdiv_step = 1 / bezierSegments;
	var subdiv_step2 = subdiv_step * subdiv_step;
	var subdiv_step3 = subdiv_step2 * subdiv_step;
	var pre1 = 3 * subdiv_step;
	var pre2 = 3 * subdiv_step2;
	var pre4 = 6 * subdiv_step2;
	var pre5 = 6 * subdiv_step3;
	var tmp1x = -cx1 * 2 + cx2;
	var tmp1y = -cy1 * 2 + cy2;
	var tmp2x = (cx1 - cx2) * 3 + 1;
	var tmp2y = (cy1 - cy2) * 3 + 1;
	var curves_0 = (cx1 * pre1 + tmp1x * pre2 + tmp2x * subdiv_step3);
	var curves_1 = (cy1 * pre1 + tmp1y * pre2 + tmp2y * subdiv_step3);
	var curves_2 = (tmp1x * pre4 + tmp2x * pre5);
	var curves_3 = (tmp1y * pre4 + tmp2y * pre5);
	var curves_4 = (tmp2x * pre5);
	var curves_5 = (tmp2y * pre5);

	return function (percent)
	{
		var dfx   = curves_0;
		var dfy   = curves_1;
		var ddfx  = curves_2;
		var ddfy  = curves_3;
		var dddfx = curves_4;
		var dddfy = curves_5;

		var x = dfx, y = dfy;
		var i = bezierSegments - 2;
		while (true) {
			if (x >= percent) {
				var lastX = x - dfx;
				var lastY = y - dfy;
				return lastY + (y - lastY) * (percent - lastX) / (x - lastX);
			}
			if (i === 0) break;
			i--;
			dfx += ddfx;
			dfy += ddfy;
			ddfx += dddfx;
			ddfy += dddfy;
			x += dfx;
			y += dfy;
		}
		return y + (1 - y) * (percent - x) / (1 - x); // Last point is 1,1.
	};
}

/**
 * @constructor
 */
spine.Curve = function ()
{
}

/**
 * @type {function(number):number}
 */
spine.Curve.prototype.evaluate = function (t) { return t; };

/**
 * @return {spine.Curve} 
 * @param {?} json 
 */
spine.Curve.prototype.load = function (json)
{
	var curve = this;

	// default: linear
	curve.evaluate = function (t) { return t; };

	if ((typeof(json) === 'string') && (json === 'stepped'))
	{
		// stepped
		curve.evaluate = function (t) { return 0; };
	}
	else if ((typeof(json) === 'object') && (typeof(json.length) === 'number') && (json.length === 4))
	{
		// bezier
		var x1 = spine.loadFloat(json, 0, 0);
		var y1 = spine.loadFloat(json, 1, 0);
		var x2 = spine.loadFloat(json, 2, 1);
		var y2 = spine.loadFloat(json, 3, 1);
		//curve.evaluate = spine.BezierCurve(x1, y1, x2, y2);
		curve.evaluate = spine.StepBezierCurve(x1, y1, x2, y2);
	}
	return curve;
}

/**
 * @return {number} 
 * @param {number} num 
 * @param {number} min 
 * @param {number} max 
 */
spine.wrap = function (num, min, max)
{
	if (min < max)
	{
		if (num < min)
		{
			return max - ((min - num) % (max - min));
		}
		else
		{
			return min + ((num - min) % (max - min));
		}
	}
	else if (min === max)
	{
		return min;
	}
	else
	{
		return num;
	}
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spine.tween = function (a, b, t)
{
	return a + ((b - a) * t);
}

/**
 * @return {number} 
 * @param {number} angle 
 */
spine.wrapAngleRadians = function (angle)
{
	if (angle <= 0)
	{
		return ((angle - Math.PI) % (2*Math.PI)) + Math.PI;
	}
	else
	{
		return ((angle + Math.PI) % (2*Math.PI)) - Math.PI;
	}
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spine.tweenAngle = function (a, b, t)
{
	return spine.wrapAngleRadians(a + (spine.wrapAngleRadians(b - a) * t));
}

/**
 * @constructor 
 * @param {number=} rad 
 */
spine.Angle = function (rad)
{
	this.rad = rad || 0;
}

Object.defineProperty(spine.Angle.prototype, 'deg', 
{
	/** @this {spine.Angle} */
	get: function () { return this.rad * 180 / Math.PI; },
	/** @this {spine.Angle} */
	set: function (value) { this.rad = value * Math.PI / 180; }
});

Object.defineProperty(spine.Angle.prototype, 'cos', 
{
	/** @this {spine.Angle} */
	get: function () { return Math.cos(this.rad); }
});

Object.defineProperty(spine.Angle.prototype, 'sin', 
{
	/** @this {spine.Angle} */
	get: function () { return Math.sin(this.rad); }
});

/**
 * @return {spine.Angle}
 */
spine.Angle.prototype.selfIdentity = function ()
{
	this.rad = 0;
	return this;
}

/**
 * @return {spine.Angle}
 * @param {spine.Angle} other 
 */
spine.Angle.prototype.copy = function (other)
{
	this.rad = other.rad;
	return this;
}

/**
 * @constructor 
 * @param {number=} x 
 * @param {number=} y 
 */
spine.Vector = function (x, y)
{
	this.x = x || 0;
	this.y = y || 0;
}

/** @type {number} */
spine.Vector.prototype.x = 0;
/** @type {number} */
spine.Vector.prototype.y = 0;

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other 
 */
spine.Vector.prototype.copy = function (other)
{
	this.x = other.x;
	this.y = other.y;
	return this;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} a 
 * @param {spine.Vector} b 
 * @param {spine.Vector=} out 
 */
spine.Vector.add = function (a, b, out)
{
	out = out || new spine.Vector();
	out.x = a.x + b.x;
	out.y = a.y + b.y;
	return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other 
 * @param {spine.Vector=} out 
 */
spine.Vector.prototype.add = function (other, out)
{
	return spine.Vector.add(this, other, out);
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other 
 */
spine.Vector.prototype.selfAdd = function (other)
{
	//return spine.Vector.add(this, other, this);
	this.x += other.x;
	this.y += other.y;
	return this;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} a 
 * @param {spine.Vector} b 
 * @param {number} pct 
 * @param {spine.Vector=} out 
 */
spine.Vector.tween = function (a, b, pct, out)
{
	out = out || new spine.Vector();
	out.x = spine.tween(a.x, b.x, pct);
	out.y = spine.tween(a.y, b.y, pct);
	return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other 
 * @param {number} pct 
 * @param {spine.Vector=} out 
 */
spine.Vector.prototype.tween = function (other, pct, out)
{
	return spine.Vector.tween(this, other, pct, out);
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other 
 * @param {number} pct 
 */
spine.Vector.prototype.selfTween = function (other, pct)
{
	return spine.Vector.tween(this, other, pct, this);
}

/**
 * @constructor 
 * @extends {spine.Vector} 
 */
spine.Position = function ()
{
	goog.base(this, 0, 0);
}

goog.inherits(spine.Position, spine.Vector);

/**
 * @constructor 
 * @extends {spine.Angle} 
 */
spine.Rotation = function ()
{
	goog.base(this, 0);
}

goog.inherits(spine.Rotation, spine.Angle);

/**
 * @constructor 
 * @extends {spine.Vector} 
 */
spine.Scale = function ()
{
	goog.base(this, 1, 1);
}

goog.inherits(spine.Scale, spine.Vector);

/**
 * @return {spine.Scale}
 */
spine.Scale.prototype.selfIdentity = function ()
{
	this.x = 1;
	this.y = 1;
	return this;
}

/**
 * @constructor 
 */
spine.Space = function ()
{
	var space = this;
	space.position = new spine.Position();
	space.rotation = new spine.Rotation();
	space.scale = new spine.Scale();
}

/** @type {spine.Position} */
spine.Space.prototype.position;
/** @type {spine.Rotation} */
spine.Space.prototype.rotation;
/** @type {spine.Scale} */
spine.Space.prototype.scale;

/**
 * @return {spine.Space} 
 * @param {spine.Space} other 
 */
spine.Space.prototype.copy = function (other)
{
	var space = this;
	space.position.copy(other.position);
	space.rotation.copy(other.rotation);
	space.scale.copy(other.scale);
	return space;
}

/**
 * @return {spine.Space} 
 * @param {Object.<string,?>} json 
 */
spine.Space.prototype.load = function (json)
{
	var space = this;
	space.position.x = spine.loadFloat(json, 'x', 0);
	space.position.y = spine.loadFloat(json, 'y', 0);
	space.rotation.deg = spine.loadFloat(json, 'rotation', 0);
	space.scale.x = spine.loadFloat(json, 'scaleX', 1);
	space.scale.y = spine.loadFloat(json, 'scaleY', 1);
	return space;
}

/**
 * @return {boolean} 
 * @param {spine.Space} a 
 * @param {spine.Space} b 
 * @param {number=} epsilon 
 */
spine.Space.equal = function (a, b, epsilon)
{
	epsilon = epsilon || 1e-6;
	if (Math.abs(a.position.x - b.position.x) > epsilon) { return false; }
	if (Math.abs(a.position.y - b.position.y) > epsilon) { return false; }
	if (Math.abs(a.rotation.rad - b.rotation.rad) > epsilon) { return false; }
	if (Math.abs(a.scale.x - b.scale.x) > epsilon) { return false; }
	if (Math.abs(a.scale.y - b.scale.y) > epsilon) { return false; }
	return true;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space=} out 
 */
spine.Space.identity = function (out)
{
	out = out || new spine.Space();
	out.position.x = 0;
	out.position.y = 0;
	out.rotation.rad = 0;
	out.scale.x = 1;
	out.scale.y = 1;
	return out;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space} space 
 * @param {number} x 
 * @param {number} y 
 */
spine.Space.translate = function (space, x, y)
{
	x *= space.scale.x;
	y *= space.scale.y;
	var rad = space.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	space.position.x += tx;
	space.position.y += ty;
	return space;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space} space 
 * @param {number} rad 
 */
spine.Space.rotate = function (space, rad)
{
	space.rotation.rad += rad;
	space.rotation.rad = spine.wrapAngleRadians(space.rotation.rad);
	return space;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space} space 
 * @param {number} x 
 * @param {number} y 
 */
spine.Space.scale = function (space, x, y)
{
	space.scale.x *= x;
	space.scale.y *= y;
	return space;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space} space 
 * @param {spine.Space=} out 
 */
spine.Space.invert = function (space, out)
{
	// invert
	// out.sca = space.sca.inv();
	// out.rot = space.rot.inv();
	// out.pos = space.pos.neg().rotate(space.rot.inv()).mul(space.sca.inv());

	out = out || new spine.Space();
	var inv_scale_x = 1 / space.scale.x;
	var inv_scale_y = 1 / space.scale.y;
	var inv_rotation = -space.rotation.rad;
	var inv_x = -space.position.x;
	var inv_y = -space.position.y;
	out.scale.x = inv_scale_x;
	out.scale.y = inv_scale_y;
	out.rotation.rad = inv_rotation;
	var x = inv_x;
	var y = inv_y;
	var rad = inv_rotation;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.position.x = tx * inv_scale_x;
	out.position.y = ty * inv_scale_y;
	return out;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space} a 
 * @param {spine.Space} b 
 * @param {spine.Space=} out 
 */
spine.Space.combine = function (a, b, out)
{
	// combine
	// out.pos = b.pos.mul(a.sca).rotate(a.rot).add(a.pos);
	// out.rot = b.rot.mul(a.rot);
	// out.sca = b.sca.mul(a.sca);

	out = out || new spine.Space();
	var x = b.position.x * a.scale.x;
	var y = b.position.y * a.scale.y;
	var rad = a.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.position.x = tx + a.position.x;
	out.position.y = ty + a.position.y;
	out.rotation.rad = spine.wrapAngleRadians(b.rotation.rad + a.rotation.rad);
	out.scale.x = b.scale.x * a.scale.x;
	out.scale.y = b.scale.y * a.scale.y;
	return out;
}

/**
 * @return {spine.Space} 
 * @param {spine.Space} ab 
 * @param {spine.Space} a 
 * @param {spine.Space=} out 
 */
spine.Space.extract = function (ab, a, out)
{
	// extract
	// out.sca = ab.sca.mul(a.sca.inv());
	// out.rot = ab.rot.mul(a.rot.inv());
	// out.pos = ab.pos.add(a.pos.neg()).rotate(a.rot.inv()).mul(a.sca.inv());

	out = out || new spine.Space();
	out.scale.x = ab.scale.x / a.scale.x;
	out.scale.y = ab.scale.y / a.scale.y;
	out.rotation.rad = spine.wrapAngleRadians(ab.rotation.rad - a.rotation.rad);
	var x = ab.position.x - a.position.x;
	var y = ab.position.y - a.position.y;
	var rad = -a.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.position.x = tx / a.scale.x;
	out.position.y = ty / a.scale.y;
	return out;
}

/**
 * @return {spine.Vector} 
 * @param {spine.Space} space 
 * @param {spine.Vector} v 
 * @param {spine.Vector=} out 
 */
spine.Space.transform = function (space, v, out)
{
	out = out || new spine.Vector();
	var x = v.x * space.scale.x;
	var y = v.y * space.scale.y;
	var rad = space.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.x = tx + space.position.x;
	out.y = ty + space.position.y;
	return out;
}

/**
 * @return {spine.Vector} 
 * @param {spine.Space} space 
 * @param {spine.Vector} v 
 * @param {spine.Vector=} out 
 */
spine.Space.untransform = function (space, v, out)
{
	out = out || new spine.Vector();
	var x = v.x - space.position.x;
	var y = v.y - space.position.y;
	var rad = -space.rotation.rad;
	var c = Math.cos(rad);
	var s = Math.sin(rad);
	var tx = c*x - s*y;
	var ty = s*x + c*y;
	out.x = tx / space.scale.x;
	out.y = ty / space.scale.y;
	return out;
}

/**
 * @constructor 
 */
spine.Bone = function ()
{
	var bone = this;
	bone.local_space = new spine.Space();
	bone.world_space = new spine.Space();
}

/** @type {string} */
spine.Bone.prototype.parent_key = "";
/** @type {number} */
spine.Bone.prototype.length = 0;
/** @type {spine.Space} */
spine.Bone.prototype.local_space;
/** @type {spine.Space} */
spine.Bone.prototype.world_space;
/** @type {boolean} */
spine.Bone.prototype.inherit_rotation = true;
/** @type {boolean} */
spine.Bone.prototype.inherit_scale = true;

/**
 * @return {spine.Bone} 
 * @param {spine.Bone} other 
 */
spine.Bone.prototype.copy = function (other)
{
	var bone = this;
	bone.parent_key = other.parent_key;
	bone.length = other.length;
	bone.local_space.copy(other.local_space);
	bone.world_space.copy(other.world_space);
	bone.inherit_rotation = other.inherit_rotation;
	bone.inherit_scale = other.inherit_scale;
	return bone;
}

/**
 * @return {spine.Bone} 
 * @param {Object.<string,?>} json 
 */
spine.Bone.prototype.load = function (json)
{
	var bone = this;
	bone.parent_key = spine.loadString(json, 'parent', "");
	bone.length = spine.loadFloat(json, 'length', 0);
	bone.local_space.load(json);
	bone.world_space.copy(bone.local_space);
	bone.inherit_rotation = spine.loadBool(json, 'inheritRotation', true);
	bone.inherit_scale = spine.loadBool(json, 'inheritScale', true);
	return bone;
}

/**
 * @return {spine.Space}
 * @param {spine.Bone} bone 
 * @param {Object.<string,spine.Bone>} bones 
 * @param {spine.Space=} out 
 */
spine.Bone.flatten = function (bone, bones, out)
{
	out = out || new spine.Space();

	var parent_bone = bones[bone.parent_key];
	if (parent_bone)
	{
		spine.Bone.flatten(parent_bone, bones, out);
	}
	else
	{
		spine.Space.identity(out);
	}

	//spine.Space.combine(out, bone.local_space, out);

	spine.Space.translate(out, bone.local_space.position.x, bone.local_space.position.y);

	if (bone.inherit_rotation)
	{
		spine.Space.rotate(out, bone.local_space.rotation.rad);
	}
	else
	{
		out.rotation.copy(bone.local_space.rotation);
	}

	if (bone.inherit_scale)
	{
		spine.Space.scale(out, bone.local_space.scale.x, bone.local_space.scale.y);
	}
	else
	{
		out.scale.copy(bone.local_space.scale);
	}

	return out;
}

/**
 * @return {spine.Space}
 * @param {spine.Bone} bone 
 * @param {Object.<string,spine.Bone>} bones 
 */
spine.Bone.updateWorldSpace = function (bone, bones)
{
	var parent_bone = bones[bone.parent_key];
	if (parent_bone)
	{
		bone.world_space.position.copy(parent_bone.world_space.position);

		if (bone.inherit_rotation)
		{
			bone.world_space.rotation.copy(parent_bone.world_space.rotation);
		}
		else
		{
			bone.world_space.rotation.selfIdentity();
		}

		if (bone.inherit_scale)
		{
			bone.world_space.scale.copy(parent_bone.world_space.scale);
		}
		else
		{
			bone.world_space.scale.selfIdentity();
		}

		spine.Space.combine(bone.world_space, bone.local_space, bone.world_space);
	}
	else
	{
		bone.world_space.copy(bone.local_space);
	}
	return bone.world_space;
}

/**
 * @constructor 
 */
spine.IkConstraint = function ()
{
	var ik_constraint = this;
	ik_constraint.bone_keys = [];
}

/** @type {string} */
spine.IkConstraint.prototype.name = "";
/** @type {Array.<string>} */
spine.IkConstraint.prototype.bone_keys;
/** @type {string} */
spine.IkConstraint.prototype.target_key = "";
/** @type {number} */
spine.IkConstraint.prototype.mix = 1;
/** @type {boolean} */
spine.IkConstraint.prototype.bend_positive = true;

/**
 * @return {spine.IkConstraint} 
 * @param {Object.<string,?>} json 
 */
spine.IkConstraint.prototype.load = function (json)
{
	var ik_constraint = this;
	ik_constraint.name = spine.loadString(json, 'name', "");
	ik_constraint.bone_keys = json['bones'] || [];
	ik_constraint.target_key = spine.loadString(json, 'target', "");
	ik_constraint.mix = spine.loadFloat(json, 'mix', 1);
	ik_constraint.bend_positive = spine.loadBool(json, 'bendPositive', true);
	return ik_constraint;
}

/**
 * @constructor 
 */
spine.Slot = function ()
{
	var slot = this;
	slot.color = new spine.Color();
}

/** @type {string} */
spine.Slot.prototype.bone_key = "";
/** @type {spine.Color} */
spine.Slot.prototype.color;
/** @type {string} */
spine.Slot.prototype.attachment_key = "";
/** @type {string} */
spine.Slot.prototype.blend = "normal";

/**
 * @return {spine.Slot} 
 * @param {spine.Slot} other 
 */
spine.Slot.prototype.copy = function (other)
{
	var slot = this;
	slot.bone_key = other.bone_key;
	slot.color.copy(other.color);
	slot.attachment_key = other.attachment_key;
	slot.blend = other.blend;
	return slot;
}

/**
 * @return {spine.Slot} 
 * @param {Object.<string,?>} json 
 */
spine.Slot.prototype.load = function (json)
{
	var slot = this;
	slot.bone_key = spine.loadString(json, 'bone', "");
	slot.color.load(json.color);
	slot.attachment_key = spine.loadString(json, 'attachment', "");
	slot.blend = spine.loadString(json, 'blend', "normal");
	return slot;
}

/**
 * @constructor 
 * @param {string} type 
 */
spine.Attachment = function (type)
{
	this.type = type;
}

/** @type {string} */
spine.Attachment.prototype.type = "region";
/** @type {string} */
spine.Attachment.prototype.name = "";
/** @type {string} */
spine.Attachment.prototype.path = "";

/**
 * @return {spine.Attachment} 
 * @param {Object.<string,?>} json 
 */
spine.Attachment.prototype.load = function (json)
{
	var attachment = this;
	var attachment_type = spine.loadString(json, 'type', "region");
	if (attachment_type !== attachment.type)
	{
		throw new Error();
	}
	attachment.name = spine.loadString(json, 'name', "");
	attachment.path = spine.loadString(json, 'path', "");
	return attachment;
}

/**
 * @constructor 
 * @extends {spine.Attachment} 
 */
spine.RegionAttachment = function ()
{
	goog.base(this, 'region');
	this.local_space = new spine.Space();
	this.world_space = new spine.Space();
}

goog.inherits(spine.RegionAttachment, spine.Attachment);

/** @type {spine.Space} */
spine.RegionAttachment.prototype.local_space;
/** @type {spine.Space} */
spine.RegionAttachment.prototype.world_space;
/** @type {number} */
spine.RegionAttachment.prototype.width = 0;
/** @type {number} */
spine.RegionAttachment.prototype.height = 0;

/**
 * @return {spine.Attachment} 
 * @param {Object.<string,?>} json 
 */
spine.RegionAttachment.prototype.load = function (json)
{
	goog.base(this, 'load', json);

	var attachment = this;
	attachment.local_space.load(json);
	attachment.world_space.copy(attachment.local_space);
	attachment.width = spine.loadFloat(json, 'width', 0);
	attachment.height = spine.loadFloat(json, 'height', 0);
	return attachment;
}

/**
 * @constructor 
 * @extends {spine.Attachment} 
 */
spine.BoundingBoxAttachment = function ()
{
	goog.base(this, 'boundingbox');
	this.vertices = [];
}

goog.inherits(spine.BoundingBoxAttachment, spine.Attachment);

/**
 * @type {Array.<number>}
 */
spine.BoundingBoxAttachment.prototype.vertices;

/**
 * @return {spine.Attachment} 
 * @param {Object.<string,?>} json 
 */
spine.BoundingBoxAttachment.prototype.load = function (json)
{
	goog.base(this, 'load', json);

	var attachment = this;
	/// The x/y pairs that make up the vertices of the polygon.
	attachment.vertices = json.vertices || [];
	return attachment;
}

/**
 * @constructor 
 * @extends {spine.Attachment} 
 */
spine.MeshAttachment = function ()
{
	goog.base(this, 'mesh');
	this.color = new spine.Color();
	this.triangles = [];
	this.edges = [];
	this.vertices = [];
	this.uvs = [];
}

goog.inherits(spine.MeshAttachment, spine.Attachment);

/**
 * @type {spine.Color}
 */
spine.MeshAttachment.prototype.color;

/**
 * @type {Array.<number>}
 */
spine.MeshAttachment.prototype.triangles;

/**
 * @type {Array.<number>}
 */
spine.MeshAttachment.prototype.edges;

/**
 * @type {Array.<number>}
 */
spine.MeshAttachment.prototype.vertices;

/**
 * @type {Array.<number>}
 */
spine.MeshAttachment.prototype.uvs;

/**
 * @type {number}
 */
spine.MeshAttachment.prototype.hull = 0;

/**
 * @return {spine.Attachment} 
 * @param {Object.<string,?>} json 
 */
spine.MeshAttachment.prototype.load = function (json)
{
	goog.base(this, 'load', json);

	var attachment = this;
	attachment.color.load(json.color);
	attachment.triangles = json.triangles || [];
	attachment.edges = json.edges || [];
	attachment.vertices = json.vertices || [];
	attachment.uvs = json.uvs || [];
	attachment.hull = spine.loadInt(json, 'hull', 0);
	return attachment;
}

/**
 * @constructor 
 * @extends {spine.Attachment} 
 */
spine.SkinnedMeshAttachment = function ()
{
	goog.base(this, 'skinnedmesh');
	this.color = new spine.Color();
	this.triangles = [];
	this.edges = [];
	this.vertices = [];
	this.uvs = [];
}

goog.inherits(spine.SkinnedMeshAttachment, spine.Attachment);

/**
 * @type {spine.Color}
 */
spine.SkinnedMeshAttachment.prototype.color;

/**
 * @type {Array.<number>}
 */
spine.SkinnedMeshAttachment.prototype.triangles;

/**
 * @type {Array.<number>}
 */
spine.SkinnedMeshAttachment.prototype.edges;

/**
 * @type {Array.<number>}
 */
spine.SkinnedMeshAttachment.prototype.vertices;

/**
 * @type {Array.<number>}
 */
spine.SkinnedMeshAttachment.prototype.uvs;

/**
 * @type {number}
 */
spine.SkinnedMeshAttachment.prototype.hull = 0;

/**
 * @return {spine.Attachment} 
 * @param {Object.<string,?>} json 
 */
spine.SkinnedMeshAttachment.prototype.load = function (json)
{
	goog.base(this, 'load', json);

	var attachment = this;
	attachment.color.load(json.color);
	attachment.triangles = json.triangles || [];
	attachment.edges = json.edges || [];
	attachment.vertices = json.vertices || [];
	attachment.uvs = json.uvs || [];
	attachment.hull = spine.loadInt(json, 'hull', 0);
	return attachment;
}

/**
 * @constructor 
 */
spine.SkinSlot = function ()
{
	var skin_slot = this;
	skin_slot.attachments = {};
}

/** @type {Object.<string,spine.Attachment>} */
spine.SkinSlot.prototype.attachments;

/**
 * @return {spine.SkinSlot} 
 * @param {Object.<string,?>} json 
 */
spine.SkinSlot.prototype.load = function (json)
{
	var skin_slot = this;
	for (var attachment_key in json)
	{
		var json_attachment = json[attachment_key];
		switch (json_attachment.type)
		{
		case 'region':
		default:
			skin_slot.attachments[attachment_key] = new spine.RegionAttachment().load(json_attachment);
			break;
		case 'boundingbox':
			skin_slot.attachments[attachment_key] = new spine.BoundingBoxAttachment().load(json_attachment);
			break;
		case 'mesh':
			skin_slot.attachments[attachment_key] = new spine.MeshAttachment().load(json_attachment);
			break;
		case 'skinnedmesh':
			skin_slot.attachments[attachment_key] = new spine.SkinnedMeshAttachment().load(json_attachment);
			break;
		}
	}
	return skin_slot;
}

/**
 * @constructor 
 */
spine.Skin = function ()
{
	var skin = this;
	skin.slots = {};
}

/** @type {Object.<string,spine.SkinSlot>} */
spine.Skin.prototype.slots;

/**
 * @return {spine.Skin} 
 * @param {Object.<string,?>} json 
 */
spine.Skin.prototype.load = function (json)
{
	var skin = this;
	for (var slot_key in json)
	{
		skin.slots[slot_key] = new spine.SkinSlot().load(json[slot_key]);
	}
	return skin;
}

/**
 * @return {void}
 * @param {function(string, spine.SkinSlot, string, spine.Attachment):void} callback 
 */
spine.Skin.prototype.iterateAttachments = function (callback)
{
	var skin = this;
	for (var slot_key in skin.slots)
	{
		var skin_slot = skin.slots[slot_key];
		for (var attachment_key in skin_slot.attachments)
		{
			var attachment = skin_slot.attachments[attachment_key];
			callback(slot_key, skin_slot, attachment.path || attachment.name || attachment_key, attachment);
		}
	}
}

/**
 * @constructor
 */
spine.Event = function ()
{
}

/** @type {string} */
spine.Event.prototype.name = "";
/** @type {number} */
spine.Event.prototype.int_value = 0;
/** @type {number} */
spine.Event.prototype.float_value = 0;
/** @type {string} */
spine.Event.prototype.string_value = "";

/**
 * @return {spine.Event}
 * @param {spine.Event} other 
 */
spine.Event.prototype.copy = function (other)
{
	this.name = other.name;
	this.int_value = other.int_value;
	this.float_value = other.float_value;
	this.string_value = other.string_value;
	return this;
}

/**
 * @return {spine.Event}
 * @param {Object.<string,?>} json 
 */
spine.Event.prototype.load = function (json)
{
	if (typeof(json['name']) === 'string')
	{
		this.name = spine.loadString(json, 'name', "");
	}
	if (typeof(json['int']) === 'string')
	{
		this.int_value = spine.loadInt(json, 'int', 0);
	}
	if (typeof(json['float']) === 'string')
	{
		this.float_value = spine.loadFloat(json['float'], 0);
	}
	if (typeof(json['string']) === 'string')
	{
		this.string_value = spine.loadString(json, 'string', "");
	}

	return this;
}

/**
 * @constructor 
 */
spine.Keyframe = function ()
{
}

/** @type {number} */
spine.Keyframe.prototype.time = 0;

/**
 * @return {spine.Keyframe} 
 */
spine.Keyframe.prototype.drop = function ()
{
	this.time = 0;
	return this;
}

/**
 * @return {spine.Keyframe} 
 * @param {Object.<string,?>} json 
 */
spine.Keyframe.prototype.load = function (json)
{
	this.time = 1000 * spine.loadFloat(json, 'time', 0); // convert to ms
	return this;
}

/**
 * @return {spine.Keyframe} 
 * @param {Object.<string,?>} json 
 */
spine.Keyframe.prototype.save = function (json)
{
	spine.saveFloat(json, 'time', this.time / 1000, 0); // convert to s
	return this;
}

/**
 * @return {number} 
 * @param {Array.<spine.Keyframe>} array 
 * @param {number} time 
 */
spine.Keyframe.find = function (array, time)
{
	if (!array) { return -1; }
	if (array.length <= 0) { return -1; }
	if (time < array[0].time) { return -1; }
	var last = array.length - 1;
	if (time >= array[last].time) { return last; }
	var lo = 0;
	var hi = last;
	if (hi === 0) { return 0; }
	var current = hi >> 1;
	while (true)
	{
		if (array[current + 1].time <= time) { lo = current + 1; } else { hi = current; }
		if (lo === hi) { return lo; }
		current = (lo + hi) >> 1;
	}
}

/**
 * @return {number} 
 * @param {spine.Keyframe} a 
 * @param {spine.Keyframe} b 
 */
spine.Keyframe.compare = function (a, b)
{
	return a.time - b.time;
}

/**
 * @constructor 
 * @extends {spine.Keyframe} 
 */
spine.BoneKeyframe = function ()
{
	goog.base(this);
	this.curve = new spine.Curve();
}

goog.inherits(spine.BoneKeyframe, spine.Keyframe);

/** @type {spine.Curve} */
spine.BoneKeyframe.prototype.curve;

/**
 * @return {spine.BoneKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.BoneKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.curve.load(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.BoneKeyframe} 
 */
spine.TranslateKeyframe = function ()
{
	goog.base(this);
	this.position = new spine.Position();
}

goog.inherits(spine.TranslateKeyframe, spine.BoneKeyframe);

/** @type {spine.Position} */
spine.TranslateKeyframe.prototype.position;

/**
 * @return {spine.TranslateKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.TranslateKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.position.x = spine.loadFloat(json, 'x', 0);
	this.position.y = spine.loadFloat(json, 'y', 0);
	return this;
}

/**
 * @constructor 
 * @extends {spine.BoneKeyframe} 
 */
spine.RotateKeyframe = function ()
{
	goog.base(this);
	this.rotation = new spine.Rotation();
}

goog.inherits(spine.RotateKeyframe, spine.BoneKeyframe);

/** @type {spine.Rotation} */
spine.RotateKeyframe.prototype.rotation;

/**
 * @return {spine.RotateKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.RotateKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.rotation.deg = spine.loadFloat(json, 'angle', 0);
	return this;
}

/**
 * @constructor 
 * @extends {spine.BoneKeyframe} 
 */
spine.ScaleKeyframe = function ()
{
	goog.base(this);
	this.scale = new spine.Scale();
}

goog.inherits(spine.ScaleKeyframe, spine.BoneKeyframe);

/** @type {spine.Scale} */
spine.ScaleKeyframe.prototype.scale;

/**
 * @return {spine.ScaleKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.ScaleKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.scale.x = spine.loadFloat(json, 'x', 1);
	this.scale.y = spine.loadFloat(json, 'y', 1);
	return this;
}

/**
 * @constructor 
 */
spine.AnimBone = function ()
{
}

/** @type {number} */
spine.AnimBone.prototype.min_time = 0;
/** @type {number} */
spine.AnimBone.prototype.max_time = 0;
/** @type {Array.<spine.TranslateKeyframe>} */
spine.AnimBone.prototype.translate_keyframes = null;
/** @type {Array.<spine.RotateKeyframe>} */
spine.AnimBone.prototype.rotate_keyframes = null;
/** @type {Array.<spine.ScaleKeyframe>} */
spine.AnimBone.prototype.scale_keyframes = null;

/**
 * @return {spine.AnimBone} 
 * @param {Object.<string,?>} json 
 */
spine.AnimBone.prototype.load = function (json)
{
	var anim_bone = this;
	anim_bone.min_time = 0;
	anim_bone.max_time = 0;
	anim_bone.translate_keyframes = null;
	anim_bone.rotate_keyframes = null;
	anim_bone.scale_keyframes = null;

	for (var key in json)
	{
		switch (key)
		{
		case 'translate':
			anim_bone.translate_keyframes = [];
			json.translate.forEach(function (translate_json)
			{
				var translate_keyframe = new spine.TranslateKeyframe().load(translate_json);
				anim_bone.translate_keyframes.push(translate_keyframe);
				anim_bone.min_time = Math.min(anim_bone.min_time, translate_keyframe.time);
				anim_bone.max_time = Math.max(anim_bone.max_time, translate_keyframe.time);
			});
			anim_bone.translate_keyframes = anim_bone.translate_keyframes.sort(spine.Keyframe.compare);
			break;
		case 'rotate':
			anim_bone.rotate_keyframes = [];
			json.rotate.forEach(function (rotate_json)
			{
				var rotate_keyframe = new spine.RotateKeyframe().load(rotate_json);
				anim_bone.rotate_keyframes.push(rotate_keyframe);
				anim_bone.min_time = Math.min(anim_bone.min_time, rotate_keyframe.time);
				anim_bone.max_time = Math.max(anim_bone.max_time, rotate_keyframe.time);
			});
			anim_bone.rotate_keyframes = anim_bone.rotate_keyframes.sort(spine.Keyframe.compare);
			break;
		case 'scale':
			anim_bone.scale_keyframes = [];
			json.scale.forEach(function (scale_json)
			{
				var scale_keyframe = new spine.ScaleKeyframe().load(scale_json);
				anim_bone.scale_keyframes.push(scale_keyframe);
				anim_bone.min_time = Math.min(anim_bone.min_time, scale_keyframe.time);
				anim_bone.max_time = Math.max(anim_bone.max_time, scale_keyframe.time);
			});
			anim_bone.scale_keyframes = anim_bone.scale_keyframes.sort(spine.Keyframe.compare);
			break;
		default:
			console.log("TODO: spine.AnimBone::load", key);
			break;
		}
	}

	return anim_bone;
}

/**
 * @constructor 
 * @extends {spine.Keyframe} 
 */
spine.SlotKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spine.SlotKeyframe, spine.Keyframe);

/**
 * @return {spine.SlotKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.SlotKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	return this;
}

/**
 * @constructor 
 * @extends {spine.SlotKeyframe} 
 */
spine.ColorKeyframe = function ()
{
	goog.base(this);

	this.color = new spine.Color();
	this.curve = new spine.Curve();
}

goog.inherits(spine.ColorKeyframe, spine.SlotKeyframe);

/** @type {spine.Color} */
spine.ColorKeyframe.prototype.color;
/** @type {spine.Curve} */
spine.ColorKeyframe.prototype.curve;

/**
 * @return {spine.ColorKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.ColorKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.color.load(json.color);
	this.curve.load(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.SlotKeyframe} 
 */
spine.AttachmentKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spine.AttachmentKeyframe, spine.SlotKeyframe);


/** @type {string} */
spine.AttachmentKeyframe.prototype.name = "";

/**
 * @return {spine.AttachmentKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.AttachmentKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.name = spine.loadString(json, 'name', "");
	return this;
}

/**
 * @constructor 
 */
spine.AnimSlot = function ()
{
}

/** @type {number} */
spine.AnimSlot.prototype.min_time = 0;
/** @type {number} */
spine.AnimSlot.prototype.max_time = 0;
/** @type {Array.<spine.ColorKeyframe>} */
spine.AnimSlot.prototype.color_keyframes = null;
/** @type {Array.<spine.AttachmentKeyframe>} */
spine.AnimSlot.prototype.attachment_keyframes = null;

/**
 * @return {spine.AnimSlot} 
 * @param {Object.<string,?>} json 
 */
spine.AnimSlot.prototype.load = function (json)
{
	var anim_slot = this;
	anim_slot.min_time = 0;
	anim_slot.max_time = 0;
	anim_slot.color_keyframes = null;
	anim_slot.attachment_keyframes = null;

	for (var key in json)
	{
		switch (key)
		{
		case 'color':
			anim_slot.color_keyframes = [];
			json[key].forEach(function (color)
			{
				var color_keyframe = new spine.ColorKeyframe().load(color);
				anim_slot.min_time = Math.min(anim_slot.min_time, color_keyframe.time);
				anim_slot.max_time = Math.max(anim_slot.max_time, color_keyframe.time);
				anim_slot.color_keyframes.push(color_keyframe);
			});
			anim_slot.color_keyframes = anim_slot.color_keyframes.sort(spine.Keyframe.compare);
			break;
		case 'attachment':
			anim_slot.attachment_keyframes = [];
			json[key].forEach(function (attachment)
			{
				;
				var attachment_keyframe = new spine.AttachmentKeyframe().load(attachment);
				anim_slot.min_time = Math.min(anim_slot.min_time, attachment_keyframe.time);
				anim_slot.max_time = Math.max(anim_slot.max_time, attachment_keyframe.time);
				anim_slot.attachment_keyframes.push(attachment_keyframe);
			});
			anim_slot.attachment_keyframes = anim_slot.attachment_keyframes.sort(spine.Keyframe.compare);
			break;
		default:
			console.log("TODO: spine.AnimSlot::load", key);
			break;
		}
	}

	return anim_slot;
}

/**
 * @constructor 
 * @extends {spine.Keyframe} 
 */
spine.EventKeyframe = function ()
{
	goog.base(this);
}

goog.inherits(spine.EventKeyframe, spine.Keyframe);

/** @type {string} */
spine.EventKeyframe.prototype.name = "";
/** @type {number} */
spine.EventKeyframe.prototype.int_value = 0;
/** @type {number} */
spine.EventKeyframe.prototype.float_value = 0;
/** @type {string} */
spine.EventKeyframe.prototype.string_value = "";

/**
 * @return {spine.EventKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.EventKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	if (typeof(json['name']) === 'string')
	{
		this.name = spine.loadString(json, 'name', "");
	}
	if (typeof(json['int']) === 'string')
	{
		this.int_value = spine.loadInt(json, 'int', 0);
	}
	if (typeof(json['float']) === 'string')
	{
		this.float_value = spine.loadFloat(json, 'float', 0);
	}
	if (typeof(json['string']) === 'string')
	{
		this.string_value = spine.loadString(json, 'string', "");
	}
	return this;
}

/**
 * @constructor
 */
spine.SlotOffset = function ()
{
}

/** @type {string} */
spine.SlotOffset.prototype.slot = "";
/** @type {number} */
spine.SlotOffset.prototype.offset = 0;

/**
 * @return {spine.SlotOffset}
 * @param {Object.<string,?>} json 
 */
spine.SlotOffset.prototype.load = function (json)
{
	this.slot = spine.loadString(json, 'slot', "");
	this.offset = spine.loadInt(json, 'offset', 0);
	return this;
}

/**
 * @constructor 
 * @extends {spine.Keyframe} 
 */
spine.OrderKeyframe = function ()
{
	goog.base(this);

	this.slot_offsets = [];
}

goog.inherits(spine.OrderKeyframe, spine.Keyframe);

/** @type {Array.<spine.SlotOffset>} */
spine.OrderKeyframe.slot_offsets;

/**
 * @return {spine.OrderKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.OrderKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	var order_keyframe = this;
	order_keyframe.slot_offsets = [];

	for (var key in json)
	{
		switch (key)
		{
		case 'offsets':
			json['offsets'].forEach(function (offset)
			{
				order_keyframe.slot_offsets.push(new spine.SlotOffset().load(offset));
			});
			break;
		}
	}
	return order_keyframe;
}

/**
 * @constructor 
 * @extends {spine.Keyframe} 
 */
spine.IkConstraintKeyframe = function ()
{
	goog.base(this);

	this.curve = new spine.Curve();
}

goog.inherits(spine.IkConstraintKeyframe, spine.Keyframe);

/** @type {spine.Curve} */
spine.IkConstraintKeyframe.prototype.curve;

/** @type {number} */
spine.IkConstraintKeyframe.prototype.mix = 1;

/** @type {boolean} */
spine.IkConstraintKeyframe.prototype.bend_positive = true;

/**
 * @return {spine.IkConstraintKeyframe} 
 * @param {Object.<string,?>} json 
 */
spine.IkConstraintKeyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.curve.load(json);
	this.mix = spine.loadFloat(json, 'mix', 1);
	this.bend_positive = spine.loadBool(json, 'bendPositive', true);
	return this;
}

/**
 * @constructor 
 */
spine.AnimIkConstraint = function ()
{
}

/** @type {number} */
spine.AnimIkConstraint.prototype.min_time = 0;
/** @type {number} */
spine.AnimIkConstraint.prototype.max_time = 0;
/** @type {Array.<spine.IkConstraintKeyframe>} */
spine.AnimIkConstraint.prototype.ik_constraint_keyframes = null;

/**
 * @return {spine.AnimIkConstraint} 
 * @param {Object.<string,?>} json 
 */
spine.AnimIkConstraint.prototype.load = function (json)
{
	var anim_ik_constraint = this;
	anim_ik_constraint.min_time = 0;
	anim_ik_constraint.max_time = 0;
	anim_ik_constraint.ik_constraint_keyframes = null;

	anim_ik_constraint.ik_constraint_keyframes = [];
	json.forEach(function (ik_constraint)
	{
		var ik_constraint_keyframe = new spine.IkConstraintKeyframe().load(ik_constraint);
		anim_ik_constraint.min_time = Math.min(anim_ik_constraint.min_time, ik_constraint_keyframe.time);
		anim_ik_constraint.max_time = Math.max(anim_ik_constraint.max_time, ik_constraint_keyframe.time);
		anim_ik_constraint.ik_constraint_keyframes.push(ik_constraint_keyframe);
	});
	anim_ik_constraint.ik_constraint_keyframes = anim_ik_constraint.ik_constraint_keyframes.sort(spine.Keyframe.compare);

	return anim_ik_constraint;
}

/**
 * @constructor
 */
spine.Animation = function ()
{
}

/** @type {string} */
spine.Animation.prototype.name = "";

/** @type {Object.<string,spine.AnimBone>} */
spine.Animation.prototype.bones = null;
/** @type {Object.<string,spine.AnimSlot>} */
spine.Animation.prototype.slots = null;
/** @type {Array.<spine.EventKeyframe>} */
spine.Animation.prototype.event_keyframes = null;
/** @type {Array.<spine.OrderKeyframe>} */
spine.Animation.prototype.order_keyframes = null;
/** @type {Object.<string,spine.AnimIkConstraint>} */
spine.Animation.prototype.ik_constraints = null;

/** @type {number} */
spine.Animation.prototype.min_time = 0;
/** @type {number} */
spine.Animation.prototype.max_time = 0;
/** @type {number} */
spine.Animation.prototype.length = 0;

/**
 * @return {spine.Animation} 
 * @param {Object.<string,?>} json 
 */
spine.Animation.prototype.load = function (json)
{
	var anim = this;

	anim.bones = null;
	anim.slots = null;
	anim.event_keyframes = null;
	anim.order_keyframes = null;
	anim.ik_constraints = null;

	anim.min_time = 0;
	anim.max_time = 0;

	for (var key in json)
	{
		switch (key)
		{
		case 'bones':
			anim.bones = {};
			for (var bone_key in json[key])
			{
				var anim_bone = new spine.AnimBone().load(json[key][bone_key]);
				anim.min_time = Math.min(anim.min_time, anim_bone.min_time);
				anim.max_time = Math.max(anim.max_time, anim_bone.max_time);
				anim.bones[bone_key] = anim_bone;
			}
			break;
		case 'slots':
			anim.slots = {};
			for (var slot_key in json[key])
			{
				var anim_slot = new spine.AnimSlot().load(json[key][slot_key]);
				anim.min_time = Math.min(anim.min_time, anim_slot.min_time);
				anim.max_time = Math.max(anim.max_time, anim_slot.max_time);
				anim.slots[slot_key] = anim_slot;
			}
			break;
		case 'events':
			anim.event_keyframes = [];
			json[key].forEach(function (event)
			{
				var event_keyframe = new spine.EventKeyframe().load(event);
				anim.min_time = Math.min(anim.min_time, event_keyframe.time);
				anim.max_time = Math.max(anim.max_time, event_keyframe.time);
				anim.event_keyframes.push(event_keyframe);
			});
			anim.event_keyframes = anim.event_keyframes.sort(spine.Keyframe.compare);
			break;
		case 'drawOrder':
		case 'draworder':
			anim.order_keyframes = [];
			json[key].forEach(function (order)
			{
				var order_keyframe = new spine.OrderKeyframe().load(order);
				anim.min_time = Math.min(anim.min_time, order_keyframe.time);
				anim.max_time = Math.max(anim.max_time, order_keyframe.time);
				anim.order_keyframes.push(order_keyframe);
			});
			anim.order_keyframes = anim.order_keyframes.sort(spine.Keyframe.compare);
			break;
		case 'ik':
			anim.ik_constraints = {};
			for (var ik_constraint_key in json[key])
			{
				var anim_ik_constraint = new spine.AnimIkConstraint().load(json[key][ik_constraint_key]);
				anim.min_time = Math.min(anim.min_time, anim_ik_constraint.min_time);
				anim.max_time = Math.max(anim.max_time, anim_ik_constraint.max_time);
				anim.ik_constraints[ik_constraint_key] = anim_ik_constraint;
			}
			break;
		default:
			console.log("TODO: spine.Animation::load", key);
			break;
		}
	}

	anim.length = anim.max_time - anim.min_time;

	return anim;
}

/**
 * @constructor 
 */
spine.Skeleton = function ()
{
}

/** @type {string} */
spine.Skeleton.prototype.hash = "";
/** @type {string} */
spine.Skeleton.prototype.spine = "";
/** @type {number} */
spine.Skeleton.prototype.width = 0;
/** @type {number} */
spine.Skeleton.prototype.height = 0;
/** @type {string} */
spine.Skeleton.prototype.images = "";

/**
 * @return {spine.Skeleton} 
 * @param {Object.<string,?>} json 
 */
spine.Skeleton.prototype.load = function (json)
{
	var skel = this;

	skel.hash = spine.loadString(json, 'hash', "");
	skel.spine = spine.loadString(json, 'spine', "");
	skel.width = spine.loadInt(json, 'width', 0);
	skel.height = spine.loadInt(json, 'height', 0);
	skel.images = spine.loadString(json, 'images', "");

	return skel;
}

/**
 * @constructor 
 */
spine.Data = function ()
{
	var data = this;
	data.skeleton = new spine.Skeleton();
	data.bones = {};
	data.bone_keys = [];
	data.ik_constraints = {};
	data.ik_constraint_keys = [];
	data.slots = {};
	data.slot_keys = [];
	data.skins = {};
	data.skin_keys = [];
	data.events = {};
	data.event_keys = [];
	data.anims = {};
	data.anim_keys = [];
}

/** @type {string} */
spine.Data.prototype.name = "";

/** @type {spine.Skeleton} */
spine.Data.prototype.skeleton = null;
/** @type {Object.<string,spine.Bone>} */
spine.Data.prototype.bones = null;
/** @type {Array.<string>} */
spine.Data.prototype.bone_keys = null;
/** @type {Object.<string,spine.IkConstraint>} */
spine.Data.prototype.ik_constraints = null;
/** @type {Array.<string>} */
spine.Data.prototype.ik_constraint_keys = null;
/** @type {Object.<string,spine.Slot>} */
spine.Data.prototype.slots = null;
/** @type {Array.<string>} */
spine.Data.prototype.slot_keys = null;
/** @type {Object.<string,spine.Skin>} */
spine.Data.prototype.skins = null;
/** @type {Array.<string>} */
spine.Data.prototype.skin_keys = null;
/** @type {Object.<string,spine.Event>} */
spine.Data.prototype.events = null;
/** @type {Array.<string>} */
spine.Data.prototype.event_keys = null;
/** @type {Object.<string,spine.Animation>} */
spine.Data.prototype.anims = null;
/** @type {Array.<string>} */
spine.Data.prototype.anim_keys = null;

/**
 * @return {spine.Data} 
 * @param {?} json 
 */
spine.Data.prototype.load = function (json)
{
	var data = this;

	data.bones = {};
	data.bone_keys = [];
	data.ik_constraints = {};
	data.ik_constraint_keys = [];
	data.slots = {};
	data.slot_keys = [];
	data.skins = {};
	data.skin_keys = [];
	data.events = {};
	data.event_keys = [];
	data.anims = {};
	data.anim_keys = [];

	for (var key in json)
	{
		switch (key)
		{
		case 'skeleton':
			data.skeleton.load(json[key]);
			break;
		case 'bones':
			var json_bones = json[key];
			json_bones.forEach(function (bone, bone_index)
			{
				data.bones[bone.name] = new spine.Bone().load(bone);
				data.bone_keys[bone_index] = bone.name;
			});
			break;
		case 'ik':
			var json_ik = json[key];
			json_ik.forEach(function (ik_constraint, ik_constraint_index)
			{
				data.ik_constraints[ik_constraint.name] = new spine.IkConstraint().load(ik_constraint);
				data.ik_constraint_keys[ik_constraint_index] = ik_constraint.name;
			});
			break;
		case 'slots':
			var json_slots = json[key];
			json_slots.forEach(function (slot, slot_index)
			{
				data.slots[slot.name] = new spine.Slot().load(slot);
				data.slot_keys[slot_index] = slot.name;
			});
			break;
		case 'skins':
			var json_skins = json[key];
			for (var skin_key in json_skins)
			{
				var skin = data.skins[skin_key] = new spine.Skin().load(json_skins[skin_key]);
				data.skin_keys.push(skin_key);
			}
			break;
		case 'events':
			var json_events = json[key];
			for (var event_key in json_events)
			{
				var event = data.events[event_key] = new spine.Event().load(json_events[event_key]);
				event.name = event.name || event_key;
				data.event_keys.push(event_key);
			}
			break;
		case 'animations':
			var json_animations = json[key];
			for (var anim_key in json_animations)
			{
				var anim = data.anims[anim_key] = new spine.Animation().load(json_animations[anim_key]);
				anim.name = anim.name || anim_key;
				data.anim_keys.push(anim_key);
			}
			break;
		default:
			console.log("TODO: spine.Skeleton::load", key);
			break;
		}
	}

	data.iterateBones(function (bone_key, bone)
	{
		spine.Bone.flatten(bone, data.bones, bone.world_space);
	});

	return data;
}

/**
 * @return {spine.Data} 
 * @param {?} json 
 */
spine.Data.prototype.loadSkeleton = function (json)
{
	var data = this;
	data.skeleton.load(json);
	return data;
}

/**
 * @return {spine.Data} 
 * @param {?} json 
 */
spine.Data.prototype.loadEvent = function (name, json)
{
	var data = this;
	var event = data.events[name] = new spine.Event().load(json);
	event.name = event.name || name;
	return data;
}

/**
 * @return {spine.Data} 
 * @param {?} json 
 */
spine.Data.prototype.loadAnimation = function (name, json)
{
	var data = this;
	var anim = data.anims[name] = new spine.Animation().load(json);
	anim.name = anim.name || name;
	return data;
}

/**
 * @return {Object.<string,spine.Skin>}
 */
spine.Data.prototype.getSkins = function ()
{
	var data = this;
	return data.skins;
}

/**
 * @return {Object.<string,spine.Event>}
 */
spine.Data.prototype.getEvents = function ()
{
	var data = this;
	return data.events;
}

/**
 * @return {Object.<string,spine.Animation>}
 */
spine.Data.prototype.getAnims = function ()
{
	var data = this;
	return data.anims;
}

/**
 * @return {void}
 * @param {function(string, spine.Bone):void} callback
 */
spine.Data.prototype.iterateBones = function (callback)
{
	var data = this;
	data.bone_keys.forEach(function (bone_key)
	{
		var data_bone = data.bones[bone_key];
		callback(bone_key, data_bone);
	});
}

/**
 * @return {void}
 * @param {function(string, spine.Slot, spine.SkinSlot, string, spine.Attachment):void} callback
 */
spine.Data.prototype.iterateAttachments = function (skin_key, callback)
{
	var data = this;
	var skin = data.skins[skin_key];
	var default_skin = data.skins['default'];
	data.slot_keys.forEach(function (slot_key)
	{
		var data_slot = data.slots[slot_key];
		var skin_slot = skin.slots[slot_key] || default_skin.slots[slot_key];
		if (!skin_slot) { return; }
		var attachment = skin_slot.attachments[data_slot.attachment_key];
		var attachment_key = (attachment && (attachment.path || attachment.name)) || data_slot.attachment_key;
		callback(slot_key, data_slot, skin_slot, attachment_key, attachment);
	});
}

/**
 * @return {void}
 * @param {function(string, spine.Skin):void} callback
 */
spine.Data.prototype.iterateSkins = function (callback)
{
	var data = this;
	for (var skin_key in data.skins)
	{
		var skin = data.skins[skin_key];
		callback(skin_key, skin);
	}
}

/**
 * @return {void}
 * @param {function(string, spine.Event):void} callback
 */
spine.Data.prototype.iterateEvents = function (callback)
{
	var data = this;
	for (var event_key in data.events)
	{
		var event = data.events[event_key];
		callback(event_key, event);
	}
}

/**
 * @return {void}
 * @param {function(string, spine.Animation):void} callback
 */
spine.Data.prototype.iterateAnims = function (callback)
{
	var data = this;
	for (var anim_key in data.anims)
	{
		var anim = data.anims[anim_key];
		callback(anim_key, anim);
	}
}

/**
 * @constructor 
 * @param {spine.Data=} data 
 */
spine.Pose = function (data)
{
	var pose = this;
	pose.data = data || null;
	pose.bones = {};
	pose.bone_keys = [];
	pose.slots = {};
	pose.slot_keys = [];
	pose.events = [];
}

/** @type {spine.Data} */
spine.Pose.prototype.data;

/** @type {string} */
spine.Pose.prototype.skin_key = "";
/** @type {string} */
spine.Pose.prototype.anim_key = "";
/** @type {number} */
spine.Pose.prototype.time = 0;
/** @type {number} */
spine.Pose.prototype.elapsed_time = 0;

/** @type {boolean} */
spine.Pose.prototype.dirty = true;

/** @type {Object.<string,spine.Bone>} */
spine.Pose.prototype.bones;

/** @type {Array.<string>} */
spine.Pose.prototype.bone_keys;

/** @type {Object.<string,spine.Slot>} */
spine.Pose.prototype.slots;

/** @type {Array.<string>} */
spine.Pose.prototype.slot_keys;

/** @type {Array.<spine.Event>} */
spine.Pose.prototype.events;

/**
 * @return {spine.Skeleton}
 */
spine.Pose.prototype.curSkel = function ()
{
	var pose = this;
	return pose.data && pose.data.skeleton;
}

/**
 * @return {Object.<string,spine.Skin>}
 */
spine.Pose.prototype.getSkins = function ()
{
	var pose = this;
	return pose.data && pose.data.getSkins();
}

/**
 * @return {spine.Skin}
 */
spine.Pose.prototype.curSkin = function ()
{
	var pose = this;
	var skins = pose.getSkins();
	return skins && skins[pose.skin_key];
}

/**
 * @return {string}
 */
spine.Pose.prototype.getSkin = function ()
{
	var pose = this;
	return pose.skin_key;
}

/**
 * @return {void} 
 * @param {string} skin_key
 */
spine.Pose.prototype.setSkin = function (skin_key)
{
	var pose = this;
	if (pose.skin_key !== skin_key)
	{
		pose.skin_key = skin_key;
	}
}

/**
 * @return {Object.<string,spine.Event>}
 */
spine.Pose.prototype.getEvents = function ()
{
	var pose = this;
	return pose.data && pose.data.getEvents();
}

/**
 * @return {Object.<string,spine.Animation>}
 */
spine.Pose.prototype.getAnims = function ()
{
	var pose = this;
	return pose.data && pose.data.getAnims();
}

/**
 * @return {spine.Animation}
 */
spine.Pose.prototype.curAnim = function ()
{
	var pose = this;
	var anims = pose.getAnims();
	return anims && anims[pose.anim_key];
}

/**
 * @return {number}
 */
spine.Pose.prototype.curAnimLength = function ()
{
	var pose = this;
	var anim = pose.curAnim();
	return (anim && anim.length) || 0;
}

/**
 * @return {string}
 */
spine.Pose.prototype.getAnim = function ()
{
	var pose = this;
	return pose.anim_key;
}

/**
 * @return {void} 
 * @param {string} anim_key
 */
spine.Pose.prototype.setAnim = function (anim_key)
{
	var pose = this;
	if (pose.anim_key !== anim_key)
	{
		pose.anim_key = anim_key;
		var anim = pose.curAnim();
		if (anim)
		{
			pose.time = spine.wrap(pose.time, anim.min_time, anim.max_time);
		}
		pose.elapsed_time = 0;
		pose.dirty = true;
	}
}

/**
 * @return {number}
 */
spine.Pose.prototype.getTime = function ()
{
	var pose = this;
	return pose.time;
}

/**
 * @return {void} 
 * @param {number} time 
 */
spine.Pose.prototype.setTime = function (time)
{
	var pose = this;
	var anim = pose.curAnim();
	if (anim)
	{
		time = spine.wrap(time, anim.min_time, anim.max_time);
	}

	if (pose.time !== time)
	{
		pose.time = time;
		pose.elapsed_time = 0;
		pose.dirty = true;
	}
}

/**
 * @return {void}
 * @param {number} elapsed_time
 */
spine.Pose.prototype.update = function (elapsed_time)
{
	var pose = this;
	pose.elapsed_time += elapsed_time;
	pose.dirty = true;
}

/**
 * @return {void}
 */
spine.Pose.prototype.strike = function ()
{
	var pose = this;
	if (!pose.dirty) { return; }
	pose.dirty = false;

	var data = pose.data;

	var anim = pose.curAnim();

	var prev_time = pose.time;
	var elapsed_time = pose.elapsed_time;
	
	pose.time = pose.time + pose.elapsed_time; // accumulate elapsed time
	pose.elapsed_time = 0; // reset elapsed time for next strike
	
	var wrapped_min = false;
	var wrapped_max = false;
	if (anim)
	{
		wrapped_min = (elapsed_time < 0) && (pose.time <= anim.min_time);
		wrapped_max = (elapsed_time > 0) && (pose.time >= anim.max_time);
		pose.time = spine.wrap(pose.time, anim.min_time, anim.max_time);
	}
	
	var time = pose.time;

	var data_bones = data && data.bones;
	var data_bone_keys = data && data.bone_keys;
	var anim_bones = anim && anim.bones;

	data_bone_keys.forEach(function (bone_key)
	{
		var data_bone = data_bones[bone_key];
		var pose_bone = pose.bones[bone_key] || (pose.bones[bone_key] = new spine.Bone());

		// start with a copy of the data bone
		pose_bone.copy(data_bone);

		// tween anim bone if keyframes are available
		var anim_bone = anim_bones && anim_bones[bone_key];
		if (anim_bone)
		{
			var translate_keyframes = anim_bone.translate_keyframes;
			if (translate_keyframes)
			{
				var translate_keyframe_index = spine.Keyframe.find(translate_keyframes, time);
				if (translate_keyframe_index !== -1)
				{
					var translate_keyframe0 = translate_keyframes[translate_keyframe_index];
					var translate_keyframe1 = translate_keyframes[translate_keyframe_index + 1];
					if (translate_keyframe1)
					{
						var pct = (time - translate_keyframe0.time) / (translate_keyframe1.time - translate_keyframe0.time);
						pct = translate_keyframe0.curve.evaluate(pct);
						pose_bone.local_space.position.x += spine.tween(translate_keyframe0.position.x, translate_keyframe1.position.x, pct);
						pose_bone.local_space.position.y += spine.tween(translate_keyframe0.position.y, translate_keyframe1.position.y, pct);
					}
					else
					{
						pose_bone.local_space.position.x += translate_keyframe0.position.x;
						pose_bone.local_space.position.y += translate_keyframe0.position.y;
					}
				}
			}

			var rotate_keyframes = anim_bone.rotate_keyframes;
			if (rotate_keyframes)
			{
				var rotate_keyframe_index = spine.Keyframe.find(rotate_keyframes, time);
				if (rotate_keyframe_index !== -1)
				{
					var rotate_keyframe0 = rotate_keyframes[rotate_keyframe_index];
					var rotate_keyframe1 = rotate_keyframes[rotate_keyframe_index + 1];
					if (rotate_keyframe1)
					{
						var pct = (time - rotate_keyframe0.time) / (rotate_keyframe1.time - rotate_keyframe0.time);
						pct = rotate_keyframe0.curve.evaluate(pct);
						pose_bone.local_space.rotation.rad += spine.tweenAngle(rotate_keyframe0.rotation.rad, rotate_keyframe1.rotation.rad, pct);
					}
					else
					{
						pose_bone.local_space.rotation.rad += rotate_keyframe0.rotation.rad;
					}
				}
			}

			var scale_keyframes = anim_bone.scale_keyframes;
			if (scale_keyframes)
			{
				var scale_keyframe_index = spine.Keyframe.find(scale_keyframes, time);
				if (scale_keyframe_index !== -1)
				{
					var scale_keyframe0 = scale_keyframes[scale_keyframe_index];
					var scale_keyframe1 = scale_keyframes[scale_keyframe_index + 1];
					if (scale_keyframe1)
					{
						var pct = (time - scale_keyframe0.time) / (scale_keyframe1.time - scale_keyframe0.time);
						pct = scale_keyframe0.curve.evaluate(pct);
						pose_bone.local_space.scale.x += spine.tween(scale_keyframe0.scale.x, scale_keyframe1.scale.x, pct) - 1;
						pose_bone.local_space.scale.y += spine.tween(scale_keyframe0.scale.y, scale_keyframe1.scale.y, pct) - 1;
					}
					else
					{
						pose_bone.local_space.scale.x += scale_keyframe0.scale.x - 1;
						pose_bone.local_space.scale.y += scale_keyframe0.scale.y - 1;
					}
				}
			}
		}
	});

	pose.bone_keys = data_bone_keys;

	// ik constraints

	var anim_ik_constraints = anim && anim.ik_constraints;

	data.ik_constraint_keys.forEach(function (ik_constraint_key)
	{
		function clamp (n, lo, hi) { return (n < lo)?(lo):((n > hi)?(hi):(n)); }

		var ik_constraint = data.ik_constraints[ik_constraint_key];
		var ik_constraint_mix = ik_constraint.mix;
		var ik_constraint_bend_positive = ik_constraint.bend_positive;

		var anim_ik_constraint = anim_ik_constraints && anim_ik_constraints[ik_constraint_key];
		if (anim_ik_constraint)
		{
			var ik_constraint_keyframes = anim_ik_constraint.ik_constraint_keyframes;
			if (ik_constraint_keyframes)
			{
				var ik_constraint_keyframe_index = spine.Keyframe.find(ik_constraint_keyframes, time);
				if (ik_constraint_keyframe_index !== -1)
				{
					var ik_constraint_keyframe0 = ik_constraint_keyframes[ik_constraint_keyframe_index];
					var ik_constraint_keyframe1 = ik_constraint_keyframes[ik_constraint_keyframe_index + 1];
					if (ik_constraint_keyframe1)
					{
						var pct = (time - ik_constraint_keyframe0.time) / (ik_constraint_keyframe1.time - ik_constraint_keyframe0.time);
						pct = ik_constraint_keyframe0.curve.evaluate(pct);
						ik_constraint_mix = spine.tween(ik_constraint_keyframe0.mix, ik_constraint_keyframe1.mix, pct);
					}
					else
					{
						ik_constraint_mix = ik_constraint_keyframe0.mix;
					}
					// no tweening ik bend direction
					ik_constraint_bend_positive = ik_constraint_keyframe0.bend_positive;
				}
			}
		}

		var target = pose.bones[ik_constraint.target_key];
		spine.Bone.flatten(target, pose.bones, target.world_space);
		var target_x = target.world_space.position.x;
		var target_y = target.world_space.position.y;
		var alpha = ik_constraint_mix;
		var bend_direction = (ik_constraint_bend_positive)?(1):(-1);

		if (alpha === 0) { return; }

		switch (ik_constraint.bone_keys.length)
		{
		case 1:
			var bone = pose.bones[ik_constraint.bone_keys[0]];
			spine.Bone.flatten(bone, pose.bones, bone.world_space);
			var parent_rotation = 0;
			var bone_parent = pose.bones[bone.parent_key];
			if (bone_parent && bone.inherit_rotation)
			{
				spine.Bone.flatten(bone_parent, pose.bones, bone_parent.world_space);
				parent_rotation = bone_parent.world_space.rotation.rad;
			}
			target_x -= bone.world_space.position.x;
			target_y -= bone.world_space.position.y;
			bone.local_space.rotation.rad = spine.tweenAngle(bone.local_space.rotation.rad, Math.atan2(target_y, target_x) - parent_rotation, alpha);
			break;
		case 2:
			var parent = pose.bones[ik_constraint.bone_keys[0]];
			spine.Bone.flatten(parent, pose.bones, parent.world_space);
			var child = pose.bones[ik_constraint.bone_keys[1]];
			spine.Bone.flatten(child, pose.bones, child.world_space);
			var position = new spine.Vector();
			var parent_parent = pose.bones[parent.parent_key];
			if (parent_parent)
			{
				position.x = target_x;
				position.y = target_y;
				spine.Bone.flatten(parent_parent, pose.bones, parent_parent.world_space);
				spine.Space.untransform(parent_parent.world_space, position, position); // world to local
				target_x = (position.x - parent.local_space.position.x) * parent_parent.world_space.scale.x;
				target_y = (position.y - parent.local_space.position.y) * parent_parent.world_space.scale.y;
			}
			else
			{
				target_x -= parent.local_space.position.x;
				target_y -= parent.local_space.position.y;
			}
			position.copy(child.local_space.position);
			var child_parent = pose.bones[child.parent_key];
			if (child_parent !== parent)
			{
				spine.Bone.flatten(child_parent, pose.bones, child_parent.world_space);
				spine.Space.transform(child_parent.world_space, position, position); // local to world
				spine.Space.untransform(parent.world_space, position, position); // world to local
			}
			var child_x = position.x * parent.world_space.scale.x;
			var child_y = position.y * parent.world_space.scale.y;
			var offset = Math.atan2(child_y, child_x);
			var len1 = Math.sqrt(child_x * child_x + child_y * child_y);
			var len2 = child.length * child.world_space.scale.x;
			var cos_denom = 2 * len1 * len2;
			if (cos_denom < 0.0001)
			{
				child.local_space.rotation.rad = spine.tweenAngle(child.local_space.rotation.rad, Math.atan2(target_y, target_x) - parent.local_space.rotation.rad, alpha);
				return;
			}
			var cos = clamp((target_x * target_x + target_y * target_y - len1 * len1 - len2 * len2) / cos_denom, -1, 1);
			var rad = Math.acos(cos) * bend_direction;
			var sin = Math.sin(rad);
			var adjacent = len2 * cos + len1;
			var opposite = len2 * sin;
			var parent_angle = Math.atan2(target_y * adjacent - target_x * opposite, target_x * adjacent + target_y * opposite);
			parent.local_space.rotation.rad = spine.tweenAngle(parent.local_space.rotation.rad, (parent_angle - offset), alpha);
			var child_angle = rad;
			if (child_parent !== parent)
			{
				child_angle += parent.world_space.rotation.rad - child_parent.world_space.rotation.rad;
			}
			child.local_space.rotation.rad = spine.tweenAngle(child.local_space.rotation.rad, (child_angle + offset), alpha);
			break;
		}
	});

	pose.iterateBones(function (bone_key, bone)
	{
		spine.Bone.flatten(bone, pose.bones, bone.world_space);
	});

	var data_slots = data && data.slots;
	var data_slot_keys = data && data.slot_keys;
	var anim_slots = anim && anim.slots;

	data_slot_keys.forEach(function (slot_key)
	{
		var data_slot = data_slots[slot_key];
		var pose_slot = pose.slots[slot_key] || (pose.slots[slot_key] = new spine.Slot());

		// start with a copy of the data slot
		pose_slot.copy(data_slot);

		// tween anim slot if keyframes are available
		var anim_slot = anim_slots && anim_slots[slot_key];
		if (anim_slot)
		{
			var color_keyframes = anim_slot.color_keyframes;
			if (color_keyframes)
			{
				var color_keyframe_index = spine.Keyframe.find(color_keyframes, time);
				if (color_keyframe_index !== -1)
				{
					var color_keyframe0 = color_keyframes[color_keyframe_index];
					var color_keyframe1 = color_keyframes[color_keyframe_index + 1];
					if (color_keyframe1)
					{
						var pct = (time - color_keyframe0.time) / (color_keyframe1.time - color_keyframe0.time);
						pct = color_keyframe0.curve.evaluate(pct);
						pose_slot.color.r = spine.tween(color_keyframe0.color.r, color_keyframe1.color.r, pct);
						pose_slot.color.g = spine.tween(color_keyframe0.color.g, color_keyframe1.color.g, pct);
						pose_slot.color.b = spine.tween(color_keyframe0.color.b, color_keyframe1.color.b, pct);
						pose_slot.color.a = spine.tween(color_keyframe0.color.a, color_keyframe1.color.a, pct);
					}
					else
					{
						pose_slot.color.r = color_keyframe0.color.r;
						pose_slot.color.g = color_keyframe0.color.g;
						pose_slot.color.b = color_keyframe0.color.b;
						pose_slot.color.a = color_keyframe0.color.a;
					}
				}
			}

			var attachment_keyframes = anim_slot.attachment_keyframes;
			if (attachment_keyframes)
			{
				var attachment_keyframe_index = spine.Keyframe.find(attachment_keyframes, time);
				if (attachment_keyframe_index !== -1)
				{
					var attachment_keyframe0 = attachment_keyframes[attachment_keyframe_index];
					// no tweening attachments
					pose_slot.attachment_key = attachment_keyframe0.name;
				}
			}
		}
	});

	pose.slot_keys = data_slot_keys;

	pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
	{
		if (!attachment) { return; }

		switch (attachment.type)
		{
		case 'region':
			var bone = pose.bones[slot.bone_key];
			spine.Space.combine(bone.world_space, attachment.local_space, attachment.world_space);
			break;
		}
	});

	if (anim)
	{
		var order_keyframe_idx = spine.Keyframe.find(anim.order_keyframes, time);
		if (order_keyframe_idx !== -1)
		{
			pose.slot_keys = data_slot_keys.slice(0); // copy array before reordering

			var order_keyframe = anim.order_keyframes[order_keyframe_idx];
			var slot_offsets = order_keyframe.slot_offsets;
			slot_offsets.forEach(function (slot_offset)
			{
				var slot_index = pose.slot_keys.indexOf(slot_offset.slot);
				if (slot_index !== -1)
				{
					// delete old position
					pose.slot_keys.splice(slot_index, 1);
					// insert new position
					pose.slot_keys.splice(slot_index + slot_offset.offset, 0, slot_offset.slot);
				}
			});
		}
	}
	
	pose.events.length = 0;

	if (anim)
	{
		var data_events = pose.getEvents()

		var add_event = function (event_keyframe)
		{
			var pose_event = new spine.Event();
			var data_event = data_events[event_keyframe.name];
			if (data_event)
			{
				pose_event.copy(data_event);
			}
			pose_event.int_value = event_keyframe.int_value || pose_event.int_value;
			pose_event.float_value = event_keyframe.float_value || pose_event.float_value;
			pose_event.string_value = event_keyframe.string_value || pose_event.string_value;
			pose.events.push(pose_event);
		}

		if (wrapped_min)
		{
			var event_keyframe_idx = spine.Keyframe.find(anim.event_keyframes, anim.min_time);
			if (event_keyframe_idx !== -1)
			{
				var event_keyframe = anim.event_keyframes[event_keyframe_idx];
				add_event(event_keyframe);
			}
		}
		else if (wrapped_max)
		{
			var event_keyframe_idx = spine.Keyframe.find(anim.event_keyframes, anim.max_time);
			if (event_keyframe_idx !== -1)
			{
				var event_keyframe = anim.event_keyframes[event_keyframe_idx];
				add_event(event_keyframe);
			}
		}

		var event_keyframe_idx = spine.Keyframe.find(anim.event_keyframes, time);
		if (event_keyframe_idx !== -1)
		{
			var event_keyframe = anim.event_keyframes[event_keyframe_idx];
			if (((elapsed_time < 0) && ((time <= event_keyframe.time) && (event_keyframe.time <= prev_time))) || 
				((elapsed_time > 0) && ((prev_time <= event_keyframe.time) && (event_keyframe.time <= time))))
			{
				add_event(event_keyframe);
			}
		}
	}
}

/**
 * @return {void}
 * @param {function(string, spine.Bone):void} callback
 */
spine.Pose.prototype.iterateBones = function (callback)
{
	var pose = this;
	pose.bone_keys.forEach(function (bone_key)
	{
		var bone = pose.bones[bone_key];
		callback(bone_key, bone);
	});
}

/**
 * @return {void}
 * @param {function(string, spine.Slot, spine.SkinSlot, string, spine.Attachment):void} callback
 */
spine.Pose.prototype.iterateAttachments = function (callback)
{
	var pose = this;
	var skin = pose.curSkin();
	if (!skin) { return; }
	var skins = pose.getSkins();
	var default_skin = skins['default'];
	pose.slot_keys.forEach(function (slot_key)
	{
		var pose_slot = pose.slots[slot_key];
		var skin_slot = skin.slots[slot_key] || default_skin.slots[slot_key];
		if (!skin_slot) { return; }
		var attachment = skin_slot.attachments[pose_slot.attachment_key];
		var attachment_key = (attachment && (attachment.path || attachment.name)) || pose_slot.attachment_key;
		callback(slot_key, pose_slot, skin_slot, attachment_key, attachment);
	});
}

spine.deprecated = function ()
{
	console.log("deprecated");
}

Object.defineProperty(spine, 'color', { get: function () { spine.deprecated(); return spine.Color; } });

Object.defineProperty(spine, 'skel_bone', { get: function () { spine.deprecated(); return spine.Bone; } });
Object.defineProperty(spine.Bone.prototype, 'x', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.local_space.position.x; } });
Object.defineProperty(spine.Bone.prototype, 'y', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.local_space.position.y; } });
Object.defineProperty(spine.Bone.prototype, 'rotation', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.local_space.rotation.deg; } });
Object.defineProperty(spine.Bone.prototype, 'scaleX', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.local_space.scale.x; } });
Object.defineProperty(spine.Bone.prototype, 'scaleY', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.local_space.scale.y; } });
Object.defineProperty(spine.Bone.prototype, 'parent', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.parent_key; } });
Object.defineProperty(spine.Bone.prototype, 'inheritRotation', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.inherit_rotation; } });
Object.defineProperty(spine.Bone.prototype, 'inheritScale', { get: /** @this {spine.Bone} */ function () { spine.deprecated(); return this.inherit_scale; } });

Object.defineProperty(spine, 'skel_slot', { get: function () { spine.deprecated(); return spine.Slot; } });
Object.defineProperty(spine.Slot.prototype, 'bone', { get: /** @this {spine.Slot} */ function () { spine.deprecated(); return this.bone_key; } });
Object.defineProperty(spine.Slot.prototype, 'attachment', { get: /** @this {spine.Slot} */ function () { spine.deprecated(); return this.attachment_key; } });
Object.defineProperty(spine.Slot.prototype, 'additive', { get: /** @this {spine.Slot} */ function () { spine.deprecated(); return this.blend === 'additive'; } });

Object.defineProperty(spine, 'attachment', { get: function () { spine.deprecated(); return spine.RegionAttachment; } });
Object.defineProperty(spine.RegionAttachment.prototype, 'x', { get: /** @this {spine.RegionAttachment} */ function () { spine.deprecated(); return this.local_space.position.x; } });
Object.defineProperty(spine.RegionAttachment.prototype, 'y', { get: /** @this {spine.RegionAttachment} */ function () { spine.deprecated(); return this.local_space.position.y; } });
Object.defineProperty(spine.RegionAttachment.prototype, 'rotation', { get: /** @this {spine.RegionAttachment} */ function () { spine.deprecated(); return this.local_space.rotation.deg; } });
Object.defineProperty(spine.RegionAttachment.prototype, 'scaleX', { get: /** @this {spine.RegionAttachment} */ function () { spine.deprecated(); return this.local_space.scale.x; } });
Object.defineProperty(spine.RegionAttachment.prototype, 'scaleY', { get: /** @this {spine.RegionAttachment} */ function () { spine.deprecated(); return this.local_space.scale.y; } });

Object.defineProperty(spine, 'skin_slot', { get: function () { spine.deprecated(); return spine.SkinSlot; } });
Object.defineProperty(spine.SkinSlot.prototype, 'skin_attachments', { get: /** @this {spine.SkinSlot} */ function () { spine.deprecated(); return this.attachments; } });

Object.defineProperty(spine, 'skin', { get: function () { spine.deprecated(); return spine.Skin; } });
Object.defineProperty(spine.Skin.prototype, 'skin_slots', { get: /** @this {spine.Skin} */ function () { spine.deprecated(); return this.slots; } });

Object.defineProperty(spine, 'event', { get: function () { spine.deprecated(); return spine.Event; } });

Object.defineProperty(spine, 'keyframe', { get: function () { spine.deprecated(); return spine.Keyframe; } });

Object.defineProperty(spine, 'bone_keyframe', { get: function () { spine.deprecated(); return spine.BoneKeyframe; } });
Object.defineProperty(spine, 'translate_keyframe', { get: function () { spine.deprecated(); return spine.TranslateKeyframe; } });
Object.defineProperty(spine, 'rotate_keyframe', { get: function () { spine.deprecated(); return spine.RotateKeyframe; } });
Object.defineProperty(spine, 'scale_keyframe', { get: function () { spine.deprecated(); return spine.ScaleKeyframe; } });

Object.defineProperty(spine, 'anim_bone', { get: function () { spine.deprecated(); return spine.AnimBone; } });

Object.defineProperty(spine, 'slot_keyframe', { get: function () { spine.deprecated(); return spine.SlotKeyframe; } });
Object.defineProperty(spine, 'color_keyframe', { get: function () { spine.deprecated(); return spine.ColorKeyframe; } });
Object.defineProperty(spine, 'attachment_keyframe', { get: function () { spine.deprecated(); return spine.AttachmentKeyframe; } });

Object.defineProperty(spine, 'anim_slot', { get: function () { spine.deprecated(); return spine.AnimSlot; } });

Object.defineProperty(spine, 'event_keyframe', { get: function () { spine.deprecated(); return spine.EventKeyframe; } });

Object.defineProperty(spine, 'slot_offset', { get: function () { spine.deprecated(); return spine.SlotOffset; } });
Object.defineProperty(spine, 'order_keyframe', { get: function () { spine.deprecated(); return spine.OrderKeyframe; } });

Object.defineProperty(spine, 'animation', { get: function () { spine.deprecated(); return spine.Animation; } });
Object.defineProperty(spine.Animation.prototype, 'anim_bones', { get: /** @this {spine.Animation} */ function () { spine.deprecated(); return this.bones; } });
Object.defineProperty(spine.Animation.prototype, 'anim_slots', { get: /** @this {spine.Animation} */ function () { spine.deprecated(); return this.slots; } });

Object.defineProperty(spine, 'skeleton', { get: function () { spine.deprecated(); return spine.Skeleton; } });

Object.defineProperty(spine, 'data', { get: function () { spine.deprecated(); return spine.Data; } });
Object.defineProperty(spine.Data.prototype, 'animations', { get: /** @this {spine.Data} */ function () { spine.deprecated(); return this.anims; } });

Object.defineProperty(spine, 'pose', { get: function () { spine.deprecated(); return spine.Pose; } });
Object.defineProperty(spine.Pose.prototype, 'tweened_skel_bones', { get: /** @this {spine.Pose} */ function () { spine.deprecated(); return this.bones; } });
Object.defineProperty(spine.Pose.prototype, 'tweened_skel_slots', { get: /** @this {spine.Pose} */ function () { spine.deprecated(); return this.slots; } });
Object.defineProperty(spine.Pose.prototype, 'tweened_skel_slot_keys', { get: /** @this {spine.Pose} */ function () { spine.deprecated(); return this.slot_keys; } });
Object.defineProperty(spine.Pose.prototype, 'tweened_events', { get: /** @this {spine.Pose} */ function () { spine.deprecated(); return this.events; } });
