goog.provide('main');

goog.require('spine');
goog.require('atlas');
goog.require('RenderCtx2D');
goog.require('RenderWebGL');

main.start = function() {
  document.body.style.margin = '0px';
  document.body.style.border = '0px';
  document.body.style.padding = '0px';
  document.body.style.overflow = 'hidden';
  document.body.style.fontFamily = '"PT Sans",Arial,"Helvetica Neue",Helvetica,Tahoma,sans-serif';

  var controls = document.createElement('div');
  controls.style.position = 'absolute';
  document.body.appendChild(controls);

  var add_checkbox_control = function(text, checked, callback) {
    var control = document.createElement('div');
    var input = document.createElement('input');
    input.type = 'checkbox';
    input.checked = checked;
    input.addEventListener('click', function() {
      callback(this.checked);
    });
    control.appendChild(input);
    var label = document.createElement('label');
    label.innerHTML = text;
    control.appendChild(label);
    controls.appendChild(control);
  }

  var add_range_control = function(text, init, min, max, step, callback) {
    var control = document.createElement('div');
    var input = document.createElement('input');
    input.type = 'range';
    input.value = init;
    input.min = min;
    input.max = max;
    input.step = step;
    input.addEventListener('input', function() {
      callback(this.value);
      label.innerHTML = text + " : " + this.value;
    });
    control.appendChild(input);
    var label = document.createElement('label');
    label.innerHTML = text + " : " + init;
    control.appendChild(label);
    controls.appendChild(control);
  }

  var messages = document.createElement('div');
  messages.style.position = 'absolute';
  messages.style.left = '0px';
  messages.style.right = '0px';
  messages.style.bottom = '0px';
  messages.style.textAlign = 'center';
  messages.style.zIndex = -1; // behind controls
  document.body.appendChild(messages);

  var canvas = document.createElement('canvas');
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  canvas.style.position = 'absolute';
  canvas.style.width = canvas.width + 'px';
  canvas.style.height = canvas.height + 'px';
  canvas.style.zIndex = -1; // behind controls

  document.body.appendChild(canvas);

  var ctx = canvas.getContext('2d');

  window.addEventListener('resize', function() {
    canvas.width = window.innerWidth;
    canvas.style.width = canvas.width + 'px';
    canvas.height = window.innerHeight;
    canvas.style.height = canvas.height + 'px';
  });

  var render_ctx2d = new RenderCtx2D(ctx);

  var canvas_gl = document.createElement('canvas');
  canvas_gl.width = window.innerWidth;
  canvas_gl.height = window.innerHeight;
  canvas_gl.style.position = 'absolute';
  canvas_gl.style.width = canvas_gl.width + 'px';
  canvas_gl.style.height = canvas_gl.height + 'px';
  canvas_gl.style.zIndex = -2; // behind 2D context canvas

  document.body.appendChild(canvas_gl);

  var gl = canvas_gl.getContext('webgl') || canvas_gl.getContext('experimental-webgl');

  window.addEventListener('resize', function() {
    canvas_gl.width = window.innerWidth;
    canvas_gl.height = window.innerHeight;
    canvas_gl.style.width = canvas_gl.width + 'px';
    canvas_gl.style.height = canvas_gl.height + 'px';
  });

  var render_webgl = new RenderWebGL(gl);

  var camera_x = 0;
  var camera_y = canvas.height / 3;
  var camera_zoom = 0.5;

  var enable_render_webgl = !!gl;
  var enable_render_ctx2d = !!ctx && !enable_render_webgl;

  add_checkbox_control("GL", enable_render_webgl, function(checked) {
    enable_render_webgl = checked;
  });
  add_checkbox_control("2D", enable_render_ctx2d, function(checked) {
    enable_render_ctx2d = checked;
  });

  var enable_render_debug_data = false;
  var enable_render_debug_pose = false;

  add_checkbox_control("2D Debug Data", enable_render_debug_data, function(checked) {
    enable_render_debug_data = checked;
  });
  add_checkbox_control("2D Debug Pose", enable_render_debug_pose, function(checked) {
    enable_render_debug_pose = checked;
  });

  var spine_data = null;
  var spine_pose = null;
  var spine_pose_next = null;
  var atlas_data = null;

  var anim_time = 0;
  var anim_length = 0;
  var anim_length_next = 0;
  var anim_rate = 1;
  var anim_repeat = 2;

  var anim_blend = 0.0;

  add_range_control("Anim Rate", anim_rate, -2.0, 2.0, 0.1, function(value) {
    anim_rate = parseFloat(value);
  });

  add_range_control("Anim Blend", anim_blend, 0.0, 1.0, 0.01, function(value) {
    anim_blend = parseFloat(value);
  });

  var alpha = 1.0;

  add_range_control("Alpha", alpha, 0.0, 1.0, 0.01, function(value) {
    alpha = parseFloat(value);
  });

  var loadFile = function(file, callback) {
    render_ctx2d.dropData(spine_data, atlas_data);
    render_webgl.dropData(spine_data, atlas_data);

    spine_data = null;
    spine_pose = null;
    spine_pose_next = null;
    atlas_data = null;

    var file_path = file.path;
    var file_json_url = file_path + file.json_url;
    var file_atlas_url = (file.atlas_url) ? (file_path + file.atlas_url) : ("");

    loadText(file_json_url, function(err, json_text) {
      if (err) {
        callback();
        return;
      }

      spine_data = new spine.Data().load(JSON.parse(json_text));
      spine_pose = new spine.Pose(spine_data);
      spine_pose_next = new spine.Pose(spine_data);

      loadText(file_atlas_url, function(err, atlas_text) {
        var images = {};

        var counter = 0;
        var counter_inc = function() {
          counter++;
        }
        var counter_dec = function() {
          if (--counter === 0) {
            render_ctx2d.loadData(spine_data, atlas_data, images);
            render_webgl.loadData(spine_data, atlas_data, images);
            callback();
          }
        }

        counter_inc();

        if (!err && atlas_text) {
          atlas_data = new atlas.Data().import(atlas_text);

          // load atlas page images
          var dir_path = file_atlas_url.slice(0, file_atlas_url.lastIndexOf('/'));
          atlas_data.pages.forEach(function(page) {
            var image_key = page.name;
            var image_url = dir_path + "/" + image_key;
            counter_inc();
            images[image_key] = loadImage(image_url, (function(page) {
              return function(err, image) {
                if (err) {
                  console.log("error loading:", image && image.src || page.name);
                }
                page.w = page.w || image.width;
                page.h = page.h || image.height;
                counter_dec();
              }
            })(page));
          });
        } else {
          // load attachment images
          spine_data.iterateSkins(function(skin_key, skin) {
            skin.iterateAttachments(function(slot_key, skin_slot, attachment_key, attachment) {
              if (!attachment) {
                return;
              }
              switch (attachment.type) {
                case 'region':
                case 'mesh':
                case 'weightedmesh':
                  var image_key = attachment_key;
                  var image_url = file_path + spine_data.skeleton.images + image_key + ".png";
                  counter_inc();
                  images[image_key] = loadImage(image_url, function(err, image) {
                    if (err) {
                      console.log("error loading:", image.src);
                    }
                    counter_dec();
                  });
                  break;
              }
            });
          });
        }

        counter_dec();
      });
    });
  }

  var files = [];

  var add_file = function(path, json_url, atlas_url) {
    var file = {};
    file.path = path;
    file.json_url = json_url;
    file.atlas_url = atlas_url || "";
    files.push(file);
  }

  add_file("Splatoon-FanArt/", "Data/splatoon.json", "Data/splatoon.atlas.txt");
  add_file("ExplorerQ/", "ExplorerQ.json");
  add_file("examples/alien/", "export/alien.json", "export/alien.atlas");
  add_file("examples/dragon/", "export/dragon.json", "export/dragon.atlas");
  add_file("examples/goblins/", "export/goblins.json", "export/goblins.atlas");
  add_file("examples/goblins/", "export/goblins-mesh.json", "export/goblins-mesh.atlas");
  add_file("examples/goblins/", "export/goblins-ffd.json", "export/goblins-ffd.atlas");
  add_file("examples/hero/", "export/hero-mesh.json", "export/hero-mesh.atlas");
  add_file("examples/hero/", "export/hero.json", "export/hero.atlas");
  add_file("examples/powerup/", "export/powerup.json", "export/powerup.atlas");
  add_file("examples/raptor/", "export/raptor.json", "export/raptor.atlas");
  add_file("examples/speedy/", "export/speedy.json", "export/speedy.atlas");
  add_file("examples/spineboy-old/", "export/spineboy-old.json", "export/spineboy-old.atlas");
  add_file("examples/spineboy/", "export/spineboy.json", "export/spineboy.atlas");
  add_file("examples/spineboy/", "export/spineboy-mesh.json", "export/spineboy-mesh.atlas");
  add_file("examples/spineboy/", "export/spineboy-hoverboard.json", "export/spineboy-hoverboard.atlas");
  add_file("examples/spinosaurus/", "export/spinosaurus.json", "export/spinosaurus.atlas");
  //var esoteric = "https://raw.githubusercontent.com/EsotericSoftware/spine-runtimes/master/";
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Dragon/", "dragon.json", "dragon.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Eyes/", "eyes.json", "eyes.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/FootSoldier/", "FootSoldier.json", "FS_White.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Gauge/", "Gauge.json", "Gauge.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Goblins/", "goblins-mesh.json", "goblins-mesh.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Hero/", "hero-mesh.json", "hero-mesh.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Raggedy Spineboy/", "Raggedy Spineboy.json", "Raggedy Spineboy.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Raptor/", "raptor.json", "raptor.atlas.txt");
  //add_file(esoteric + "spine-unity/Assets/Examples/Spine/Spineboy/", "spineboy.json", "spineboy.atlas.txt");

  var file_index = 0;
  var skin_index = 0;
  var anim_index = 0;

  var loading = false;

  function updateFile() {
    skin_index = 0;
    updateSkin();
    anim_index = 0;
    updateAnim();
  }

  function updateSkin() {
    var skin_key = spine_data.skin_keys[skin_index];
    spine_pose.setSkin(skin_key);
    spine_pose_next.setSkin(skin_key);
  }

  function updateAnim() {
    var anim_key = spine_data.anim_keys[anim_index];
    spine_pose.setAnim(anim_key);
    var anim_key_next = spine_data.anim_keys[(anim_index + 1) % spine_data.anim_keys.length];
    spine_pose_next.setAnim(anim_key_next);
    spine_pose.setTime(anim_time = 0);
    spine_pose_next.setTime(anim_time);
    anim_length = spine_pose.curAnimLength() || 1000;
    anim_length_next = spine_pose_next.curAnimLength() || 1000;
  }

  var file = files[file_index];
  messages.innerHTML = "loading";
  loading = true;
  loadFile(file, function() {
    loading = false;
    updateFile();
  });

  var prev_time = 0;

  var loop = function(time) {
    requestAnimationFrame(loop);

    var dt = time - (prev_time || time);
    prev_time = time; // ms

    if (!loading) {
      spine_pose.update(dt * anim_rate);
      var anim_rate_next = anim_rate * anim_length_next / anim_length;
      spine_pose_next.update(dt * anim_rate_next);

      anim_time += dt * anim_rate;

      if (anim_time >= (anim_length * anim_repeat)) {
        if (++anim_index >= spine_data.anim_keys.length) {
          anim_index = 0;
          if (++skin_index >= spine_data.skin_keys.length) {
            skin_index = 0;
            if (files.length > 1) {
              if (++file_index >= files.length) {
                file_index = 0;
              }
              file = files[file_index];
              messages.innerHTML = "loading";
              loading = true;
              loadFile(file, function() {
                loading = false;
                updateFile();
              });
              return;
            }
          }
          updateSkin();
        }
        updateAnim();
      }

      var skin_key = spine_data.skin_keys[skin_index];
      var anim_key = spine_data.anim_keys[anim_index];
      var anim_key_next = spine_data.anim_keys[(anim_index + 1) % spine_data.anim_keys.length];
      messages.innerHTML = "skin: " + skin_key + ", anim: " + anim_key + ", next anim: " + anim_key_next + "<br>" + file.path + file.json_url;
    }

    if (ctx) {
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }

    if (gl) {
      gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
      gl.clearColor(0, 0, 0, 0);
      gl.clear(gl.COLOR_BUFFER_BIT);
    }

    if (loading) {
      return;
    }

    spine_pose.strike();

    //spine_pose.events.forEach(function (event) { console.log("event", event.name, event.int_value, event.float_value, event.string_value); });

    if (anim_blend > 0) {
      spine_pose_next.strike();

      // blend next pose bone into pose bone
      spine_pose.iterateBones(function(bone_key, bone) {
        var bone_next = spine_pose_next.bones[bone_key];
        if (!bone_next) {
          return;
        }
        spine.Space.tween(bone.local_space, bone_next.local_space, anim_blend, bone.local_space);
      });

      // compute bone world space
      spine_pose.iterateBones(function(bone_key, bone) {
        spine.Bone.flatten(bone, spine_pose.bones);
      });
    }

    if (ctx) {
      ctx.globalAlpha = alpha;

      // origin at center, x right, y up
      ctx.translate(ctx.canvas.width / 2, ctx.canvas.height / 2);
      ctx.scale(1, -1);

      if (enable_render_ctx2d && enable_render_webgl) {
        ctx.translate(-ctx.canvas.width / 4, 0);
      }

      ctx.translate(-camera_x, -camera_y);
      ctx.scale(camera_zoom, camera_zoom);
      ctx.lineWidth = 1 / camera_zoom;

      if (enable_render_ctx2d) {
        render_ctx2d.drawPose(spine_pose, atlas_data);
      }

      if (enable_render_debug_data) {
        render_ctx2d.drawDebugData(spine_pose, atlas_data);
      }

      if (enable_render_debug_pose) {
        render_ctx2d.drawDebugPose(spine_pose, atlas_data);
      }
    }

    if (gl) {
      var gl_color = render_webgl.gl_color;
      gl_color[3] = alpha;

      var gl_projection = render_webgl.gl_projection;
      mat4x4Identity(gl_projection);
      mat4x4Ortho(gl_projection, -gl.canvas.width / 2, gl.canvas.width / 2, -gl.canvas.height / 2, gl.canvas.height / 2, -1, 1);

      if (enable_render_ctx2d && enable_render_webgl) {
        mat4x4Translate(gl_projection, gl.canvas.width / 4, 0, 0);
      }

      mat4x4Translate(gl_projection, -camera_x, -camera_y, 0);
      mat4x4Scale(gl_projection, camera_zoom, camera_zoom, 1);

      if (enable_render_webgl) {
        render_webgl.drawPose(spine_pose, atlas_data);
      }
    }
  }

  requestAnimationFrame(loop);
}

function loadText(url, callback) {
  var req = new XMLHttpRequest();
  if (url) {
    req.open("GET", url, true);
    req.responseType = 'text';
    req.addEventListener('error', function() {
      callback("error", null);
    });
    req.addEventListener('abort', function() {
      callback("abort", null);
    });
    req.addEventListener('load', function() {
        if (req.status === 200) {
          callback(null, req.response);
        } else {
          callback(req.response, null);
        }
      });
    req.send();
  } else {
    callback("error", null);
  }
  return req;
}

function loadImage(url, callback) {
  var image = new Image();
  image.crossOrigin = "Anonymous";
  image.addEventListener('error', function() {
    callback("error", null);
  });
  image.addEventListener('abort', function() {
    callback("abort", null);
  });
  image.addEventListener('load', function() {
    callback(null, image);
  });
  image.src = url;
  return image;
}
