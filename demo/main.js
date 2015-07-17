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
	canvas.style.width = canvas.width + 'px';
	canvas.style.height = canvas.height + 'px';
	
	document.body.appendChild(canvas);

	window.addEventListener('resize', function ()
	{
		canvas.width = window.innerWidth;
		canvas.height = window.innerHeight;
		canvas.style.width = canvas.width + 'px';
		canvas.style.height = canvas.height + 'px';
	});

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

	var anim_time = 0;
	var anim_repeat = 2;

	var bone_info_map = {};
	// setup_space 
	// blend_space
	var skin_info_map = {};
	// setup_positions
	// setup_blend_arrays
	// blend_positions
	// debug_blend_positions

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

		skin_info_map = {};

		var skin = pose.curSkin();

		skin.iterateAttachments(function (slot_key, skin_slot, attachment_key, attachment)
		{
			switch (attachment.type)
			{
			case 'skinnedmesh':
				var skin_info = skin_info_map[attachment_key] = {};
				var setup_positions = skin_info.setup_positions = [];
				var setup_blend_arrays = skin_info.setup_blend_arrays = [];
				var blend_positions = skin_info.blend_positions = [];
				var debug_blend_positions = skin_info.debug_blend_positions = [];
				var position = new spine.Vector();
				var setup_position = new spine.Vector();
				var bone_blend_position = new spine.Vector();
				for (var i = 0; i < attachment.vertices.length; )
				{
					var blend_count = attachment.vertices[i++];
					setup_position.x = 0;
					setup_position.y = 0;
					var blend_array = [];
					for (var j = 0; j < blend_count; ++j)
					{
						var bone_index = attachment.vertices[i++];
						position.x = attachment.vertices[i++];
						position.y = attachment.vertices[i++];
						var weight = attachment.vertices[i++];
						var bone_key = data.bone_keys[bone_index];
						var bone = data.bones[bone_key];
						var bone_blend_space = bone.world_space;
						spine.Space.transform(bone_blend_space, position, bone_blend_position);
						setup_position.x += bone_blend_position.x * weight;
						setup_position.y += bone_blend_position.y * weight;
						blend_array.push({ bone_index: bone_index, weight: weight });
					}
					// sort the blends descending by weight
					blend_array = blend_array.sort(function (a, b) { return b.weight - a.weight; });
					setup_positions.push(setup_position.x, setup_position.y);
					setup_blend_arrays.push(blend_array);
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
				atlas.pages.forEach(function (page)
				{
					var image_key = page.name;
					var dir_path = file_atlas_url.slice(0, file_atlas_url.lastIndexOf('/'));
					var image_url = dir_path + "/" + image_key;
					images[image_key] = images[image_key] || loadImage(image_url, function (err, image) {});
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
						images[image_key] = images[image_key] || loadImage(image_url, function (err, image) {});
						break;
					}
				});
			}
		});
	});

	var loop = function (time)
	{
		requestAnimationFrame(loop);

		var ctx = canvas.getContext('2d');

		ctx.setTransform(1, 0, 0, 1, 0, 0);

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// origin at center, x right, y up
		ctx.translate(ctx.canvas.width/2, ctx.canvas.height/2); ctx.scale(1, -1);

		ctx.translate(-camera_x, -camera_y);
		ctx.scale(camera_zoom, camera_zoom);
		ctx.lineWidth = 1 / camera_zoom;

		var dt = 1000 / 60; // ms

		var rate = 1;		

		pose.update(dt * rate);

		anim_time += dt * rate;

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
				var skin_info = skin_info_map[attachment_key];
				var setup_positions = skin_info.setup_positions;
				var setup_blend_arrays = skin_info.setup_blend_arrays;
				var blend_positions = skin_info.blend_positions;
				blend_positions.length = 0;
				var setup_position = new spine.Vector();
				var blend_position = new spine.Vector();
				var bone_blend_position = new spine.Vector();
				setup_blend_arrays.forEach(function (blend_array, index)
				{
					setup_position.x = setup_positions[index*2];
					setup_position.y = setup_positions[index*2+1];
					blend_position.x = 0;
					blend_position.y = 0;
					blend_array.forEach(function (blend)
					{
						var bone_index = blend.bone_index;
						var weight = blend.weight;
						var bone_key = pose.bone_keys[bone_index];
						var bone_info = bone_info_map[bone_key];
						var bone_blend_space = bone_info.blend_space;
						spine.Space.transform(bone_blend_space, setup_position, bone_blend_position);
						blend_position.x += bone_blend_position.x * weight;
						blend_position.y += bone_blend_position.y * weight;
					});
					blend_positions.push(blend_position.x, blend_position.y);
				});

				if (render_debug_pose)
				{
					var skin_info = skin_info_map[attachment_key];
					var debug_blend_positions = skin_info.debug_blend_positions;
					debug_blend_positions.length = 0;
					var position = new spine.Vector();
					var blend_position = new spine.Vector();
					var bone_blend_position = new spine.Vector();
					for (var i = 0; i < attachment.vertices.length; )
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
							var bone_blend_space = bone.world_space;
							spine.Space.transform(bone_blend_space, position, bone_blend_position);
							blend_position.x += bone_blend_position.x * weight;
							blend_position.y += bone_blend_position.y * weight;
						}
						debug_blend_positions.push(blend_position.x, blend_position.y);
					}
				}
				break;
			}
		});

		if (render_debug_data)
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
					applySpace(ctx, attachment.space);
					var w = attachment.width;
					var h = attachment.height;
					//ctx.fillStyle = 'rgba(127,127,127,0.25)';
					//ctx.fillRect(-w/2, -h/2, w, h);
					ctx.strokeStyle = 'rgba(127,127,127,1.0)';
					ctx.strokeRect(-w/2, -h/2, w, h);
					break;
				case 'boundingbox':
					var bone = data.bones[slot.bone_key];
					if (bone) { applySpace(ctx, bone.world_space); }
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
					var bone = data.bones[slot.bone_key];
					applySpace(ctx, bone.world_space);
					drawMesh(ctx, attachment.triangles, attachment.vertices, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
					break;
				case 'skinnedmesh':
					var skin_info = skin_info_map[attachment_key];
					drawMesh(ctx, attachment.triangles, skin_info.setup_positions, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
					break;
				}

				ctx.restore();
			});

			data.iterateBones(function (bone_key, data_bone)
			{
				ctx.save();
				applySpace(ctx, data_bone.world_space);
				drawPoint(ctx, 'blue', 1);
				ctx.restore();
			});

			drawIkConstraints(ctx, data, data.bones);
		}

		if (render_debug_pose)
		{
			pose.iterateAttachments(function (slot_key, slot, skin_slot, attachment_key, attachment)
			{
				if (!attachment) { return; }

				ctx.save();

				switch (attachment.type)
				{
				case 'region':
					var bone = pose.bones[slot.bone_key];
					applySpace(ctx, bone.world_space);
					applySpace(ctx, attachment.space);
					var w = attachment.width;
					var h = attachment.height;
					//ctx.fillStyle = 'rgba(127,127,127,0.25)';
					//ctx.fillRect(-w/2, -h/2, w, h);
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
					var skin_info = skin_info_map[attachment_key];
					drawMesh(ctx, attachment.triangles, skin_info.blend_positions, 'rgba(127,127,127,1.0)', 'rgba(127,127,127,0.25)');
					drawMesh(ctx, attachment.triangles, skin_info.debug_blend_positions, 'rgba(127,0,127,1.0)', 'rgba(127,0,127,0.25)');
					break;
				}

				ctx.restore();
			});

			pose.iterateBones(function (bone_key, pose_bone)
			{
				ctx.save();
				applySpace(ctx, pose_bone.world_space);
				drawPoint(ctx, 'blue', 1);
				ctx.restore();
			});

			drawIkConstraints(ctx, data, pose.bones);
		}
		else
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
						var bone = pose.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						applySpace(ctx, attachment.space);
						var w = attachment.width;
						var h = attachment.height;
						ctx.scale(1, -1); ctx.drawImage(image, tx, ty, tw, th, -w/2, -h/2, w, h);
						break;
					case 'mesh':
						var bone = pose.bones[slot.bone_key];
						applySpace(ctx, bone.world_space);
						drawImageMesh(ctx, attachment.triangles, attachment.vertices, attachment.uvs, image, tx, ty, tw, th);
						break;
					case 'skinnedmesh':
						var skin_info = skin_info_map[attachment_key];
						drawImageMesh(ctx, attachment.triangles, skin_info.blend_positions, attachment.uvs, image, tx, ty, tw, th);
						break;
					}

					ctx.restore();
				}
			});
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
	ctx.beginPath();
	ctx.arc(0, 0, 12*scale, 0, 2*Math.PI, false);
	ctx.strokeStyle = color;
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
	triangles.forEach(function (value, index)
	{
		var ix = value*2, iy = ix+1;
		var x = positions[ix];
		var y = positions[iy];
		if ((index % 3) === 0) { ctx.moveTo(x, y); sx = x; sy = y; } else { ctx.lineTo(x, y); }
		if ((index % 3) === 2) { ctx.lineTo(sx, sy); }
	});
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
