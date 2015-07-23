goog.provide('main');

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

	var region_vertex_position = new Float32Array([ -1, -1, 1, -1, 1, 1, -1, 1 ]);
	var region_vertex_texcoord = new Float32Array([ 0, 1, 1, 1, 1, 0, 0, 0 ]);
	var region_vertex_triangle = new Uint16Array([ 0, 1, 2, 0, 2, 3 ]);

	if (gl)
	{
		var gl_projection = mat3x3Identity(new Float32Array(9));
		var gl_modelview = mat3x3Identity(new Float32Array(9));
		var gl_tex_matrix = mat3x3Identity(new Float32Array(9));
		var gl_color = vec4Identity(new Float32Array(4));
		var gl_mesh_shader_vs_src = 
		[
			"precision mediump int;",
			"precision mediump float;",
			"uniform mat3 uProjection;",
			"uniform mat3 uModelview;",
			"uniform mat3 uTexMatrix;",
			"attribute vec2 aVertexPosition;", // [ x, y ]
			"attribute vec2 aVertexTexCoord;", // [ u, v ]
			"varying vec3 vTexCoord;",
			"void main(void) {",
			" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
			" gl_Position = vec4(uProjection * uModelview * vec3(aVertexPosition, 1.0), 1.0);",
			"}"
		];
		var gl_mesh_shader_fs_src = 
		[
			"precision mediump int;",
			"precision mediump float;",
			"uniform sampler2D uSampler;",
			"uniform vec4 uColor;",
			"varying vec3 vTexCoord;",
			"void main(void) {",
			" gl_FragColor = uColor * texture2D(uSampler, vTexCoord.st);",
			"}"
		];
		var gl_mesh_shader = glMakeShader(gl, gl_mesh_shader_vs_src, gl_mesh_shader_fs_src);
		var gl_region_vertex = {};
		gl_region_vertex.position = glMakeVertex(gl, region_vertex_position, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
		gl_region_vertex.texcoord = glMakeVertex(gl, region_vertex_texcoord, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
		gl_region_vertex.triangle = glMakeVertex(gl, region_vertex_triangle, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
		var gl_skin_shader_modelview_count = 16; // * mat3
		var gl_skin_shader_modelview_array = new Float32Array(9 * gl_skin_shader_modelview_count);
		var gl_skin_shader_position_count = 8; // * vec4
		var gl_skin_shader_vs_src = 
		[
			"precision mediump int;",
			"precision mediump float;",
			"uniform mat3 uProjection;",
			"uniform mat3 uModelviewArray[" + gl_skin_shader_modelview_count + "];",
			"uniform mat3 uTexMatrix;",
			"attribute vec4 aVertexPosition0;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition1;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition2;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition3;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition4;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition5;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition6;", // [ x, y, i, w ]
			"attribute vec4 aVertexPosition7;", // [ x, y, i, w ]
			"attribute vec2 aVertexTexCoord;", // [ u, v ]
			"varying vec3 vTexCoord;",
			"void main(void) {",
			" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
			" vec3 blendPosition = vec3(0.0);",
			" blendPosition += (uModelviewArray[int(aVertexPosition0.z)] * vec3(aVertexPosition0.xy, 1.0)) * aVertexPosition0.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition1.z)] * vec3(aVertexPosition1.xy, 1.0)) * aVertexPosition1.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition2.z)] * vec3(aVertexPosition2.xy, 1.0)) * aVertexPosition2.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition3.z)] * vec3(aVertexPosition3.xy, 1.0)) * aVertexPosition3.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition4.z)] * vec3(aVertexPosition4.xy, 1.0)) * aVertexPosition4.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition5.z)] * vec3(aVertexPosition5.xy, 1.0)) * aVertexPosition5.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition6.z)] * vec3(aVertexPosition6.xy, 1.0)) * aVertexPosition6.w;",
			" blendPosition += (uModelviewArray[int(aVertexPosition7.z)] * vec3(aVertexPosition7.xy, 1.0)) * aVertexPosition7.w;",
			" gl_Position = vec4(uProjection * blendPosition, 1.0);",
			"}"
		];
		var gl_skin_shader_fs_src = 
		[
			"precision mediump int;",
			"precision mediump float;",
			"uniform sampler2D uSampler;",
			"uniform vec4 uColor;",
			"varying vec3 vTexCoord;",
			"void main(void) {",
			" gl_FragColor = uColor * texture2D(uSampler, vTexCoord.st);",
			"}"
		];
		var gl_skin_shader = glMakeShader(gl, gl_skin_shader_vs_src, gl_skin_shader_fs_src);
	}

	var camera_x = 0;
	var camera_y = canvas.height/3;
	var camera_zoom = 0.5;

	var render_debug_data = false;
	var render_debug_pose = false;

	add_checkbox_control("Debug Data", render_debug_data, function (checked) { render_debug_data = checked; });
	add_checkbox_control("Debug Pose", render_debug_pose, function (checked) { render_debug_pose = checked; });

	var data = new spine.Data();
	var pose = new spine.Pose(data);
	var atlas = null;
	var images = {};
	var gl_textures = {};

	var anim_time = 0;
	var anim_length = 0;
	var anim_rate = 1;
	var anim_repeat = 2;

	var skin_info_map = {};

	var loadFile = function (file, callback)
	{
		data = new spine.Data();
		pose = new spine.Pose(data);
		atlas = null;

		for (var image_key in images)
		{
			delete images[image_key];
			if (gl)
			{
				var gl_texture = gl_textures[image_key];
				gl.deleteTexture(gl_texture); gl_texture = null;
				delete gl_textures[image_key];
			}
		}

		images = {};
		gl_textures = {};

		for (var skin_key in skin_info_map)
		{
			var skin_info = skin_info_map[skin_key];
			var slot_info_map = skin_info.slot_info_map;
			for (var slot_key in slot_info_map)
			{
				var slot_info = slot_info_map[slot_key];
				switch (slot_info.type)
				{
				case 'mesh':
					if (gl)
					{
						var gl_vertex = slot_info.gl_vertex;
						gl.deleteBuffer(gl_vertex.position.buffer);
						gl.deleteBuffer(gl_vertex.texcoord.buffer);
						gl.deleteBuffer(gl_vertex.triangle.buffer);
					}
					break;
				case 'skinnedmesh':
					if (gl)
					{
						var gl_vertex = slot_info.gl_vertex;
						gl.deleteBuffer(gl_vertex.position.buffer);
						gl.deleteBuffer(gl_vertex.texcoord.buffer);
						gl.deleteBuffer(gl_vertex.triangle.buffer);
					}
					break;
				default:
					console.log("TODO", skin_key, slot_key, slot_info.type);
					break;
				}
			}
		}

		skin_info_map = {};

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

			var json = JSON.parse(json_text);
		
			data.load(json);
		
			data.iterateSkins(function (skin_key, skin)
			{
				var skin_info = skin_info_map[skin_key] = {};
				var slot_info_map = skin_info.slot_info_map = {};

				data.iterateAttachments(skin_key, function (slot_key, slot, skin_slot, attachment_key, attachment)
				{
					if (!attachment) { return; }

					switch (attachment.type)
					{
					case 'mesh':
						var slot_info = slot_info_map[slot_key] = {};
						slot_info.type = attachment.type;
						var vertex_position = slot_info.vertex_position = new Float32Array(attachment.vertices);
						var vertex_texcoord = slot_info.vertex_texcoord = new Float32Array(attachment.uvs);
						var vertex_triangle = slot_info.vertex_triangle = new Uint16Array(attachment.triangles);
						if (gl)
						{
							var gl_vertex = slot_info.gl_vertex = {};
							gl_vertex.position = glMakeVertex(gl, vertex_position, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
							gl_vertex.texcoord = glMakeVertex(gl, vertex_texcoord, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
							gl_vertex.triangle = glMakeVertex(gl, vertex_triangle, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
						}
						break;
					case 'skinnedmesh':
						var slot_info = slot_info_map[slot_key] = {};
						slot_info.type = attachment.type;
						var vertex_setup_position = slot_info.vertex_setup_position = new Float32Array(attachment.uvs.length);
						var vertex_blend_position = slot_info.vertex_blend_position = new Float32Array(attachment.uvs.length);
						var vertex_position = slot_info.vertex_position = new Float32Array(4 * gl_skin_shader_position_count * attachment.uvs.length);
						var vertex_texcoord = slot_info.vertex_texcoord = new Float32Array(attachment.uvs);
						var vertex_triangle = slot_info.vertex_triangle = new Uint16Array(attachment.triangles);
						var blend_bone_index_array = slot_info.blend_bone_index_array = [];
						var position = new spine.Vector();
						for (var i = 0, vertex_i = 0; i < attachment.vertices.length; ++vertex_i)
						{
							var blend_count = attachment.vertices[i++];
							var setup_position_x = 0;
							var setup_position_y = 0;
							var blenders = [];
							for (var j = 0; j < blend_count; ++j)
							{
								var bone_index = attachment.vertices[i++];
								var x = position.x = attachment.vertices[i++];
								var y = position.y = attachment.vertices[i++];
								var weight = attachment.vertices[i++];
								blenders.push({ x: x, y: y, bone_index: bone_index, weight: weight });
								var bone_key = data.bone_keys[bone_index];
								var bone = data.bones[bone_key];
								spine.Space.transform(bone.world_space, position, position);
								setup_position_x += position.x * weight;
								setup_position_y += position.y * weight;
							}
							var vertex_setup_position_offset = vertex_i * 2;
							vertex_setup_position[vertex_setup_position_offset++] = setup_position_x;
							vertex_setup_position[vertex_setup_position_offset++] = setup_position_y;

							// sort the blenders descending by weight
							blenders = blenders.sort(function (a, b) { return b.weight - a.weight; });

							// clamp blenders and adjust weights
							if (blenders.length > gl_skin_shader_position_count)
							{
								console.log(attachment_key, blenders.length);
								blenders.length = gl_skin_shader_position_count;
								var weight_sum = 0;
								blenders.forEach(function (blend) { weight_sum += blend.weight; });
								blenders.forEach(function (blend) { blend.weight /= weight_sum; });
							}

							// keep track of which bones are used for blending
							blenders.forEach(function (blend)
							{
								if (blend_bone_index_array.indexOf(blend.bone_index) === -1)
								{
									blend_bone_index_array.push(blend.bone_index);
								}
							});

							// pad out blenders
							while (blenders.length < gl_skin_shader_position_count)
							{
								blenders.push({ x: 0, y: 0, bone_index: -1, weight: 0 });
							}

							var vertex_position_offset = vertex_i * 4 * gl_skin_shader_position_count;
							blenders.forEach(function (blend, index)
							{
								vertex_position[vertex_position_offset++] = blend.x;
								vertex_position[vertex_position_offset++] = blend.y;
								vertex_position[vertex_position_offset++] = (blend.bone_index >= 0)?(blend_bone_index_array.indexOf(blend.bone_index)):(0);
								vertex_position[vertex_position_offset++] = blend.weight;
							});
						}
						vertex_blend_position.set(vertex_setup_position);
						if (gl)
						{
							var gl_vertex = slot_info.gl_vertex = {};
							gl_vertex.position = glMakeVertex(gl, vertex_position, 4, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
							gl_vertex.texcoord = glMakeVertex(gl, vertex_texcoord, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
							gl_vertex.triangle = glMakeVertex(gl, vertex_triangle, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
						}
						break;
					}
				});
			});

			loadText(file_atlas_url, function (err, atlas_text)
			{
				if (!err && atlas_text)
				{
					// load atlas and atlas page images
					atlas = new spine.Atlas();
					atlas.import(atlas_text);
					var dir_path = file_atlas_url.slice(0, file_atlas_url.lastIndexOf('/'));
					atlas.pages.forEach(function (page)
					{
						var image_key = page.name;
						var image_url = dir_path + "/" + image_key;
						images[image_key] = images[image_key] || loadImage(image_url, function (err, image)
						{
							if (err)
							{
								console.log("error loading:", image.src);
							}
							if (gl)
							{
								var gl_texture = gl_textures[image_key] = gl.createTexture();
								gl.bindTexture(gl.TEXTURE_2D, gl_texture);
								gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
								gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
								gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
								gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
								gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
							}
						});
					});
				}
				else
				{
					// load attachment images
					data.iterateSkins(function (skin_key, skin)
					{
						data.iterateAttachments(skin_key, function (slot_key, slot, skin_slot, attachment_key, attachment)
						{
							if (!attachment) { return; }

							switch (attachment.type)
							{
							case 'region':
							case 'mesh':
							case 'skinnedmesh':
								var image_key = attachment_key;
								var image_url = file_path + data.skeleton.images + image_key + ".png";
								images[image_key] = images[image_key] || loadImage(image_url, function (err, image)
								{
									if (err)
									{
										console.log("error loading:", image.src);
									}
									if (gl)
									{
										var gl_texture = gl_textures[image_key] = gl.createTexture();
										gl.bindTexture(gl.TEXTURE_2D, gl_texture);
										gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
										gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
										gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
										gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
										gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
									}
								});
								break;
							}
						});
					});
				}

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
		pose.setSkin(data.skin_keys[skin_index = 0]);
		pose.setAnim(data.anim_keys[anim_index = 0]);
		pose.setTime(anim_time = 0);
		anim_length = pose.curAnimLength() || 1000;
	});

	var prev_time = 0;

	var loop = function (time)
	{
		requestAnimationFrame(loop);

		var dt = time - (prev_time || time); prev_time = time; // ms

		if (!loading)
		{
			pose.update(dt * anim_rate);

			anim_time += dt * anim_rate;

			if (anim_time >= (anim_length * anim_repeat))
			{
				if (++anim_index >= data.anim_keys.length)
				{
					anim_index = 0;
					if (++skin_index >= data.skin_keys.length)
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
								pose.setSkin(data.skin_keys[skin_index = 0]);
								pose.setAnim(data.anim_keys[anim_index = 0]);
								pose.setTime(anim_time = 0);
								anim_length = pose.curAnimLength() || 1000;
							});
							return;
						}
					}
					pose.setSkin(data.skin_keys[skin_index]);
				}
				pose.setAnim(data.anim_keys[anim_index]);
				pose.setTime(anim_time = 0);
				anim_length = pose.curAnimLength() || 1000;
			}

			messages.innerHTML = "skin: " + pose.skin_key + ", anim: " + pose.anim_key + "<br>" + file.path + file.json_url;
		}

		pose.strike();

		//pose.events.forEach(function (event) { console.log(event.name, event.int_value, event.float_value, event.string_value); });

		if (ctx)
		{
			ctx.setTransform(1, 0, 0, 1, 0, 0);

			ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
			
			// origin at center, x right, y up
			ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2); ctx.scale(1, -1);

			ctx.translate(-camera_x, -camera_y);
			ctx.scale(camera_zoom, camera_zoom);
			ctx.lineWidth = 1 / camera_zoom;
		}

		if (gl)
		{
			gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
			gl.clearColor(0, 0, 0, 0);
			gl.clear(gl.COLOR_BUFFER_BIT);

			mat3x3Identity(gl_projection);
			mat3x3Ortho(gl_projection, -canvas_gl.width/2, canvas_gl.width/2, -canvas_gl.height/2, canvas_gl.height/2);
			mat3x3Translate(gl_projection, -camera_x, -camera_y);
			mat3x3Scale(gl_projection, camera_zoom, camera_zoom);
		}

		if (ctx)
		{
			pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
			{
				if (!attachment) { return; }
				if (attachment.type !== 'skinnedmesh') { return; }

				var skin_info = skin_info_map[pose.skin_key];
				var slot_info_map = skin_info.slot_info_map;
				var slot_info = slot_info_map[slot_key];
				var vertex_blend_position = slot_info.vertex_blend_position;
				var position = new spine.Vector();
				for (var i = 0, vertex_i = 0; i < attachment.vertices.length; ++vertex_i)
				{
					var blend_count = attachment.vertices[i++];
					var blend_position_x = 0;
					var blend_position_y = 0;
					for (var j = 0; j < blend_count; ++j)
					{
						var bone_index = attachment.vertices[i++];
						position.x = attachment.vertices[i++];
						position.y = attachment.vertices[i++];
						var weight = attachment.vertices[i++];
						var bone_key = pose.bone_keys[bone_index];
						var bone = pose.bones[bone_key];
						spine.Space.transform(bone.world_space, position, position);
						blend_position_x += position.x * weight;
						blend_position_y += position.y * weight;
					}
					var vertex_blend_position_x_offset = (vertex_i*2);
					var vertex_blend_position_y_offset = vertex_blend_position_x_offset+1;
					vertex_blend_position[vertex_blend_position_x_offset] = blend_position_x;
					vertex_blend_position[vertex_blend_position_y_offset] = blend_position_y;
				}
			});
		}

		if (gl)
		{
			pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
			{
				if (!attachment) { return; }
				if (attachment.type === 'boundingbox') { return; }

				var image = null;
				var site = atlas && atlas.sites[attachment_key];
				var gl_texture = null;
				if (site)
				{
					var page = atlas.pages[site.page];
					var image_key = page.name;
					image = images[image_key];
					if (image && image.complete)
					{
						page.w = page.w || image.width;
						page.h = page.h || image.height;
					}
					gl_texture = gl_textures[image_key];
				}
				else
				{
					var image_key = attachment_key;
					image = images[image_key];
					gl_texture = gl_textures[image_key];
				}

				if (image && image.complete && gl_texture)
				{
					mat3x3Identity(gl_modelview);

					if (site)
					{
						if (site.rotate)
						{
							mat3x3Identity(gl_tex_matrix);
							mat3x3Scale(gl_tex_matrix, 1 / page.w, 1 / page.h);
							mat3x3Translate(gl_tex_matrix, site.x, site.y);
							mat3x3Scale(gl_tex_matrix, site.h, site.w);
							mat3x3Translate(gl_tex_matrix, 0, 1); // bottom-left corner
							mat3x3Rotate(gl_tex_matrix, -Math.PI/2); // -90 degrees
						}
						else
						{
							mat3x3Identity(gl_tex_matrix);
							mat3x3Scale(gl_tex_matrix, 1 / page.w, 1 / page.h);
							mat3x3Translate(gl_tex_matrix, site.x, site.y);
							mat3x3Scale(gl_tex_matrix, site.w, site.h);
						}
					}
					else
					{
						mat3x3Identity(gl_tex_matrix);
					}

					vec4ApplyColor(gl_color, slot.color);

					gl.enable(gl.BLEND);
					switch (slot.blend)
					{
					default:
					case 'normal':
						gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
						break;
					case 'additive':
						gl.blendFunc(gl.ONE, gl.ONE);
						break;
					case 'multiply':
						gl.blendFunc(gl.DST_COLOR, gl.ZERO);
						break;
					case 'screen':
						gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR);
						break;
					}

					switch (attachment.type)
					{
					case 'region':
						mat3x3ApplySpace(gl_modelview, attachment.world_space);
						mat3x3Scale(gl_modelview, attachment.width/2, attachment.height/2);
						if (site)
						{
							mat3x3Scale(gl_modelview, 1 / site.original_w, 1 / site.original_h);
							mat3x3Translate(gl_modelview, site.offset_x, site.offset_y);
							mat3x3Scale(gl_modelview, site.w, site.h);
						}

						var gl_shader = gl_mesh_shader;
						var gl_vertex = gl_region_vertex;

						gl.useProgram(gl_shader.program);

						gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
						gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
						gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
						gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);

						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, gl_texture);
						gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.position.buffer);
						gl.vertexAttribPointer(gl_shader.attribs['aVertexPosition'], gl_vertex.position.size, gl_vertex.position.type, false, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.texcoord.buffer);
						gl.vertexAttribPointer(gl_shader.attribs['aVertexTexCoord'], gl_vertex.texcoord.size, gl_vertex.texcoord.type, false, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, null);

						gl.enableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
						gl.enableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);

						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
						gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

						gl.disableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
						gl.disableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);

						gl.bindTexture(gl.TEXTURE_2D, null);
						break;
					case 'mesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						var bone = pose.bones[slot.bone_key];
						mat3x3ApplySpace(gl_modelview, bone.world_space);
						if (site)
						{
							mat3x3Scale(gl_modelview, 1 / site.original_w, 1 / site.original_h);
							mat3x3Translate(gl_modelview, site.offset_x, site.offset_y);
							mat3x3Scale(gl_modelview, site.w, site.h);
						}
						
						var gl_shader = gl_mesh_shader;
						var gl_vertex = slot_info.gl_vertex;

						gl.useProgram(gl_shader.program);
						
						gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
						gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
						gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
						gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
						
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, gl_texture);
						gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.position.buffer);
						gl.vertexAttribPointer(gl_shader.attribs['aVertexPosition'], gl_vertex.position.size, gl_vertex.position.type, false, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.texcoord.buffer);
						gl.vertexAttribPointer(gl_shader.attribs['aVertexTexCoord'], gl_vertex.texcoord.size, gl_vertex.texcoord.type, false, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, null);

						gl.enableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
						gl.enableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);

						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
						gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

						gl.disableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
						gl.disableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);

						gl.bindTexture(gl.TEXTURE_2D, null);

						gl.useProgram(null);
						break;
					case 'skinnedmesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						// update skin shader modelview array
						var blend_bone_index_array = slot_info.blend_bone_index_array;
						for (var i = 0; i < blend_bone_index_array.length; ++i)
						{
							var bone_index = blend_bone_index_array[i];
							var bone_key = pose.bone_keys[bone_index];
							var bone = pose.bones[bone_key];
							if (i < gl_skin_shader_modelview_count)
							{
								var modelview = gl_skin_shader_modelview_array.subarray(i * 9, (i + 1) * 9);
								mat3x3Copy(modelview, gl_modelview);
								mat3x3ApplySpace(modelview, bone.world_space);
								if (site)
								{
									mat3x3Scale(gl_modelview, 1 / site.original_w, 1 / site.original_h);
									mat3x3Translate(gl_modelview, site.offset_x, site.offset_y);
									mat3x3Scale(gl_modelview, site.w, site.h);
								}
							}
						}
						var gl_shader = gl_skin_shader;
						var gl_vertex = slot_info.gl_vertex;

						gl.useProgram(gl_shader.program);
						
						gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
						gl.uniformMatrix3fv(gl_shader.uniforms['uModelviewArray[0]'], false, gl_skin_shader_modelview_array);
						gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
						gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
						
						gl.activeTexture(gl.TEXTURE0);
						gl.bindTexture(gl.TEXTURE_2D, gl_texture);
						gl.uniform1i(gl_shader.uniforms['uSampler'], 0);
						
						var position_stride = 16 * gl_skin_shader_position_count; // in bytes: sizeof(vec4) * count
						gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.position.buffer);
						for (var i = 0; i < gl_skin_shader_position_count; ++i)
						{
							var position_offset = 16 * i; // in bytes: sizeof(vec4) * i
							gl.vertexAttribPointer(gl_shader.attribs['aVertexPosition'+i], gl_vertex.position.size, gl_vertex.position.type, false, position_stride, position_offset);
						}
						
						gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.texcoord.buffer);
						gl.vertexAttribPointer(gl_shader.attribs['aVertexTexCoord'], gl_vertex.texcoord.size, gl_vertex.texcoord.type, false, 0, 0);

						gl.bindBuffer(gl.ARRAY_BUFFER, null);

						for (var i = 0; i < gl_skin_shader_position_count; ++i)
						{
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexPosition'+i]);
						}
						gl.enableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);
						
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
						gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
						gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);
						
						for (var i = 0; i < gl_skin_shader_position_count; ++i)
						{
							gl.disableVertexAttribArray(gl_shader.attribs['aVertexPosition'+i]);
						}
						gl.disableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);

						gl.bindTexture(gl.TEXTURE_2D, null);
						break;
					}
				}
			});
		}
		else if (ctx)
		{
			pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
			{
				if (!attachment) { return; }
				if (attachment.type === 'boundingbox') { return; }

				var image = null;
				var site = atlas && atlas.sites[attachment_key];
				if (site)
				{
					var page = atlas.pages[site.page];
					var image_key = page.name;
					image = images[image_key];
					if (image && image.complete)
					{
						page.w = page.w || image.width;
						page.h = page.h || image.height;
					}
				}
				else
				{
					var image_key = attachment_key;
					image = images[image_key];
				}

				if (image && image.complete)
				{
					ctx.save();

					switch (slot.blend)
					{
					default:
					case 'normal':
						ctx.globalCompositeOperation = 'source-over';
						break;
					case 'additive':
						ctx.globalCompositeOperation = 'lighter';
						break;
					case 'multiply':
						ctx.globalCompositeOperation = 'multiply';
						break;
					case 'screen':
						ctx.globalCompositeOperation = 'screen';
						break;
					}

					switch (attachment.type)
					{
					case 'region':
						applySpace(ctx, attachment.world_space);
						ctx.scale(attachment.width/2, attachment.height/2);
						drawImageMesh(ctx, region_vertex_triangle, region_vertex_position, region_vertex_texcoord, image, site);
						break;
					case 'mesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						var bone = pose.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						drawImageMesh(ctx, slot_info.vertex_triangle, slot_info.vertex_position, slot_info.vertex_texcoord, image, site);
						break;
					case 'skinnedmesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						drawImageMesh(ctx, slot_info.vertex_triangle, slot_info.vertex_blend_position, slot_info.vertex_texcoord, image, site);
						break;
					}

					ctx.restore();
				}
			});
		}

		if (render_debug_data)
		{
			if (ctx)
			{
				data.iterateAttachments(pose.skin_key, function (slot_key, slot, skin_slot, attachment_key, attachment)
				{
					if (!attachment) { return; }

					ctx.save();

					switch (attachment.type)
					{
					case 'region':
						var bone = data.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						applySpace(ctx, attachment.local_space);
						var w = attachment.width;
						var h = attachment.height;
						ctx.fillStyle = 'rgba(127,127,127,0.25)';
						ctx.fillRect(-w/2, -h/2, w, h);
						ctx.strokeStyle = 'rgba(127,127,127,1.0)';
						ctx.strokeRect(-w/2, -h/2, w, h);
						break;
					case 'boundingbox':
						var bone = data.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						ctx.beginPath();
						var x = 0;
						attachment.vertices.forEach(function (value, index)
						{
							if (index & 1) { ctx.lineTo(x, value); } else { x = value; }
						});
						ctx.closePath();
						ctx.strokeStyle = 'rgba(127,127,127,1.0)';
						ctx.stroke();
						break;
					case 'mesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						var bone = data.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						drawMesh(ctx, slot_info.vertex_triangle, slot_info.vertex_position, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
						break;
					case 'skinnedmesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						drawMesh(ctx, slot_info.vertex_triangle, slot_info.vertex_setup_position, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
						break;
					}

					ctx.restore();
				});

				data.iterateBones(function (bone_key, data_bone)
				{
					ctx.save();
					applySpace(ctx, data_bone.world_space);
					drawPoint(ctx);
					ctx.restore();
				});

				drawIkConstraints(ctx, data, data.bones);
			}
		}

		if (render_debug_pose)
		{
			if (ctx)
			{
				pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
				{
					if (!attachment) { return; }

					ctx.save();

					switch (attachment.type)
					{
					case 'region':
						applySpace(ctx, attachment.world_space);
						var w = attachment.width;
						var h = attachment.height;
						ctx.fillStyle = 'rgba(127,127,127,0.25)';
						ctx.fillRect(-w/2, -h/2, w, h);
						ctx.strokeStyle = 'rgba(127,127,127,1.0)';
						ctx.strokeRect(-w/2, -h/2, w, h);
						break;
					case 'boundingbox':
						var bone = pose.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						ctx.beginPath();
						var x = 0;
						attachment.vertices.forEach(function (value, index)
						{
							if (index & 1) { ctx.lineTo(x, value); } else { x = value; }
						});
						ctx.closePath();
						ctx.strokeStyle = 'rgba(127,127,127,1.0)';
						ctx.stroke();
						break;
					case 'mesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						var bone = pose.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						drawMesh(ctx, slot_info.vertex_triangle, slot_info.vertex_position, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
						break;
					case 'skinnedmesh':
						var skin_info = skin_info_map[pose.skin_key];
						var slot_info_map = skin_info.slot_info_map;
						var slot_info = slot_info_map[slot_key];
						drawMesh(ctx, slot_info.vertex_triangle, slot_info.vertex_blend_position, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
						break;
					}

					ctx.restore();
				});

				pose.iterateBones(function (bone_key, pose_bone)
				{
					ctx.save();
					applySpace(ctx, pose_bone.world_space);
					drawPoint(ctx);
					ctx.restore();
				});

				drawIkConstraints(ctx, data, pose.bones);
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

function applySpace (ctx, space)
{
	ctx.translate(space.position.x, space.position.y);
	ctx.rotate(space.rotation.rad);
	ctx.scale(space.scale.x, space.scale.y);
}

function drawCircle (ctx, color, scale)
{
	ctx.beginPath();
	ctx.arc(0, 0, 12*scale, 0, 2*Math.PI, false);
	ctx.strokeStyle = color;
	ctx.stroke();
}

function drawPoint (ctx, color, scale)
{
	scale = scale || 1;
	ctx.beginPath();
	ctx.arc(0, 0, 12*scale, 0, 2*Math.PI, false);
	ctx.strokeStyle = color || 'blue';
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(24*scale, 0);
	ctx.strokeStyle = 'red';
	ctx.stroke();
	ctx.beginPath();
	ctx.moveTo(0, 0);
	ctx.lineTo(0, 24*scale);
	ctx.strokeStyle = 'green';
	ctx.stroke();
}

function drawMesh(ctx, triangles, positions, stroke_style, fill_style)
{
	ctx.beginPath();
	var sx = 0, sy = 0;
	for (var index = 0; index < triangles.length; index++)
	{
		var value = triangles[index];
		var ix = value*2, iy = ix+1;
		var x = positions[ix];
		var y = positions[iy];
		if ((index % 3) === 0) { ctx.moveTo(x, y); sx = x; sy = y; } else { ctx.lineTo(x, y); }
		if ((index % 3) === 2) { ctx.lineTo(sx, sy); }
	};
	if (fill_style)
	{
		ctx.fillStyle = fill_style;
		ctx.fill();
	}
	ctx.strokeStyle = stroke_style || 'grey';
	ctx.stroke();
}

function drawImageMesh(ctx, triangles, positions, texcoords, image, site)
{
	if (site)
	{
		var tex_matrix = new Float32Array(9);
		var site_texcoord = new Float32Array(2);

		if (site.rotate)
		{
			mat3x3Identity(tex_matrix);
			mat3x3Translate(tex_matrix, site.x, site.y);
			mat3x3Scale(tex_matrix, site.h, site.w);
			mat3x3Translate(tex_matrix, 0, 1); // bottom-left corner
			mat3x3Rotate(tex_matrix, -Math.PI/2); // -90 degrees
		}
		else
		{
			mat3x3Identity(tex_matrix);
			mat3x3Translate(tex_matrix, site.x, site.y);
			mat3x3Scale(tex_matrix, site.w, site.h);
		}
	}

	/// http://www.irrlicht3d.org/pivot/entry.php?id=1329
	for (var i = 0; i < triangles.length; )
	{
		var triangle = triangles[i++]*2;
		var position = positions.subarray(triangle, triangle+2);
		var x0 = position[0], y0 = position[1];
		var texcoord = texcoords.subarray(triangle, triangle+2);
		if (site) { texcoord = mat3x3Transform(tex_matrix, texcoord, site_texcoord); }
		var u0 = texcoord[0], v0 = texcoord[1];

		var triangle = triangles[i++]*2;
		var position = positions.subarray(triangle, triangle+2);
		var x1 = position[0], y1 = position[1];
		var texcoord = texcoords.subarray(triangle, triangle+2);
		if (site) { texcoord = mat3x3Transform(tex_matrix, texcoord, site_texcoord); }
		var u1 = texcoord[0], v1 = texcoord[1];

		var triangle = triangles[i++]*2;
		var position = positions.subarray(triangle, triangle+2);
		var x2 = position[0], y2 = position[1];
		var texcoord = texcoords.subarray(triangle, triangle+2);
		if (site) { texcoord = mat3x3Transform(tex_matrix, texcoord, site_texcoord); }
		var u2 = texcoord[0], v2 = texcoord[1];

		ctx.save();
		ctx.beginPath();
		ctx.moveTo(x0, y0);
		ctx.lineTo(x1, y1);
		ctx.lineTo(x2, y2);
		ctx.closePath();
		ctx.clip();
		x1 -= x0; y1 -= y0;
		x2 -= x0; y2 -= y0; 
		u1 -= u0; v1 -= v0;
		u2 -= u0; v2 -= v0; 
		var id = 1 / (u1*v2 - u2*v1);
		var a = id * (v2*x1 - v1*x2);
		var b = id * (v2*y1 - v1*y2);
		var c = id * (u1*x2 - u2*x1);
		var d = id * (u1*y2 - u2*y1);
		var e = x0 - a*u0 - c*v0;
		var f = y0 - b*u0 - d*v0;
		ctx.transform(a, b, c, d, e, f);
		ctx.drawImage(image, 0, 0);
		ctx.restore();
	}
}

function drawIkConstraints (ctx, data, bones)
{
	data.ik_constraint_keys.forEach(function (ik_constraint_key)
	{
		var ik_constraint = data.ik_constraints[ik_constraint_key];
		var target = bones[ik_constraint.target_key];
		switch (ik_constraint.bone_keys.length)
		{
		case 1:
			var bone = bones[ik_constraint.bone_keys[0]];
			
			ctx.beginPath();
			ctx.moveTo(target.world_space.position.x, target.world_space.position.y);
			ctx.lineTo(bone.world_space.position.x, bone.world_space.position.y);
			ctx.strokeStyle = 'yellow';
			ctx.stroke();

			ctx.save();
			applySpace(ctx, target.world_space);
			drawCircle(ctx, 'yellow', 1.5);
			ctx.restore();
			
			ctx.save();
			applySpace(ctx, bone.world_space);
			drawCircle(ctx, 'yellow', 0.5);
			ctx.restore();
			break;
		case 2:
			var parent = bones[ik_constraint.bone_keys[0]];
			var child = bones[ik_constraint.bone_keys[1]];
			
			ctx.beginPath();
			ctx.moveTo(target.world_space.position.x, target.world_space.position.y);
			ctx.lineTo(child.world_space.position.x, child.world_space.position.y);
			ctx.lineTo(parent.world_space.position.x, parent.world_space.position.y);
			ctx.strokeStyle = 'yellow';
			ctx.stroke();
			
			ctx.save();
			applySpace(ctx, target.world_space);
			drawCircle(ctx, 'yellow', 1.5);
			ctx.restore();
			
			ctx.save();
			applySpace(ctx, child.world_space);
			drawCircle(ctx, 'yellow', 0.75);
			ctx.restore();
			
			ctx.save();
			applySpace(ctx, parent.world_space);
			drawCircle(ctx, 'yellow', 0.5);
			ctx.restore();
			break;
		}
	});
}

function vec4Identity (v)
{
	v[0] = v[1] = v[2] = v[3] = 1.0;
	return v;
}

function vec4ApplyColor (v, color)
{
	v[0] = color.r;
	v[1] = color.g;
	v[2] = color.b;
	v[3] = color.a;
	return v;
}

function mat3x3Identity (m)
{
	m[1] = m[2] = m[3] = 
	m[5] = m[6] = m[7] = 0.0;
	m[0] = m[4] = m[8] = 1.0;
	return m;
}

function mat3x3Copy (m, other)
{
	m.set(other);
	return m;
}

function mat3x3Ortho (m, l, r, b, t)
{
	var lr = 1 / (l - r);
	var bt = 1 / (b - t);
	m[0] *= -2 * lr;
	m[4] *= -2 * bt;
	m[6] += (l + r) * lr;
	m[7] += (t + b) * bt;
	return m;
}

function mat3x3Translate (m, x, y)
{
	m[6] += m[0] * x + m[3] * y;
	m[7] += m[1] * x + m[4] * y;
	return m;
}

function mat3x3Rotate (m, angle)
{
	var c = Math.cos(angle);
	var s = Math.sin(angle);
	var m0 = m[0], m1 = m[1];
	var m3 = m[3], m4 = m[4];
	m[0] = m0 * c + m3 * s;
	m[1] = m1 * c + m4 * s;
	m[3] = m3 * c - m0 * s;
	m[4] = m4 * c - m1 * s;
	return m;
}

function mat3x3Scale (m, x, y)
{
	m[0] *= x; m[1] *= x; m[2] *= x;
	m[3] *= y; m[4] *= y; m[5] *= y;
	return m;
}

function mat3x3Transform (m, v, out)
{
	var x = m[0]*v[0] + m[3]*v[1] + m[6];
	var y = m[1]*v[0] + m[4]*v[1] + m[7];
	var w = m[2]*v[0] + m[5]*v[1] + m[8];
	out[0] = x / w;
	out[1] = y / w;
	return out;
}

function mat3x3ApplySpace (m, space)
{
	mat3x3Translate(m, space.position.x, space.position.y);
	mat3x3Rotate(m, space.rotation.rad);
	mat3x3Scale(m, space.scale.x, space.scale.y);
	return m;
}

function glCompileShader (gl, src, type)
{
	var shader = gl.createShader(type);
	gl.shaderSource(shader, src.join('\n'));
	gl.compileShader(shader);
	if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS))
	{
		src.forEach(function (line, index) { console.log(index + 1, line); });
		console.log(gl.getShaderInfoLog(shader));
		gl.deleteShader(shader);
		shader = null;
	}
	return shader;
}

function glLinkProgram (gl, vs, fs)
{
	var program = gl.createProgram();
	gl.attachShader(program, vs);
	gl.attachShader(program, fs);
	gl.linkProgram(program);
	if (!gl.getProgramParameter(program, gl.LINK_STATUS))
	{
		console.log("could not link shader program");
		gl.detachShader(program, vs);
		gl.detachShader(program, fs);
		gl.deleteProgram(program);
		program = null;
	}
	return program;
}

function glGetUniforms (gl, program, uniforms)
{
	var count = /** @type {number} */ (gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS));
	for (var i = 0; i < count; ++i)
	{
		var uniform = gl.getActiveUniform(program, i);
		uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
	}
	return uniforms;
}

function glGetAttribs (gl, program, attribs)
{
	var count = /** @type {number} */ (gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES));
	for (var i = 0; i < count; ++i)
	{
		var attrib = gl.getActiveAttrib(program, i);
		attribs[attrib.name] = gl.getAttribLocation(program, attrib.name);
	}
	return attribs;
}

function glMakeShader (gl, vs_src, fs_src)
{
	var shader = {};
	shader.vs_src = vs_src;
	shader.fs_src = fs_src;
	shader.vs = glCompileShader(gl, shader.vs_src, gl.VERTEX_SHADER);
	shader.fs = glCompileShader(gl, shader.fs_src, gl.FRAGMENT_SHADER);
	shader.program = glLinkProgram(gl, shader.vs, shader.fs);
	shader.uniforms = glGetUniforms(gl, shader.program, {});
	shader.attribs = glGetAttribs(gl, shader.program, {});
	return shader;
}

function glMakeVertex (gl, type_array, size, buffer_type, buffer_draw)
{
	var vertex = {};
	if (type_array instanceof Float32Array) { vertex.type = gl.FLOAT; }
	else if (type_array instanceof Int8Array) { vertex.type = gl.CHAR; }
	else if (type_array instanceof Uint8Array) { vertex.type = gl.UNSIGNED_CHAR; }
	else if (type_array instanceof Int16Array) { vertex.type = gl.SHORT; }
	else if (type_array instanceof Uint16Array) { vertex.type = gl.UNSIGNED_SHORT; }
	else if (type_array instanceof Int32Array) { vertex.type = gl.INT; }
	else if (type_array instanceof Uint32Array) { vertex.type = gl.UNSIGNED_INT; }
	else { throw new Error(); }
	vertex.size = size;
	vertex.count = type_array.length / vertex.size;
	vertex.type_array = type_array;
	vertex.buffer = gl.createBuffer();
	vertex.buffer_type = buffer_type;
	vertex.buffer_draw = buffer_draw;
	gl.bindBuffer(vertex.buffer_type, vertex.buffer);
	gl.bufferData(vertex.buffer_type, vertex.type_array, vertex.buffer_draw);
	return vertex;
}
