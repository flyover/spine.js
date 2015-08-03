goog.provide('main');

goog.require('spine');
goog.require('atlas');
goog.require('renderCtx2D');
goog.require('renderWebGL');

main.start = function ()
{
	document.body.style.margin = '0px';
	document.body.style.border = '0px';
	document.body.style.padding = '0px';
	document.body.style.overflow = 'hidden';
	document.body.style.fontFamily = '"PT Sans",Arial,"Helvetica Neue",Helvetica,Tahoma,sans-serif';

	var controls = document.createElement('div');
	controls.style.position = 'absolute';
	document.body.appendChild(controls);

	var add_checkbox_control = function (text, checked, callback)
	{
		var control = document.createElement('div');
		var input = document.createElement('input');
		input.type = 'checkbox';
		input.checked = checked;
		input.addEventListener('click', function () { callback(this.checked); }, false);
		control.appendChild(input);
		var label = document.createElement('label');
		label.innerHTML = text;
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

	window.addEventListener('resize', function ()
	{
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
	});

	var render_ctx2d = new renderCtx2D(ctx);

	var canvas_gl = document.createElement('canvas');
	canvas_gl.width = window.innerWidth;
	canvas_gl.height = window.innerHeight;
	canvas_gl.style.position = 'absolute';
	canvas_gl.style.width = canvas_gl.width + 'px';
	canvas_gl.style.height = canvas_gl.height + 'px';
	canvas_gl.style.zIndex = -2; // behind 2D context canvas

	document.body.appendChild(canvas_gl);

	var gl = canvas_gl.getContext('webgl') || canvas_gl.getContext('experimental-webgl');

	window.addEventListener('resize', function ()
	{
		canvas_gl.width = window.innerWidth;
		canvas_gl.height = window.innerHeight;
		canvas_gl.style.width = canvas_gl.width + 'px';
		canvas_gl.style.height = canvas_gl.height + 'px';
	});

	var render_webgl = new renderWebGL(gl);

	var camera_x = 0;
	var camera_y = canvas.height/3;
	var camera_zoom = 0.5;

	var enable_render_webgl = !!gl;
	var enable_render_ctx2d = !!ctx && !enable_render_webgl;

	add_checkbox_control("GL", enable_render_webgl, function (checked) { enable_render_webgl = checked; });
	add_checkbox_control("2D", enable_render_ctx2d, function (checked) { enable_render_ctx2d = checked; });

	var enable_render_debug_data = false;
	var enable_render_debug_pose = false;

	add_checkbox_control("2D Debug Data", enable_render_debug_data, function (checked) { enable_render_debug_data = checked; });
	add_checkbox_control("2D Debug Pose", enable_render_debug_pose, function (checked) { enable_render_debug_pose = checked; });

	var spine_pose = null;
	var atlas_data = null;

	var anim_time = 0;
	var anim_length = 0;
	var anim_rate = 1;
	var anim_repeat = 2;

	var loadFile = function (file, callback)
	{
		render_ctx2d.dropPose(spine_pose, atlas_data);
		render_webgl.dropPose(spine_pose, atlas_data);

		spine_pose = null;
		atlas_data = null;

		var file_path = file.path;
		var file_json_url = file_path + file.json_url;
		var file_atlas_url = (file.atlas_url)?(file_path + file.atlas_url):("");

		loadText(file_json_url, function (err, json_text)
		{
			if (err)
			{
				callback();
				return;
			}

			spine_pose = new spine.Pose(new spine.Data().load(JSON.parse(json_text)));

			loadText(file_atlas_url, function (err, atlas_text)
			{
				if (!err && atlas_text)
				{
					atlas_data = new atlas.Data().import(atlas_text);
				}

				render_ctx2d.loadPose(spine_pose, atlas_data, file_path, file_atlas_url);
				render_webgl.loadPose(spine_pose, atlas_data, file_path, file_atlas_url);

				callback();
			});
		});
	}

	var files = [];

	var add_file = function (path, json_url, atlas_url)
	{
		var file = {};
		file.path = path;
		file.json_url = json_url;
		file.atlas_url = atlas_url || "";
		files.push(file);
	}

	//add_file("spineboy/", "export/spineboy.json");
	//add_file("raptor/", "export/raptor.json", "export/raptor.atlas");
	add_file("Splatoon-FanArt/", "Data/splatoon.json", "Data/splatoon.atlas.txt");
	var esoteric = "https://raw.githubusercontent.com/EsotericSoftware/spine-runtimes/master/";
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Dragon/", "dragon.json", "dragon.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Eyes/", "eyes.json", "eyes.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/FootSoldier/", "FootSoldier.json", "FS_White.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Gauge/", "Gauge.json", "Gauge.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Goblins/", "goblins-mesh.json", "goblins-mesh.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Hero/", "hero-mesh.json", "hero-mesh.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Raggedy Spineboy/", "Raggedy Spineboy.json", "Raggedy Spineboy.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Raptor/", "raptor.json", "raptor.atlas.txt");
	add_file(esoteric + "spine-unity/Assets/Examples/Spine/Spineboy/", "spineboy.json", "spineboy.atlas.txt");

	var file_index = 0;
	var skin_index = 0;
	var anim_index = 0;

	var loading = false;

	var file = files[file_index];
	messages.innerHTML = "loading";
	loading = true; loadFile(file, function ()
	{
		loading = false;
		spine_pose.setSkin(spine_pose.data.skin_keys[skin_index = 0]);
		spine_pose.setAnim(spine_pose.data.anim_keys[anim_index = 0]);
		spine_pose.setTime(anim_time = 0);
		anim_length = spine_pose.curAnimLength() || 1000;
	});

	var prev_time = 0;

	var loop = function (time)
	{
		requestAnimationFrame(loop);

		var dt = time - (prev_time || time); prev_time = time; // ms

		if (!loading)
		{
			spine_pose.update(dt * anim_rate);

			anim_time += dt * anim_rate;

			if (anim_time >= (anim_length * anim_repeat))
			{
				if (++anim_index >= spine_pose.data.anim_keys.length)
				{
					anim_index = 0;
					if (++skin_index >= spine_pose.data.skin_keys.length)
					{
						skin_index = 0;
						if (files.length > 1)
						{
							if (++file_index >= files.length)
							{
								file_index = 0;
							}
							file = files[file_index];
							messages.innerHTML = "loading";
							loading = true; loadFile(file, function ()
							{
								loading = false;
								spine_pose.setSkin(spine_pose.data.skin_keys[skin_index = 0]);
								spine_pose.setAnim(spine_pose.data.anim_keys[anim_index = 0]);
								spine_pose.setTime(anim_time = 0);
								anim_length = spine_pose.curAnimLength() || 1000;
							});
							return;
						}
					}
					spine_pose.setSkin(spine_pose.data.skin_keys[skin_index]);
				}
				spine_pose.setAnim(spine_pose.data.anim_keys[anim_index]);
				spine_pose.setTime(anim_time = 0);
				anim_length = spine_pose.curAnimLength() || 1000;
			}

			messages.innerHTML = "skin: " + spine_pose.skin_key + ", anim: " + spine_pose.anim_key + "<br>" + file.path + file.json_url;
		}

		if (ctx)
		{
			ctx.setTransform(1, 0, 0, 1, 0, 0);
			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);			
		}

		if (gl)
		{
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);
		}

		if (loading) { return; }

		spine_pose.strike();

		//spine_pose.events.forEach(function (event) { console.log("event", event.name, event.int_value, event.float_value, event.string_value); });

		if (ctx)
		{
			// origin at center, x right, y up
			ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2); ctx.scale(1, -1);

			if (enable_render_ctx2d && enable_render_webgl)
			{
				ctx.translate(-ctx.canvas.width/4, 0);
			}

			ctx.translate(-camera_x, -camera_y);
			ctx.scale(camera_zoom, camera_zoom);
			ctx.lineWidth = 1 / camera_zoom;

			if (enable_render_ctx2d)
			{
				render_ctx2d.drawPose(spine_pose, atlas_data);
			}

			if (enable_render_debug_data)
			{
				render_ctx2d.drawDebugData(spine_pose, atlas_data);
			}

			if (enable_render_debug_pose)
			{
				render_ctx2d.drawDebugPose(spine_pose, atlas_data);
			}
		}

		if (gl)
		{
			var gl_projection = render_webgl.gl_projection;
			mat3x3Identity(gl_projection);
			mat3x3Ortho(gl_projection, -gl.canvas.width/2, gl.canvas.width/2, -gl.canvas.height/2, gl.canvas.height/2);

			if (enable_render_ctx2d && enable_render_webgl)
			{
				mat3x3Translate(gl_projection, gl.canvas.width/4, 0);
			}

			mat3x3Translate(gl_projection, -camera_x, -camera_y);
			mat3x3Scale(gl_projection, camera_zoom, camera_zoom);

			if (enable_render_webgl)
			{
				render_webgl.drawPose(spine_pose, atlas_data);
			}
		}
	}

	requestAnimationFrame(loop);
}

function loadText (url, callback)
{
	var req = new XMLHttpRequest();
	if (url)
	{
		req.open("GET", url, true);
		req.responseType = 'text';
		req.addEventListener('error', function (event) { callback("error", null); }, false);
		req.addEventListener('abort', function (event) { callback("abort", null); }, false);
		req.addEventListener('load', function (event)
		{
			if (req.status === 200)
			{
				callback(null, req.response);
			}
			else
			{
				callback(req.response, null);
			}
		}, 
		false);
		req.send();
	}
	else
	{
		callback("error", null);
	}
	return req;
}

function loadImage (url, callback)
{
	var image = new Image();
	image.crossOrigin = "Anonymous";
	image.addEventListener('error', function (event) { callback("error", null); }, false);
	image.addEventListener('abort', function (event) { callback("abort", null); }, false);
	image.addEventListener('load', function (event) { callback(null, image); }, false);
	image.src = url;
	return image;	
}
