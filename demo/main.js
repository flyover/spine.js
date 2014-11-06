var loadText = function (url, callback)
{
	var req = new XMLHttpRequest();
	req.open("GET", url, true);
	req.responseType = 'text';
	req.addEventListener('error', function (event) {}, false);
	req.addEventListener('abort', function (event) {}, false);
	req.addEventListener('load', function (event) { callback(req.response); }, false);
	req.send();
	return req;
}

var loadImage = function (url, callback)
{
	var image = new Image();
	image.addEventListener('error', function (event) {}, false);
	image.addEventListener('abort', function (event) {}, false);
	image.addEventListener('load', function (event) { callback(image); }, false);
	image.src = url;
	return image;	
}

goog.provide('main');

main.start = function ()
{
	var spine_data = new spine.data();
	var spine_pose = new spine.pose(spine_data);
	var images = {};

	loadText("spineboy/export/spineboy.json", function (text)
	{
		var spine_json = JSON.parse(text);
	
		spine_data.load(spine_json);
	
		var skin_keys = []; for (skin_key in spine_pose.getSkins()) { skin_keys.push(skin_key); }
		spine_pose.setSkin(skin_keys[0]);
	
		var anim_keys = []; for (anim_key in spine_pose.getAnims()) { anim_keys.push(anim_key); }
		spine_pose.setAnim(anim_keys[0]);
	
		var next_anim = function ()
		{
			var index = anim_keys.indexOf(spine_pose.getAnim());
			spine_pose.setAnim(anim_keys[(index + 1) % anim_keys.length]);
			spine_pose.setTime(0);
			setTimeout(next_anim, spine_pose.curAnim().length);
		}
		next_anim();

		var skin = spine_pose.curSkin();
		for (var slot_key in skin.skin_slots)
		{
			var skin_slot = skin.skin_slots[slot_key];
			for (var skin_attachment_key in skin_slot.skin_attachments)
			{
				var skin_attachment = skin_slot.skin_attachments[skin_attachment_key];
				if (skin_attachment.type !== 'region') { continue; }
				var image_key = skin_attachment.name || skin_attachment_key;
				images[image_key] = loadImage("spineboy/images/" + image_key + ".png", function (image) {});
			}
		}		
	});

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

	var loop = function (time)
	{
		requestAnimationFrame(loop);

		var ctx = canvas.getContext('2d');

		ctx.setTransform(1, 0, 0, 1, 0, 0);

		ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
		
		// origin at bottom center, x right, y up
		ctx.translate(ctx.canvas.width/2, ctx.canvas.height); ctx.scale(1, -1);
		
		var dt = 1000 / 60; // ms

		spine_pose.update(dt);

		spine_pose.strike();

		var skel = spine_pose.curSkel();

		var skel_bones = spine_pose.tweened_skel_bones;
		var skel_bone_keys = skel.skel_bone_keys;
		
		var skel_slots = spine_pose.tweened_skel_slots;
		var skel_slot_keys = spine_pose.tweened_skel_slot_keys;
		
		var skin = spine_pose.curSkin();
	
		var applyBone = function (skel_bone)
		{
			if (skel_bone)
			{
				applyBone(skel_bones[skel_bone.parent]);
				ctx.translate(skel_bone.x, skel_bone.y);
				ctx.rotate(skel_bone.rotation * Math.PI / 180);
				ctx.scale(skel_bone.scaleX, skel_bone.scaleY);
			}
		}

		var applySkin = function (skin_attachment)
		{
			ctx.translate(skin_attachment.x, skin_attachment.y);
			ctx.rotate(skin_attachment.rotation * Math.PI / 180);
			ctx.scale(skin_attachment.scaleX, skin_attachment.scaleY);			
		}

		if (skel_slot_keys) for (var skel_slot_key_idx = 0; skel_slot_key_idx < skel_slot_keys.length; ++skel_slot_key_idx)
		{
			var slot_key = skel_slot_keys[skel_slot_key_idx];
			var skel_slot = skel_slots[slot_key];
			var bone_key = skel_slot.bone;
			var skin_attachment_key = skel_slot.attachment;
			if (!skin_attachment_key) { continue; }
			var skin_slot = skin.skin_slots[slot_key];
			if (!skin_slot) { continue; }
			var skin_attachment = skin_slot.skin_attachments[skin_attachment_key];
			if (skin_attachment.type !== 'region') { continue; }
			var image_key = skin_attachment.name || skin_attachment_key;
			var image = images[image_key];

			ctx.save();
			applyBone(skel_bones[bone_key]);
			applySkin(skin_attachment);
			ctx.scale(1, -1); ctx.drawImage(image, -image.width/2, -image.height/2, image.width, image.height);
			ctx.restore();
		}
	}

	requestAnimationFrame(loop);
}
