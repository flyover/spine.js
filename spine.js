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
spine.loadBool = function(json, key, def) {
  var value = json[key];
  switch (typeof(value)) {
    case 'string':
      return (value === 'true') ? true : false;
    case 'boolean':
      return value;
    default:
      return def || false;
  }
}

/**
 * @return {void}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {boolean} value
 * @param {boolean=} def
 */
spine.saveBool = function(json, key, value, def) {
  if ((typeof(def) !== 'boolean') || (value !== def)) {
    json[key] = value;
  }
}

/**
 * @return {number}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {number=} def
 */
spine.loadFloat = function(json, key, def) {
  var value = json[key];
  switch (typeof(value)) {
    case 'string':
      return parseFloat(value);
    case 'number':
      return value;
    default:
      return def || 0;
  }
}

/**
 * @return {void}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {number} value
 * @param {number=} def
 */
spine.saveFloat = function(json, key, value, def) {
  if ((typeof(def) !== 'number') || (value !== def)) {
    json[key] = value;
  }
}

/**
 * @return {number}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {number=} def
 */
spine.loadInt = function(json, key, def) {
  var value = json[key];
  switch (typeof(value)) {
    case 'string':
      return parseInt(value, 10);
    case 'number':
      return 0 | value;
    default:
      return def || 0;
  }
}

/**
 * @return {void}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {number} value
 * @param {number=} def
 */
spine.saveInt = function(json, key, value, def) {
  if ((typeof(def) !== 'number') || (value !== def)) {
    json[key] = value;
  }
}

/**
 * @return {string}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {string=} def
 */
spine.loadString = function(json, key, def) {
  var value = json[key];
  switch (typeof(value)) {
    case 'string':
      return value;
    default:
      return def || "";
  }
}

/**
 * @return {void}
 * @param {Object.<string,?>|Array.<?>} json
 * @param {string|number} key
 * @param {string} value
 * @param {string=} def
 */
spine.saveString = function(json, key, value, def) {
  if ((typeof(def) !== 'string') || (value !== def)) {
    json[key] = value;
  }
}

/**
 * @constructor
 */
spine.Color = function() {}

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
spine.Color.prototype.copy = function(other) {
  var color = this;
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
spine.Color.prototype.load = function(json) {
  var color = this;
  var rgba = 0xffffffff;
  switch (typeof(json)) {
    case 'string':
      rgba = parseInt(json, 16);
      break;
    case 'number':
      rgba = 0 | json;
      break;
    default:
      rgba = 0xffffffff;
      break;
  }
  color.r = ((rgba >> 24) & 0xff) / 255;
  color.g = ((rgba >> 16) & 0xff) / 255;
  color.b = ((rgba >> 8) & 0xff) / 255;
  color.a = (rgba & 0xff) / 255;
  return color;
}

/**
 * @return {string}
 */
spine.Color.prototype.toString = function() {
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
spine.BezierCurve = function(x1, y1, x2, y2, epsilon) {

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

  function curveX(t) {
    var t2 = t * t;
    var t3 = t2 * t;
    var v = 1 - t;
    var v2 = v * v;
    return 3 * x1 * v2 * t + 3 * x2 * v * t2 + t3;
  }

  function curveY(t) {
    var t2 = t * t;
    var t3 = t2 * t;
    var v = 1 - t;
    var v2 = v * v;
    return 3 * y1 * v2 * t + 3 * y2 * v * t2 + t3;
  }

  function derivativeCurveX(t) {
    var t2 = t * t;
    var t3 = t2 * t;
    return 3 * x1 * t - 3 * (2 * x1 - x2) * t2 + (3 * x1 - 3 * x2 + 1) * t3;
  }

  epsilon = epsilon || 1e-6;

  return function(percent) {
    var x = percent,
      t0, t1, t2, x2, d2, i;

    // First try a few iterations of Newton's method -- normally very fast.
    for (t2 = x, i = 0; i < 8; ++i) {
      x2 = curveX(t2) - x;
      if (Math.abs(x2) < epsilon) return curveY(t2);
      d2 = derivativeCurveX(t2);
      if (Math.abs(d2) < epsilon) break;
      t2 = t2 - (x2 / d2);
    }

    t0 = 0, t1 = 1, t2 = x;

    if (t2 < t0) return curveY(t0);
    if (t2 > t1) return curveY(t1);

    // Fallback to the bisection method for reliability.
    while (t0 < t1) {
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
spine.StepBezierCurve = function(cx1, cy1, cx2, cy2) {
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

  return function(percent) {
    var dfx = curves_0;
    var dfy = curves_1;
    var ddfx = curves_2;
    var ddfy = curves_3;
    var dddfx = curves_4;
    var dddfy = curves_5;

    var x = dfx,
      y = dfy;
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
spine.Curve = function() {}

/** @type {function(number):number} */
spine.Curve.prototype.evaluate = function(t) {
  return t;
};

/**
 * @return {spine.Curve}
 * @param {?} json
 */
spine.Curve.prototype.load = function(json) {
  var curve = this;

  // default: linear
  curve.evaluate = function(t) {
    return t;
  };

  if ((typeof(json) === 'string') && (json === 'stepped')) {
    // stepped
    curve.evaluate = function() {
      return 0;
    };
  } else if ((typeof(json) === 'object') && (typeof(json.length) === 'number') && (json.length === 4)) {
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
spine.wrap = function(num, min, max) {
  if (min < max) {
    if (num < min) {
      return max - ((min - num) % (max - min));
    } else {
      return min + ((num - min) % (max - min));
    }
  } else if (min === max) {
    return min;
  } else {
    return num;
  }
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spine.tween = function(a, b, t) {
  return a + ((b - a) * t);
}

/**
 * @return {number}
 * @param {number} angle
 */
spine.wrapAngleRadians = function(angle) {
  if (angle <= 0) {
    return ((angle - Math.PI) % (2 * Math.PI)) + Math.PI;
  } else {
    return ((angle + Math.PI) % (2 * Math.PI)) - Math.PI;
  }
}

/**
 * @return {number}
 * @param {number} a
 * @param {number} b
 * @param {number} t
 */
spine.tweenAngle = function(a, b, t) {
  return spine.wrapAngleRadians(a + (spine.wrapAngleRadians(b - a) * t));
}

/**
 * @constructor
 * @param {number=} rad
 */
spine.Angle = function(rad) {
  this.rad = rad || 0;
}

/** @type {number} */
spine.Angle.prototype.deg;
Object.defineProperty(spine.Angle.prototype, 'deg', {
  /** @this {spine.Angle} */
  get: function() { return this.rad * 180 / Math.PI; },
  /** @this {spine.Angle} */
  set: function(value) { this.rad = value * Math.PI / 180; }
});

/** @type {number} */
spine.Angle.prototype.cos;
Object.defineProperty(spine.Angle.prototype, 'cos', {
  /** @this {spine.Angle} */
  get: function() { return Math.cos(this.rad); }
});

/** @type {number} */
spine.Angle.prototype.sin;
Object.defineProperty(spine.Angle.prototype, 'sin', {
  /** @this {spine.Angle} */
  get: function() { return Math.sin(this.rad); }
});

/**
 * @return {spine.Angle}
 * @param {spine.Angle} angle
 * @param {spine.Angle=} out
 */
spine.Angle.copy = function(angle, out) {
  out = out || new spine.Angle();
  out.rad = angle.rad;
  return out;
}

/**
 * @return {spine.Angle}
 * @param {spine.Angle} other
 */
spine.Angle.prototype.copy = function(other) {
  return spine.Angle.copy(other, this);
}

/**
 * @return {boolean}
 * @param {spine.Angle} a
 * @param {spine.Angle} b
 * @param {number=} epsilon
 */
spine.Angle.equal = function(a, b, epsilon) {
  epsilon = epsilon || 1e-6;
  if (Math.abs(spine.wrapAngleRadians(a.rad - b.rad)) > epsilon) { return false; }
  return true;
}

/**
 * @return {boolean}
 * @param {spine.Angle} other
 * @param {number=} epsilon
 */
spine.Angle.prototype.equal = function(other, epsilon) {
  return spine.Angle.equal(this, other, epsilon);
}

/**
 * @return {spine.Angle}
 * @param {spine.Angle} a
 * @param {spine.Angle} b
 * @param {number} pct
 * @param {spine.Angle=} out
 */
spine.Angle.tween = function(a, b, pct, out) {
  out = out || new spine.Angle();
  out.rad = spine.tweenAngle(a.rad, b.rad, pct);
  return out;
}

/**
 * @return {spine.Angle}
 * @param {spine.Angle} other
 * @param {number} pct
 * @param {spine.Angle=} out
 */
spine.Angle.prototype.tween = function(other, pct, out) {
  return spine.Angle.tween(this, other, pct, out);
}

/**
 * @constructor
 * @param {number=} x
 * @param {number=} y
 */
spine.Vector = function(x, y) {
  this.x = x || 0;
  this.y = y || 0;
}

/** @type {number} */
spine.Vector.prototype.x = 0;
/** @type {number} */
spine.Vector.prototype.y = 0;

/**
 * @return {spine.Vector}
 * @param {spine.Vector} m
 * @param {spine.Vector=} out
 */
spine.Vector.copy = function(m, out) {
  out = out || new spine.Vector();
  out.x = m.x;
  out.y = m.y;
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other
 */
spine.Vector.prototype.copy = function(other) {
  return spine.Vector.copy(other, this);
}

/**
 * @return {boolean}
 * @param {spine.Vector} a
 * @param {spine.Vector} b
 * @param {number=} epsilon
 */
spine.Vector.equal = function(a, b, epsilon) {
  epsilon = epsilon || 1e-6;
  if (Math.abs(a.x - b.x) > epsilon) { return false; }
  if (Math.abs(a.y - b.y) > epsilon) { return false; }
  return true;
}

/**
 * @return {boolean}
 * @param {spine.Vector} other
 * @param {number=} epsilon
 */
spine.Vector.prototype.equal = function(other, epsilon) {
  return spine.Vector.equal(this, other, epsilon);
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Vector.negate = function(v, out) {
  out = out || new spine.Vector();
  out.x = -v.x;
  out.y = -v.y;
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} a
 * @param {spine.Vector} b
 * @param {spine.Vector=} out
 */
spine.Vector.add = function(a, b, out) {
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
spine.Vector.prototype.add = function(other, out) {
  return spine.Vector.add(this, other, out);
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other
 */
spine.Vector.prototype.selfAdd = function(other) {
  //return spine.Vector.add(this, other, this);
  this.x += other.x;
  this.y += other.y;
  return this;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} a
 * @param {spine.Vector} b
 * @param {spine.Vector=} out
 */
spine.Vector.subtract = function(a, b, out) {
  out = out || new spine.Vector();
  out.x = a.x - b.x;
  out.y = a.y - b.y;
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other
 * @param {spine.Vector=} out
 */
spine.Vector.prototype.subtract = function(other, out) {
  return spine.Vector.subtract(this, other, out);
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} other
 */
spine.Vector.prototype.selfSubtract = function(other) {
  //return spine.Vector.subtract(this, other, this);
  this.x -= other.x;
  this.y -= other.y;
  return this;
}

/**
 * @return {spine.Vector}
 * @param {spine.Vector} a
 * @param {spine.Vector} b
 * @param {number} pct
 * @param {spine.Vector=} out
 */
spine.Vector.tween = function(a, b, pct, out) {
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
spine.Vector.prototype.tween = function(other, pct, out) {
  return spine.Vector.tween(this, other, pct, out);
}

/**
 * @constructor
 */
spine.Matrix = function() {}

/** @type {number} */
spine.Matrix.prototype.a = 1;
/** @type {number} */
spine.Matrix.prototype.b = 0;
/** @type {number} */
spine.Matrix.prototype.c = 0;
/** @type {number} */
spine.Matrix.prototype.d = 1;

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} m
 * @param {spine.Matrix=} out
 */
spine.Matrix.copy = function(m, out) {
  out = out || new spine.Matrix();
  out.a = m.a;
  out.b = m.b;
  out.c = m.c;
  out.d = m.d;
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} other
 */
spine.Matrix.prototype.copy = function(other) {
  return spine.Matrix.copy(other, this);
}

/**
 * @return {boolean}
 * @param {spine.Matrix} a
 * @param {spine.Matrix} b
 * @param {number=} epsilon
 */
spine.Matrix.equal = function(a, b, epsilon) {
  epsilon = epsilon || 1e-6;
  if (Math.abs(a.a - b.a) > epsilon) { return false; }
  if (Math.abs(a.b - b.b) > epsilon) { return false; }
  if (Math.abs(a.c - b.c) > epsilon) { return false; }
  if (Math.abs(a.d - b.d) > epsilon) { return false; }
  return true;
}

/**
 * @return {boolean}
 * @param {spine.Matrix} other
 * @param {number=} epsilon
 */
spine.Matrix.prototype.equal = function(other, epsilon) {
  return spine.Matrix.equal(this, other, epsilon);
}

/**
 * @return {number}
 * @param {spine.Matrix} m
 */
spine.Matrix.determinant = function(m) {
  return m.a * m.d - m.b * m.c;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix=} out
 */
spine.Matrix.identity = function(out) {
  out = out || new spine.Matrix();
  out.a = 1; out.b = 0;
  out.c = 0; out.d = 1;
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} a
 * @param {spine.Matrix} b
 * @param {spine.Matrix=} out
 */
spine.Matrix.multiply = function(a, b, out) {
  out = out || new spine.Matrix();
  var a_a = a.a, a_b = a.b, a_c = a.c, a_d = a.d;
  var b_a = b.a, b_b = b.b, b_c = b.c, b_d = b.d;
  out.a = a_a * b_a + a_b * b_c;
  out.b = a_a * b_b + a_b * b_d;
  out.c = a_c * b_a + a_d * b_c;
  out.d = a_c * b_b + a_d * b_d;
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} m
 * @param {spine.Matrix=} out
 */
spine.Matrix.invert = function(m, out) {
  out = out || new spine.Matrix();
  var a = m.a, b = m.b, c = m.c, d = m.d;
  var inv_det = 1 / (a * d - b * c);
  out.a = inv_det * d;
  out.b = -inv_det * b;
  out.c = -inv_det * c;
  out.d = inv_det * a;
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} a
 * @param {spine.Matrix} b
 * @param {spine.Matrix=} out
 */
spine.Matrix.combine = function(a, b, out) {
  return spine.Matrix.multiply(a, b, out);
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} ab
 * @param {spine.Matrix} a
 * @param {spine.Matrix=} out
 */
spine.Matrix.extract = function(ab, a, out) {
  return spine.Matrix.multiply(spine.Matrix.invert(a, out), ab, out);
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} m
 * @param {number} cos
 * @param {number} sin
 * @param {spine.Matrix=} out
 */
spine.Matrix.rotate = function(m, cos, sin, out) {
  out = out || new spine.Matrix();
  var a = m.a, b = m.b, c = m.c, d = m.d;
  out.a = a * cos + b * sin; out.b = b * cos - a * sin;
  out.c = c * cos + d * sin; out.d = d * cos - c * sin;
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} m
 * @param {number} x
 * @param {number} y
 * @param {spine.Matrix=} out
 */
spine.Matrix.scale = function(m, x, y, out) {
  out = out || new spine.Matrix();
  out.a = m.a * x; out.b = m.b * y;
  out.c = m.c * x; out.d = m.d * y;
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Matrix} m
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Matrix.transform = function(m, v, out) {
  out = out || new spine.Vector();
  var x = v.x, y = v.y;
  out.x = m.a * x + m.b * y;
  out.y = m.c * x + m.d * y;
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Matrix} m
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Matrix.untransform = function(m, v, out) {
  out = out || new spine.Vector();
  var a = m.a, b = m.b, c = m.c, d = m.d;
  var x = v.x, y = v.y;
  var inv_det = 1 / (a * d - b * c);
  out.x = inv_det * (d * x - b * y);
  out.y = inv_det * (a * y - c * x);
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} a
 * @param {spine.Matrix} b
 * @param {number} pct
 * @param {spine.Matrix=} out
 */
spine.Matrix.tween = function(a, b, pct, out) {
  out = out || new spine.Matrix();
  out.a = spine.tween(a.a, b.a, pct);
  out.b = spine.tween(a.b, b.b, pct);
  out.c = spine.tween(a.c, b.c, pct);
  out.d = spine.tween(a.d, b.d, pct);
  return out;
}

/**
 * @return {spine.Matrix}
 * @param {spine.Matrix} other
 * @param {number} pct
 * @param {spine.Matrix=} out
 */
spine.Matrix.prototype.tween = function(other, pct, out) {
  return spine.Matrix.tween(this, other, pct, out);
}

/**
 * @constructor
 */
spine.Affine = function() {
  var affine = this;
  affine.vector = new spine.Vector();
  affine.matrix = new spine.Matrix();
}

/** @type {spine.Vector} */
spine.Affine.prototype.vector;
/** @type {spine.Matrix} */
spine.Affine.prototype.matrix;

/**
 * @return {spine.Affine}
 * @param {spine.Affine} affine
 * @param {spine.Affine=} out
 */
spine.Affine.copy = function(affine, out) {
  out = out || new spine.Affine();
  spine.Vector.copy(affine.vector, out.vector);
  spine.Matrix.copy(affine.matrix, out.matrix);
  return out;
}

/**
 * @return {spine.Affine}
 * @param {spine.Affine} other
 */
spine.Affine.prototype.copy = function(other) {
  return spine.Affine.copy(other, this);
}

/**
 * @return {boolean}
 * @param {spine.Affine} a
 * @param {spine.Affine} b
 * @param {number=} epsilon
 */
spine.Affine.equal = function(a, b, epsilon) {
  if (!a.vector.equal(b.vector, epsilon)) { return false; }
  if (!a.matrix.equal(b.matrix, epsilon)) { return false; }
  return true;
}

/**
 * @return {boolean}
 * @param {spine.Affine} other
 * @param {number=} epsilon
 */
spine.Affine.prototype.equal = function(other, epsilon) {
  return spine.Affine.equal(this, other, epsilon);
}

/**
 * @return {spine.Affine}
 * @param {spine.Affine} affine
 * @param {spine.Affine=} out
 */
spine.Affine.invert = function(affine, out) {
  out = out || new spine.Affine();
  spine.Matrix.invert(affine.matrix, out.matrix);
  spine.Vector.negate(affine.vector, out.vector);
  spine.Matrix.transform(out.matrix, out.vector, out.vector);
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Affine} affine
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Affine.transform = function(affine, v, out) {
  out = out || new spine.Vector();
  spine.Matrix.transform(affine.matrix, v, out);
  spine.Vector.add(affine.vector, out, out);
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Affine} affine
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Affine.untransform = function(affine, v, out) {
  out = out || new spine.Vector();
  spine.Vector.subtract(v, affine.vector, out);
  spine.Matrix.untransform(affine.matrix, out, out);
  return out;
}

/**
 * @constructor
 * @extends {spine.Vector}
 */
spine.Position = function() {
  goog.base(this, 0, 0);
}

goog.inherits(spine.Position, spine.Vector);

/**
 * @constructor
 * @extends {spine.Angle}
 */
spine.Rotation = function() {
  goog.base(this, 0);
}

goog.inherits(spine.Rotation, spine.Angle);

/**
 * @constructor
 * @extends {spine.Matrix}
 */
spine.Scale = function() {
  goog.base(this);
}

goog.inherits(spine.Scale, spine.Matrix);

spine.signum = function(n) { return (n < 0)?(-1):(n > 0)?(1):(n); }

/** @type {number} */
spine.Scale.prototype.x;
Object.defineProperty(spine.Scale.prototype, 'x', {
  /** @this {spine.Scale} */
  get: function() { return (this.c == 0)?(this.a):(spine.signum(this.a) * Math.sqrt(this.a * this.a + this.c * this.c)); },
  /** @this {spine.Scale} */
  set: function(value) { this.a = value; this.c = 0; }
});

/** @type {number} */
spine.Scale.prototype.y;
Object.defineProperty(spine.Scale.prototype, 'y', {
  /** @this {spine.Scale} */
  get: function() { return (this.b == 0)?(this.d):(spine.signum(this.d) * Math.sqrt(this.b * this.b + this.d * this.d)); },
  /** @this {spine.Scale} */
  set: function(value) { this.b = 0; this.d = value; }
});

/**
 * @constructor
 */
spine.Space = function() {
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
spine.Space.prototype.copy = function(other) {
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
spine.Space.prototype.load = function(json) {
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
spine.Space.equal = function(a, b, epsilon) {
  epsilon = epsilon || 1e-6;
  if (!a.position.equal(b.position, epsilon)) { return false; }
  if (!a.rotation.equal(b.rotation, epsilon)) { return false; }
  if (!a.scale.equal(b.scale, epsilon)) { return false; }
  return true;
}

/**
 * @return {boolean}
 * @param {spine.Space} other
 * @param {number=} epsilon
 */
spine.Space.prototype.equal = function(other, epsilon) {
  return spine.Space.equal(this, other, epsilon);
}

/**
 * @return {spine.Space}
 * @param {spine.Space=} out
 */
spine.Space.identity = function(out) {
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
spine.Space.translate = function(space, x, y) {
  var tx = space.scale.a * x + space.scale.b * y;
  var ty = space.scale.c * x + space.scale.d * y;
  x = tx; y = ty;
  var c = space.rotation.cos;
  var s = space.rotation.sin;
  var tx = c * x - s * y;
  var ty = s * x + c * y;
  space.position.x += tx;
  space.position.y += ty;
  return space;
}

/**
 * @return {spine.Space}
 * @param {spine.Space} space
 * @param {number} rad
 */
spine.Space.rotate = function(space, rad) {
  if (spine.Matrix.determinant(space.scale) < 0.0) {
    space.rotation.rad = spine.wrapAngleRadians(space.rotation.rad - rad);
  } else {
    space.rotation.rad = spine.wrapAngleRadians(space.rotation.rad + rad);
  }
  return space;
}

/**
 * @return {spine.Space}
 * @param {spine.Space} space
 * @param {number} x
 * @param {number} y
 */
spine.Space.scale = function(space, x, y) {
  spine.Matrix.scale(space.scale, x, y, space.scale);
  return space;
}

/**
 * @return {spine.Space}
 * @param {spine.Space} space
 * @param {spine.Space=} out
 */
spine.Space.invert = function(space, out) {
  // invert
  // out.sca = space.sca.inv();
  // out.rot = space.rot.inv();
  // out.pos = space.pos.neg().rotate(space.rot.inv()).mul(space.sca.inv());

  out = out || new spine.Space();
  spine.Matrix.invert(space.scale, out.scale);
  if (spine.Matrix.determinant(space.scale) < 0.0) {
    out.rotation.rad = spine.wrapAngleRadians(space.rotation.rad - 0);
  } else {
    out.rotation.rad = spine.wrapAngleRadians(0 - space.rotation.rad);
  }
  var x = 0 - space.position.x;
  var y = 0 - space.position.y;
  var rad = -space.rotation.rad;
  var c = Math.cos(rad);
  var s = Math.sin(rad);
  var tx = c * x - s * y;
  var ty = s * x + c * y;
  out.position.x = tx;
  out.position.y = ty;
  spine.Matrix.untransform(space.scale, out.position, out.position);
  return out;
}

/**
 * @return {spine.Space}
 * @param {spine.Space} a
 * @param {spine.Space} b
 * @param {spine.Space=} out
 */
spine.Space.combine = function(a, b, out) {
  // combine
  // out.pos = b.pos.mul(a.sca).rotate(a.rot).add(a.pos);
  // out.rot = b.rot.mul(a.rot);
  // out.sca = b.sca.mul(a.sca);

  out = out || new spine.Space();
  var x = a.scale.a * b.position.x + a.scale.b * b.position.y;
  var y = a.scale.c * b.position.x + a.scale.d * b.position.y;
  var rad = a.rotation.rad;
  var c = Math.cos(rad);
  var s = Math.sin(rad);
  var tx = c * x - s * y;
  var ty = s * x + c * y;
  out.position.x = a.position.x + tx;
  out.position.y = a.position.y + ty;
  if (spine.Matrix.determinant(a.scale) < 0.0) {
    out.rotation.rad = spine.wrapAngleRadians(a.rotation.rad - b.rotation.rad);
  } else {
    out.rotation.rad = spine.wrapAngleRadians(a.rotation.rad + b.rotation.rad);
  }
  spine.Matrix.multiply(a.scale, b.scale, out.scale);
  return out;
}

/**
 * @return {spine.Space}
 * @param {spine.Space} ab
 * @param {spine.Space} a
 * @param {spine.Space=} out
 */
spine.Space.extract = function(ab, a, out) {
  // extract
  // out.sca = ab.sca.mul(a.sca.inv());
  // out.rot = ab.rot.mul(a.rot.inv());
  // out.pos = ab.pos.add(a.pos.neg()).rotate(a.rot.inv()).mul(a.sca.inv());

  out = out || new spine.Space();
  spine.Matrix.extract(ab.scale, a.scale, out.scale);
  if (spine.Matrix.determinant(a.scale) < 0.0) {
    out.rotation.rad = spine.wrapAngleRadians(a.rotation.rad - ab.rotation.rad);
  } else {
    out.rotation.rad = spine.wrapAngleRadians(ab.rotation.rad - a.rotation.rad);
  }
  var x = ab.position.x - a.position.x;
  var y = ab.position.y - a.position.y;
  var rad = -a.rotation.rad;
  var c = Math.cos(rad);
  var s = Math.sin(rad);
  var tx = c * x - s * y;
  var ty = s * x + c * y;
  out.position.x = tx;
  out.position.y = ty;
  spine.Matrix.untransform(a.scale, out.position, out.position);
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Space} space
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Space.transform = function(space, v, out) {
  out = out || new spine.Vector();
  spine.Matrix.transform(space.scale, v, out);
  var x = out.x, y = out.y;
  var rad = space.rotation.rad;
  var c = Math.cos(rad);
  var s = Math.sin(rad);
  var tx = c * x - s * y;
  var ty = s * x + c * y;
  out.x = space.position.x + tx;
  out.y = space.position.y + ty;
  return out;
}

/**
 * @return {spine.Vector}
 * @param {spine.Space} space
 * @param {spine.Vector} v
 * @param {spine.Vector=} out
 */
spine.Space.untransform = function(space, v, out) {
  out = out || new spine.Vector();
  var x = v.x - space.position.x;
  var y = v.y - space.position.y;
  var rad = -space.rotation.rad;
  var c = Math.cos(rad);
  var s = Math.sin(rad);
  var tx = c * x - s * y;
  var ty = s * x + c * y;
  out.x = tx;
  out.y = ty;
  spine.Matrix.untransform(space.scale, out, out);
  return out;
}

/**
 * @return {spine.Space}
 * @param {spine.Space} a
 * @param {spine.Space} b
 * @param {number} tween
 * @param {spine.Space=} out
 */
spine.Space.tween = function(a, b, tween, out) {
  a.position.tween(b.position, tween, out.position);
  a.rotation.tween(b.rotation, tween, out.rotation);
  a.scale.tween(b.scale, tween, out.scale);
  return out;
}

/**
 * @constructor
 */
spine.Bone = function() {
  var bone = this;
  bone.color = new spine.Color();
  bone.local_space = new spine.Space();
  bone.world_space = new spine.Space();
  bone.world_affine = new spine.Affine();
}

/** @type {spine.Color} */
spine.Bone.prototype.color;
/** @type {string} */
spine.Bone.prototype.parent_key = "";
/** @type {number} */
spine.Bone.prototype.length = 0;
/** @type {spine.Space} */
spine.Bone.prototype.local_space;
/** @type {spine.Space} */
spine.Bone.prototype.world_space;
/** @type {spine.Affine} */
spine.Bone.prototype.world_affine;
/** @type {boolean} */
spine.Bone.prototype.inherit_rotation = true;
/** @type {boolean} */
spine.Bone.prototype.inherit_scale = true;

/**
 * @return {spine.Bone}
 * @param {spine.Bone} other
 */
spine.Bone.prototype.copy = function(other) {
  var bone = this;
  bone.color.copy(other.color);
  bone.parent_key = other.parent_key;
  bone.length = other.length;
  bone.local_space.copy(other.local_space);
  bone.world_space.copy(other.world_space);
  bone.world_affine.copy(other.world_affine);
  bone.inherit_rotation = other.inherit_rotation;
  bone.inherit_scale = other.inherit_scale;
  return bone;
}

/**
 * @return {spine.Bone}
 * @param {Object.<string,?>} json
 */
spine.Bone.prototype.load = function(json) {
  var bone = this;
  bone.color.load(json.color);
  bone.parent_key = spine.loadString(json, 'parent', "");
  bone.length = spine.loadFloat(json, 'length', 0);
  bone.local_space.load(json);
  bone.inherit_rotation = spine.loadBool(json, 'inheritRotation', true);
  bone.inherit_scale = spine.loadBool(json, 'inheritScale', true);
  return bone;
}

/**
 * @return {spine.Bone}
 * @param {spine.Bone} bone
 * @param {Object.<string,spine.Bone>} bones
 */
spine.Bone.flatten = function(bone, bones) {
  var bls = bone.local_space;
  var bws = bone.world_space;
  var bwa = bone.world_affine;
  var parent = bones[bone.parent_key];
  if (!parent) {
    spine.Vector.copy(bls.position, bwa.vector);
    spine.Matrix.identity(bwa.matrix);
  } else {
    spine.Bone.flatten(parent, bones);
    var pwa = parent.world_affine;
    // compute bone world affine position vector
    spine.Affine.transform(pwa, bls.position, bwa.vector);
    // compute bone world affine rotation/scale matrix based in inheritance
    if (bone.inherit_rotation && bone.inherit_scale) {
      spine.Matrix.copy(pwa.matrix, bwa.matrix);
    } else if (bone.inherit_rotation) {
      spine.Matrix.identity(bwa.matrix);
      while (parent && parent.inherit_rotation) {
        var pls = parent.local_space;
        spine.Matrix.rotate(bwa.matrix, pls.rotation.cos, pls.rotation.sin, bwa.matrix);
        parent = bones[parent.parent_key];
      }
    } else if (bone.inherit_scale) {
      spine.Matrix.identity(bwa.matrix);
      while (parent && parent.inherit_scale) {
        var pls = parent.local_space;
        var cos = pls.rotation.cos, sin = pls.rotation.sin;
        spine.Matrix.rotate(bwa.matrix, cos, sin, bwa.matrix);
        spine.Matrix.multiply(bwa.matrix, pls.scale, bwa.matrix);
        if (pls.scale.x >= 0) { sin = -sin; }
        spine.Matrix.rotate(bwa.matrix, cos, sin, bwa.matrix);
        parent = bones[parent.parent_key];
      }
    } else {
      spine.Matrix.identity(bwa.matrix);
    }
  }
  spine.Matrix.rotate(bwa.matrix, bls.rotation.cos, bls.rotation.sin, bwa.matrix);
  spine.Matrix.multiply(bwa.matrix, bls.scale, bwa.matrix);
  // update bone world space
  spine.Vector.copy(bwa.vector, bws.position);
  bws.rotation.rad = Math.atan2(bwa.matrix.c, bwa.matrix.a); // x axis rotation
  spine.Matrix.identity(bws.scale);
  spine.Matrix.rotate(bws.scale, bws.rotation.cos, bws.rotation.sin, bws.scale);
  spine.Matrix.invert(bws.scale, bws.scale);
  spine.Matrix.multiply(bws.scale, bwa.matrix, bws.scale);
  return bone;
}

/**
 * @constructor
 */
spine.Ikc = function() {
  var ikc = this;
  ikc.bone_keys = [];
}

/** @type {string} */
spine.Ikc.prototype.name = "";
/** @type {Array.<string>} */
spine.Ikc.prototype.bone_keys;
/** @type {string} */
spine.Ikc.prototype.target_key = "";
/** @type {number} */
spine.Ikc.prototype.mix = 1;
/** @type {boolean} */
spine.Ikc.prototype.bend_positive = true;

/**
 * @return {spine.Ikc}
 * @param {Object.<string,?>} json
 */
spine.Ikc.prototype.load = function(json) {
  var ikc = this;
  ikc.name = spine.loadString(json, 'name', "");
  ikc.bone_keys = json['bones'] || [];
  ikc.target_key = spine.loadString(json, 'target', "");
  ikc.mix = spine.loadFloat(json, 'mix', 1);
  ikc.bend_positive = spine.loadBool(json, 'bendPositive', true);
  return ikc;
}

/**
 * @constructor
 */
spine.Slot = function() {
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
spine.Slot.prototype.copy = function(other) {
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
spine.Slot.prototype.load = function(json) {
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
spine.Attachment = function(type) {
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
spine.Attachment.prototype.load = function(json) {
  var attachment = this;
  var attachment_type = spine.loadString(json, 'type', "region");
  if (attachment_type !== attachment.type) {
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
spine.RegionAttachment = function() {
  goog.base(this, 'region');
  this.color = new spine.Color();
  this.local_space = new spine.Space();
}

goog.inherits(spine.RegionAttachment, spine.Attachment);

/** @type {spine.Color} */
spine.RegionAttachment.prototype.color;
/** @type {spine.Space} */
spine.RegionAttachment.prototype.local_space;
/** @type {number} */
spine.RegionAttachment.prototype.width = 0;
/** @type {number} */
spine.RegionAttachment.prototype.height = 0;

/**
 * @return {spine.Attachment}
 * @param {Object.<string,?>} json
 */
spine.RegionAttachment.prototype.load = function(json) {
  goog.base(this, 'load', json);

  var attachment = this;
  attachment.color.load(json.color);
  attachment.local_space.load(json);
  attachment.width = spine.loadFloat(json, 'width', 0);
  attachment.height = spine.loadFloat(json, 'height', 0);
  return attachment;
}

/**
 * @constructor
 * @extends {spine.Attachment}
 */
spine.BoundingBoxAttachment = function() {
  goog.base(this, 'boundingbox');
  this.vertices = [];
}

goog.inherits(spine.BoundingBoxAttachment, spine.Attachment);

/** @type {Array.<number>} */
spine.BoundingBoxAttachment.prototype.vertices;

/**
 * @return {spine.Attachment}
 * @param {Object.<string,?>} json
 */
spine.BoundingBoxAttachment.prototype.load = function(json) {
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
spine.MeshAttachment = function() {
  goog.base(this, 'mesh');
  this.color = new spine.Color();
  this.triangles = [];
  this.edges = [];
  this.vertices = [];
  this.uvs = [];
}

goog.inherits(spine.MeshAttachment, spine.Attachment);

/** @type {spine.Color} */
spine.MeshAttachment.prototype.color;
/** @type {Array.<number>} */
spine.MeshAttachment.prototype.triangles;
/** @type {Array.<number>} */
spine.MeshAttachment.prototype.edges;
/** @type {Array.<number>} */
spine.MeshAttachment.prototype.vertices;
/** @type {Array.<number>} */
spine.MeshAttachment.prototype.uvs;
/** @type {number} */
spine.MeshAttachment.prototype.hull = 0;

/**
 * @return {spine.Attachment}
 * @param {Object.<string,?>} json
 */
spine.MeshAttachment.prototype.load = function(json) {
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
spine.WeightedMeshAttachment = function() {
  goog.base(this, 'weightedmesh');
  this.color = new spine.Color();
  this.triangles = [];
  this.edges = [];
  this.vertices = [];
  this.uvs = [];
}

goog.inherits(spine.WeightedMeshAttachment, spine.Attachment);

/** @type {spine.Color} */
spine.WeightedMeshAttachment.prototype.color;
/** @type {Array.<number>} */
spine.WeightedMeshAttachment.prototype.triangles;
/** @type {Array.<number>} */
spine.WeightedMeshAttachment.prototype.edges;
/** @type {Array.<number>} */
spine.WeightedMeshAttachment.prototype.vertices;
/** @type {Array.<number>} */
spine.WeightedMeshAttachment.prototype.uvs;
/** @type {number} */
spine.WeightedMeshAttachment.prototype.hull = 0;

/**
 * @return {spine.Attachment}
 * @param {Object.<string,?>} json
 */
spine.WeightedMeshAttachment.prototype.load = function(json) {
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
spine.SkinSlot = function() {
  var skin_slot = this;
  skin_slot.attachments = {};
  skin_slot.attachment_keys = [];
}

/** @type {Object.<string,spine.Attachment>} */
spine.SkinSlot.prototype.attachments;
/** @type {Array.<string>} */
spine.SkinSlot.prototype.attachment_keys;

/**
 * @return {spine.SkinSlot}
 * @param {Object.<string,?>} json
 */
spine.SkinSlot.prototype.load = function(json) {
  var skin_slot = this;
  skin_slot.attachment_keys = Object.keys(json || {});
  skin_slot.attachment_keys.forEach(function(attachment_key) {
    var json_attachment = json[attachment_key];
    switch (json_attachment.type) {
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
        json_attachment.type = 'weightedmesh';
      case 'weightedmesh':
        skin_slot.attachments[attachment_key] = new spine.WeightedMeshAttachment().load(json_attachment);
        break;
    }
  });
  return skin_slot;
}

/**
 * @constructor
 */
spine.Skin = function() {
  var skin = this;
  skin.slots = {};
  skin.slot_keys = [];
}

/** @type {string} */
spine.Skin.prototype.name = "";
/** @type {Object.<string,spine.SkinSlot>} */
spine.Skin.prototype.slots;
/** @type {Array.<string>} */
spine.Skin.prototype.slot_keys;

/**
 * @return {spine.Skin}
 * @param {Object.<string,?>} json
 */
spine.Skin.prototype.load = function(json) {
  var skin = this;
  skin.name = spine.loadString(json, 'name', "");
  skin.slot_keys = Object.keys(json || {});
  skin.slot_keys.forEach(function(slot_key) {
    skin.slots[slot_key] = new spine.SkinSlot().load(json[slot_key]);
  });
  return skin;
}

/**
 * @return {void}
 * @param {function(string, spine.SkinSlot, string, spine.Attachment):void} callback
 */
spine.Skin.prototype.iterateAttachments = function(callback) {
  var skin = this;
  skin.slot_keys.forEach(function(slot_key) {
    var skin_slot = skin.slots[slot_key];
    skin_slot.attachment_keys.forEach(function(attachment_key) {
      var attachment = skin_slot.attachments[attachment_key];
      callback(slot_key, skin_slot, attachment.path || attachment.name || attachment_key, attachment);
    });
  });
}

/**
 * @constructor
 */
spine.Event = function() {}

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
spine.Event.prototype.copy = function(other) {
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
spine.Event.prototype.load = function(json) {
  this.name = spine.loadString(json, 'name', "");
  if (typeof(json['int']) === 'number') {
    this.int_value = spine.loadInt(json, 'int', 0);
  }
  if (typeof(json['float']) === 'number') {
    this.float_value = spine.loadFloat(json, 'float', 0);
  }
  if (typeof(json['string']) === 'string') {
    this.string_value = spine.loadString(json, 'string', "");
  }

  return this;
}

/**
 * @constructor
 */
spine.Keyframe = function() {}

/** @type {number} */
spine.Keyframe.prototype.time = 0;

/**
 * @return {spine.Keyframe}
 */
spine.Keyframe.prototype.drop = function() {
  this.time = 0;
  return this;
}

/**
 * @return {spine.Keyframe}
 * @param {Object.<string,?>} json
 */
spine.Keyframe.prototype.load = function(json) {
  this.time = 1000 * spine.loadFloat(json, 'time', 0); // convert to ms
  return this;
}

/**
 * @return {spine.Keyframe}
 * @param {Object.<string,?>} json
 */
spine.Keyframe.prototype.save = function(json) {
  spine.saveFloat(json, 'time', this.time / 1000, 0); // convert to s
  return this;
}

/**
 * @return {number}
 * @param {Array.<spine.Keyframe>} array
 * @param {number} time
 */
spine.Keyframe.find = function(array, time) {
  if (!array) {
    return -1;
  }
  if (array.length <= 0) {
    return -1;
  }
  if (time < array[0].time) {
    return -1;
  }
  var last = array.length - 1;
  if (time >= array[last].time) {
    return last;
  }
  var lo = 0;
  var hi = last;
  if (hi === 0) {
    return 0;
  }
  var current = hi >> 1;
  while (true) {
    if (array[current + 1].time <= time) {
      lo = current + 1;
    } else {
      hi = current;
    }
    if (lo === hi) {
      return lo;
    }
    current = (lo + hi) >> 1;
  }
}

/**
 * @return {number}
 * @param {spine.Keyframe} a
 * @param {spine.Keyframe} b
 */
spine.Keyframe.compare = function(a, b) {
  return a.time - b.time;
}

/**
 * @constructor
 * @extends {spine.Keyframe}
 */
spine.BoneKeyframe = function() {
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
spine.BoneKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.curve.load(json.curve);
  return this;
}

/**
 * @constructor
 * @extends {spine.BoneKeyframe}
 */
spine.PositionKeyframe = function() {
  goog.base(this);
  this.position = new spine.Position();
}

goog.inherits(spine.PositionKeyframe, spine.BoneKeyframe);

/** @type {spine.Position} */
spine.PositionKeyframe.prototype.position;

/**
 * @return {spine.PositionKeyframe}
 * @param {Object.<string,?>} json
 */
spine.PositionKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.position.x = spine.loadFloat(json, 'x', 0);
  this.position.y = spine.loadFloat(json, 'y', 0);
  return this;
}

/**
 * @constructor
 * @extends {spine.BoneKeyframe}
 */
spine.RotationKeyframe = function() {
  goog.base(this);
  this.rotation = new spine.Rotation();
}

goog.inherits(spine.RotationKeyframe, spine.BoneKeyframe);

/** @type {spine.Rotation} */
spine.RotationKeyframe.prototype.rotation;

/**
 * @return {spine.RotationKeyframe}
 * @param {Object.<string,?>} json
 */
spine.RotationKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.rotation.deg = spine.loadFloat(json, 'angle', 0);
  return this;
}

/**
 * @constructor
 * @extends {spine.BoneKeyframe}
 */
spine.ScaleKeyframe = function() {
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
spine.ScaleKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.scale.x = spine.loadFloat(json, 'x', 1);
  this.scale.y = spine.loadFloat(json, 'y', 1);
  return this;
}

/**
 * @constructor
 */
spine.AnimBone = function() {}

/** @type {number} */
spine.AnimBone.prototype.min_time = 0;
/** @type {number} */
spine.AnimBone.prototype.max_time = 0;
/** @type {Array.<spine.PositionKeyframe>} */
spine.AnimBone.prototype.position_keyframes = null;
/** @type {Array.<spine.RotationKeyframe>} */
spine.AnimBone.prototype.rotation_keyframes = null;
/** @type {Array.<spine.ScaleKeyframe>} */
spine.AnimBone.prototype.scale_keyframes = null;

/**
 * @return {spine.AnimBone}
 * @param {Object.<string,?>} json
 */
spine.AnimBone.prototype.load = function(json) {
  var anim_bone = this;
  anim_bone.min_time = 0;
  anim_bone.max_time = 0;
  anim_bone.position_keyframes = null;
  anim_bone.rotation_keyframes = null;
  anim_bone.scale_keyframes = null;

  Object.keys(json || {}).forEach(function(key) {
    switch (key) {
      case 'translate':
        anim_bone.position_keyframes = [];
        json.translate.forEach(function(translate_json) {
          var position_keyframe = new spine.PositionKeyframe().load(translate_json);
          anim_bone.position_keyframes.push(position_keyframe);
          anim_bone.min_time = Math.min(anim_bone.min_time, position_keyframe.time);
          anim_bone.max_time = Math.max(anim_bone.max_time, position_keyframe.time);
        });
        anim_bone.position_keyframes.sort(spine.Keyframe.compare);
        break;
      case 'rotate':
        anim_bone.rotation_keyframes = [];
        json.rotate.forEach(function(rotate_json) {
          var rotation_keyframe = new spine.RotationKeyframe().load(rotate_json);
          anim_bone.rotation_keyframes.push(rotation_keyframe);
          anim_bone.min_time = Math.min(anim_bone.min_time, rotation_keyframe.time);
          anim_bone.max_time = Math.max(anim_bone.max_time, rotation_keyframe.time);
        });
        anim_bone.rotation_keyframes.sort(spine.Keyframe.compare);
        break;
      case 'scale':
        anim_bone.scale_keyframes = [];
        json.scale.forEach(function(scale_json) {
          var scale_keyframe = new spine.ScaleKeyframe().load(scale_json);
          anim_bone.scale_keyframes.push(scale_keyframe);
          anim_bone.min_time = Math.min(anim_bone.min_time, scale_keyframe.time);
          anim_bone.max_time = Math.max(anim_bone.max_time, scale_keyframe.time);
        });
        anim_bone.scale_keyframes.sort(spine.Keyframe.compare);
        break;
      default:
        console.log("TODO: spine.AnimBone::load", key);
        break;
    }
  });

  return anim_bone;
}

/**
 * @constructor
 * @extends {spine.Keyframe}
 */
spine.SlotKeyframe = function() {
  goog.base(this);
}

goog.inherits(spine.SlotKeyframe, spine.Keyframe);

/**
 * @return {spine.SlotKeyframe}
 * @param {Object.<string,?>} json
 */
spine.SlotKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  return this;
}

/**
 * @constructor
 * @extends {spine.SlotKeyframe}
 */
spine.ColorKeyframe = function() {
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
spine.ColorKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.color.load(json.color);
  this.curve.load(json.curve);
  return this;
}

/**
 * @constructor
 * @extends {spine.SlotKeyframe}
 */
spine.AttachmentKeyframe = function() {
  goog.base(this);
}

goog.inherits(spine.AttachmentKeyframe, spine.SlotKeyframe);


/** @type {string} */
spine.AttachmentKeyframe.prototype.name = "";

/**
 * @return {spine.AttachmentKeyframe}
 * @param {Object.<string,?>} json
 */
spine.AttachmentKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.name = spine.loadString(json, 'name', "");
  return this;
}

/**
 * @constructor
 */
spine.AnimSlot = function() {}

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
spine.AnimSlot.prototype.load = function(json) {
  var anim_slot = this;
  anim_slot.min_time = 0;
  anim_slot.max_time = 0;
  anim_slot.color_keyframes = null;
  anim_slot.attachment_keyframes = null;

  Object.keys(json || {}).forEach(function(key) {
    switch (key) {
      case 'color':
        anim_slot.color_keyframes = [];
        json[key].forEach(function(color) {
          var color_keyframe = new spine.ColorKeyframe().load(color);
          anim_slot.min_time = Math.min(anim_slot.min_time, color_keyframe.time);
          anim_slot.max_time = Math.max(anim_slot.max_time, color_keyframe.time);
          anim_slot.color_keyframes.push(color_keyframe);
        });
        anim_slot.color_keyframes.sort(spine.Keyframe.compare);
        break;
      case 'attachment':
        anim_slot.attachment_keyframes = [];
        json[key].forEach(function(attachment) {
          var attachment_keyframe = new spine.AttachmentKeyframe().load(attachment);
          anim_slot.min_time = Math.min(anim_slot.min_time, attachment_keyframe.time);
          anim_slot.max_time = Math.max(anim_slot.max_time, attachment_keyframe.time);
          anim_slot.attachment_keyframes.push(attachment_keyframe);
        });
        anim_slot.attachment_keyframes.sort(spine.Keyframe.compare);
        break;
      default:
        console.log("TODO: spine.AnimSlot::load", key);
        break;
    }
  });

  return anim_slot;
}

/**
 * @constructor
 * @extends {spine.Keyframe}
 */
spine.EventKeyframe = function() {
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
spine.EventKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.name = spine.loadString(json, 'name', "");
  if (typeof(json['int']) === 'number') {
    this.int_value = spine.loadInt(json, 'int', 0);
  }
  if (typeof(json['float']) === 'number') {
    this.float_value = spine.loadFloat(json, 'float', 0);
  }
  if (typeof(json['string']) === 'string') {
    this.string_value = spine.loadString(json, 'string', "");
  }
  return this;
}

/**
 * @constructor
 */
spine.SlotOffset = function() {}

/** @type {string} */
spine.SlotOffset.prototype.slot_key = "";
/** @type {number} */
spine.SlotOffset.prototype.offset = 0;

/**
 * @return {spine.SlotOffset}
 * @param {Object.<string,?>} json
 */
spine.SlotOffset.prototype.load = function(json) {
  this.slot_key = spine.loadString(json, 'slot', "");
  this.offset = spine.loadInt(json, 'offset', 0);
  return this;
}

/**
 * @constructor
 * @extends {spine.Keyframe}
 */
spine.OrderKeyframe = function() {
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
spine.OrderKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  var order_keyframe = this;
  order_keyframe.slot_offsets = [];

  Object.keys(json || {}).forEach(function(key) {
    switch (key) {
      case 'offsets':
        json[key].forEach(function(offset) {
          order_keyframe.slot_offsets.push(new spine.SlotOffset().load(offset));
        });
        break;
    }
  });
  return order_keyframe;
}

/**
 * @constructor
 * @extends {spine.Keyframe}
 */
spine.IkcKeyframe = function() {
  goog.base(this);

  this.curve = new spine.Curve();
}

goog.inherits(spine.IkcKeyframe, spine.Keyframe);

/** @type {spine.Curve} */
spine.IkcKeyframe.prototype.curve;
/** @type {number} */
spine.IkcKeyframe.prototype.mix = 1;
/** @type {boolean} */
spine.IkcKeyframe.prototype.bend_positive = true;

/**
 * @return {spine.IkcKeyframe}
 * @param {Object.<string,?>} json
 */
spine.IkcKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.curve.load(json);
  this.mix = spine.loadFloat(json, 'mix', 1);
  this.bend_positive = spine.loadBool(json, 'bendPositive', true);
  return this;
}

/**
 * @constructor
 */
spine.AnimIkc = function() {}

/** @type {number} */
spine.AnimIkc.prototype.min_time = 0;
/** @type {number} */
spine.AnimIkc.prototype.max_time = 0;
/** @type {Array.<spine.IkcKeyframe>} */
spine.AnimIkc.prototype.ikc_keyframes = null;

/**
 * @return {spine.AnimIkc}
 * @param {Object.<string,?>} json
 */
spine.AnimIkc.prototype.load = function(json) {
  var anim_ikc = this;
  anim_ikc.min_time = 0;
  anim_ikc.max_time = 0;
  anim_ikc.ikc_keyframes = [];

  json.forEach(function(ikc) {
    var ikc_keyframe = new spine.IkcKeyframe().load(ikc);
    anim_ikc.min_time = Math.min(anim_ikc.min_time, ikc_keyframe.time);
    anim_ikc.max_time = Math.max(anim_ikc.max_time, ikc_keyframe.time);
    anim_ikc.ikc_keyframes.push(ikc_keyframe);
  });
  anim_ikc.ikc_keyframes.sort(spine.Keyframe.compare);

  return anim_ikc;
}

/**
 * @constructor
 * @extends {spine.Keyframe}
 */
spine.FfdKeyframe = function() {
  goog.base(this);

  this.curve = new spine.Curve();
  this.vertices = [];
}

goog.inherits(spine.FfdKeyframe, spine.Keyframe);

/** @type {spine.Curve} */
spine.FfdKeyframe.prototype.curve;
/** @type {number} */
spine.FfdKeyframe.prototype.offset = 0;
/** @type {Array.<number>} */
spine.FfdKeyframe.prototype.vertices;

/**
 * @return {spine.FfdKeyframe}
 * @param {Object.<string,?>} json
 */
spine.FfdKeyframe.prototype.load = function(json) {
  goog.base(this, 'load', json);
  this.curve.load(json);
  this.offset = spine.loadInt(json, 'offset', 0);
  this.vertices = json.vertices || [];
  return this;
}

/**
 * @constructor
 */
spine.FfdAttachment = function() {}

/** @type {number} */
spine.FfdAttachment.prototype.min_time = 0;
/** @type {number} */
spine.FfdAttachment.prototype.max_time = 0;
/** @type {Array.<spine.FfdKeyframe>} */
spine.FfdAttachment.prototype.ffd_keyframes = null;

/**
 * @return {spine.FfdAttachment}
 * @param {Object.<string,?>} json
 */
spine.FfdAttachment.prototype.load = function(json) {
  var ffd_attachment = this;

  ffd_attachment.min_time = 0;
  ffd_attachment.max_time = 0;
  ffd_attachment.ffd_keyframes = [];

  json.forEach(function(ffd_keyframe_json) {
    var ffd_keyframe = new spine.FfdKeyframe().load(ffd_keyframe_json);
    ffd_attachment.min_time = Math.min(ffd_attachment.min_time, ffd_keyframe.time);
    ffd_attachment.max_time = Math.max(ffd_attachment.max_time, ffd_keyframe.time);
    ffd_attachment.ffd_keyframes.push(ffd_keyframe);
  });

  ffd_attachment.ffd_keyframes.sort(spine.Keyframe.compare);

  return ffd_attachment;
}

/**
 * @constructor
 */
spine.FfdSlot = function() {
  var ffd_slot = this;
  ffd_slot.ffd_attachments = {};
  ffd_slot.ffd_attachment_keys = [];
}

/** @type {Object.<string,spine.FfdAttachment>} */
spine.FfdSlot.prototype.ffd_attachments;
/** @type {Array.<string>} */
spine.FfdSlot.prototype.ffd_attachment_keys;

/**
 * @return {spine.FfdSlot}
 * @param {Object.<string,?>} json
 */
spine.FfdSlot.prototype.load = function(json) {
  var ffd_slot = this;

  ffd_slot.ffd_attachments = {};
  ffd_slot.ffd_attachment_keys = Object.keys(json || {});
  ffd_slot.ffd_attachment_keys.forEach(function(key) {
    ffd_slot.ffd_attachments[key] = new spine.FfdAttachment().load(json[key]);
  });

  return ffd_slot;
}

/**
 * @return {void}
 * @param {function(string, spine.FfdAttachment):void} callback
 */
spine.FfdSlot.prototype.iterateAttachments = function(callback) {
  var ffd_slot = this;

  ffd_slot.ffd_attachment_keys.forEach(function(ffd_attachment_key) {
    var ffd_attachment = ffd_slot.ffd_attachments[ffd_attachment_key];

    callback(ffd_attachment_key, ffd_attachment);
  });
}

/**
 * @constructor
 */
spine.AnimFfd = function() {
  var anim_ffd = this;
  anim_ffd.ffd_slots = {};
}

/** @type {number} */
spine.AnimFfd.prototype.min_time = 0;
/** @type {number} */
spine.AnimFfd.prototype.max_time = 0;
/** @type {Object.<string,spine.FfdSlot>} */
spine.AnimFfd.prototype.ffd_slots;
/** @type {Array.<string>} */
spine.AnimFfd.prototype.ffd_slot_keys;

/**
 * @return {spine.AnimFfd}
 * @param {Object.<string,?>} json
 */
spine.AnimFfd.prototype.load = function(json) {
  var anim_ffd = this;

  anim_ffd.min_time = 0;
  anim_ffd.max_time = 0;
  anim_ffd.ffd_slots = {};
  anim_ffd.ffd_slot_keys = Object.keys(json || {});
  anim_ffd.ffd_slot_keys.forEach(function(key) {
    anim_ffd.ffd_slots[key] = new spine.FfdSlot().load(json[key]);
  });

  anim_ffd.iterateAttachments(function(ffd_slot_key, ffd_slot, ffd_attachment_key, ffd_attachment) {
    anim_ffd.min_time = Math.min(anim_ffd.min_time, ffd_attachment.min_time);
    anim_ffd.max_time = Math.max(anim_ffd.max_time, ffd_attachment.max_time);
  });

  return anim_ffd;
}

/**
 * @return {void}
 * @param {function(string, spine.FfdSlot, string, spine.FfdAttachment):void} callback
 */
spine.AnimFfd.prototype.iterateAttachments = function(callback) {
  var anim_ffd = this;

  anim_ffd.ffd_slot_keys.forEach(function(ffd_slot_key) {
    var ffd_slot = anim_ffd.ffd_slots[ffd_slot_key];

    ffd_slot.iterateAttachments(function(ffd_attachment_key, ffd_attachment) {
      callback(ffd_slot_key, ffd_slot, ffd_attachment_key, ffd_attachment);
    });
  });
}

/**
 * @constructor
 */
spine.Animation = function() {
  var anim = this;
  anim.bones = {};
  anim.slots = {};
  anim.ikcs = {};
  anim.ffds = {};
}

/** @type {string} */
spine.Animation.prototype.name = "";
/** @type {Object.<string,spine.AnimBone>} */
spine.Animation.prototype.bones;
/** @type {Object.<string,spine.AnimSlot>} */
spine.Animation.prototype.slots;
/** @type {Array.<spine.EventKeyframe>} */
spine.Animation.prototype.event_keyframes = null;
/** @type {Array.<spine.OrderKeyframe>} */
spine.Animation.prototype.order_keyframes = null;
/** @type {Object.<string,spine.AnimIkc>} */
spine.Animation.prototype.ikcs;
/** @type {Object.<string,spine.AnimFfd>} */
spine.Animation.prototype.ffds;
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
spine.Animation.prototype.load = function(json) {
  var anim = this;

  anim.bones = {};
  anim.slots = {};
  anim.event_keyframes = null;
  anim.order_keyframes = null;
  anim.ikcs = {};
  anim.ffds = {};

  anim.min_time = 0;
  anim.max_time = 0;

  Object.keys(json || {}).forEach(function(key) {
    switch (key) {
      case 'bones':
        Object.keys(json[key] || {}).forEach(function(bone_key) {
          var anim_bone = new spine.AnimBone().load(json[key][bone_key]);
          anim.min_time = Math.min(anim.min_time, anim_bone.min_time);
          anim.max_time = Math.max(anim.max_time, anim_bone.max_time);
          anim.bones[bone_key] = anim_bone;
        });
        break;
      case 'slots':
        Object.keys(json[key] || {}).forEach(function(slot_key) {
          var anim_slot = new spine.AnimSlot().load(json[key][slot_key]);
          anim.min_time = Math.min(anim.min_time, anim_slot.min_time);
          anim.max_time = Math.max(anim.max_time, anim_slot.max_time);
          anim.slots[slot_key] = anim_slot;
        });
        break;
      case 'events':
        anim.event_keyframes = [];
        json[key].forEach(function(event) {
          var event_keyframe = new spine.EventKeyframe().load(event);
          anim.min_time = Math.min(anim.min_time, event_keyframe.time);
          anim.max_time = Math.max(anim.max_time, event_keyframe.time);
          anim.event_keyframes.push(event_keyframe);
        });
        anim.event_keyframes.sort(spine.Keyframe.compare);
        break;
      case 'drawOrder':
      case 'draworder':
        anim.order_keyframes = [];
        json[key].forEach(function(order) {
          var order_keyframe = new spine.OrderKeyframe().load(order);
          anim.min_time = Math.min(anim.min_time, order_keyframe.time);
          anim.max_time = Math.max(anim.max_time, order_keyframe.time);
          anim.order_keyframes.push(order_keyframe);
        });
        anim.order_keyframes.sort(spine.Keyframe.compare);
        break;
      case 'ik':
        Object.keys(json[key] || {}).forEach(function(ikc_key) {
          var anim_ikc = new spine.AnimIkc().load(json[key][ikc_key]);
          anim.min_time = Math.min(anim.min_time, anim_ikc.min_time);
          anim.max_time = Math.max(anim.max_time, anim_ikc.max_time);
          anim.ikcs[ikc_key] = anim_ikc;
        });
        break;
      case 'ffd':
        Object.keys(json[key] || {}).forEach(function(ffd_key) {
          var anim_ffd = new spine.AnimFfd().load(json[key][ffd_key]);
          anim.min_time = Math.min(anim.min_time, anim_ffd.min_time);
          anim.max_time = Math.max(anim.max_time, anim_ffd.max_time);
          anim.ffds[ffd_key] = anim_ffd;
        });
        break;
      default:
        console.log("TODO: spine.Animation::load", key);
        break;
    }
  });

  anim.length = anim.max_time - anim.min_time;

  return anim;
}

/**
 * @constructor
 */
spine.Skeleton = function() {}

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
spine.Skeleton.prototype.load = function(json) {
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
spine.Data = function() {
  var data = this;
  data.skeleton = new spine.Skeleton();
  data.bones = {};
  data.bone_keys = [];
  data.ikcs = {};
  data.ikc_keys = [];
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
spine.Data.prototype.skeleton;
/** @type {Object.<string,spine.Bone>} */
spine.Data.prototype.bones;
/** @type {Array.<string>} */
spine.Data.prototype.bone_keys;
/** @type {Object.<string,spine.Ikc>} */
spine.Data.prototype.ikcs;
/** @type {Array.<string>} */
spine.Data.prototype.ikc_keys;
/** @type {Object.<string,spine.Slot>} */
spine.Data.prototype.slots;
/** @type {Array.<string>} */
spine.Data.prototype.slot_keys;
/** @type {Object.<string,spine.Skin>} */
spine.Data.prototype.skins;
/** @type {Array.<string>} */
spine.Data.prototype.skin_keys;
/** @type {Object.<string,spine.Event>} */
spine.Data.prototype.events;
/** @type {Array.<string>} */
spine.Data.prototype.event_keys;
/** @type {Object.<string,spine.Animation>} */
spine.Data.prototype.anims;
/** @type {Array.<string>} */
spine.Data.prototype.anim_keys;

/**
 * @return {spine.Data}
 * @param {?} json
 */
spine.Data.prototype.load = function(json) {
  var data = this;

  data.bones = {};
  data.bone_keys = [];
  data.ikcs = {};
  data.ikc_keys = [];
  data.slots = {};
  data.slot_keys = [];
  data.skins = {};
  data.skin_keys = [];
  data.events = {};
  data.event_keys = [];
  data.anims = {};
  data.anim_keys = [];

  Object.keys(json || {}).forEach(function(key) {
    switch (key) {
      case 'skeleton':
        data.skeleton.load(json[key]);
        break;
      case 'bones':
        var json_bones = json[key];
        json_bones.forEach(function(bone, bone_index) {
          data.bones[bone.name] = new spine.Bone().load(bone);
          data.bone_keys[bone_index] = bone.name;
        });
        break;
      case 'ik':
        var json_ik = json[key];
        json_ik.forEach(function(ikc, ikc_index) {
          data.ikcs[ikc.name] = new spine.Ikc().load(ikc);
          data.ikc_keys[ikc_index] = ikc.name;
        });
        // sort by ancestry
        data.ikc_keys = data.ikc_keys.sort(function(a, b) {
          var ikc_a = data.ikcs[a];
          var ikc_b = data.ikcs[b];
          for (var ia = 0; ia < ikc_a.bone_keys.length; ++ia) {
            var bone_a = data.bones[ikc_a.bone_keys[ia]];
            for (var ib = 0; ib < ikc_b.bone_keys.length; ++ib) {
              var bone_b = data.bones[ikc_b.bone_keys[ib]];
              var bone_a_parent = data.bones[bone_a.parent_key];
              while (bone_a_parent) {
                if (bone_a_parent === bone_b) {
                  return 1;
                }
                bone_a_parent = data.bones[bone_a_parent.parent_key];
              }
              var bone_b_parent = data.bones[bone_b.parent_key];
              while (bone_b_parent) {
                if (bone_b_parent === bone_a) {
                  return -1;
                }
                bone_b_parent = data.bones[bone_b_parent.parent_key];
              }
            }
          }
          return 0;
        });
        break;
      case 'slots':
        var json_slots = json[key];
        json_slots.forEach(function(slot, slot_index) {
          data.slots[slot.name] = new spine.Slot().load(slot);
          data.slot_keys[slot_index] = slot.name;
        });
        break;
      case 'skins':
        var json_skins = json[key] || {};
        data.skin_keys = Object.keys(json_skins);
        data.skin_keys.forEach(function(skin_key) {
          var skin = data.skins[skin_key] = new spine.Skin().load(json_skins[skin_key]);
          skin.name = skin.name || skin_key;
        });
        break;
      case 'events':
        var json_events = json[key] || {};
        data.event_keys = Object.keys(json_events);
        data.event_keys.forEach(function(event_key) {
          var event = data.events[event_key] = new spine.Event().load(json_events[event_key]);
          event.name = event.name || event_key;
        });
        break;
      case 'animations':
        var json_animations = json[key] || {};
        data.anim_keys = Object.keys(json_animations);
        data.anim_keys.forEach(function(anim_key) {
          var anim = data.anims[anim_key] = new spine.Animation().load(json_animations[anim_key]);
          anim.name = anim.name || anim_key;
        });
        break;
      default:
        console.log("TODO: spine.Skeleton::load", key);
        break;
    }
  });

  data.iterateBones(function(bone_key, bone) {
    spine.Bone.flatten(bone, data.bones);
  });

  return data;
}

/**
 * @return {spine.Data}
 * @param {?} json
 */
spine.Data.prototype.loadSkeleton = function(json) {
  var data = this;
  data.skeleton.load(json);
  return data;
}

/**
 * @return {spine.Data}
 * @param {?} json
 */
spine.Data.prototype.loadEvent = function(name, json) {
  var data = this;
  var event = data.events[name] = new spine.Event().load(json);
  event.name = event.name || name;
  return data;
}

/**
 * @return {spine.Data}
 * @param {?} json
 */
spine.Data.prototype.loadAnimation = function(name, json) {
  var data = this;
  var anim = data.anims[name] = new spine.Animation().load(json);
  anim.name = anim.name || name;
  return data;
}

/**
 * @return {Object.<string,spine.Skin>}
 */
spine.Data.prototype.getSkins = function() {
  var data = this;
  return data.skins;
}

/**
 * @return {Object.<string,spine.Event>}
 */
spine.Data.prototype.getEvents = function() {
  var data = this;
  return data.events;
}

/**
 * @return {Object.<string,spine.Animation>}
 */
spine.Data.prototype.getAnims = function() {
  var data = this;
  return data.anims;
}

/**
 * @return {void}
 * @param {function(string, spine.Bone):void} callback
 */
spine.Data.prototype.iterateBones = function(callback) {
  var data = this;
  data.bone_keys.forEach(function(bone_key) {
    var data_bone = data.bones[bone_key];
    callback(bone_key, data_bone);
  });
}

/**
 * @return {void}
 * @param {function(string, spine.Slot, spine.SkinSlot, string, spine.Attachment):void} callback
 */
spine.Data.prototype.iterateAttachments = function(skin_key, callback) {
  var data = this;
  var skin = data.skins[skin_key];
  var default_skin = data.skins['default'];
  data.slot_keys.forEach(function(slot_key) {
    var data_slot = data.slots[slot_key];
    var skin_slot = skin && (skin.slots[slot_key] || default_skin.slots[slot_key]);
    var attachment = skin_slot && skin_slot.attachments[data_slot.attachment_key];
    var attachment_key = (attachment && (attachment.path || attachment.name)) || data_slot.attachment_key;
    callback(slot_key, data_slot, skin_slot, attachment_key, attachment);
  });
}

/**
 * @return {void}
 * @param {function(string, spine.Skin):void} callback
 */
spine.Data.prototype.iterateSkins = function(callback) {
  var data = this;
  data.skin_keys.forEach(function(skin_key) {
    var skin = data.skins[skin_key];
    callback(skin_key, skin);
  });
}

/**
 * @return {void}
 * @param {function(string, spine.Event):void} callback
 */
spine.Data.prototype.iterateEvents = function(callback) {
  var data = this;
  data.event_keys.forEach(function(event_key) {
    var event = data.events[event_key];
    callback(event_key, event);
  });
}

/**
 * @return {void}
 * @param {function(string, spine.Animation):void} callback
 */
spine.Data.prototype.iterateAnims = function(callback) {
  var data = this;
  data.anim_keys.forEach(function(anim_key) {
    var anim = data.anims[anim_key];
    callback(anim_key, anim);
  });
}

/**
 * @constructor
 * @param {spine.Data=} data
 */
spine.Pose = function(data) {
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
spine.Pose.prototype.curSkel = function() {
  var pose = this;
  var data = pose.data;
  return data && data.skeleton;
}

/**
 * @return {Object.<string,spine.Skin>}
 */
spine.Pose.prototype.getSkins = function() {
  var pose = this;
  var data = pose.data;
  return data && data.skins;
}

/**
 * @return {spine.Skin}
 */
spine.Pose.prototype.curSkin = function() {
  var pose = this;
  var data = pose.data;
  return data && data.skins[pose.skin_key];
}

/**
 * @return {string}
 */
spine.Pose.prototype.getSkin = function() {
  var pose = this;
  return pose.skin_key;
}

/**
 * @return {void}
 * @param {string} skin_key
 */
spine.Pose.prototype.setSkin = function(skin_key) {
  var pose = this;
  if (pose.skin_key !== skin_key) {
    pose.skin_key = skin_key;
  }
}

/**
 * @return {Object.<string,spine.Event>}
 */
spine.Pose.prototype.getEvents = function() {
  var pose = this;
  var data = pose.data;
  return data && data.events;
}

/**
 * @return {Object.<string,spine.Animation>}
 */
spine.Pose.prototype.getAnims = function() {
  var pose = this;
  var data = pose.data;
  return data && data.anims;
}

/**
 * @return {spine.Animation}
 */
spine.Pose.prototype.curAnim = function() {
  var pose = this;
  var data = pose.data;
  return data && data.anims[pose.anim_key];
}

/**
 * @return {number}
 */
spine.Pose.prototype.curAnimLength = function() {
  var pose = this;
  var data = pose.data;
  var anim = data && data.anims[pose.anim_key];
  return (anim && anim.length) || 0;
}

/**
 * @return {string}
 */
spine.Pose.prototype.getAnim = function() {
  var pose = this;
  return pose.anim_key;
}

/**
 * @return {void}
 * @param {string} anim_key
 */
spine.Pose.prototype.setAnim = function(anim_key) {
  var pose = this;
  if (pose.anim_key !== anim_key) {
    pose.anim_key = anim_key;
    var data = pose.data;
    var anim = data && data.anims[pose.anim_key];
    if (anim) {
      pose.time = spine.wrap(pose.time, anim.min_time, anim.max_time);
    }
    pose.elapsed_time = 0;
    pose.dirty = true;
  }
}

/**
 * @return {number}
 */
spine.Pose.prototype.getTime = function() {
  var pose = this;
  return pose.time;
}

/**
 * @return {void}
 * @param {number} time
 */
spine.Pose.prototype.setTime = function(time) {
  var pose = this;
  var data = pose.data;
  var anim = data && data.anims[pose.anim_key];
  if (anim) {
    time = spine.wrap(time, anim.min_time, anim.max_time);
  }

  if (pose.time !== time) {
    pose.time = time;
    pose.elapsed_time = 0;
    pose.dirty = true;
  }
}

/**
 * @return {void}
 * @param {number} elapsed_time
 */
spine.Pose.prototype.update = function(elapsed_time) {
  var pose = this;
  pose.elapsed_time += elapsed_time;
  pose.dirty = true;
}

/**
 * @return {void}
 */
spine.Pose.prototype.strike = function() {
  var pose = this;
  if (!pose.dirty) {
    return;
  }
  pose.dirty = false;

  var data = pose.data;

  var anim = data && data.anims[pose.anim_key];

  var prev_time = pose.time;
  var elapsed_time = pose.elapsed_time;

  pose.time = pose.time + pose.elapsed_time; // accumulate elapsed time
  pose.elapsed_time = 0; // reset elapsed time for next strike

  var wrapped_min = false;
  var wrapped_max = false;
  if (anim) {
    wrapped_min = (elapsed_time < 0) && (pose.time <= anim.min_time);
    wrapped_max = (elapsed_time > 0) && (pose.time >= anim.max_time);
    pose.time = spine.wrap(pose.time, anim.min_time, anim.max_time);
  }

  var time = pose.time;

  var keyframe_index;
  var pct;

  data.bone_keys.forEach(function(bone_key) {
    var data_bone = data.bones[bone_key];
    var pose_bone = pose.bones[bone_key] || (pose.bones[bone_key] = new spine.Bone());

    // start with a copy of the data bone
    pose_bone.copy(data_bone);

    // tween anim bone if keyframes are available
    var anim_bone = anim && anim.bones[bone_key];
    if (anim_bone) {
      keyframe_index = spine.Keyframe.find(anim_bone.position_keyframes, time);
      if (keyframe_index !== -1) {
        var position_keyframe0 = anim_bone.position_keyframes[keyframe_index];
        var position_keyframe1 = anim_bone.position_keyframes[keyframe_index + 1];
        if (position_keyframe1) {
          pct = position_keyframe0.curve.evaluate((time - position_keyframe0.time) / (position_keyframe1.time - position_keyframe0.time));
          pose_bone.local_space.position.x += spine.tween(position_keyframe0.position.x, position_keyframe1.position.x, pct);
          pose_bone.local_space.position.y += spine.tween(position_keyframe0.position.y, position_keyframe1.position.y, pct);
        } else {
          pose_bone.local_space.position.x += position_keyframe0.position.x;
          pose_bone.local_space.position.y += position_keyframe0.position.y;
        }
      }

      keyframe_index = spine.Keyframe.find(anim_bone.rotation_keyframes, time);
      if (keyframe_index !== -1) {
        var rotation_keyframe0 = anim_bone.rotation_keyframes[keyframe_index];
        var rotation_keyframe1 = anim_bone.rotation_keyframes[keyframe_index + 1];
        if (rotation_keyframe1) {
          pct = rotation_keyframe0.curve.evaluate((time - rotation_keyframe0.time) / (rotation_keyframe1.time - rotation_keyframe0.time));
          pose_bone.local_space.rotation.rad += spine.tweenAngle(rotation_keyframe0.rotation.rad, rotation_keyframe1.rotation.rad, pct);
        } else {
          pose_bone.local_space.rotation.rad += rotation_keyframe0.rotation.rad;
        }
      }

      keyframe_index = spine.Keyframe.find(anim_bone.scale_keyframes, time);
      if (keyframe_index !== -1) {
        var scale_keyframe0 = anim_bone.scale_keyframes[keyframe_index];
        var scale_keyframe1 = anim_bone.scale_keyframes[keyframe_index + 1];
        if (scale_keyframe1) {
          pct = scale_keyframe0.curve.evaluate((time - scale_keyframe0.time) / (scale_keyframe1.time - scale_keyframe0.time));
          pose_bone.local_space.scale.a *= spine.tween(scale_keyframe0.scale.a, scale_keyframe1.scale.a, pct);
          pose_bone.local_space.scale.b *= spine.tween(scale_keyframe0.scale.b, scale_keyframe1.scale.b, pct);
          pose_bone.local_space.scale.c *= spine.tween(scale_keyframe0.scale.c, scale_keyframe1.scale.c, pct);
          pose_bone.local_space.scale.d *= spine.tween(scale_keyframe0.scale.d, scale_keyframe1.scale.d, pct);
        } else {
          pose_bone.local_space.scale.a *= scale_keyframe0.scale.a;
          pose_bone.local_space.scale.b *= scale_keyframe0.scale.b;
          pose_bone.local_space.scale.c *= scale_keyframe0.scale.c;
          pose_bone.local_space.scale.d *= scale_keyframe0.scale.d;
        }
      }
    }
  });

  pose.bone_keys = data.bone_keys;

  // ik constraints

  data.ikc_keys.forEach(function(ikc_key) {
    function clamp(n, lo, hi) {
      return (n < lo) ? (lo) : ((n > hi) ? (hi) : (n));
    }

    var ikc = data.ikcs[ikc_key];
    var ikc_mix = ikc.mix;
    var ikc_bend_positive = ikc.bend_positive;

    var anim_ikc = anim && anim.ikcs[ikc_key];
    if (anim_ikc) {
      keyframe_index = spine.Keyframe.find(anim_ikc.ikc_keyframes, time);
      if (keyframe_index !== -1) {
        var ikc_keyframe0 = anim_ikc.ikc_keyframes[keyframe_index];
        var ikc_keyframe1 = anim_ikc.ikc_keyframes[keyframe_index + 1];
        if (ikc_keyframe1) {
          pct = ikc_keyframe0.curve.evaluate((time - ikc_keyframe0.time) / (ikc_keyframe1.time - ikc_keyframe0.time));
          ikc_mix = spine.tween(ikc_keyframe0.mix, ikc_keyframe1.mix, pct);
        } else {
          ikc_mix = ikc_keyframe0.mix;
        }
        // no tweening ik bend direction
        ikc_bend_positive = ikc_keyframe0.bend_positive;
      }
    }

    var alpha = ikc_mix;
    var bendDir = (ikc_bend_positive) ? (1) : (-1);

    if (alpha === 0) {
      return;
    }

    var target = pose.bones[ikc.target_key];
    spine.Bone.flatten(target, pose.bones);

    switch (ikc.bone_keys.length) {
      case 1:
        var bone = pose.bones[ikc.bone_keys[0]];
        spine.Bone.flatten(bone, pose.bones);
        var a1 = Math.atan2(target.world_space.position.y - bone.world_space.position.y, target.world_space.position.x - bone.world_space.position.x);
        var bone_parent = pose.bones[bone.parent_key];
        if (bone_parent) {
          spine.Bone.flatten(bone_parent, pose.bones);
          a1 -= bone_parent.world_space.rotation.rad;
        }
        bone.local_space.rotation.rad = spine.tweenAngle(bone.local_space.rotation.rad, a1, alpha);
        break;
      case 2:
        var parent = pose.bones[ikc.bone_keys[0]];
        spine.Bone.flatten(parent, pose.bones);
        var child = pose.bones[ikc.bone_keys[1]];
        spine.Bone.flatten(child, pose.bones);
        var px = parent.local_space.position.x;
        var py = parent.local_space.position.y;
        var psx = parent.local_space.scale.x;
        var psy = parent.local_space.scale.y;
        var cy = child.local_space.position.y;
        var csx = child.local_space.scale.x;
        var offset1 = 0, offset2 = 0, sign2 = 1;
        if (psx < 0) {
          psx = -psx;
          offset1 = Math.PI;
          sign2 = -1;
        }
        if (psy < 0) {
          psy = -psy;
          sign2 = -sign2;
        }
        if (csx < 0) {
          csx = -csx;
          offset2 = Math.PI;
        }
        var t = spine.Vector.copy(target.world_space.position, new spine.Vector());
        var d = spine.Vector.copy(child.world_space.position, new spine.Vector());
        var pp = pose.bones[parent.parent_key];
        if (pp) {
          spine.Bone.flatten(pp, pose.bones);
          spine.Space.untransform(pp.world_space, t, t);
          spine.Space.untransform(pp.world_space, d, d);
        }
        spine.Vector.subtract(t, parent.local_space.position, t);
        spine.Vector.subtract(d, parent.local_space.position, d);
        var tx = t.x, ty = t.y;
        var dx = d.x, dy = d.y;
        var l1 = Math.sqrt(dx * dx + dy * dy), l2 = child.length * csx, a1, a2;
        outer:
        if (Math.abs(psx - psy) <= 0.0001) {
          l2 *= psx;
          var cos = (tx * tx + ty * ty - l1 * l1 - l2 * l2) / (2 * l1 * l2);
          if (cos < -1) cos = -1; else if (cos > 1) cos = 1; // clamp
          a2 = Math.acos(cos) * bendDir;
          var adj = l1 + l2 * cos;
          var opp = l2 * Math.sin(a2);
          a1 = Math.atan2(ty * adj - tx * opp, tx * adj + ty * opp);
        } else {
          cy = 0;
          var a = psx * l2;
          var b = psy * l2;
          var ta = Math.atan2(ty, tx);
          var aa = a * a;
          var bb = b * b;
          var ll = l1 * l1;
          var dd = tx * tx + ty * ty;
          var c0 = bb * ll + aa * dd - aa * bb;
          var c1 = -2 * bb * l1;
          var c2 = bb - aa;
          var d = c1 * c1 - 4 * c2 * c0;
          if (d >= 0) {
            var q = Math.sqrt(d);
            if (c1 < 0) q = -q;
            q = -(c1 + q) / 2;
            var r0 = q / c2, r1 = c0 / q;
            var r = Math.abs(r0) < Math.abs(r1) ? r0 : r1;
            if (r * r <= dd) {
              var y = Math.sqrt(dd - r * r) * bendDir;
              a1 = ta - Math.atan2(y, r);
              a2 = Math.atan2(y / psy, (r - l1) / psx);
              break outer;
            }
          }
          var minAngle = 0, minDist = Number.MAX_VALUE, minX = 0, minY = 0;
          var maxAngle = 0, maxDist = 0, maxX = 0, maxY = 0;
          var angle, dist, x, y;
          x = l1 + a; dist = x * x;
          if (dist > maxDist) { maxAngle = 0; maxDist = dist; maxX = x; }
          x = l1 - a; dist = x * x;
          if (dist < minDist) { minAngle = Math.PI; minDist = dist; minX = x; }
          angle = Math.acos(-a * l1 / (aa - bb));
          x = a * Math.cos(angle) + l1;
          y = b * Math.sin(angle);
          dist = x * x + y * y;
          if (dist < minDist) { minAngle = angle; minDist = dist; minX = x; minY = y; }
          if (dist > maxDist) { maxAngle = angle; maxDist = dist; maxX = x; maxY = y; }
          if (dd <= (minDist + maxDist) / 2) {
            a1 = ta - Math.atan2(minY * bendDir, minX);
            a2 = minAngle * bendDir;
          } else {
            a1 = ta - Math.atan2(maxY * bendDir, maxX);
            a2 = maxAngle * bendDir;
          }
        }
        var offset = Math.atan2(cy, child.local_space.position.x) * sign2;
        a1 = (a1 - offset) + offset1;
        a2 = (a2 + offset) * sign2 + offset2;
        parent.local_space.rotation.rad = spine.tweenAngle(parent.local_space.rotation.rad, a1, alpha);
        child.local_space.rotation.rad = spine.tweenAngle(child.local_space.rotation.rad, a2, alpha);
        break;
    }
  });

  pose.iterateBones(function(bone_key, bone) {
    spine.Bone.flatten(bone, pose.bones);
  });

  data.slot_keys.forEach(function(slot_key) {
    var data_slot = data.slots[slot_key];
    var pose_slot = pose.slots[slot_key] || (pose.slots[slot_key] = new spine.Slot());

    // start with a copy of the data slot
    pose_slot.copy(data_slot);

    // tween anim slot if keyframes are available
    var anim_slot = anim && anim.slots[slot_key];
    if (anim_slot) {
      keyframe_index = spine.Keyframe.find(anim_slot.color_keyframes, time);
      if (keyframe_index !== -1) {
        var color_keyframe0 = anim_slot.color_keyframes[keyframe_index];
        var color_keyframe1 = anim_slot.color_keyframes[keyframe_index + 1];
        if (color_keyframe1) {
          pct = color_keyframe0.curve.evaluate((time - color_keyframe0.time) / (color_keyframe1.time - color_keyframe0.time));
          pose_slot.color.r = spine.tween(color_keyframe0.color.r, color_keyframe1.color.r, pct);
          pose_slot.color.g = spine.tween(color_keyframe0.color.g, color_keyframe1.color.g, pct);
          pose_slot.color.b = spine.tween(color_keyframe0.color.b, color_keyframe1.color.b, pct);
          pose_slot.color.a = spine.tween(color_keyframe0.color.a, color_keyframe1.color.a, pct);
        } else {
          pose_slot.color.r = color_keyframe0.color.r;
          pose_slot.color.g = color_keyframe0.color.g;
          pose_slot.color.b = color_keyframe0.color.b;
          pose_slot.color.a = color_keyframe0.color.a;
        }
      }

      keyframe_index = spine.Keyframe.find(anim_slot.attachment_keyframes, time);
      if (keyframe_index !== -1) {
        var attachment_keyframe0 = anim_slot.attachment_keyframes[keyframe_index];
        // no tweening attachments
        pose_slot.attachment_key = attachment_keyframe0.name;
      }
    }
  });

  pose.slot_keys = data.slot_keys;

  if (anim) {
    keyframe_index = spine.Keyframe.find(anim.order_keyframes, time);
    if (keyframe_index !== -1) {
      var order_keyframe = anim.order_keyframes[keyframe_index];
      pose.slot_keys = data.slot_keys.slice(0); // copy array before reordering
      order_keyframe.slot_offsets.forEach(function(slot_offset) {
        var slot_index = pose.slot_keys.indexOf(slot_offset.slot_key);
        if (slot_index !== -1) {
          // delete old position
          pose.slot_keys.splice(slot_index, 1);
          // insert new position
          pose.slot_keys.splice(slot_index + slot_offset.offset, 0, slot_offset.slot_key);
        }
      });
    }
  }

  pose.events.length = 0;

  if (anim && anim.event_keyframes) {
    var add_event = function(event_keyframe) {
      var pose_event = new spine.Event();
      var data_event = data.events[event_keyframe.name];
      if (data_event) {
        pose_event.copy(data_event);
      }
      pose_event.int_value = event_keyframe.int_value || pose_event.int_value;
      pose_event.float_value = event_keyframe.float_value || pose_event.float_value;
      pose_event.string_value = event_keyframe.string_value || pose_event.string_value;
      pose.events.push(pose_event);
    }

    if (elapsed_time < 0) {
      if (wrapped_min) {
        // min    prev_time           time      max
        //  |         |                |         |
        //  ----------x                o<---------
        // all events between min_time and prev_time, not including prev_time
        // all events between max_time and time
        anim.event_keyframes.forEach(function(event_keyframe) {
          if (((anim.min_time <= event_keyframe.time) && (event_keyframe.time < prev_time)) ||
            ((time <= event_keyframe.time) && (event_keyframe.time <= anim.max_time))) {
            add_event(event_keyframe);
          }
        });
      } else {
        // min       time          prev_time    max
        //  |         |                |         |
        //            o<---------------x
        // all events between time and prev_time, not including prev_time
        anim.event_keyframes.forEach(function(event_keyframe) {
          if ((time <= event_keyframe.time) && (event_keyframe.time < prev_time)) {
            add_event(event_keyframe);
          }
        });
      }
    } else {
      if (wrapped_max) {
        // min       time          prev_time    max
        //  |         |                |         |
        //  --------->o                x----------
        // all events between prev_time and max_time, not including prev_time
        // all events between min_time and time
        anim.event_keyframes.forEach(function(event_keyframe) {
          if (((anim.min_time <= event_keyframe.time) && (event_keyframe.time <= time)) ||
            ((prev_time < event_keyframe.time) && (event_keyframe.time <= anim.max_time))) {
            add_event(event_keyframe);
          }
        });
      } else {
        // min    prev_time           time      max
        //  |         |                |         |
        //            x--------------->o
        // all events between prev_time and time, not including prev_time
        anim.event_keyframes.forEach(function(event_keyframe) {
          if ((prev_time < event_keyframe.time) && (event_keyframe.time <= time)) {
            add_event(event_keyframe);
          }
        });
      }
    }
  }
}

/**
 * @return {void}
 * @param {function(string, spine.Bone):void} callback
 */
spine.Pose.prototype.iterateBones = function(callback) {
  var pose = this;
  pose.bone_keys.forEach(function(bone_key) {
    var bone = pose.bones[bone_key];
    callback(bone_key, bone);
  });
}

/**
 * @return {void}
 * @param {function(string, spine.Slot, spine.SkinSlot, string, spine.Attachment):void} callback
 */
spine.Pose.prototype.iterateAttachments = function(callback) {
  var pose = this;
  var data = pose.data;
  var skin = data && data.skins[pose.skin_key];
  var default_skin = data && data.skins['default'];
  pose.slot_keys.forEach(function(slot_key) {
    var pose_slot = pose.slots[slot_key];
    var skin_slot = skin && (skin.slots[slot_key] || default_skin.slots[slot_key]);
    var attachment = skin_slot && skin_slot.attachments[pose_slot.attachment_key];
    var attachment_key = (attachment && (attachment.path || attachment.name)) || pose_slot.attachment_key;
    callback(slot_key, pose_slot, skin_slot, attachment_key, attachment);
  });
}
