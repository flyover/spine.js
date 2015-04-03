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
 * @param {string|boolean} value 
 * @param {boolean=} def 
 */
spine.importBool = function (value, def)
{
	switch (typeof(value))
	{
	case 'string': return (value === 'true') ? true : false;
	case 'boolean': return value;
	default: return def || false;
	}
}

/**
 * @return {number} 
 * @param {string|number} value 
 * @param {number=} def 
 */
spine.importInt = function (value, def)
{
	switch (typeof(value))
	{
	case 'string': return parseInt(value, 10);
	case 'number': return 0 | value;
	default: return def || 0;
	}
}

/**
 * @return {number} 
 * @param {string|number} value 
 * @param {number=} def 
 */
spine.importFloat = function (value, def)
{
	switch (typeof(value))
	{
	case 'string': return parseFloat(value);
	case 'number': return value;
	default: return def || 0;
	}
}

/**
 * @return {string} 
 * @param {string} value 
 * @param {string=} def 
 */
spine.importString = function (value, def)
{
	switch (typeof(value))
	{
	case 'string': return value;
	default: return def || "";
	}
}

/**
 * @return {Array}
 * @param {*} value 
 */
spine.makeArray = function (value)
{
	if ((typeof(value) === 'object') && (typeof(value.length) === 'number')) // (Object.isArray(value))
	{
		return /** @type {Array} */ (value);
	}
	if (typeof(value) !== 'undefined')
	{
		return [ value ];
	}
	return [];
}

/**
 * @constructor
 */
spine.color = function ()
{
}

/** @type {number} */
spine.color.prototype.rgba = 0xffffffff;
/** @type {number} */
spine.color.prototype.r = 1;
/** @type {number} */
spine.color.prototype.g = 1;
/** @type {number} */
spine.color.prototype.b = 1;
/** @type {number} */
spine.color.prototype.a = 1;

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
	switch (typeof(json))
	{
	case 'string': this.rgba = parseInt(json, 16); break;
	case 'number': this.rgba = 0 | json; break;
	default: this.rgba = 0xffffffff; break;
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
 * @return {function(number):number}
 * @param {*} value 
 * @param {function(number):number=} def 
 */
spine.toCurve = function (value, def)
{
	if (typeof(value) === 'string')
	{
		switch (value)
		{
		case 'linear':
			return function (t) { return t; };
			break;
		case 'stepped':
			return function (t) { return 0; };
			break;
		}
	}
	else if ((typeof(value) === 'object') && (typeof(value.length) === 'number')) // (Object.isArray(value))
	{
		switch (value.length)
		{
		case 4:
			var x1 = spine.importFloat(value[0], 0);
			var y1 = spine.importFloat(value[1], 0);
			var x2 = spine.importFloat(value[2], 1);
			var y2 = spine.importFloat(value[3], 1);
			//return spine.bezier_curve(x1, y1, x2, y2);
			return spine.step_bezier_curve(x1, y1, x2, y2);
			break;
		}
	}

	return def || function (t) { return t; };
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
spine.wrapAngle = function (angle)
{
	if (angle <= 0)
	{
		return ((angle - 180) % 360) + 180;
	}
	else
	{
		return ((angle + 180) % 360) - 180;
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
	return spine.wrapAngle(a + (spine.wrapAngle(b - a) * t));
}

/**
 * @constructor 
 */
spine.skel_bone = function ()
{
}

/** @type {string} */
spine.skel_bone.prototype.parent = "";
/** @type {number} */
spine.skel_bone.prototype.length = 0;
/** @type {number} */
spine.skel_bone.prototype.x = 0;
/** @type {number} */
spine.skel_bone.prototype.y = 0;
/** @type {number} */
spine.skel_bone.prototype.rotation = 0;
/** @type {number} */
spine.skel_bone.prototype.scaleX = 1;
/** @type {number} */
spine.skel_bone.prototype.scaleY = 1;
/** @type {boolean} */
spine.skel_bone.prototype.inheritRotation = true;
/** @type {boolean} */
spine.skel_bone.prototype.inheritScale = true;

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
	this.inheritRotation = other.inheritRotation;
	this.inheritScale = other.inheritScale;
	return this;
}

/**
 * @return {spine.skel_bone} 
 * @param {*} json 
 */
spine.skel_bone.prototype.load = function (json)
{
	this.parent = spine.importString(json.parent, "");
	this.length = spine.importFloat(json.length, 0);
	this.x = spine.importFloat(json.x, 0);
	this.y = spine.importFloat(json.y, 0);
	this.rotation = spine.importFloat(json.rotation, 0);
	this.scaleX = spine.importFloat(json.scaleX, 1);
	this.scaleY = spine.importFloat(json.scaleY, 1);
	this.inheritRotation = spine.importBool(json.inheritRotation, true);
	this.inheritScale = spine.importBool(json.inheritScale, true);
	return this;
}

/**
 * @constructor 
 */
spine.skel_slot = function ()
{
	this.color = new spine.color();
}

/** @type {string} */
spine.skel_slot.prototype.bone = "";
/** @type {spine.color} */
spine.skel_slot.prototype.color;
/** @type {string} */
spine.skel_slot.prototype.attachment = "";
/** @type {boolean} */
spine.skel_slot.prototype.additive = false;

/**
 * @return {spine.skel_slot} 
 * @param {spine.skel_slot} other 
 */
spine.skel_slot.prototype.copy = function (other)
{
	this.bone = other.bone;
	this.color.copy(other.color);
	this.attachment = other.attachment;
	this.additive = other.additive;
	return this;
}

/**
 * @return {spine.skel_slot} 
 * @param {*} json 
 */
spine.skel_slot.prototype.load = function (json)
{
	this.bone = spine.importString(json.bone, "");
	this.color.load(json.color);
	this.attachment = spine.importString(json.attachment, "");
	this.additive = spine.importBool(json.additive, false);
	return this;
}

/**
 * @constructor 
 */
spine.skin_attachment = function ()
{
}

/** @type {string} */
spine.skin_attachment.prototype.name = "";
/** @type {string} */
spine.skin_attachment.prototype.type = "region";
/** @type {number} */
spine.skin_attachment.prototype.x = 0;
/** @type {number} */
spine.skin_attachment.prototype.y = 0;
/** @type {number} */
spine.skin_attachment.prototype.rotation = 0;
/** @type {number} */
spine.skin_attachment.prototype.scaleX = 1;
/** @type {number} */
spine.skin_attachment.prototype.scaleY = 1;
/** @type {number} */
spine.skin_attachment.prototype.width = 0;
/** @type {number} */
spine.skin_attachment.prototype.height = 0;

/**
 * @return {spine.skin_attachment} 
 * @param {*} json 
 */
spine.skin_attachment.prototype.load = function (json)
{
	this.name = spine.importString(json.name, "");
	this.type = spine.importString(json.type, "region");
	switch (this.type)
	{
	case "region":
		break;
	case "regionsequence":
		/// The frames per second to show each image in the sequence.
		//var fps = json.fps && spine.importFloat(json.fps, 0);
		/// Defines how the sequence of images is cycled. One of: forward, 
		/// backward, forwardLoop, backwardLoop, pingPong, or random. 
		/// Assume "forward" if omitted.
		//var mode = json.mode && spine.importString(json.mode, "forward");
		break;
	case "boundingbox":
		/// The x/y pairs that make up the vertices of the polygon.
		//var vertices = json.vertices;
		this.vertices = json.vertices;
		break;
	default:
		break;
	}
	this.x = spine.importFloat(json.x, 0);
	this.y = spine.importFloat(json.y, 0);
	this.rotation = spine.importFloat(json.rotation, 0);
	this.scaleX = spine.importFloat(json.scaleX, 1);
	this.scaleY = spine.importFloat(json.scaleY, 1);
	this.width = spine.importFloat(json.width, 0);
	this.height = spine.importFloat(json.height, 0);
	return this;
}

/**
 * @constructor 
 */
spine.skin_slot = function ()
{
	this.skin_attachments = {};
}

/** @type {Object.<string,spine.skin_attachment>} */
spine.skin_slot.prototype.skin_attachments;

/**
 * @return {spine.skin_slot} 
 * @param {*} json 
 */
spine.skin_slot.prototype.load = function (json)
{
	for (var skin_attachment_key in json)
	{
		this.skin_attachments[skin_attachment_key] = new spine.skin_attachment().load(json[skin_attachment_key]);
	}
	return this;
}

/**
 * @constructor 
 */
spine.skin = function ()
{
	this.skin_slots = {};
}

/** @type {Object.<string,spine.skin_slot>} */
spine.skin.prototype.skin_slots;

/**
 * @return {spine.skin} 
 * @param {*} json 
 */
spine.skin.prototype.load = function (json)
{
	for (var slot_key in json)
	{
		this.skin_slots[slot_key] = new spine.skin_slot().load(json[slot_key]);
	}
	return this;
}

/**
 * @constructor
 */
spine.event = function ()
{
}

/** @type {string} */
spine.event.prototype.name = "";
/** @type {number|string} */
spine.event.prototype.value = 0;

/**
 * @return {spine.event}
 * @param {spine.event} other 
 */
spine.event.prototype.copy = function (other)
{
	this.name = other.name;
	this.value = other.value;
	return this;
}

/**
 * @return {spine.event}
 * @param {*} json 
 */
spine.event.prototype.load = function (json)
{
	if (typeof(json.name) === 'string')
	{
		this.name = spine.importString(json.name, "");
	}
	if (typeof(json['int']) === 'string')
	{
		this.value = spine.importInt(json['int'], 0);
	}
	if (typeof(json['float']) === 'string')
	{
		this.value = spine.importFloat(json['float'], 0);
	}
	if (typeof(json['string']) === 'string')
	{
		this.value = spine.importString(json['string'], "");
	}

	return this;
}

/**
 * @constructor 
 * @param {number=} time 
 */
spine.keyframe = function (time)
{
	this.time = time || 0;
}

/** @type {number} */
spine.keyframe.prototype.time = 0;

/**
 * @return {spine.keyframe} 
 * @param {*} json 
 */
spine.keyframe.prototype.load = function (json)
{
	this.time = 1000 * spine.importFloat(json.time, 0);
	return this;
}

/**
 * @return {number} 
 * @param {Array.< spine.keyframe >} array 
 * @param {number} time 
 */
spine.keyframe.find = function (array, time)
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
 * @param {spine.keyframe} a 
 * @param {spine.keyframe} b 
 */
spine.keyframe.compare = function (a, b)
{
	return a.time - b.time;
}

/**
 * @constructor 
 * @extends {spine.keyframe} 
 * @param {number=} time 
 */
spine.bone_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.bone_keyframe, spine.keyframe);

/** @type {function(number):number} */
spine.bone_keyframe.prototype.curve = function (t) { return t; };

/**
 * @return {spine.bone_keyframe} 
 * @param {*} json 
 */
spine.bone_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.curve = spine.toCurve(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.bone_keyframe} 
 * @param {number=} time 
 */
spine.translate_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.translate_keyframe, spine.bone_keyframe);

/** @type {number} */
spine.translate_keyframe.prototype.x = 0;
/** @type {number} */
spine.translate_keyframe.prototype.y = 0;

/**
 * @return {spine.translate_keyframe} 
 * @param {*} json 
 */
spine.translate_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.x = spine.importFloat(json.x, 0);
	this.y = spine.importFloat(json.y, 0);
	return this;
}

/**
 * @constructor 
 * @extends {spine.bone_keyframe} 
 * @param {number=} time 
 */
spine.rotate_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.rotate_keyframe, spine.bone_keyframe);

/** @type {number} */
spine.rotate_keyframe.prototype.angle = 0;

/**
 * @return {spine.rotate_keyframe} 
 * @param {*} json 
 */
spine.rotate_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.angle = spine.importFloat(json.angle, 0);
	return this;
}

/**
 * @constructor 
 * @extends {spine.bone_keyframe} 
 * @param {number=} time 
 */
spine.scale_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.scale_keyframe, spine.bone_keyframe);

/** @type {number} */
spine.scale_keyframe.prototype.scaleX = 1;
/** @type {number} */
spine.scale_keyframe.prototype.scaleY = 1;

/**
 * @return {spine.scale_keyframe} 
 * @param {*} json 
 */
spine.scale_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.scaleX = spine.importFloat(json.x, 1);
	this.scaleY = spine.importFloat(json.y, 1);
	return this;
}

/**
 * @constructor 
 */
spine.anim_bone = function ()
{
}

/** @type {number} */
spine.anim_bone.prototype.min_time = 0;
/** @type {number} */
spine.anim_bone.prototype.max_time = 0;
/** @type {Array.<spine.translate_keyframe>} */
spine.anim_bone.prototype.translate_keyframes = null;
/** @type {Array.<spine.rotate_keyframe>} */
spine.anim_bone.prototype.rotate_keyframes = null;
/** @type {Array.<spine.scale_keyframe>} */
spine.anim_bone.prototype.scale_keyframes = null;

/**
 * @return {spine.anim_bone} 
 * @param {*} json 
 */
spine.anim_bone.prototype.load = function (json)
{
	this.min_time = 0;
	this.max_time = 0;
	this.translate_keyframes = null;
	this.rotate_keyframes = null;
	this.scale_keyframes = null;

	if (json.translate)
	{
		this.translate_keyframes = [];
		for (var translate_idx = 0; translate_idx < json.translate.length; ++translate_idx)
		{
			var translate_keyframe = new spine.translate_keyframe().load(json.translate[translate_idx]);
			this.translate_keyframes.push(translate_keyframe);
			this.min_time = Math.min(this.min_time, translate_keyframe.time);
			this.max_time = Math.max(this.max_time, translate_keyframe.time);
		}
		this.translate_keyframes = this.translate_keyframes.sort(spine.keyframe.compare);
	}

	if (json.rotate)
	{
		this.rotate_keyframes = [];
		for (var rotate_idx = 0; rotate_idx < json.rotate.length; ++rotate_idx)
		{
			var rotate_keyframe = new spine.rotate_keyframe().load(json.rotate[rotate_idx]);
			this.rotate_keyframes.push(rotate_keyframe);
			this.min_time = Math.min(this.min_time, rotate_keyframe.time);
			this.max_time = Math.max(this.max_time, rotate_keyframe.time);
		}
		this.rotate_keyframes = this.rotate_keyframes.sort(spine.keyframe.compare);
	}

	if (json.scale)
	{
		this.scale_keyframes = [];
		for (var scale_idx = 0; scale_idx < json.scale.length; ++scale_idx)
		{
			var scale_keyframe = new spine.scale_keyframe().load(json.scale[scale_idx]);
			this.scale_keyframes.push(scale_keyframe);
			this.min_time = Math.min(this.min_time, scale_keyframe.time);
			this.max_time = Math.max(this.max_time, scale_keyframe.time);
		}
		this.scale_keyframes = this.scale_keyframes.sort(spine.keyframe.compare);
	}

	return this;
}

/**
 * @constructor 
 * @extends {spine.keyframe} 
 * @param {number=} time 
 */
spine.slot_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.slot_keyframe, spine.keyframe);

/**
 * @return {spine.slot_keyframe} 
 * @param {*} json 
 */
spine.slot_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	return this;
}

/**
 * @constructor 
 * @extends {spine.slot_keyframe} 
 * @param {number=} time 
 */
spine.color_keyframe = function (time)
{
	goog.base(this, time);

	this.color = new spine.color();
}

goog.inherits(spine.color_keyframe, spine.slot_keyframe);

/** @type {spine.color} */
spine.color_keyframe.prototype.color;
/** @type {function(number):number} */
spine.color_keyframe.prototype.curve = function (t) { return t; };

/**
 * @return {spine.color_keyframe} 
 * @param {*} json 
 */
spine.color_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.color.load(json.color);
	this.curve = spine.toCurve(json.curve);
	return this;
}

/**
 * @constructor 
 * @extends {spine.slot_keyframe} 
 * @param {number=} time 
 */
spine.attachment_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.attachment_keyframe, spine.slot_keyframe);


/** @type {string} */
spine.attachment_keyframe.prototype.name = "";

/**
 * @return {spine.attachment_keyframe} 
 * @param {*} json 
 */
spine.attachment_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.name = spine.importString(json.name, "");
	return this;
}

/**
 * @constructor 
 */
spine.anim_slot = function ()
{
}

/** @type {number} */
spine.anim_slot.prototype.min_time = 0;
/** @type {number} */
spine.anim_slot.prototype.max_time = 0;
/** @type {Array.<spine.color_keyframe>} */
spine.anim_slot.prototype.color_keyframes = null;
/** @type {Array.<spine.attachment_keyframe>} */
spine.anim_slot.prototype.attachment_keyframes = null;

/**
 * @return {spine.anim_slot} 
 * @param {*} json 
 */
spine.anim_slot.prototype.load = function (json)
{
	this.min_time = 0;
	this.max_time = 0;
	this.color_keyframes = null;
	this.attachment_keyframes = null;

	if (json.color)
	{
		this.color_keyframes = [];
		for (var color_idx = 0; color_idx < json.color.length; ++color_idx)
		{
			var color_keyframe = new spine.color_keyframe().load(json.color[color_idx]);
			this.min_time = Math.min(this.min_time, color_keyframe.time);
			this.max_time = Math.max(this.max_time, color_keyframe.time);
			this.color_keyframes.push(color_keyframe);
		}
		this.color_keyframes = this.color_keyframes.sort(spine.keyframe.compare);
	}

	if (json.attachment)
	{
		this.attachment_keyframes = [];
		for (var attachment_idx = 0; attachment_idx < json.attachment.length; ++attachment_idx)
		{
			var attachment_keyframe = new spine.attachment_keyframe().load(json.attachment[attachment_idx]);
			this.min_time = Math.min(this.min_time, attachment_keyframe.time);
			this.max_time = Math.max(this.max_time, attachment_keyframe.time);
			this.attachment_keyframes.push(attachment_keyframe);
		}
		this.attachment_keyframes = this.attachment_keyframes.sort(spine.keyframe.compare);
	}

	return this;
}

/**
 * @constructor 
 * @extends {spine.keyframe} 
 * @param {number=} time 
 */
spine.event_keyframe = function (time)
{
	goog.base(this, time);
}

goog.inherits(spine.event_keyframe, spine.keyframe);

/** @type {string} */
spine.event_keyframe.prototype.name = "";
/** @type {number|string} */
spine.event_keyframe.prototype.value = 0;

/**
 * @return {spine.event_keyframe} 
 * @param {*} json 
 */
spine.event_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	if (typeof(json.name) === 'string')
	{
		this.name = spine.importString(json.name, "");
	}
	if (typeof(json['int']) === 'string')
	{
		this.value = spine.importInt(json['int'], 0);
	}
	if (typeof(json['float']) === 'string')
	{
		this.value = spine.importFloat(json['float'], 0);
	}
	if (typeof(json['string']) === 'string')
	{
		this.value = spine.importString(json['string'], "");
	}
	return this;
}

/**
 * @constructor
 */
spine.slot_offset = function ()
{
}

/** @type {string} */
spine.slot_offset.prototype.slot = "";
/** @type {number} */
spine.slot_offset.prototype.offset = 0;

/**
 * @return {spine.slot_offset}
 * @param {*} json 
 */
spine.slot_offset.prototype.load = function (json)
{
	this.slot = spine.importString(json.slot, "");
	this.offset = spine.importInt(json.offset, 0);
	return this;
}

/**
 * @constructor 
 * @extends {spine.keyframe} 
 * @param {number=} time 
 */
spine.draworder_keyframe = function (time)
{
	goog.base(this, time);

	this.slot_offsets = [];
}

goog.inherits(spine.draworder_keyframe, spine.keyframe);

/** @type {Array.<spine.slot_offset>} */
spine.draworder_keyframe.slot_offsets;

/**
 * @return {spine.draworder_keyframe} 
 * @param {*} json 
 */
spine.draworder_keyframe.prototype.load = function (json)
{
	goog.base(this, 'load', json);
	this.slot_offsets = [];
	if (json.offsets) for (var offset_idx = 0; offset_idx < json.offsets.length; ++offset_idx)
	{
		this.slot_offsets.push(new spine.slot_offset().load(json.offsets[offset_idx]));
	}
	return this;
}

/**
 * @constructor
 */
spine.animation = function ()
{
}

/** @type {string} */
spine.animation.prototype.name = "";

/** @type {Object.<string,spine.anim_bone>} */
spine.animation.prototype.anim_bones = null;
/** @type {Object.<string,spine.anim_slot>} */
spine.animation.prototype.anim_slots = null;
/** @type {Array.<spine.event_keyframe>} */
spine.animation.prototype.event_keyframes = null;
/** @type {Array.<spine.draworder_keyframe>} */
spine.animation.prototype.draworder_keyframes = null;

/** @type {number} */
spine.animation.prototype.min_time = 0;
/** @type {number} */
spine.animation.prototype.max_time = 0;
/** @type {number} */
spine.animation.prototype.length = 0;

/**
 * @return {spine.animation} 
 * @param {*} json 
 */
spine.animation.prototype.load = function (json)
{
	this.anim_bones = null;
	this.anim_slots = null;
	this.event_keyframes = null;
	this.draworder_keyframes = null;

	this.min_time = 0;
	this.max_time = 0;

	if (json.bones)
	{
		this.anim_bones = {};
		for (var bone_key in json.bones)
		{
			var anim_bone = new spine.anim_bone().load(json.bones[bone_key]);
			this.min_time = Math.min(this.min_time, anim_bone.min_time);
			this.max_time = Math.max(this.max_time, anim_bone.max_time);
			this.anim_bones[bone_key] = anim_bone;
		}
	}

	if (json.slots)
	{
		this.anim_slots = {};
		for (var slot_key in json.slots)
		{
			var anim_slot = new spine.anim_slot().load(json.slots[slot_key]);
			this.min_time = Math.min(this.min_time, anim_slot.min_time);
			this.max_time = Math.max(this.max_time, anim_slot.max_time);
			this.anim_slots[slot_key] = anim_slot;
		}
	}

	if (json.events)
	{
		this.event_keyframes = [];
		for (var event_idx = 0; event_idx < json.events.length; ++event_idx)
		{
			var event_keyframe = new spine.event_keyframe().load(json.events[event_idx]);
			this.min_time = Math.min(this.min_time, event_keyframe.time);
			this.max_time = Math.max(this.max_time, event_keyframe.time);
			this.event_keyframes.push(event_keyframe);
		}
		this.event_keyframes = this.event_keyframes.sort(spine.keyframe.compare);
	}

	if (json.drawOrder)
	{
		this.draworder_keyframes = [];
		for (var draworder_idx = 0; draworder_idx < json.drawOrder.length; ++draworder_idx)
		{
			var draworder_keyframe = new spine.draworder_keyframe().load(json.drawOrder[draworder_idx]);
			this.min_time = Math.min(this.min_time, draworder_keyframe.time);
			this.max_time = Math.max(this.max_time, draworder_keyframe.time);
			this.draworder_keyframes.push(draworder_keyframe);
		}
		this.draworder_keyframes = this.draworder_keyframes.sort(spine.keyframe.compare);
	}

	this.length = this.max_time - this.min_time;

	return this;
}

/**
 * @constructor 
 */
spine.skeleton = function ()
{
}

/** @type {string} */
spine.skeleton.prototype.name = "";

/** @type {string} */
spine.skeleton.prototype.images = "";

/** @type {Object.<string,spine.skel_bone>} */
spine.skeleton.prototype.skel_bones = null;
/** @type {Array.<string>} */
spine.skeleton.prototype.skel_bone_keys = null;
/** @type {Object.<string,spine.skel_slot>} */
spine.skeleton.prototype.skel_slots = null;
/** @type {Array.<string>} */
spine.skeleton.prototype.skel_slot_keys = null;
/** @type {Object.<string,spine.skin>} */
spine.skeleton.prototype.skins = null;

/**
 * @return {spine.skeleton} 
 * @param {*} json 
 */
spine.skeleton.prototype.load = function (json)
{
	this.skel_bones = null;
	this.skel_bone_keys = null;
	this.skel_slots = null;
	this.skel_slot_keys = null;
	this.skins = null;

	if (json.skeleton)
	{
		this.images = json.skeleton.images || "";
	}

	if (json.bones)
	{
		this.skel_bones = {};
		this.skel_bone_keys = [];
		for (var bone_idx = 0; bone_idx < json.bones.length; ++bone_idx)
		{
			var bone = json.bones[bone_idx];
			this.skel_bones[bone.name] = new spine.skel_bone().load(bone);
			this.skel_bone_keys[bone_idx] = bone.name;
		}
	}

	if (json.slots)
	{
		this.skel_slots = {};
		this.skel_slot_keys = [];
		for (var slot_idx = 0; slot_idx < json.slots.length; ++slot_idx)
		{
			var slot = json.slots[slot_idx];
			this.skel_slots[slot.name] = new spine.skel_slot().load(slot);
			this.skel_slot_keys[slot_idx] = slot.name;
		}
	}

	if (json.skins)
	{
		this.skins = {};
		for (var skin_key in json.skins)
		{
			var skin = json.skins[skin_key];
			this.skins[skin_key] = new spine.skin().load(skin);
		}
	}

	return this;
}

/**
 * @constructor 
 */
spine.data = function ()
{
	this.skeleton = new spine.skeleton();
}

/** @type {string} */
spine.data.prototype.name = "";

/** @type {spine.skeleton} */
spine.data.prototype.skeleton = new spine.skeleton();
/** @type {Object.<string,spine.event>} */
spine.data.prototype.events = null;
/** @type {Object.<string,spine.animation>} */
spine.data.prototype.animations = null;

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.load = function (json)
{
	this.events = null;
	this.animations = null;

	this.loadSkeleton(json);

	if (json.events)
	{
		this.events = {};
		for (var event_name in json.events)
		{
			this.loadEvent(event_name, json.events[event_name]);
		}
	}

	if (json.animations)
	{
		this.animations = {};
		for (var anim_key in json.animations)
		{
			this.loadAnimation(anim_key, json.animations[anim_key]);
		}
	}

	return this;
}

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.loadSkeleton = function (json)
{
	this.skeleton.load(json);

	return this;
}

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.loadEvent = function (name, json)
{
	this.events[name] = new spine.event().load(json);

	return this;
}

/**
 * @return {spine.data} 
 * @param {*} json 
 */
spine.data.prototype.loadAnimation = function (name, json)
{
	this.animations[name] = new spine.animation().load(json);

	return this;
}

/**
 * @return {Object.<string,spine.skin>}
 */
spine.data.prototype.getSkins = function ()
{
	return this.skeleton.skins;
}

/**
 * @return {Object.<string,spine.event>}
 */
spine.data.prototype.getEvents = function ()
{
	return this.events;
}

/**
 * @return {Object.<string,spine.animation>}
 */
spine.data.prototype.getAnims = function ()
{
	return this.animations;
}


/**
 * @constructor 
 * @param {spine.data=} data 
 */
spine.pose = function (data)
{
	this.data = data || null;

	this.tweened_skel_bones = {};
	this.tweened_skel_slots = {};
	this.tweened_events = [];
	this.tweened_skel_slot_keys = [];
}

/** @type {spine.data} */
spine.pose.prototype.data;

/** @type {string} */
spine.pose.prototype.skin_key = "";
/** @type {string} */
spine.pose.prototype.anim_key = "";
/** @type {number} */
spine.pose.prototype.time = 0;
/** @type {number} */
spine.pose.prototype.elapsed_time = 0;

/** @type {boolean} */
spine.pose.prototype.dirty = true;

/** @type {Object.<string,spine.skel_bone>} */
spine.pose.prototype.tweened_skel_bones;

/** @type {Object.<string,spine.skel_slot>} */
spine.pose.prototype.tweened_skel_slots;

/** @type {Array.<spine.event>} */
spine.pose.prototype.tweened_events;

/** @type {Array.<string>} */
spine.pose.prototype.tweened_skel_slot_keys;

/**
 * @return {spine.skeleton}
 */
spine.pose.prototype.curSkel = function ()
{
	return this.data && this.data.skeleton;
}

/**
 * @return {Object.<string,spine.skin>}
 */
spine.pose.prototype.getSkins = function ()
{
	return this.data && this.data.getSkins();
}

/**
 * @return {spine.skin}
 */
spine.pose.prototype.curSkin = function ()
{
	var skins = this.getSkins();
	return skins && skins[this.skin_key];
}

/**
 * @return {string}
 */
spine.pose.prototype.getSkin = function ()
{
	return this.skin_key;
}

/**
 * @return {void} 
 * @param {string} skin_key
 */
spine.pose.prototype.setSkin = function (skin_key)
{
	if (this.skin_key !== skin_key)
	{
		this.skin_key = skin_key;
	}
}

/**
 * @return {Object.<string,spine.event>}
 */
spine.pose.prototype.getEvents = function ()
{
	return this.data && this.data.getEvents();
}

/**
 * @return {Object.<string,spine.animation>}
 */
spine.pose.prototype.getAnims = function ()
{
	return this.data && this.data.getAnims();
}

/**
 * @return {spine.animation}
 */
spine.pose.prototype.curAnim = function ()
{
	var anims = this.getAnims();
	return anims && anims[this.anim_key];
}

/**
 * @return {string}
 */
spine.pose.prototype.getAnim = function ()
{
	return this.anim_key;
}

/**
 * @return {void} 
 * @param {string} anim_key
 */
spine.pose.prototype.setAnim = function (anim_key)
{
	if (this.anim_key !== anim_key)
	{
		this.anim_key = anim_key;
		var anim = this.curAnim();
		if (anim)
		{
			this.time = spine.wrap(this.time, anim.min_time, anim.max_time);
		}
		this.elapsed_time = 0;
		this.dirty = true;
	}
}

/**
 * @return {number}
 */
spine.pose.prototype.getTime = function ()
{
	return this.time;
}

/**
 * @return {void} 
 * @param {number} time 
 */
spine.pose.prototype.setTime = function (time)
{
	var anim = this.curAnim();
	if (anim)
	{
		time = spine.wrap(time, anim.min_time, anim.max_time);
	}

	if (this.time !== time)
	{
		this.time = time;
		this.elapsed_time = 0;
		this.dirty = true;
	}
}

/**
 * @return {void}
 * @param {number} elapsed_time
 */
spine.pose.prototype.update = function (elapsed_time)
{
	this.setTime(this.getTime() + elapsed_time);
}

/**
 * @return {void}
 */
spine.pose.prototype.strike = function ()
{
	if (!this.dirty) { return; }
	this.dirty = false;

	var skel = this.curSkel();
	var skel_bones = skel && skel.skel_bones;
	var skel_slots = skel && skel.skel_slots;
	var skel_slot_keys = skel && skel.skel_slot_keys;
	var anim = this.curAnim();
	var anim_bones = anim && anim.anim_bones;
	var anim_slots = anim && anim.anim_slots;

	var events = this.getEvents()

	var time = this.time;
	var elapsed_time = this.elapsed_time;

	this.elapsed_time = 0; // reset elapsed time for next update

	for (var bone_key in skel_bones)
	{
		var skel_bone = skel_bones[bone_key];
		var tweened_skel_bone = this.tweened_skel_bones[bone_key] || (this.tweened_skel_bones[bone_key] = new spine.skel_bone());

		// start with a copy of the skeleton bone
		tweened_skel_bone.copy(skel_bone);

		// tween anim bone if keyframes are available
		var anim_bone = anim_bones && anim_bones[bone_key];
		if (anim_bone)
		{
			var translate_keyframes = anim_bone.translate_keyframes;
			if (translate_keyframes)
			{
				var translate_keyframe0_idx = spine.keyframe.find(translate_keyframes, time);
				if (translate_keyframe0_idx !== -1)
				{
					var translate_keyframe0 = translate_keyframes[translate_keyframe0_idx];
					var translate_keyframe1_idx = translate_keyframe0_idx + 1;
					if (translate_keyframe1_idx < translate_keyframes.length)
					{
						var translate_keyframe1 = translate_keyframes[translate_keyframe1_idx];
						var pct = (time - translate_keyframe0.time) / (translate_keyframe1.time - translate_keyframe0.time);
						pct = translate_keyframe0.curve(pct);
						tweened_skel_bone.x += spine.tween(translate_keyframe0.x, translate_keyframe1.x, pct);
						tweened_skel_bone.y += spine.tween(translate_keyframe0.y, translate_keyframe1.y, pct);
					}
					else
					{
						tweened_skel_bone.x += translate_keyframe0.x;
						tweened_skel_bone.y += translate_keyframe0.y;
					}
				}
			}

			var rotate_keyframes = anim_bone.rotate_keyframes;
			if (rotate_keyframes)
			{
				var rotate_keyframe0_idx = spine.keyframe.find(rotate_keyframes, time);
				if (rotate_keyframe0_idx !== -1)
				{
					var rotate_keyframe0 = rotate_keyframes[rotate_keyframe0_idx];
					var rotate_keyframe1_idx = rotate_keyframe0_idx + 1;
					if (rotate_keyframe1_idx < rotate_keyframes.length)
					{
						var rotate_keyframe1 = rotate_keyframes[rotate_keyframe1_idx];
						var pct = (time - rotate_keyframe0.time) / (rotate_keyframe1.time - rotate_keyframe0.time);
						pct = rotate_keyframe0.curve(pct);
						tweened_skel_bone.rotation += spine.tweenAngle(rotate_keyframe0.angle, rotate_keyframe1.angle, pct);
					}
					else
					{
						tweened_skel_bone.rotation += rotate_keyframe0.angle;
					}
				}
			}

			var scale_keyframes = anim_bone.scale_keyframes;
			if (scale_keyframes)
			{
				var scale_keyframe0_idx = spine.keyframe.find(scale_keyframes, time);
				if (scale_keyframe0_idx !== -1)
				{
					var scale_keyframe0 = scale_keyframes[scale_keyframe0_idx];
					var scale_keyframe1_idx = scale_keyframe0_idx + 1;
					if (scale_keyframe1_idx < scale_keyframes.length)
					{
						var scale_keyframe1 = scale_keyframes[scale_keyframe1_idx];
						var pct = (time - scale_keyframe0.time) / (scale_keyframe1.time - scale_keyframe0.time);
						pct = scale_keyframe0.curve(pct);
						tweened_skel_bone.scaleX += spine.tween(scale_keyframe0.scaleX, scale_keyframe1.scaleX, pct) - 1;
						tweened_skel_bone.scaleY += spine.tween(scale_keyframe0.scaleY, scale_keyframe1.scaleY, pct) - 1;
					}
					else
					{
						tweened_skel_bone.scaleX += scale_keyframe0.scaleX - 1;
						tweened_skel_bone.scaleY += scale_keyframe0.scaleY - 1;
					}
				}
			}
		}
	}

	for (var slot_key in skel_slots)
	{
		var skel_slot = skel_slots[slot_key];
		var tweened_skel_slot = this.tweened_skel_slots[slot_key] || (this.tweened_skel_slots[slot_key] = new spine.skel_slot());

		// start with a copy of the skeleton slot
		tweened_skel_slot.copy(skel_slot);

		// tween anim slot if keyframes are available
		var anim_slot = anim_slots && anim_slots[slot_key];
		if (anim_slot)
		{
			var color_keyframes = anim_slot.color_keyframes;
			if (color_keyframes)
			{
				var color_keyframe0_idx = spine.keyframe.find(color_keyframes, time);
				if (color_keyframe0_idx !== -1)
				{
					var color_keyframe0 = color_keyframes[color_keyframe0_idx];
					var color_keyframe1_idx = color_keyframe0_idx + 1;
					if (color_keyframe1_idx < color_keyframes.length)
					{
						var color_keyframe1 = color_keyframes[color_keyframe1_idx];
						var pct = (time - color_keyframe0.time) / (color_keyframe1.time - color_keyframe0.time);
						pct = color_keyframe0.curve(pct);
						tweened_skel_slot.color.r = spine.tween(color_keyframe0.color.r, color_keyframe1.color.r, pct);
						tweened_skel_slot.color.g = spine.tween(color_keyframe0.color.g, color_keyframe1.color.g, pct);
						tweened_skel_slot.color.b = spine.tween(color_keyframe0.color.b, color_keyframe1.color.b, pct);
						tweened_skel_slot.color.a = spine.tween(color_keyframe0.color.a, color_keyframe1.color.a, pct);
					}
					else
					{
						tweened_skel_slot.color.r = color_keyframe0.color.r;
						tweened_skel_slot.color.g = color_keyframe0.color.g;
						tweened_skel_slot.color.b = color_keyframe0.color.b;
						tweened_skel_slot.color.a = color_keyframe0.color.a;
					}
				}
			}

			var attachment_keyframes = anim_slot.attachment_keyframes;
			if (attachment_keyframes)
			{
				var attachment_keyframe0_idx = spine.keyframe.find(attachment_keyframes, time);
				if (attachment_keyframe0_idx !== -1)
				{
					var attachment_keyframe0 = attachment_keyframes[attachment_keyframe0_idx];
					// no tweening attachments
					tweened_skel_slot.attachment = attachment_keyframe0.name;
				}
			}
		}
	}

	this.tweened_events = [];

	if (anim)
	{
		var add_event = function (tweened_events, event_keyframe)
		{
			var tweened_event = new spine.event();
			var event = events && events[event_keyframe.name];
			if (event)
			{
				// start with a copy of the event
				tweened_event.copy(event);
			}
			tweened_events.push(tweened_event);
		}

		var prev_time = time - elapsed_time;
		var wrapped_min = (elapsed_time < 0) && (prev_time > anim.max_time);
		var wrapped_max = (elapsed_time > 0) && (prev_time < anim.min_time);

		if (wrapped_min)
		{
			var event_keyframe_idx = spine.keyframe.find(anim.event_keyframes, anim.min_time);
			if (event_keyframe_idx !== -1)
			{
				var event_keyframe = anim.event_keyframes[event_keyframe_idx];
				add_event(this.tweened_events, event_keyframe);
			}
		}
		else if (wrapped_max)
		{
			var event_keyframe_idx = spine.keyframe.find(anim.event_keyframes, anim.max_time);
			if (event_keyframe_idx !== -1)
			{
				var event_keyframe = anim.event_keyframes[event_keyframe_idx];
				add_event(this.tweened_events, event_keyframe);
			}
		}

		var event_keyframe_idx = spine.keyframe.find(anim.event_keyframes, time);
		if (event_keyframe_idx !== -1)
		{
			var event_keyframe = anim.event_keyframes[event_keyframe_idx];
			if (((elapsed_time < 0) && ((time <= event_keyframe.time) && (event_keyframe.time <= prev_time))) || 
				((elapsed_time > 0) && ((prev_time <= event_keyframe.time) && (event_keyframe.time <= time))))
			{
				add_event(this.tweened_events, event_keyframe);
			}
		}
	}

	this.tweened_skel_slot_keys = skel_slot_keys && skel_slot_keys.slice(0);

	if (anim)
	{
		var draworder_keyframe_idx = spine.keyframe.find(anim.draworder_keyframes, time);
		if (draworder_keyframe_idx !== -1)
		{
			var draworder_keyframe = anim.draworder_keyframes[draworder_keyframe_idx];
			var slot_offsets = draworder_keyframe.slot_offsets;
			for (var slot_offset_index = 0; slot_offset_index < slot_offsets.length; ++slot_offset_index)
			{
				var slot_offset = slot_offsets[slot_offset_index];
				var index = this.tweened_skel_slot_keys.indexOf(slot_offset.slot);
				if (index >= 0)
				{
					// delete old position
					this.tweened_skel_slot_keys.splice(index, 1);
					// insert new position
					this.tweened_skel_slot_keys.splice(index + slot_offset.offset, 0, slot_offset.slot);
				}
			}
		}
	}
}

