/**
 * Copyright (c) 2013 Flyover Games, LLC 
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
 * @param {string} value 
 * @param {boolean=} def 
 */
spine.toBool = function (value, def)
{
	if (value !== undefined)
	{
		return 'true' === value ? true : false;
	}
	return def || false;
}

/**
 * @return {number} 
 * @param {string} value 
 * @param {number=} def 
 */
spine.toInt = function (value, def)
{
	if (value !== undefined)
	{
		return parseInt(value, 10);
	}
	return def || 0;
}

/**
 * @return {number} 
 * @param {string} value 
 * @param {number=} def 
 */
spine.toFloat = function (value, def)
{
	if (value !== undefined)
	{
		return parseFloat(value);
	}
	return def || 0;
}

/**
 * @return {?string} 
 * @param {string} value 
 * @param {?string=} def 
 */
spine.toString = function (value, def)
{
	if (value !== undefined)
	{
		return value;
	}
	return def || "";
}

/**
 * @return {Array}
 * @param {*} value 
 * @param {Array=} def 
 */
spine.toArray = function (value, def)
{
	if (value)
	{
		if (value.length)
		{
			return /** @type {Array} */ (value);
		}

		return [value];
	}

	return def || [];
}

/**
 * @constructor
 */
spine.color = function ()
{
	/** @type {number} */
	this.rgba = 0xffffffff;
	/** @type {number} */
	this.r = 1;
	/** @type {number} */
	this.g = 1;
	/** @type {number} */
	this.b = 1;
	/** @type {number} */
	this.a = 1;
}

/**
 * @return {spine.color} 
 * @param {spine.color} other 
 */
spine.color.prototype.copy = function (other)
{
	this.rgba = other.rgba;
	this.r = other.r;
	this.g = other.g;
	this.b = other.b;
	this.a = other.a;
	return this;
}

/**
 * @return {spine.color} 
 * @param {*} json 
 */
spine.color.prototype.load = function (json)
{
	if (json !== undefined)
	{
		this.rgba = parseInt(json, 16);
	}
	else
	{
		this.rgba = 0xffffffff;
	}
	this.r = ((this.rgba >> 24) & 0xff) / 255;
	this.g = ((this.rgba >> 16) & 0xff) / 255;
	this.b = ((this.rgba >> 8) & 0xff) / 255;
	this.a = (this.rgba & 0xff) / 255;
	return this;
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
spine.bezier_curve = function (x1, y1, x2, y2, epsilon)
{
	epsilon = epsilon || 1e-6;

	/*
	var orig_curveX = function(t){
		var v = 1 - t;
		return 3 * v * v * t * x1 + 3 * v * t * t * x2 + t * t * t;
	};

	var orig_curveY = function(t){
		var v = 1 - t;
		return 3 * v * v * t * y1 + 3 * v * t * t * y2 + t * t * t;
	};

	var orig_derivativeCurveX = function(t){
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
	
	var curveX = function (t)
	{
		var t2 = t*t;
		var t3 = t2*t;
		var v = 1-t;
		var v2 = v*v;
		return 3*x1*v2*t + 3*x2*v*t2 + t3;
	};

	var curveY = function (t)
	{
		var t2 = t*t;
		var t3 = t2*t;
		var v = 1-t;
		var v2 = v*v;
		return 3*y1*v2*t + 3*y2*v*t2 + t3;
	};

	var derivativeCurveX = function (t)
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
spine.step_bezier_curve = function (cx1, cy1, cx2, cy2)
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
			if (i == 0) break;
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
 * @return {function(number):number}
 * @param {*} value 
 * @param {function(number):number=} def 
 */
spine.toCurve = function (value, def)
{
	if (value !== undefined)
	{
		if (value == 'stepped')
		{
			return function (t) { return 0; };
		}
		else if (value.length == 4)
		{
			var x1 = parseFloat(value[0]);
			var y1 = parseFloat(value[1]);
			var x2 = parseFloat(value[2]);
			var y2 = parseFloat(value[3]);
			//return spine.bezier_curve(x1, y1, x2, y2);
			return spine.step_bezier_curve(x1, y1, x2, y2);
		}
	}

	return def || function (t) { return t; };
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
spine.wrapAngle = function (angle)
{
	while (angle >= 180) { angle -= 360; }
	while (angle < -180) { angle += 360; }
	return angle;
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spine.tweenAngle = function (a, b, t)
{
	return spine.wrapAngle(a + (spine.wrapAngle(b - a) * t));
}

/**
 * @constructor 
 */
spine.skel_bone = function ()
{
	/** @type {?string} */
	this.parent = null;
	/** @type {number} */
	this.length = 0;
	/** @type {number} */
	this.x = 0;
	/** @type {number} */
	this.y = 0;
	/** @type {number} */
	this.rotation = 0;
	/** @type {number} */
	this.scaleX = 1;
	/** @type {number} */
	this.scaleY = 1;
}

/**
 * @return {spine.skel_bone} 
 * @param {spine.skel_bone} other 
 */
spine.skel_bone.prototype.copy = function (other)
{
	this.parent = other.parent;
	this.length = other.length;
	this.x = other.x;
	this.y = other.y;
	this.rotation = other.rotation;
	this.scaleX = other.scaleX;
	this.scaleY = other.scaleY;
	return this;
}

/**
 * @return {spine.skel_bone} 
 * @param {*} json 
 */
spine.skel_bone.prototype.load = function (json)
{
	this.parent = spine.toString(json.parent, null);
	this.length = spine.toFloat(json.length, 0);
	this.x = spine.toFloat(json.x, 0);
	this.y = spine.toFloat(json.y, 0);
	this.rotation = spine.toFloat(json.rotation, 0);
	this.scaleX = spine.toFloat(json.scaleX, 1);
	this.scaleY = spine.toFloat(json.scaleY, 1);
	return this;
}

/**
 * @constructor 
 */
spine.skel_slot = function ()
{
	/** @type {string} */
	this.bone = "";
	/** @type {spine.color} */
	this.color = new spine.color();
	/** @type {?string} */
	this.attachment = null;
}

/**
 * @return {spine.skel_slot} 
 * @param {spine.skel_slot} other 
 */
spine.skel_slot.prototype.copy = function (other)
{
	this.bone = other.bone;
	this.color.copy(other.color);
	this.attachment = other.attachment;
	return this;
}

/**
 * @return {spine.skel_slot} 
 * @param {*} json 
 */
spine.skel_slot.prototype.load = function (json)
{
	this.bone = spine.toString(json.bone, null) || "";
	this.color.load(json.color);
	this.attachment = spine.toString(json.attachment, null);
	return this;
}

/**
 * @constructor 
 */
spine.skin_attachment = function ()
{
	/** @type {?string} */
	this.name = null;
	/** @type {?string} */
	this.type = "region";
	/** @type {number} */
	this.x = 0;
	/** @type {number} */
	this.y = 0;
	/** @type {number} */
	this.rotation = 0;
	/** @type {number} */
	this.scaleX = 1;
	/** @type {number} */
	this.scaleY = 1;
	/** @type {number} */
	this.width = 0;
	/** @type {number} */
	this.height = 0;
}

/**
 * @return {spine.skin_attachment} 
 * @param {*} json 
 */
spine.skin_attachment.prototype.load = function (json)
{
	this.name = json.name || null;
	this.type = spine.toString(json.type, "region");
	switch (this.type)
	{
	case "region":
		break;
	case "animatedRegion":
		var fps = json.fps && spine.toFloat(json.fps, 0);
		var playMode = json.playMode && spine.toString(json.playMode, "forward");
		break;
	default:
		break;
	}
	this.x = spine.toFloat(json.x, 0);
	this.y = spine.toFloat(json.y, 0);
	this.rotation = spine.toFloat(json.rotation, 0);
	this.scaleX = spine.toFloat(json.scaleX, 1);
	this.scaleY = spine.toFloat(json.scaleY, 1);
	this.width = spine.toFloat(json.width, 0);
	this.height = spine.toFloat(json.height, 0);
	return this;
}

/**
 * @constructor 
 */
spine.skin_slot = function ()
{
	/** @type {Object.<string,spine.skin_attachment>} */
	this.skin_attachments = {};
}

/**
 * @return {spine.skin_slot} 
 * @param {*} json 
 */
spine.skin_slot.prototype.load = function (json)
{
	for (var skin_attachment_i in json)
	{
		this.skin_attachments[skin_attachment_i] = new spine.skin_attachment().load(json[skin_attachment_i]);
	}
	return this;
}

/**
 * @constructor 
 */
spine.skin = function ()
{
	/** @type {Object.<string,spine.skin_slot>} */
	this.skin_slots = {};
}

/**
 * @return {spine.skin} 
 * @param {*} json 
 */
spine.skin.prototype.load = function (json)
{
	for (var skin_slot_i in json)
	{
		this.skin_slots[skin_slot_i] = new spine.skin_slot().load(json[skin_slot_i]);
	}
	return this;
}

/**
 * @constructor 
 * @param {number=} time 
 */
spine.key = function (time)
{
	/** @type {number} */
	this.time = time || 0;
}

/**
 * @constructor 
 * @extends {spine.key} 
 * @param {number=} time 
 */
spine.translate_key = function (time)
{
	goog.base(this, time);

	/** @type {number} */
	this.x = 0;
	/** @type {number} */
	this.y = 0;
	/** @type {?function(number):number} */
	this.curve = null;
}

goog.inherits(spine.translate_key, spine.key);

/**
 * @return {spine.translate_key} 
 * @param {*} json 
 */
spine.translate_key.prototype.load = function (json)
{
	this.x = spine.toFloat(json.x, 0);
	this.y = spine.toFloat(json.y, 0);
	this.curve = spine.toCurve(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.key} 
 * @param {number=} time 
 */
spine.rotate_key = function (time)
{
	goog.base(this, time);

	/** @type {number} */
	this.angle = 0;
	/** @type {?function(number):number} */
	this.curve = null;
}

goog.inherits(spine.rotate_key, spine.key);

/**
 * @return {spine.rotate_key} 
 * @param {*} json 
 */
spine.rotate_key.prototype.load = function (json)
{
	this.angle = spine.toFloat(json.angle, 0);
	this.curve = spine.toCurve(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.key} 
 * @param {number=} time 
 */
spine.scale_key = function (time)
{
	goog.base(this, time);

	/** @type {number} */
	this.scaleX = 0;
	/** @type {number} */
	this.scaleY = 0;
	/** @type {?function(number):number} */
	this.curve = null;
}

goog.inherits(spine.scale_key, spine.key);

/**
 * @return {spine.scale_key} 
 * @param {*} json 
 */
spine.scale_key.prototype.load = function (json)
{
	this.scaleX = spine.toFloat(json.x, 1);
	this.scaleY = spine.toFloat(json.y, 1);
	this.curve = spine.toCurve(json.curve);
	return this;
}

/**
 * @constructor 
 */
spine.anim_bone = function ()
{
	/** @type {number} */
	this.min_time = 0;
	/** @type {number} */
	this.max_time = 0;
	/** @type {Array.<spine.translate_key>} */
	this.translate_keys = [];
	/** @type {Array.<spine.rotate_key>} */
	this.rotate_keys = [];
	/** @type {Array.<spine.scale_key>} */
	this.scale_keys = [];
}

/**
 * @return {spine.anim_bone} 
 * @param {*} json 
 */
spine.anim_bone.prototype.load = function (json)
{
	this.min_time = 0;
	this.max_time = 0;
	this.translate_keys = [];
	this.rotate_keys = [];
	this.scale_keys = [];

	if (json.translate)
	{
		if (json.translate instanceof Array)
		{
			// version >= spine-1.0.9
			for (var translate_i = 0; translate_i < json.translate.length; ++translate_i)
			{
				var translate = json.translate[translate_i];
				var time = 1000 * spine.toFloat(translate.time, 0);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.translate_keys.push(new spine.translate_key(time).load(translate));
			}
		}
		else
		{
			// version < spine-1.0.9
			for (var translate_i in json.translate)
			{
				var translate = json.translate[translate_i];
				var time = 1000 * parseFloat(translate_i);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.translate_keys.push(new spine.translate_key(time).load(translate));
			}
		}
		this.translate_keys.sort(function (a, b) { return a.time - b.time; });
	}

	if (json.rotate)
	{
		if (json.rotate instanceof Array)
		{
			// version >= spine-1.0.9
			for (var rotate_i = 0; rotate_i < json.rotate.length; ++rotate_i)
			{
				var rotate = json.rotate[rotate_i];
				var time = 1000 * spine.toFloat(rotate.time, 0);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.rotate_keys.push(new spine.rotate_key(time).load(rotate));
			}
		}
		else
		{
			// version < spine-1.0.9
			for (var rotate_i in json.rotate)
			{
				var rotate = json.rotate[rotate_i];
				var time = 1000 * parseFloat(rotate_i);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.rotate_keys.push(new spine.rotate_key(time).load(rotate));
			}
		}
		this.rotate_keys.sort(function (a, b) { return a.time - b.time; });
	}

	if (json.scale)
	{
		if (json.scale instanceof Array)
		{
			// version >= spine-1.0.9
			for (var scale_i = 0; scale_i < json.scale.length; ++scale_i)
			{
				var scale = json.scale[scale_i];
				var time = 1000 * spine.toFloat(scale.time, 0);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.scale_keys.push(new spine.scale_key(time).load(scale));
			}
		}
		else
		{
			// version < spine-1.0.9
			for (var scale_i in json.scale)
			{
				var scale = json.scale[scale_i];
				var time = 1000 * parseFloat(scale_i);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.scale_keys.push(new spine.scale_key(time).load(scale));
			}
		}
		this.scale_keys.sort(function (a, b) { return a.time - b.time; });
	}

	return this;
}

/**
 * @constructor 
 * @extends {spine.key} 
 * @param {number=} time 
 */
spine.color_key = function (time)
{
	goog.base(this, time);

	/** @type {spine.color} */
	this.color = new spine.color();
	/** @type {?function(number):number} */
	this.curve = null;
}

goog.inherits(spine.color_key, spine.key);

/**
 * @return {spine.color_key} 
 * @param {*} json 
 */
spine.color_key.prototype.load = function (json)
{
	this.color.load(json.color);
	this.curve = spine.toCurve(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.key} 
 * @param {number=} time 
 */
spine.attachment_key = function (time)
{
	goog.base(this, time);

	/** @type {?string} */
	this.attachment = null;
}

goog.inherits(spine.attachment_key, spine.key);

/**
 * @return {spine.attachment_key} 
 * @param {*} json 
 */
spine.attachment_key.prototype.load = function (json)
{
	this.attachment = spine.toString(json.name, null);
	return this;
}

/**
 * @constructor 
 */
spine.anim_slot = function ()
{
	/** @type {number} */
	this.min_time = 0;
	/** @type {number} */
	this.max_time = 0;
	/** @type {Array.<spine.color_key>} */
	this.color_keys = [];
	/** @type {Array.<spine.attachment_key>} */
	this.attachment_keys = [];
}

/**
 * @return {spine.anim_slot} 
 * @param {*} json 
 */
spine.anim_slot.prototype.load = function (json)
{
	this.min_time = 0;
	this.max_time = 0;
	this.color_keys = [];
	this.attachment_keys = [];

	if (json.color)
	{
		if (json.color instanceof Array)
		{
			// version >= spine-1.0.9
			for (var color_i = 0; color_i < json.color.length; ++color_i)
			{
				var color = json.color[color_i];
				var time = 1000 * spine.toFloat(color.time, 0);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.color_keys.push(new spine.color_key(time).load(color));
			}
		}
		else
		{
			// version < spine-1.0.9
			for (var color_i in json.color)
			{
				var color = json.color[color_i];
				var time = 1000 * parseFloat(color_i);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.color_keys.push(new spine.color_key(time).load(color));
			}
		}
		this.color_keys.sort(function (a, b) { return a.time - b.time; });
	}

	if (json.attachment)
	{
		if (json.attachment instanceof Array)
		{
			// version >= spine-1.0.9
			// json.attachment is an array of objects with time:number and name:string
			for (var attachment_i = 0; attachment_i < json.attachment.length; ++attachment_i)
			{
				var attachment = json.attachment[attachment_i];
				var time = 1000 * spine.toFloat(attachment.time, 0);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.attachment_keys.push(new spine.attachment_key(time).load(attachment));
			}
		}
		else
		{
			// version < spine-1.0.9
			// json.attachment is an object with name strings keyed to time
			for (var attachment_i in json.attachment)
			{
				var attachment = json.attachment[attachment_i];
				var time = 1000 * parseFloat(attachment_i);
				this.min_time = Math.min(this.min_time, time);
				this.max_time = Math.max(this.max_time, time);
				this.attachment_keys.push(new spine.attachment_key(time).load({ name:attachment }));
			}
		}
		this.attachment_keys.sort(function (a, b) { return a.time - b.time; });
	}

	return this;
}

/**
 * @constructor
 */
spine.animation = function ()
{
	/** @type {?string} */
	this.name = null;

	/** @type {Object.<string,spine.anim_bone>} */
	this.anim_bones = {};
	/** @type {Object.<string,spine.anim_slot>} */
	this.anim_slots = {};

	/** @type {number} */
	this.min_time = 0;
	/** @type {number} */
	this.max_time = 0;
	/** @type {number} */
	this.length = 0;
}

/**
 * @return {spine.animation} 
 * @param {*} json 
 */
spine.animation.prototype.load = function (json)
{
	this.anim_bones = {};
	this.anim_slots = {};

	this.min_time = 0;
	this.max_time = 0;

	if (json.bones) for (var bone_i in json.bones)
	{
		var anim_bone = new spine.anim_bone().load(json.bones[bone_i]);
		this.min_time = Math.min(this.min_time, anim_bone.min_time);
		this.max_time = Math.max(this.max_time, anim_bone.max_time);
		this.anim_bones[bone_i] = anim_bone;
	}

	if (json.slots) for (var slot_i in json.slots)
	{
		var anim_slot = new spine.anim_slot().load(json.slots[slot_i]);
		this.min_time = Math.min(this.min_time, anim_slot.min_time);
		this.max_time = Math.max(this.max_time, anim_slot.max_time);
		this.anim_slots[slot_i] = anim_slot;
	}

	this.length = this.max_time - this.min_time;

	return this;
}

/**
 * @return {number} 
 * @param {Array.<spine.key>} keys 
 * @param {number} time 
 */
spine.animation.find_key = function (keys, time)
{
	if (keys.length <= 0) { return -1; }
	if (time < keys[0].time) { return -1; }
	var last = keys.length - 1;
	if (time >= keys[last].time) { return last; }
	var lo = 0;
	var hi = last;
	if (hi == 0) { return 0; }
	var current = hi >> 1;
	while (true)
	{
		if (keys[current + 1].time <= time) { lo = current + 1; } else { hi = current; }
		if (lo == hi) { return lo; }
		current = (lo + hi) >> 1;
	}
}

/**
 * @constructor 
 */
spine.skeleton = function ()
{
	/** @type {?string} */
	this.name = null;

	/** @type {?string} */
	this.current_skin_i = null;

	/** @type {Object.<string,spine.skel_bone>} */
	this.skel_bones = {};
	/** @type {Object.<string,spine.skel_slot>} */
	this.skel_slots = {};
	/** @type {Object.<string,spine.skin>} */
	this.skins = {};
}

/**
 * @return {spine.skeleton} 
 * @param {*} json 
 */
spine.skeleton.prototype.load = function (json)
{
	this.current_skin_i = null;

	// default to the first skin
	if (json.skins) for (var skin_i in json.skins)
	{
		this.current_skin_i = skin_i;
		break;
	}

	this.skel_bones = {};
	this.skel_slots = {};
	this.skins = {};

	if (json.bones)
	{
		if (json.bones instanceof Array)
		{
			// version >= spine-1.0.9
			for (var i = 0; i < json.bones.length; ++i)
			{
				this.skel_bones[json.bones[i].name] = new spine.skel_bone().load(json.bones[i]);
			}
		}
		else
		{
			// version < spine-1.0.9
			for (var bone_i in json.bones)
			{
				this.skel_bones[bone_i] = new spine.skel_bone().load(json.bones[bone_i]);
			}
		}
	}

	if (json.slots)
	{
		if (json.slots instanceof Array)
		{
			// version >= spine-1.0.9
			for (var i = 0; i < json.slots.length; ++i)
			{
				this.skel_slots[json.slots[i].name] = new spine.skel_slot().load(json.slots[i]);
			}
		}
		else
		{
			// version < spine-1.0.9
			for (var slot_i in json.slots)
			{
				this.skel_slots[slot_i] = new spine.skel_slot().load(json.slots[slot_i]);
			}
		}
	}

	if (json.skins) for (var skin_i in json.skins)
	{
		this.skins[skin_i] = new spine.skin().load(json.skins[skin_i]);
	}

	return this;
}

/**
 * @constructor 
 */
spine.data = function ()
{
	/** @type {spine.skeleton} */
	this.m_skeleton = new spine.skeleton();
	/** @type {Object.<string,spine.animation>} */
	this.m_animations = {};
}

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.load = function (json)
{
	this.loadSkeleton(json);

	this.m_animations = {};

	if (json.animations) for (var animation_i in json.animations)
	{
		this.loadAnimation(animation_i, json.animations[animation_i]);
	}

	return this;
}

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.loadSkeleton = function (json)
{
	this.m_skeleton.load(json);

	return this;
}

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.loadAnimation = function (name, json)
{
	this.m_animations[name] = new spine.animation().load(json);

	return this;
}

/**
 * @return {number} 
 */
spine.data.prototype.getNumAnims = function ()
{
	return 0; //return this.m_animations.length;
}

/**
 * @return {?string} 
 * @param {number=} anim_index 
 */
spine.data.prototype.getAnimName = function (anim_index)
{
	/*
	if ((anim_index >= 0) && (anim_index < this.getNumAnims()))
	{
		var anim = this.m_animations[anim_index];
		return anim.name;
	}
	*/
	return null;
}

/**
 * @return {number} 
 * @param {number} anim_index 
 */
spine.data.prototype.getAnimLength = function (anim_index)
{
	/*
	if ((anim_index >= 0) && (anim_index < this.getNumAnims()))
	{
		var anim = this.m_animations[anim_index];
		return anim.length;
	}
	*/
	return -1;
}

/**
 * @constructor 
 * @param {spine.data=} data 
 */
spine.pose = function (data)
{
	/** @type {spine.data} */
	this.m_data = data || null;

	/** @type {string} */
	this.m_anim_name = "";
	/** @type {number} */
	this.m_time = 0;

	/** @type {boolean} */
	this.m_dirty = true;

	/** @type {Object.<string,spine.skel_bone>} */
	this.m_tweened_skel_bones = {};

	/** @type {Object.<string,spine.skel_slot>} */
	this.m_tweened_skel_slots = {};
}

/**
 * @return {number} 
 */
spine.pose.prototype.getNumAnims = function ()
{
	if (this.m_skeleton)
	{
		return this.m_skeleton.getNumAnims();
	}
	return 0;
}

/**
 * @return {string}
 */
spine.pose.prototype.getAnim = function ()
{
	return this.m_anim_name;
}

/**
 * @return {void} 
 * @param {number|string} anim_id
 */
spine.pose.prototype.setAnim = function (anim_id)
{
	if (isFinite(anim_id))
	{
		// set animation by index
//		if ((0 <= anim_id) && (anim_id < this.getNumAnims()))
//		{
//			this.m_anim_index = /** @type {number} */ (anim_id);
//			this.m_time = 0;
//			this.m_dirty = true;
//		}
//		else
//		{
//			this.m_anim_index = -1;
//			this.m_time = 0;
//			this.m_dirty = true;
//		}
	}
	else
	{
		// set animation by name
		if (this.m_anim_name != anim_id)
		{
			this.m_anim_name = /** @type {string} */ (anim_id);
			this.m_time = 0;
			this.m_dirty = true;
		}
	}
}

/**
 * @return {void}
 */
spine.pose.prototype.setNextAnim = function ()
{
	/*
	var num_anims = this.getNumAnims();
	if (num_anims > 1)
	{
		this.setAnim((this.getAnim() + 1) % num_anims);
	}
	*/
}

/**
 * @return {void}
 */
spine.pose.prototype.setPrevAnim = function ()
{
	/*
	var num_anims = this.getNumAnims();
	if (num_anims > 1)
	{
		this.setAnim((this.getAnim() + num_anims - 1) % num_anims);
	}
	*/
}

/**
 * @return {?string} 
 * @param {number=} anim_index 
 */
spine.pose.prototype.getAnimName = function (anim_index)
{
	/*
	anim_index = (anim_index !== undefined)?(anim_index):(this.m_anim_index);
	if (this.m_skeleton)
	{
		return this.m_skeleton.getAnimName(anim_index);
	}
	*/
	return null;
}

/**
 * @return {number}
 * @param {string=} anim_name 
 */
spine.pose.prototype.getAnimLength = function (anim_name)
{
	anim_name = (anim_name !== undefined)?(anim_name):(this.m_anim_name);
	var data = this.m_data;
	if (!data) { return 0; }
	var animation = data.m_animations[anim_name];
	if (!animation) { return 0; }
	var anim_length = animation.length;
	return anim_length;
}

/**
 * @return {number}
 */
spine.pose.prototype.getTime = function ()
{
	return this.m_time;
}

/**
 * @return {void} 
 * @param {number} time 
 */
spine.pose.prototype.setTime = function (time)
{
	if (this.m_time != time)
	{
		this.m_time = time;

		var anim_length = this.getAnimLength();

		if (anim_length > 0)
		{
			while (this.m_time < 0) { this.m_time += anim_length; }
			while (this.m_time >= anim_length) { this.m_time -= anim_length; }
		}

		this.m_dirty = true;
	}
}

/**
 * @return {void}
 * @param {number} elapsed_time
 */
spine.pose.prototype.update = function (elapsed_time)
{
	var anim_length = this.getAnimLength();

	if (anim_length > 0)
	{
		this.m_time += elapsed_time;

		while (this.m_time < 0) { this.m_time += anim_length; }
		while (this.m_time >= anim_length) { this.m_time -= anim_length; }

		this.m_dirty = true;
	}
}

/**
 * @return {void}
 */
spine.pose.prototype.strike = function ()
{
	var data = this.m_data;
	if (!data) { return; }

	var skeleton = data.m_skeleton;
	var animation = data.m_animations[this.m_anim_name];

	var time = this.getTime();

	if (!this.m_dirty) { return; }
	this.m_dirty = false;

	for (var bone_i in skeleton.skel_bones)
	{
		var skel_bone = skeleton.skel_bones[bone_i];
		var tweened_skel_bone = this.m_tweened_skel_bones[bone_i] || (this.m_tweened_skel_bones[bone_i] = new spine.skel_bone());

		// start with a copy of the skeleton bone
		tweened_skel_bone.copy(skel_bone);

		// tween anim bone if keys are available
		var anim_bone = animation && animation.anim_bones && animation.anim_bones[bone_i];
		if (anim_bone)
		{
			var translate_keys = anim_bone.translate_keys;
			if (translate_keys)
			{
				var translate_key0_i = spine.animation.find_key(translate_keys, time);
				if (translate_key0_i != -1)
				{
					var translate_key0 = translate_keys[translate_key0_i];
					var translate_key1_i = translate_key0_i + 1;
					if (translate_key1_i < translate_keys.length)
					{
						var translate_key1 = translate_keys[translate_key1_i];
						var pct = (time - translate_key0.time) / (translate_key1.time - translate_key0.time);
						pct = translate_key0.curve(pct);
						tweened_skel_bone.x += spine.tween(translate_key0.x, translate_key1.x, pct);
						tweened_skel_bone.y += spine.tween(translate_key0.y, translate_key1.y, pct);
					}
					else
					{
						tweened_skel_bone.x += translate_key0.x;
						tweened_skel_bone.y += translate_key0.y;
					}
				}
			}

			var rotate_keys = anim_bone.rotate_keys;
			if (rotate_keys)
			{
				var rotate_key0_i = spine.animation.find_key(rotate_keys, time);
				if (rotate_key0_i != -1)
				{
					var rotate_key0 = rotate_keys[rotate_key0_i];
					var rotate_key1_i = rotate_key0_i + 1;
					if (rotate_key1_i < rotate_keys.length)
					{
						var rotate_key1 = rotate_keys[rotate_key1_i];
						var pct = (time - rotate_key0.time) / (rotate_key1.time - rotate_key0.time);
						pct = rotate_key0.curve(pct);
						tweened_skel_bone.rotation += spine.tweenAngle(rotate_key0.angle, rotate_key1.angle, pct);
					}
					else
					{
						tweened_skel_bone.rotation += rotate_key0.angle;
					}
				}
			}

			var scale_keys = anim_bone.scale_keys;
			if (scale_keys)
			{
				var scale_key0_i = spine.animation.find_key(scale_keys, time);
				if (scale_key0_i != -1)
				{
					var scale_key0 = scale_keys[scale_key0_i];
					var scale_key1_i = scale_key0_i + 1;
					if (scale_key1_i < scale_keys.length)
					{
						var scale_key1 = scale_keys[scale_key1_i];
						var pct = (time - scale_key0.time) / (scale_key1.time - scale_key0.time);
						pct = scale_key0.curve(pct);
						tweened_skel_bone.scaleX += spine.tween(scale_key0.scaleX, scale_key1.scaleX, pct) - 1;
						tweened_skel_bone.scaleY += spine.tween(scale_key0.scaleY, scale_key1.scaleY, pct) - 1;
					}
					else
					{
						tweened_skel_bone.scaleX += scale_key0.scaleX - 1;
						tweened_skel_bone.scaleY += scale_key0.scaleY - 1;
					}
				}
			}
		}
	}

	for (var slot_i in skeleton.skel_slots)
	{
		var skel_slot = skeleton.skel_slots[slot_i];
		var tweened_skel_slot = this.m_tweened_skel_slots[slot_i] || (this.m_tweened_skel_slots[slot_i] = new spine.skel_slot());

		// start with a copy of the skeleton slot
		tweened_skel_slot.copy(skel_slot);

		// tween anim slot if keys are available
		var anim_slot = animation && animation.anim_slots && animation.anim_slots[slot_i];
		if (anim_slot)
		{
			var color_keys = anim_slot.color_keys;
			if (color_keys)
			{
				var color_key0_i = spine.animation.find_key(color_keys, time);
				if (color_key0_i != -1)
				{
					var color_key0 = color_keys[color_key0_i];
					var color_key1_i = color_key0_i + 1;
					if (color_key1_i < color_keys.length)
					{
						var color_key1 = color_keys[color_key1_i];
						var pct = (time - color_key0.time) / (color_key1.time - color_key0.time);
						pct = color_key0.curve(pct);
						tweened_skel_slot.color.r = spine.tween(color_key0.color.r, color_key1.color.r, pct);
						tweened_skel_slot.color.g = spine.tween(color_key0.color.g, color_key1.color.g, pct);
						tweened_skel_slot.color.b = spine.tween(color_key0.color.b, color_key1.color.b, pct);
						tweened_skel_slot.color.a = spine.tween(color_key0.color.a, color_key1.color.a, pct);
					}
					else
					{
						tweened_skel_slot.color.r = color_key0.color.r;
						tweened_skel_slot.color.g = color_key0.color.g;
						tweened_skel_slot.color.b = color_key0.color.b;
						tweened_skel_slot.color.a = color_key0.color.a;
					}
				}
			}

			var attachment_keys = anim_slot.attachment_keys;
			if (attachment_keys)
			{
				var attachment_key0_i = spine.animation.find_key(attachment_keys, time);
				if (attachment_key0_i != -1)
				{
					var attachment_key0 = attachment_keys[attachment_key0_i];
					// no tweening attachments
					if (attachment_key0.attachment)
					{
						tweened_skel_slot.attachment = attachment_key0.attachment;
					}
				}
			}
		}
	}
}

