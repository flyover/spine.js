goog.provide('renderWebGL');

/**
 * @constructor
 * @param {WebGLRenderingContext} gl
 */
renderWebGL = function (gl)
{
	var render = this;
	render.gl = gl;
	if (!gl) { return; }
	render.bone_info_map = {};
	render.skin_info_map = {};
	render.gl_textures = {};
	render.gl_projection = mat4x4Identity(new Float32Array(16));
	render.gl_modelview = mat3x3Identity(new Float32Array(9));
	render.gl_tex_matrix = mat3x3Identity(new Float32Array(9));
	render.gl_color = vec4Identity(new Float32Array(4));
	var gl_mesh_shader_vs_src =
	[
		"precision mediump int;",
		"precision mediump float;",
		"uniform mat4 uProjection;",
		"uniform mat3 uModelview;",
		"uniform mat3 uTexMatrix;",
		"attribute vec2 aVertexPosition;", // [ x, y ]
		"attribute vec2 aVertexTexCoord;", // [ u, v ]
		"varying vec3 vTexCoord;",
		"void main(void) {",
		" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
		" gl_Position = uProjection * vec4(uModelview * vec3(aVertexPosition, 1.0), 1.0);",
		"}"
	];
	var gl_ffd_mesh_shader_vs_src =
	[
		"precision mediump int;",
		"precision mediump float;",
		"uniform mat4 uProjection;",
		"uniform mat3 uModelview;",
		"uniform mat3 uTexMatrix;",
		"uniform float uMorphWeight;",
		"attribute vec2 aVertexPosition;", // [ x, y ]
		"attribute vec2 aVertexTexCoord;", // [ u, v ]
		"attribute vec2 aVertexMorph0Position;", // [ dx, dy ]
		"attribute vec2 aVertexMorph1Position;", // [ dx, dy ]
		"varying vec3 vTexCoord;",
		"void main(void) {",
		" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
		" gl_Position = uProjection * vec4(uModelview * vec3(aVertexPosition + mix(aVertexMorph0Position, aVertexMorph1Position, uMorphWeight), 1.0), 1.0);",
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
	render.gl_mesh_shader = glMakeShader(gl, gl_mesh_shader_vs_src, gl_mesh_shader_fs_src);
	render.gl_ffd_mesh_shader = glMakeShader(gl, gl_ffd_mesh_shader_vs_src, gl_mesh_shader_fs_src);
	render.gl_region_vertex = {};
	render.gl_region_vertex.position = glMakeVertex(gl, new Float32Array([ -1, -1,  1, -1,  1,  1, -1,  1 ]), 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // [ x, y ]
	render.gl_region_vertex.texcoord = glMakeVertex(gl, new Float32Array([  0,  1,  1,  1,  1,  0,  0,  0 ]), 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW); // [ u, v ]
	render.gl_skin_shader_modelview_count = 16; // * mat3
	render.gl_skin_shader_modelview_array = new Float32Array(9 * render.gl_skin_shader_modelview_count);
	render.gl_skin_shader_blenders_count = 8; // * vec2
	function repeat (format, count)
	{
		var array = [];
		for (var index = 0; index < count; ++index)
		{
			array.push(format.replace(/{index}/g, index));
		}
		return array;
	}
	var gl_skin_shader_vs_src =
	[
		"precision mediump int;",
		"precision mediump float;",
		"uniform mat4 uProjection;",
		"uniform mat3 uModelviewArray[" + render.gl_skin_shader_modelview_count + "];",
		"uniform mat3 uTexMatrix;",
		"attribute vec2 aVertexPosition;", // [ x, y ]
		repeat("attribute vec2 aVertexBlenders{index};", render.gl_skin_shader_blenders_count), // [ i, w ]
		"attribute vec2 aVertexTexCoord;", // [ u, v ]
		"varying vec3 vTexCoord;",
		"void main(void) {",
		" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
		" vec3 position = vec3(aVertexPosition, 1.0);",
		" vec3 blendPosition = vec3(0.0);",
		repeat(" blendPosition += (uModelviewArray[int(aVertexBlenders{index}.x)] * position) * aVertexBlenders{index}.y;", render.gl_skin_shader_blenders_count),
		" gl_Position = uProjection * vec4(blendPosition, 1.0);",
		"}"
	];
	var gl_ffd_skin_shader_vs_src =
	[
		"precision mediump int;",
		"precision mediump float;",
		"uniform mat4 uProjection;",
		"uniform mat3 uModelviewArray[" + render.gl_skin_shader_modelview_count + "];",
		"uniform mat3 uTexMatrix;",
		"uniform float uMorphWeight;",
		"attribute vec2 aVertexPosition;", // [ x, y ]
		repeat("attribute vec2 aVertexBlenders{index};", render.gl_skin_shader_blenders_count), // [ i, w ]
		"attribute vec2 aVertexTexCoord;", // [ u, v ]
		"attribute vec2 aVertexMorph0Position;", // [ dx, dy ]
		"attribute vec2 aVertexMorph1Position;", // [ dx, dy ]
		"varying vec3 vTexCoord;",
		"void main(void) {",
		" vTexCoord = uTexMatrix * vec3(aVertexTexCoord, 1.0);",
		" vec3 position = vec3(aVertexPosition + mix(aVertexMorph0Position, aVertexMorph1Position, uMorphWeight), 1.0);",
		" vec3 blendPosition = vec3(0.0);",
		repeat(" blendPosition += (uModelviewArray[int(aVertexBlenders{index}.x)] * position) * aVertexBlenders{index}.y;", render.gl_skin_shader_blenders_count),
		" gl_Position = uProjection * vec4(blendPosition, 1.0);",
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
	render.gl_skin_shader = glMakeShader(gl, gl_skin_shader_vs_src, gl_skin_shader_fs_src);
	render.gl_ffd_skin_shader = glMakeShader(gl, gl_ffd_skin_shader_vs_src, gl_skin_shader_fs_src);
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 */
renderWebGL.prototype.dropPose = function (spine_pose, atlas_data)
{
	var render = this;
	var gl = render.gl;
	if (!gl) { return; }

	for (var image_key in render.gl_textures)
	{
		var gl_texture = render.gl_textures[image_key];
		gl.deleteTexture(gl_texture); gl_texture = null;
		delete render.gl_textures[image_key];
	}

	render.gl_textures = {};

	for (var bone_key in render.bone_info_map)
	{
		var bone_info = render.bone_info_map[bone_key];
	}

	render.bone_info_map = {};

	for (var skin_key in render.skin_info_map)
	{
		var skin_info = render.skin_info_map[skin_key];
		var slot_info_map = skin_info.slot_info_map;
		for (var slot_key in slot_info_map)
		{
			var slot_info = slot_info_map[slot_key];
			var attachment_info_map = slot_info.attachment_info_map;
			for (var attachment_key in attachment_info_map)
			{
				var attachment_info = attachment_info_map[attachment_key];

				switch (attachment_info.type)
				{
				case 'mesh':
					var gl_vertex = attachment_info.gl_vertex;
					gl.deleteBuffer(gl_vertex.position.buffer);
					gl.deleteBuffer(gl_vertex.texcoord.buffer);
					gl.deleteBuffer(gl_vertex.triangle.buffer);
					for (var anim_key in attachment_info.anim_ffd_attachments)
					{
						var anim_ffd_attachment = attachment_info.anim_ffd_attachments[anim_key];
						anim_ffd_attachment.ffd_keyframes.forEach(function (ffd_keyframe)
						{
							gl.deleteBuffer(ffd_keyframe.gl_vertex.buffer);
						});
					}
					break;
				case 'skinnedmesh':
					var gl_vertex = attachment_info.gl_vertex;
					gl.deleteBuffer(gl_vertex.position.buffer);
					gl.deleteBuffer(gl_vertex.blenders.buffer);
					gl.deleteBuffer(gl_vertex.texcoord.buffer);
					gl.deleteBuffer(gl_vertex.triangle.buffer);
					for (var anim_key in attachment_info.anim_ffd_attachments)
					{
						var anim_ffd_attachment = attachment_info.anim_ffd_attachments[anim_key];
						anim_ffd_attachment.ffd_keyframes.forEach(function (ffd_keyframe)
						{
							gl.deleteBuffer(ffd_keyframe.gl_vertex.buffer);
						});
					}
					break;
				default:
					console.log("TODO", skin_key, slot_key, attachment_key, attachment_info.type);
					break;
				}
			}
		}
	}

	render.skin_info_map = {};
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 * @param {Object.<string,HTMLImageElement>} images
 */
renderWebGL.prototype.loadPose = function (spine_pose, atlas_data, images)
{
	var render = this;
	var gl = render.gl;
	if (!gl) { return; }

	spine_pose.data.iterateBones(function (bone_key, bone)
	{
		var bone_info = render.bone_info_map[bone_key] = {};
		bone_info.setup_space = spine.Space.invert(bone.world_space, new spine.Space());
	});

	spine_pose.data.iterateSkins(function (skin_key, skin)
	{
		var skin_info = render.skin_info_map[skin_key] = {};
		var slot_info_map = skin_info.slot_info_map = {};

		skin.iterateAttachments(function (slot_key, skin_slot, attachment_key, attachment)
		{
			if (!attachment) { return; }

			switch (attachment.type)
			{
			case 'mesh':
				var slot_info = slot_info_map[slot_key] = slot_info_map[slot_key] || {};
				var attachment_info_map = slot_info.attachment_info_map = slot_info.attachment_info_map || {};
				var attachment_info = attachment_info_map[attachment_key] = {};
				attachment_info.type = attachment.type;
				var vertex_count = attachment.vertices.length / 2;
				var vertex_position = new Float32Array(attachment.vertices);
				var vertex_texcoord = new Float32Array(attachment.uvs);
				var vertex_triangle = new Uint16Array(attachment.triangles);
				var gl_vertex = attachment_info.gl_vertex = {};
				gl_vertex.position = glMakeVertex(gl, vertex_position, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
				gl_vertex.texcoord = glMakeVertex(gl, vertex_texcoord, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
				gl_vertex.triangle = glMakeVertex(gl, vertex_triangle, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
				var anim_ffd_attachments = attachment_info.anim_ffd_attachments = {};
				spine_pose.data.iterateAnims(function (anim_key, anim)
				{
					var anim_ffd = anim.ffds && anim.ffds[skin_key];
					var ffd_slot = anim_ffd && anim_ffd.ffd_slots[slot_key];
					var ffd_attachment = ffd_slot && ffd_slot.ffd_attachments[attachment_key];
					if (ffd_attachment)
					{
						var anim_ffd_attachment = anim_ffd_attachments[anim_key] = {};
						var anim_ffd_keyframes = anim_ffd_attachment.ffd_keyframes = [];
						ffd_attachment.ffd_keyframes.forEach(function (ffd_keyframe, ffd_keyframe_index)
						{
							var anim_ffd_keyframe = anim_ffd_keyframes[ffd_keyframe_index] = {};
							var vertex = new Float32Array(2 * vertex_count);
							vertex.subarray(ffd_keyframe.offset, ffd_keyframe.offset + ffd_keyframe.vertices.length).set(new Float32Array(ffd_keyframe.vertices));
							anim_ffd_keyframe.gl_vertex = glMakeVertex(gl, vertex, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
						});
					}
				});
				break;
			case 'skinnedmesh':
				var slot_info = slot_info_map[slot_key] = slot_info_map[slot_key] || {};
				var attachment_info_map = slot_info.attachment_info_map = slot_info.attachment_info_map || {};
				var attachment_info = attachment_info_map[attachment_key] = {};
				attachment_info.type = attachment.type;
				var vertex_count = attachment.uvs.length / 2;
				var vertex_position = new Float32Array(2 * vertex_count); // [ x, y ]
				var vertex_blenders = new Float32Array(2 * render.gl_skin_shader_blenders_count * vertex_count); // [ i, w ]
				var vertex_texcoord = new Float32Array(attachment.uvs);
				var vertex_triangle = new Uint16Array(attachment.triangles);
				var blend_bone_index_array = attachment_info.blend_bone_index_array = [];
				for (var vertex_index = 0, index = 0; vertex_index < vertex_count; ++vertex_index)
				{
					var blender_count = attachment.vertices[index++];
					var blender_array = [];
					for (var blender_index = 0; blender_index < blender_count; ++blender_index)
					{
						var bone_index = attachment.vertices[index++];
						var x = attachment.vertices[index++];
						var y = attachment.vertices[index++];
						var weight = attachment.vertices[index++];
						blender_array.push({ position: new spine.Vector(x, y), bone_index: bone_index, weight: weight });
					}

					// sort the blender array descending by weight
					blender_array = blender_array.sort(function (a, b) { return b.weight - a.weight; });

					// clamp blender array and adjust weights
					if (blender_array.length > render.gl_skin_shader_blenders_count)
					{
						console.log("blend array length for", attachment_key, "is", blender_array.length, "so clamp to", render.gl_skin_shader_blenders_count);
						blender_array.length = render.gl_skin_shader_blenders_count;
						var weight_sum = 0;
						blender_array.forEach(function (blend) { weight_sum += blend.weight; });
						blender_array.forEach(function (blend) { blend.weight /= weight_sum; });
					}

					var position_x = 0;
					var position_y = 0;
					var blend_position = new spine.Vector();
					var vertex_blenders_offset = vertex_index * 2 * render.gl_skin_shader_blenders_count;
					blender_array.forEach(function (blend, index)
					{
						// keep track of which bones are used for blending
						if (blend_bone_index_array.indexOf(blend.bone_index) === -1)
						{
							blend_bone_index_array.push(blend.bone_index);
						}
						var bone_key = spine_pose.data.bone_keys[blend.bone_index];
						var bone = spine_pose.data.bones[bone_key];
						spine.Space.transform(bone.world_space, blend.position, blend_position);
						position_x += blend_position.x * blend.weight;
						position_y += blend_position.y * blend.weight;
						// index into gl_skin_shader_modelview_array, not spine_pose.data.bone_keys
						vertex_blenders[vertex_blenders_offset++] = blend_bone_index_array.indexOf(blend.bone_index);
						vertex_blenders[vertex_blenders_offset++] = blend.weight;
					});
					var vertex_position_offset = vertex_index * 2;
					vertex_position[vertex_position_offset++] = position_x;
					vertex_position[vertex_position_offset++] = position_y;

					if (blend_bone_index_array.length > render.gl_skin_shader_modelview_count)
					{
						console.log("blend bone index array length for", attachmentPkey, "is", blend_bone_index_array.length, "greater than", render.gl_skin_shader_modelview_count);
					}
				}
				var gl_vertex = attachment_info.gl_vertex = {};
				gl_vertex.position = glMakeVertex(gl, vertex_position, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
				gl_vertex.blenders = glMakeVertex(gl, vertex_blenders, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
				gl_vertex.texcoord = glMakeVertex(gl, vertex_texcoord, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
				gl_vertex.triangle = glMakeVertex(gl, vertex_triangle, 1, gl.ELEMENT_ARRAY_BUFFER, gl.STATIC_DRAW);
				var anim_ffd_attachments = attachment_info.anim_ffd_attachments = {};
				spine_pose.data.iterateAnims(function (anim_key, anim)
				{
					var anim_ffd = anim.ffds && anim.ffds[skin_key];
					var ffd_slot = anim_ffd && anim_ffd.ffd_slots[slot_key];
					var ffd_attachment = ffd_slot && ffd_slot.ffd_attachments[attachment_key];
					if (ffd_attachment)
					{
						var anim_ffd_attachment = anim_ffd_attachments[anim_key] = {};
						var anim_ffd_keyframes = anim_ffd_attachment.ffd_keyframes = [];
						ffd_attachment.ffd_keyframes.forEach(function (ffd_keyframe, ffd_keyframe_index)
						{
							var anim_ffd_keyframe = anim_ffd_keyframes[ffd_keyframe_index] = {};
							var vertex = new Float32Array(2 * vertex_count);
							for (var vertex_index = 0, index = 0, ffd_index = 0; vertex_index < vertex_count; ++vertex_index)
							{
								var blender_count = attachment.vertices[index++];
								var vertex_x = 0;
								var vertex_y = 0;
								for (var blender_index = 0; blender_index < blender_count; ++blender_index)
								{
									var bone_index = attachment.vertices[index++];
									var x = attachment.vertices[index++];
									var y = attachment.vertices[index++];
									var weight = attachment.vertices[index++];
									var morph_position_x = ffd_keyframe.vertices[ffd_index - ffd_keyframe.offset] || 0; ++ffd_index;
									var morph_position_y = ffd_keyframe.vertices[ffd_index - ffd_keyframe.offset] || 0; ++ffd_index;
									vertex_x += morph_position_x * weight;
									vertex_y += morph_position_y * weight;
								}
								var vertex_offset = vertex_index * 2;
								vertex[vertex_offset++] = vertex_x;
								vertex[vertex_offset++] = vertex_y;
							}
							anim_ffd_keyframe.gl_vertex = glMakeVertex(gl, vertex, 2, gl.ARRAY_BUFFER, gl.STATIC_DRAW);
						});
					}
				});
				break;
			}
		});
	});

	if (atlas_data)
	{
		// load atlas page images
		atlas_data.pages.forEach(function (page)
		{
			if (page.format !== 'RGBA8888')
			{
				throw new Error(page.format);
			}

			var gl_min_filter = gl.NONE;
			switch (page.min_filter)
			{
			case 'Nearest': gl_min_filter = gl.NEAREST; break;
			default: case 'Linear': gl_min_filter = gl.LINEAR; break;
			case 'MipMapNearestNearest': gl_min_filter = gl.NEAREST_MIPMAP_NEAREST; break;
			case 'MipMapLinearNearest': gl_min_filter = gl.LINEAR_MIPMAP_NEAREST; break;
			case 'MipMapNearestLinear': gl_min_filter = gl.NEAREST_MIPMAP_LINEAR; break;
			case 'MipMapLinearLinear': gl_min_filter = gl.LINEAR_MIPMAP_LINEAR; break;
			}

			var gl_mag_filter = gl.NONE;
			switch (page.mag_filter)
			{
			case 'Nearest': gl_mag_filter = gl.NEAREST; break;
			default: case 'Linear': gl_mag_filter = gl.LINEAR; break;
			}

			var gl_wrap_s = gl.NONE;
			switch (page.wrap_s)
			{
			case 'Repeat': gl_wrap_s = gl.REPEAT; break;
			default: case 'ClampToEdge': gl_wrap_s = gl.CLAMP_TO_EDGE; break;
			case 'MirroredRepeat': gl_wrap_s = gl.MIRRORED_REPEAT; break;
			}

			var gl_wrap_t = gl.NONE;
			switch (page.wrap_t)
			{
			case 'Repeat': gl_wrap_t = gl.REPEAT; break;
			default: case 'ClampToEdge': gl_wrap_t = gl.CLAMP_TO_EDGE; break;
			case 'MirroredRepeat': gl_wrap_t = gl.MIRRORED_REPEAT; break;
			}

			var image_key = page.name;
			var image = images[image_key];
			var gl_texture = render.gl_textures[image_key] = gl.createTexture();
			gl.bindTexture(gl.TEXTURE_2D, gl_texture);
			gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
			gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl_min_filter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl_mag_filter);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl_wrap_s);
			gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl_wrap_t);
		});
	}
	else
	{
		// load attachment images
		spine_pose.data.iterateSkins(function (skin_key, skin)
		{
			skin.iterateAttachments(function (slot_key, skin_slot, attachment_key, attachment)
			{
				if (!attachment) { return; }

				switch (attachment.type)
				{
				case 'region':
				case 'mesh':
				case 'skinnedmesh':
					var image_key = attachment_key;
					var image = images[image_key];
					var gl_texture = render.gl_textures[image_key] = gl.createTexture();
					gl.bindTexture(gl.TEXTURE_2D, gl_texture);
					gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
					gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
					gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
					break;
				}
			});
		});
	}
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 */
renderWebGL.prototype.drawPose = function (spine_pose, atlas_data)
{
	var render = this;
	var gl = render.gl;
	if (!gl) { return; }

	var gl_projection = render.gl_projection;
	var gl_modelview = render.gl_modelview;
	var gl_tex_matrix = render.gl_tex_matrix;
	var gl_color = render.gl_color;

	spine_pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
	{
		if (!attachment) { return; }
		if (attachment.type === 'boundingbox') { return; }

		var site = atlas_data && atlas_data.sites[attachment_key];
		var page = site && site.page;
		var image_key = (page && page.name) || attachment_key;
		var gl_texture = render.gl_textures[image_key];

		if (!gl_texture) { return; }

		mat3x3Identity(gl_modelview);
		mat3x3Identity(gl_tex_matrix);
		mat3x3ApplyAtlasPageTexcoord(gl_tex_matrix, page);
		mat3x3ApplyAtlasSiteTexcoord(gl_tex_matrix, site);

		vec4CopyColor(gl_color, slot.color);

		gl.enable(gl.BLEND);
		switch (slot.blend)
		{
		default:
		case 'normal': gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); break;
		case 'additive': gl.blendFunc(gl.SRC_ALPHA, gl.ONE); break;
		case 'multiply': gl.blendFunc(gl.DST_COLOR, gl.ONE_MINUS_SRC_ALPHA); break;
		case 'screen': gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_COLOR); break;
		}

		switch (attachment.type)
		{
		case 'region':
			var bone = spine_pose.bones[slot.bone_key];
			mat3x3ApplySpace(gl_modelview, bone.world_space);
			mat3x3ApplySpace(gl_modelview, attachment.local_space);
			mat3x3Scale(gl_modelview, attachment.width/2, attachment.height/2);
			mat3x3ApplyAtlasSitePosition(gl_modelview, site);

			var gl_shader = render.gl_mesh_shader;
			var gl_vertex = render.gl_region_vertex;

			gl.useProgram(gl_shader.program);

			gl.uniformMatrix4fv(gl_shader.uniforms['uProjection'], false, gl_projection);
			gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
			gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
			gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);

			gl.activeTexture(gl.TEXTURE0);
			gl.bindTexture(gl.TEXTURE_2D, gl_texture);
			gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

			glSetupAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
			glSetupAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

			gl.drawArrays(gl.TRIANGLE_FAN, 0, gl_vertex.position.count);

			glResetAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
			glResetAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

			gl.bindTexture(gl.TEXTURE_2D, null);

			gl.useProgram(null);
			break;
		case 'mesh':
			var skin_info = render.skin_info_map[spine_pose.skin_key], default_skin_info = render.skin_info_map['default'];
			var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
			var attachment_info = slot_info.attachment_info_map[attachment_key];
			var bone = spine_pose.bones[slot.bone_key];
			mat3x3ApplySpace(gl_modelview, bone.world_space);
			mat3x3ApplyAtlasSitePosition(gl_modelview, site);

			var anim = spine_pose.data.anims[spine_pose.anim_key];
			var anim_ffd = anim && anim.ffds && anim.ffds[spine_pose.skin_key];
			var ffd_slot = anim_ffd && anim_ffd.ffd_slots[slot_key];
			var ffd_attachment = ffd_slot && ffd_slot.ffd_attachments[attachment_key];
			var ffd_keyframes = ffd_attachment && ffd_attachment.ffd_keyframes;
			var ffd_keyframe0_index = spine.Keyframe.find(ffd_keyframes, spine_pose.time);
			if (ffd_keyframe0_index !== -1)
			{
				// ffd

				var pct = 0;
				var ffd_keyframe0 = ffd_keyframes[ffd_keyframe0_index];
				var ffd_keyframe1_index = ffd_keyframe0_index + 1;
				var ffd_keyframe1 = ffd_keyframes[ffd_keyframe1_index];
				if (ffd_keyframe1)
				{
					pct = ffd_keyframe0.curve.evaluate((spine_pose.time - ffd_keyframe0.time) / (ffd_keyframe1.time - ffd_keyframe0.time));
				}
				else
				{
					ffd_keyframe1_index = ffd_keyframe0_index;
					ffd_keyframe1 = ffd_keyframes[ffd_keyframe1_index];
				}

				var anim_ffd_attachment = attachment_info.anim_ffd_attachments[spine_pose.anim_key];
				var anim_ffd_keyframe0 = anim_ffd_attachment.ffd_keyframes[ffd_keyframe0_index];
				var anim_ffd_keyframe1 = anim_ffd_attachment.ffd_keyframes[ffd_keyframe1_index];

				var gl_shader = render.gl_ffd_mesh_shader;
				var gl_vertex = attachment_info.gl_vertex;

				gl.useProgram(gl_shader.program);

				gl.uniformMatrix4fv(gl_shader.uniforms['uProjection'], false, gl_projection);
				gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
				gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
				gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
				gl.uniform1f(gl_shader.uniforms['uMorphWeight'], pct);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, gl_texture);
				gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

				glSetupAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glSetupAttribute(gl, gl_shader, 'aVertexMorph0Position', anim_ffd_keyframe0.gl_vertex);
				glSetupAttribute(gl, gl_shader, 'aVertexMorph1Position', anim_ffd_keyframe1.gl_vertex);
				glSetupAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
				gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

				glResetAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glResetAttribute(gl, gl_shader, 'aVertexMorph0Position', anim_ffd_keyframe0.gl_vertex);
				glResetAttribute(gl, gl_shader, 'aVertexMorph1Position', anim_ffd_keyframe1.gl_vertex);
				glResetAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindTexture(gl.TEXTURE_2D, null);

				gl.useProgram(null);
			}
			else
			{
				// no ffd

				var gl_shader = render.gl_mesh_shader;
				var gl_vertex = attachment_info.gl_vertex;

				gl.useProgram(gl_shader.program);

				gl.uniformMatrix4fv(gl_shader.uniforms['uProjection'], false, gl_projection);
				gl.uniformMatrix3fv(gl_shader.uniforms['uModelview'], false, gl_modelview);
				gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
				gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, gl_texture);
				gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

				glSetupAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glSetupAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
				gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

				glResetAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glResetAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindTexture(gl.TEXTURE_2D, null);

				gl.useProgram(null);
			}
			break;
		case 'skinnedmesh':
			var skin_info = render.skin_info_map[spine_pose.skin_key], default_skin_info = render.skin_info_map['default'];
			var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
			var attachment_info = slot_info.attachment_info_map[attachment_key];
			// update skin shader modelview array
			var blend_bone_index_array = attachment_info.blend_bone_index_array;
			for (var index = 0; index < blend_bone_index_array.length; ++index)
			{
				var bone_index = blend_bone_index_array[index];
				var bone_key = spine_pose.bone_keys[bone_index];
				var bone = spine_pose.bones[bone_key];
				var bone_info = render.bone_info_map[bone_key];
				if (index < render.gl_skin_shader_modelview_count)
				{
					var modelview = render.gl_skin_shader_modelview_array.subarray(index * 9, (index + 1) * 9);
					mat3x3Copy(modelview, gl_modelview);
					mat3x3ApplySpace(modelview, bone.world_space);
					mat3x3ApplySpace(modelview, bone_info.setup_space);
					mat3x3ApplyAtlasSitePosition(modelview, site);
				}
			}

			var anim = spine_pose.data.anims[spine_pose.anim_key];
			var anim_ffd = anim && anim.ffds && anim.ffds[spine_pose.skin_key];
			var ffd_slot = anim_ffd && anim_ffd.ffd_slots[slot_key];
			var ffd_attachment = ffd_slot && ffd_slot.ffd_attachments[attachment_key];
			var ffd_keyframes = ffd_attachment && ffd_attachment.ffd_keyframes;
			var ffd_keyframe0_index = spine.Keyframe.find(ffd_keyframes, spine_pose.time);
			if (ffd_keyframe0_index !== -1)
			{
				// ffd

				var pct = 0;
				var ffd_keyframe0 = ffd_keyframes[ffd_keyframe0_index];
				var ffd_keyframe1_index = ffd_keyframe0_index + 1;
				var ffd_keyframe1 = ffd_keyframes[ffd_keyframe1_index];
				if (ffd_keyframe1)
				{
					pct = ffd_keyframe0.curve.evaluate((spine_pose.time - ffd_keyframe0.time) / (ffd_keyframe1.time - ffd_keyframe0.time));
				}
				else
				{
					ffd_keyframe1_index = ffd_keyframe0_index;
					ffd_keyframe1 = ffd_keyframes[ffd_keyframe1_index];
				}

				var anim_ffd_attachment = attachment_info.anim_ffd_attachments[spine_pose.anim_key];
				var anim_ffd_keyframe0 = anim_ffd_attachment.ffd_keyframes[ffd_keyframe0_index];
				var anim_ffd_keyframe1 = anim_ffd_attachment.ffd_keyframes[ffd_keyframe1_index];

				var gl_shader = render.gl_ffd_skin_shader;
				var gl_vertex = attachment_info.gl_vertex;

				gl.useProgram(gl_shader.program);

				gl.uniformMatrix4fv(gl_shader.uniforms['uProjection'], false, gl_projection);
				gl.uniformMatrix3fv(gl_shader.uniforms['uModelviewArray[0]'], false, render.gl_skin_shader_modelview_array);
				gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
				gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);
				gl.uniform1f(gl_shader.uniforms['uMorphWeight'], pct);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, gl_texture);
				gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

				glSetupAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glSetupAttribute(gl, gl_shader, 'aVertexBlenders{index}', gl_vertex.blenders, render.gl_skin_shader_blenders_count);
				glSetupAttribute(gl, gl_shader, 'aVertexMorph0Position', anim_ffd_keyframe0.gl_vertex);
				glSetupAttribute(gl, gl_shader, 'aVertexMorph1Position', anim_ffd_keyframe1.gl_vertex);
				glSetupAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
				gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

				glResetAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glResetAttribute(gl, gl_shader, 'aVertexBlenders{index}', gl_vertex.blenders, render.gl_skin_shader_blenders_count);
				glResetAttribute(gl, gl_shader, 'aVertexMorph0Position', anim_ffd_keyframe0.gl_vertex);
				glResetAttribute(gl, gl_shader, 'aVertexMorph1Position', anim_ffd_keyframe1.gl_vertex);
				glResetAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindTexture(gl.TEXTURE_2D, null);

				gl.useProgram(null);
			}
			else
			{
				// no ffd

				var gl_shader = render.gl_skin_shader;
				var gl_vertex = attachment_info.gl_vertex;

				gl.useProgram(gl_shader.program);

				gl.uniformMatrix4fv(gl_shader.uniforms['uProjection'], false, gl_projection);
				gl.uniformMatrix3fv(gl_shader.uniforms['uModelviewArray[0]'], false, render.gl_skin_shader_modelview_array);
				gl.uniformMatrix3fv(gl_shader.uniforms['uTexMatrix'], false, gl_tex_matrix);
				gl.uniform4fv(gl_shader.uniforms['uColor'], gl_color);

				gl.activeTexture(gl.TEXTURE0);
				gl.bindTexture(gl.TEXTURE_2D, gl_texture);
				gl.uniform1i(gl_shader.uniforms['uSampler'], 0);

				glSetupAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glSetupAttribute(gl, gl_shader, 'aVertexBlenders{index}', gl_vertex.blenders, render.gl_skin_shader_blenders_count);
				glSetupAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl_vertex.triangle.buffer);
				gl.drawElements(gl.TRIANGLES, gl_vertex.triangle.count, gl_vertex.triangle.type, 0);
				gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, null);

				glResetAttribute(gl, gl_shader, 'aVertexPosition', gl_vertex.position);
				glResetAttribute(gl, gl_shader, 'aVertexBlenders{index}', gl_vertex.blenders, render.gl_skin_shader_blenders_count);
				glResetAttribute(gl, gl_shader, 'aVertexTexCoord', gl_vertex.texcoord);

				gl.bindTexture(gl.TEXTURE_2D, null);

				gl.useProgram(null);
			}
			break;
		}
	});
}

function vec4Identity (v)
{
	v[0] = v[1] = v[2] = v[3] = 1.0;
	return v;
}

function vec4CopyColor (v, color)
{
	v[0] = color.r;
	v[1] = color.g;
	v[2] = color.b;
	v[3] = color.a;
	return v;
}

function vec4ApplyColor (v, color)
{
	v[0] *= color.r;
	v[1] *= color.g;
	v[2] *= color.b;
	v[3] *= color.a;
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

function mat3x3RotateCosSin (m, c, s)
{
	var m0 = m[0], m1 = m[1];
	var m3 = m[3], m4 = m[4];
	m[0] = m0 * c + m3 * s;
	m[1] = m1 * c + m4 * s;
	m[3] = m3 * c - m0 * s;
	m[4] = m4 * c - m1 * s;
	return m;
}

function mat3x3Rotate (m, angle)
{
	return mat3x3RotateCosSin(m, Math.cos(angle), Math.sin(angle));
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
	var iw = (w)?(1/w):(1);
	out[0] = x * iw;
	out[1] = y * iw;
	return out;
}

function mat3x3ApplySpace (m, space)
{
	if (space)
	{
		mat3x3Translate(m, space.position.x, space.position.y);
		mat3x3Rotate(m, space.rotation.rad * space.flip.x * space.flip.y);
		mat3x3Scale(m, space.scale.x * space.flip.x, space.scale.y * space.flip.y);
	}
	return m;
}

function mat3x3ApplyAtlasPageTexcoord (m, page)
{
	if (page)
	{
		mat3x3Scale(m, 1 / page.w, 1 / page.h);
	}
	return m;
}

function mat3x3ApplyAtlasSiteTexcoord (m, site)
{
	if (site)
	{
		mat3x3Translate(m, site.x, site.y);
		if (site.rotate === -1)
		{
			mat3x3Translate(m, 0, site.w); // bottom-left corner
			mat3x3RotateCosSin(m, 0, -1); // -90 degrees
		}
		else if (site.rotate === 1)
		{
			mat3x3Translate(m, site.h, 0); // top-right corner
			mat3x3RotateCosSin(m, 0, 1); // 90 degrees
		}
		mat3x3Scale(m, site.w, site.h);
	}
	return m;
}

function mat3x3ApplyAtlasSitePosition (m, site)
{
	if (site)
	{
		mat3x3Scale(m, 1 / site.original_w, 1 / site.original_h);
		mat3x3Translate(m, 2*site.offset_x - (site.original_w - site.w), (site.original_h - site.h) - 2*site.offset_y);
		mat3x3Scale(m, site.w, site.h);
	}
	return m;
}

function mat4x4Identity (m)
{
	m[1] = m[2] = m[3] = m[4] = 
	m[6] = m[7] = m[8] = m[9] = 
	m[11] = m[12] = m[13] = m[14] = 0.0;
	m[0] = m[5] = m[10] = m[15] = 1.0;
	return m;
}

function mat4x4Copy (m, other)
{
	m.set(other);
	return m;
}

function mat4x4Ortho(m, l, r, b, t, n, f)
{
	var lr = 1 / (l - r);
	var bt = 1 / (b - t);
	var nf = 1 / (n - f);
	m[ 0] = -2 * lr;
	m[ 5] = -2 * bt;
	m[10] = 2 * nf;
	m[12] = (l + r) * lr;
	m[13] = (t + b) * bt;
	m[14] = (f + n) * nf;
	return m;
}

function mat4x4Translate (m, x, y, z)
{
	z = z || 0;
	m[12] += m[0] * x + m[4] * y + m[ 8] * z;
	m[13] += m[1] * x + m[5] * y + m[ 9] * z;
	m[14] += m[2] * x + m[6] * y + m[10] * z;
	m[15] += m[3] * x + m[7] * y + m[11] * z;
	return m;
}

function mat4x4RotateCosSinZ (m, c, s)
{
	var a_x = m[0], a_y = m[1], a_z = m[2], a_w = m[3];
	var b_x = m[4], b_y = m[5], b_z = m[6], b_w = m[7];
	m[0] = a_x * c + b_x * s;
	m[1] = a_y * c + b_y * s;
	m[2] = a_z * c + b_z * s;
	m[3] = a_w * c + b_w * s;
	m[4] = b_x * c - a_x * s;
	m[5] = b_y * c - a_y * s;
	m[6] = b_z * c - a_z * s;
	m[7] = b_w * c - a_w * s;
	return m;
}

function mat4x4RotateZ (m, angle)
{
	return mat4x4RotateCosSinZ(m, Math.cos(angle), Math.sin(angle));
}

function mat4x4Scale (m, x, y, z)
{
	z = z || 1;
	m[0] *= x; m[1] *= x; m[ 2] *= x; m[ 3] *= x;
	m[4] *= y; m[5] *= y; m[ 6] *= y; m[ 7] *= y;
	m[8] *= z; m[9] *= z; m[10] *= z; m[11] *= z;
	return m;
}

function glCompileShader (gl, src, type)
{
	function flatten (array, out)
	{
		out = out || [];
		array.forEach(function (value)
		{
			if (Array.isArray(value)) { flatten(value, out); } else { out.push(value); }
		});
		return out;
	}
	src = flatten(src);
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
	for (var index = 0; index < count; ++index)
	{
		var uniform = gl.getActiveUniform(program, index);
		uniforms[uniform.name] = gl.getUniformLocation(program, uniform.name);
	}
	return uniforms;
}

function glGetAttribs (gl, program, attribs)
{
	var count = /** @type {number} */ (gl.getProgramParameter(program, gl.ACTIVE_ATTRIBUTES));
	for (var index = 0; index < count; ++index)
	{
		var attrib = gl.getActiveAttrib(program, index);
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
	else if (type_array instanceof Int8Array) { vertex.type = gl.BYTE; }
	else if (type_array instanceof Uint8Array) { vertex.type = gl.UNSIGNED_BYTE; }
	else if (type_array instanceof Int16Array) { vertex.type = gl.SHORT; }
	else if (type_array instanceof Uint16Array) { vertex.type = gl.UNSIGNED_SHORT; }
	else if (type_array instanceof Int32Array) { vertex.type = gl.INT; }
	else if (type_array instanceof Uint32Array) { vertex.type = gl.UNSIGNED_INT; }
	else { vertex.type = gl.NONE; throw new Error(); }
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

function glSetupAttribute(gl, shader, format, vertex, count)
{
	count = count || 0;
	gl.bindBuffer(vertex.buffer_type, vertex.buffer);
	if (count > 0)
	{
		var sizeof_vertex = vertex.type_array.BYTES_PER_ELEMENT * vertex.size; // in bytes
		var stride = sizeof_vertex * count;
		for (var index = 0; index < count; ++index)
		{
			var offset = sizeof_vertex * index;
			var attrib = shader.attribs[format.replace(/{index}/g, index)];
			gl.vertexAttribPointer(attrib, vertex.size, vertex.type, false, stride, offset);
			gl.enableVertexAttribArray(attrib);
		}
	}
	else
	{
		var attrib = shader.attribs[format];
		gl.vertexAttribPointer(attrib, vertex.size, vertex.type, false, 0, 0);
		gl.enableVertexAttribArray(attrib);
	}
}

function glResetAttribute(gl, shader, format, vertex, count)
{
	count = count || 0;
	if (count > 0)
	{
		for (var index = 0; index < count; ++index)
		{
			var attrib = shader.attribs[format.replace(/{index}/g, index)];
			gl.disableVertexAttribArray(attrib);
		}
	}
	else
	{
		var attrib = shader.attribs[format];
		gl.disableVertexAttribArray(attrib);
	}
}
