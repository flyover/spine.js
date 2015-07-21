goog.provide('main');

main.start = function ()
{
	document.body.style.margin = '0px';
	document.body.style.border = '0px';
	document.body.style.padding = '0px';
	document.body.style.overflow = 'hidden';

	var canvas = document.createElement('canvas');
	canvas.width = window.innerWidth;
	canvas.height = window.innerHeight;
	canvas.style.position = 'absolute';
	canvas.style.width = canvas.width + 'px';
	canvas.style.height = canvas.height + 'px';
	
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
	canvas_gl.style.zIndex = -1; // behind 2D context canvas

	document.body.appendChild(canvas_gl);

	var gl = canvas_gl.getContext('webgl') || canvas_gl.getContext('experimental-webgl');

	window.addEventListener('resize', function ()
	{
		canvas_gl.width = window.innerWidth;
		canvas_gl.height = window.innerHeight;
		canvas_gl.style.width = canvas_gl.width + 'px';
		canvas_gl.style.height = canvas_gl.height + 'px';
	});

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
		gl_region_vertex.position = glMakeVertex(gl, new Float32Array([ -1, -1, 1, -1, 1, 1, -1, 1 ]), 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
		gl_region_vertex.texcoord = glMakeVertex(gl, new Float32Array([ 0, 1, 1, 1, 1, 0, 0, 0 ]), 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
		gl_region_vertex.triangle = glMakeVertex(gl, new Uint16Array([ 0, 1, 2, 0, 2, 3 ]), 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
	}

	var camera_x = 0;
	var camera_y = canvas.height/2;
	var camera_zoom = 0.5;

	var render_debug_data = false;
	var render_debug_pose = false;

	canvas.addEventListener('click', function () { render_debug_pose = !render_debug_pose; }, false);

	var data = new spine.Data();
	var pose = new spine.Pose(data);
	var atlas = null;
	var images = {};
	var gl_textures = {};

	var anim_time = 0;
	var anim_rate = 1;
	var anim_repeat = 2;

	var bone_info_map = {};
	// setup_space 
	// blend_space
	var attachment_info_map = {};
	// setup_positions
	// blend_positions

	//var file_path = "spineboy/";
	//var file_json_url = file_path + "export/spineboy.json";
	//var file_atlas_url = "";

	var file_path = "raptor/";
	var file_json_url = file_path + "export/raptor.json";
	var file_atlas_url = file_path + "export/raptor.atlas";

	loadText(file_json_url, function (err, json_text)
	{
		var json = JSON.parse(json_text);
	
		data.load(json);
	
		pose.setSkin(data.skin_keys[0]);
	
		pose.setAnim(data.anim_keys[0]);

		bone_info_map = {};

		data.iterateBones(function (bone_key, data_bone)
		{
			var bone_info = bone_info_map[bone_key] = {};
			bone_info.setup_space = spine.Space.invert(data_bone.world_space, new spine.Space());
			bone_info.blend_space = new spine.Space();
		});

		attachment_info_map = {};

		var skin = pose.curSkin();

		skin.iterateAttachments(function (slot_key, skin_slot, attachment_key, attachment)
		{
			switch (attachment.type)
			{
			case 'mesh':
				var attachment_info = attachment_info_map[attachment_key] = {};
				var positions = attachment_info.positions = new Float32Array(attachment.vertices);
				var texcoords = attachment_info.texcoords = new Float32Array(attachment.uvs);
				var triangles = attachment_info.triangles = new Uint16Array(attachment.triangles);
				if (gl)
				{
					var gl_vertex = attachment_info.gl_vertex = {};
					gl_vertex.position = glMakeVertex(gl, positions, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
					gl_vertex.texcoord = glMakeVertex(gl, texcoords, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
					gl_vertex.triangle = glMakeVertex(gl, triangles, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
				}
				break;
			case 'skinnedmesh':
				var attachment_info = attachment_info_map[attachment_key] = {};
				var setup_positions = attachment_info.setup_positions = new Float32Array(attachment.uvs.length);
				var blend_positions = attachment_info.blend_positions = new Float32Array(attachment.uvs.length);
				var texcoords = attachment_info.texcoords = new Float32Array(attachment.uvs);
				var triangles = attachment_info.triangles = new Uint16Array(attachment.triangles);
				var position = new spine.Vector();
				var setup_position = new spine.Vector();
				for (var i = 0, position_i = 0; i < attachment.vertices.length; )
				{
					var blend_count = attachment.vertices[i++];
					setup_position.x = 0;
					setup_position.y = 0;
					for (var j = 0; j < blend_count; ++j)
					{
						var bone_index = attachment.vertices[i++];
						position.x = attachment.vertices[i++];
						position.y = attachment.vertices[i++];
						var weight = attachment.vertices[i++];
						var bone_key = data.bone_keys[bone_index];
						var bone = data.bones[bone_key];
						spine.Space.transform(bone.world_space, position, position);
						setup_position.x += position.x * weight;
						setup_position.y += position.y * weight;
					}
					setup_positions[position_i++] = setup_position.x;
					setup_positions[position_i++] = setup_position.y;
				}
				if (gl)
				{
					var gl_vertex = attachment_info.gl_vertex = {};
					gl_vertex.setup_position = glMakeVertex(gl, setup_positions, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
					gl_vertex.blend_position = glMakeVertex(gl, blend_positions, 2, gl.ARRAY_BUFFER, gl.DYNAMIC_DRAW);
					gl_vertex.texcoord = glMakeVertex(gl, texcoords, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
					gl_vertex.triangle = glMakeVertex(gl, triangles, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
				}
				break;
			}
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
				skin.iterateAttachments(function (slot_key, skin_slot, attachment_key, attachment)
				{
					switch (attachment.type)
					{
					case 'region':
					case 'mesh':
					case 'skinnedmesh':
						var image_key = attachment_key;
						var image_url = file_path + data.skeleton.images + image_key + ".png";
						images[image_key] = images[image_key] || loadImage(image_url, function (err, image)
						{
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
			}
		});
	});

	var prev_time = 0;

	var loop = function (time)
	{
		requestAnimationFrame(loop);

		var dt = time - (prev_time || time); prev_time = time; // ms

		pose.update(dt * anim_rate);

		anim_time += dt * anim_rate;

		var anim_key = pose.getAnim();
		var anim = data.anims[anim_key];
		if (anim && (anim_time >= (anim.length * anim_repeat)))
		{
			var anim_key = data.anim_keys[(data.anim_keys.indexOf(anim_key) + 1) % data.anim_keys.length];
			pose.setAnim(anim_key);
			pose.setTime(0);
			anim_time = 0;
		}

		pose.strike();

		//pose.events.forEach(function (event) { console.log(event.name, event.int_value, event.float_value, event.string_value); });

		/// update bones

		pose.iterateBones(function (bone_key, pose_bone)
		{
			var bone_info = bone_info_map[bone_key];
			spine.Space.combine(pose_bone.world_space, bone_info.setup_space, bone_info.blend_space);
		});

		/// update attachments

		pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
		{
			if (!attachment) { return; }

			switch (attachment.type)
			{
			case 'region':
				break;
			case 'boundingbox':
				break;
			case 'mesh':
				break;
			case 'skinnedmesh':
				var attachment_info = attachment_info_map[attachment_key];
				var blend_positions = attachment_info.blend_positions;
				var position = new spine.Vector();
				var blend_position = new spine.Vector();
				for (var i = 0, blend_position_i = 0; i < attachment.vertices.length; )
				{
					var blend_count = attachment.vertices[i++];
					blend_position.x = 0;
					blend_position.y = 0;
					for (var j = 0; j < blend_count; ++j)
					{
						var bone_index = attachment.vertices[i++];
						position.x = attachment.vertices[i++];
						position.y = attachment.vertices[i++];
						var weight = attachment.vertices[i++];
						var bone_key = pose.bone_keys[bone_index];
						var bone = pose.bones[bone_key];
						spine.Space.transform(bone.world_space, position, position);
						blend_position.x += position.x * weight;
						blend_position.y += position.y * weight;
					}
					blend_positions[blend_position_i++] = blend_position.x;
					blend_positions[blend_position_i++] = blend_position.y;
				}
				if (gl)
				{
					var gl_vertex = attachment_info.gl_vertex;
					gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.blend_position.buffer);
					gl.bufferData(gl.ARRAY_BUFFER, gl_vertex.blend_position.type_array, gl.DYNAMIC_DRAW);
				}
				break;
			}
		});

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
						applySpace(ctx, attachment.world_space);
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
						var attachment_info = attachment_info_map[attachment_key];
						var bone = data.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						drawMesh(ctx, attachment_info.triangles, attachment_info.positions, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
						break;
					case 'skinnedmesh':
						var attachment_info = attachment_info_map[attachment_key];
						drawMesh(ctx, attachment_info.triangles, attachment_info.setup_positions, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
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
						var bone = pose.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						drawMesh(ctx, attachment.triangles, attachment.vertices, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
						break;
					case 'skinnedmesh':
						var attachment_info = attachment_info_map[attachment_key];
						drawMesh(ctx, attachment_info.triangles, attachment_info.blend_positions, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
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
		else
		{
			if (gl)
			{
				pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
				{
					if (!attachment) { return; }
					if (attachment.type === 'boundingbox') { return; }

					var image = null;
					var w = 0, h = 0;
					var tx = 0, tw = 0;
					var ty = 0, th = 0;
					var gl_texture = null;
					if (atlas)
					{
						var site = atlas.sites[attachment_key];
						var page = atlas.pages[site.page];
						var image_key = page.name;
						image = images[image_key];
						w = page.w; h = page.h;
						tx = site.x; tw = site.w;
						ty = site.y; th = site.h;
						gl_texture = gl_textures[image_key];
					}
					else
					{
						var image_key = attachment_key;
						image = images[image_key];
						if (image && image.complete)
						{
							w = tw = image.width;
							h = th = image.height;
						}
						gl_texture = gl_textures[image_key];
					}

					if (image && image.complete && gl_texture)
					{
						mat3x3Identity(gl_modelview);

						mat3x3Identity(gl_tex_matrix);
						mat3x3Scale(gl_tex_matrix, 1 / w, 1 / h);
						mat3x3Translate(gl_tex_matrix, tx, ty);
						mat3x3Scale(gl_tex_matrix, tw, th);

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
							var gl_shader = gl_mesh_shader;
							gl.useProgram(gl_shader.program);
							gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
							gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
							gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
							gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
							gl.activeTexture(gl.TEXTURE0);
							gl.bindTexture(gl.TEXTURE_2D, gl_texture);
							gl.uniform1i(gl_shader.uniforms['uSampler'], 0);
							var gl_vertex = gl_region_vertex;
							gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.position.buffer);
							gl.vertexAttribPointer(gl_shader.attribs['aVertexPosition'], gl_vertex.position.size, gl_vertex.position.type, false, 0, 0);
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
							gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.texcoord.buffer);
							gl.vertexAttribPointer(gl_shader.attribs['aVertexTexCoord'], gl_vertex.texcoord.size, gl_vertex.texcoord.type, false, 0, 0);
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);
							gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
							gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
							break;
						case 'mesh':
							var attachment_info = attachment_info_map[attachment_key];
							var bone = pose.bones[slot.bone_key];
							mat3x3ApplySpace(gl_modelview, bone.world_space);
							var gl_shader = gl_mesh_shader;
							gl.useProgram(gl_shader.program);
							gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
							gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
							gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
							gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
							gl.activeTexture(gl.TEXTURE0);
							gl.bindTexture(gl.TEXTURE_2D, gl_texture);
							gl.uniform1i(gl_shader.uniforms['uSampler'], 0);
							var gl_vertex = attachment_info.gl_vertex;
							gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.position.buffer);
							gl.vertexAttribPointer(gl_shader.attribs['aVertexPosition'], gl_vertex.position.size, gl_vertex.position.type, false, 0, 0);
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
							gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.texcoord.buffer);
							gl.vertexAttribPointer(gl_shader.attribs['aVertexTexCoord'], gl_vertex.texcoord.size, gl_vertex.texcoord.type, false, 0, 0);
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);
							gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
							gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
							break;
						case 'skinnedmesh':
							var attachment_info = attachment_info_map[attachment_key];
							var gl_shader = gl_mesh_shader;
							gl.useProgram(gl_shader.program);
							gl.uniformMatrix3fv(gl_shader.uniforms['uProjection'], false, gl_projection);
							gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
							gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
							gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
							gl.activeTexture(gl.TEXTURE0);
							gl.bindTexture(gl.TEXTURE_2D, gl_texture);
							gl.uniform1i(gl_shader.uniforms['uSampler'], 0);
							var gl_vertex = attachment_info.gl_vertex;
							gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.blend_position.buffer);
							gl.vertexAttribPointer(gl_shader.attribs['aVertexPosition'], gl_vertex.blend_position.size, gl_vertex.blend_position.type, false, 0, 0);
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexPosition']);
							gl.bindBuffer(gl.ARRAY_BUFFER, gl_vertex.texcoord.buffer);
							gl.vertexAttribPointer(gl_shader.attribs['aVertexTexCoord'], gl_vertex.texcoord.size, gl_vertex.texcoord.type, false, 0, 0);
							gl.enableVertexAttribArray(gl_shader.attribs['aVertexTexCoord']);
							gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
							gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
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
					var tx = 0, tw = 0;
					var ty = 0, th = 0;
					if (atlas)
					{
						var site = atlas.sites[attachment_key];
						var page = atlas.pages[site.page];
						var image_key = page.name;
						image = images[image_key];
						tx = site.x; tw = site.w;
						ty = site.y; th = site.h;
					}
					else
					{
						var image_key = attachment_key;
						image = images[image_key];
						if (image && image.complete)
						{
							tw = image.width;
							th = image.height;
						}
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
							var w = attachment.width;
							var h = attachment.height;
							ctx.scale(1, -1); ctx.drawImage(image, tx, ty, tw, th, -w/2, -h/2, w, h);
							break;
						case 'mesh':
							var attachment_info = attachment_info_map[attachment_key];
							var bone = pose.bones[slot.bone_key];
							applySpace(ctx, bone.world_space);
							drawImageMesh(ctx, attachment_info.triangles, attachment_info.positions, attachment_info.texcoords, image, tx, ty, tw, th);
							break;
						case 'skinnedmesh':
							var attachment_info = attachment_info_map[attachment_key];
							drawImageMesh(ctx, attachment_info.triangles, attachment_info.blend_positions, attachment_info.texcoords, image, tx, ty, tw, th);
							break;
						}

						ctx.restore();
					}
				});
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
		req.addEventListener('load', function (event) { callback(null, req.response); }, false);
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

function drawImageMesh(ctx, triangles, positions, texcoords, image, tx, ty, tw, th)
{
	/// http://www.irrlicht3d.org/pivot/entry.php?id=1329
	for (var i = 0; i < triangles.length; )
	{
		var i0 = triangles[i++], ix0 = i0*2, iy0 = ix0+1;
		var i1 = triangles[i++], ix1 = i1*2, iy1 = ix1+1;
		var i2 = triangles[i++], ix2 = i2*2, iy2 = ix2+1;
		var x0 = positions[ix0], y0 = positions[iy0];
		var x1 = positions[ix1], y1 = positions[iy1];
		var x2 = positions[ix2], y2 = positions[iy2];
		var u0 = texcoords[ix0] * tw + tx, v0 = texcoords[iy0] * th + ty;
		var u1 = texcoords[ix1] * tw + tx, v1 = texcoords[iy1] * th + ty;
		var u2 = texcoords[ix2] * tw + tx, v2 = texcoords[iy2] * th + ty;
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
		console.log(src);
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
	gl.bindBuffer(buffer_type, vertex.buffer);
	gl.bufferData(buffer_type, vertex.type_array, buffer_draw);
	return vertex;
}
