#!/usr/bin/env node
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
 * A Spine skeleton/animation JSON to Spriter SCML converter.
 */

var fs = require('fs');
var path = require('path');
var closure = require('closure');

// enable google closure library
closure.Closure(global);

// load dependency file
goog.loadScript('spine2spriter-deps.js');

goog.require('spine');
goog.require('jsonxml.json2xml');

var json2xml = jsonxml.json2xml;

function main(argv)
{
	if ((argv.length < 3) || (argv.length > 3))
	{
		console.log("Spine skeleton/animation JSON to Spriter SCML converter");
		console.log("");
		console.log("Usage: ");
		console.log("$ node spine2spriter.js path/to/spine.json");
		console.log("$ node spine2spriter.js path/to/spine-skeleton.json");
		console.log("");
		console.log("For path/to/spine.json");
		console.log("Loads Spine data \"path/to/spine.json\" file.");
		console.log("Saves Spriter \"path/to/spine.scml\" file.");
		console.log("");
		console.log("For path/to/spine-skeleton.json");
		console.log("Loads Spine skeleton \"path/to/spine-skeleton.json\" file.");
		console.log("Searches for and loads all Spine animation \"path/to/spine-*.json\" files.");
		console.log("Saves Spriter \"path/to/spine.scml\" file.");
		return 1;
	}

	var spine_data = new spine.data();
	var spine_skeleton = spine_data.m_skeleton;

	var spine_json_filename = argv[2];
	var spine_json_dirname = path.dirname(spine_json_filename);
	var spine_json_basename = path.basename(spine_json_filename);

	var match = path.basename(spine_json_filename).match(new RegExp("^(\\w*)-skeleton.json$", "i"));
	//console.log(match);

	if (match && match[1])
	{
		// multiple file version
		var spine_skeleton_json_filename = spine_json_filename;
		console.log("spine skeleton json: " + spine_skeleton_json_filename);

		var spine_skeleton_json_string = fs.readFileSync(spine_skeleton_json_filename, "UTF-8");
		var spine_skeleton_json = JSON.parse(spine_skeleton_json_string);
		spine_data.loadSkeleton(spine_skeleton_json);
		spine_skeleton.name = match[1];
		console.log("spine skeleton name: " + spine_skeleton.name);

		// search the spine skeleton json directory for spine animation json files
		var filelist = fs.readdirSync(spine_json_dirname);
		for (var i = 0; i < filelist.length; ++i)
		{
			var filename = filelist[i];
			var match = filename.match(new RegExp("^" + spine_skeleton.name + "-(.*).json$", "i"));
			//console.log(match);
			if (match && (match[1] != "skeleton"))
			{
				var spine_animation_json_filename = spine_json_dirname + "/" + filename;
				console.log("spine animation json: " + spine_animation_json_filename);
				var spine_animation_json_string = fs.readFileSync(spine_animation_json_filename, "UTF-8");
				var spine_animation_json = JSON.parse(spine_animation_json_string);
				var spine_animation_name = (match && match[1]) || "default";
				console.log("spine animation name: " + spine_animation_name);
				spine_data.loadAnimation(spine_animation_name, spine_animation_json);
			}
		}
	}
	else
	{
		// single file version
		var spine_data_json_filename = spine_json_filename;
		console.log("spine data json: " + spine_data_json_filename);

		var spine_data_json_string = fs.readFileSync(spine_data_json_filename, "UTF-8");
		var spine_data_json = JSON.parse(spine_data_json_string);
		spine_data.load(spine_data_json);
		var match = path.basename(spine_data_json_filename).match(new RegExp("^(\\w*).json$", "i"));
		//console.log(match);
		spine_skeleton.name = (match && match[1]) || "skeleton";
		console.log("spine skeleton name: " + spine_skeleton.name);

		for (var i in spine_data.m_animations)
		{
			console.log("spine animation name: " + i);
		}
	}

	// use spine skeleton json base name for output spriter scml name
	var spriter_scml_filename = spine_json_dirname + "/" + spine_skeleton.name + ".scml";
	console.log("spriter scml: " + spriter_scml_filename);

	// TODO: multiple skin support
	var skin = spine_skeleton.skins[spine_skeleton.current_skin_i];

	// find all the files used by this skin
	var spine_skin_files = [];
	if (skin) for (var skin_slot_i in skin.skin_slots)
	{
		var skin_slot = skin.skin_slots[skin_slot_i];
		if (skin_slot)
		{
			for (var skin_attachment_i in skin_slot.skin_attachments)
			{
				var skin_attachment = skin_slot.skin_attachments[skin_attachment_i];
				if (skin_attachment)
				{
					var spine_skin_file = {};
					spine_skin_file.name = skin_attachment.name || skin_attachment_i;
					spine_skin_file.width = skin_attachment.width;
					spine_skin_file.height = skin_attachment.height;
					spine_skin_files.push(spine_skin_file);
				}
			}
		}
	}

	// gather files into folder/file objects
	var spine_folders_object = {};
	var spine_folder_id = 0;
	for (var spine_skin_file_i in spine_skin_files)
	{
		var spine_skin_file = spine_skin_files[spine_skin_file_i];
		// split into folder and file name
		var dirname = path.dirname(spine_skin_file.name);
		var basename = path.basename(spine_skin_file.name);
		// create a folder object keyed by folder name if it doesn't exist
		var spine_folder_object = spine_folders_object[dirname] = spine_folders_object[dirname] || { id:spine_folder_id++, file_id:0 };
		// create a files object in this folder if it doesn't exist
		var spine_files_object = spine_folder_object.spine_files_object = spine_folder_object.spine_files_object || {};
		// create a file object keyed by file name if it doesn't exist
		var spine_file_object = spine_files_object[basename] = spine_files_object[basename] || { id:spine_folder_object.file_id++ };
		spine_file_object.width = spine_skin_file.width;
		spine_file_object.height = spine_skin_file.height;
	}

	// flatten file/folder objects into arrays sorted by id
	var spine_folders_array = [];
	for (var spine_folder_object_i in spine_folders_object)
	{
		var spine_folder_object = spine_folders_object[spine_folder_object_i];
		spine_folder_object.name = spine_folder_object_i;
		spine_folder_object.files_array = [];
		for (var spine_file_object_i in spine_folder_object.spine_files_object)
		{
			var spine_file_object = spine_folder_object.spine_files_object[spine_file_object_i];
			spine_file_object.name = spine_file_object_i;
			spine_folder_object.files_array.push(spine_file_object);
		}
		spine_folder_object.files_array.sort(function (a, b){ return a.id - b.id;});
		spine_folders_array.push(spine_folder_object);
	}
	spine_folders_array.sort(function (a, b){ return a.id - b.id;});

	// map bones and slots to timelines
	var timeline = 0;

	var skel_bone_id = 0;
	var skel_bone_map = {};

	for (var skel_bone_i in spine_skeleton.skel_bones)
	{
		var skel_bone = spine_skeleton.skel_bones[skel_bone_i];
		skel_bone_map[skel_bone_i] = { id:skel_bone_id++, timeline:timeline++ };
	}

	var skel_slot_id = 0;
	var skel_slot_map = {};

	for (var skel_slot_i in spine_skeleton.skel_slots)
	{
		var skel_slot = spine_skeleton.skel_slots[skel_slot_i];

		var skin_slot = skin.skin_slots[skel_slot_i];
		if (skin_slot)
		{
			var skin_attachment = skin_slot.skin_attachments[skel_slot.attachment];
			if (skin_attachment)
			{
				skel_slot_map[skel_slot_i] = { id:skel_slot_id++, timeline:timeline++ };
			}
		}
	}

	// output scml
	var spriter_scml_json = {};

	// header
	var spriter_data = spriter_scml_json.spriter_data = {};
	spriter_data['@scml_version'] = "1.0";
	spriter_data['@generator'] = "spine.js";
	spriter_data['@generator_version'] = "pre1.0";

	// folder array
	spriter_data.folder = [];
	for (var spine_folder_i = 0; spine_folder_i < spine_folders_array.length; ++spine_folder_i)
	{
		var spine_folder = spine_folders_array[spine_folder_i];
		var spriter_folder = {};
		spriter_folder['@id'] = spine_folder.id;
		if ((spine_folder.name.length > 0) && (spine_folder.name.charAt(0) != '.'))
		{
			spriter_folder['@name'] = spine_folder.name;
		}
		spriter_folder.file = [];
		spriter_data.folder.push(spriter_folder);
		for (var file_i = 0; file_i < spine_folder.files_array.length; ++file_i)
		{
			var spine_file = spine_folder.files_array[file_i];
			var spriter_file = {};
			spriter_file['@id'] = spine_file.id;
			if ((spine_folder.name.length > 0) && (spine_folder.name.charAt(0) != '.'))
			{
				spriter_file['@name'] = spine_folder.name + "/" + spine_file.name + ".png";
			}
			else
			{
				spriter_file['@name'] = spine_file.name + ".png";
			}
			spriter_file['@width'] = spine_file.width;
			spriter_file['@height'] = spine_file.height;
			spriter_folder.file.push(spriter_file);
		}
	}

	// entity array
	spriter_data.entity = [];

	// default entity
	var spriter_entity = {};
	spriter_entity['@id'] = spriter_data.entity.length;
	spriter_entity['@name'] = spine_skeleton.name || "skeleton";
	spriter_entity.animation = [];
	spriter_data.entity.push(spriter_entity);

	var add_animation = function (spine_pose, spine_anim_i)
	{
		spine_pose.setAnim(spine_anim_i);

		var spine_skeleton = spine_pose.m_data.m_skeleton;

		var animation_name = "default";
		var animation_length = 0;
		var time_array = [ 0 ];

		if (spine_pose.m_anim_name)
		{
			var spine_animation = spine_data.m_animations[spine_pose.m_anim_name];
			animation_name = spine_pose.m_anim_name;
			animation_length = spine_pose.getAnimLength();

			time_array.push(Math.round(animation_length));

			var add_times = function (keys)
			{
				for (var key_i = 0; key_i < keys.length; ++key_i)
				{
					var key = keys[key_i];
					var time = key.time;
					time_array.push(time);

					// for attachments or stepped animation, add key 1ms before switch
					if ((!key.curve) || (key.curve(1) == 0))
					{
						if (time > 0) { time_array.push(time - 1); }
					}
				}
			}

			for (var anim_bone_i in spine_animation.anim_bones)
			{
				var anim_bone = spine_animation.anim_bones[anim_bone_i];
				add_times(anim_bone.translate_keys);
				add_times(anim_bone.rotate_keys);
				add_times(anim_bone.scale_keys);
			}

			for (var anim_slot_i in spine_animation.anim_slots)
			{
				var anim_slot = spine_animation.anim_slots[anim_slot_i];
				add_times(anim_slot.color_keys);
				add_times(anim_slot.attachment_keys);
			}

			// remove duplicates
			time_array = time_array.filter(function(elem, pos, self) { return self.indexOf(elem) == pos; });

			// sort ascending
			time_array.sort(function (a, b) { return a - b; });
		}

		var spriter_animation = {};
		spriter_animation['@id'] = spriter_entity.animation.length;
		spriter_animation['@name'] = animation_name;
		spriter_animation['@length'] = Math.round(animation_length);
		spriter_animation['@looping'] = "false";
		spriter_animation.mainline = {};
		spriter_animation.mainline.key = [];
		spriter_animation.timeline = [];
		spriter_entity.animation.push(spriter_animation);

		// create timeline for each spine skeleton bone
		for (var skel_bone_i in spine_skeleton.skel_bones)
		{
			var skel_bone = spine_skeleton.skel_bones[skel_bone_i];

			var spriter_timeline = {};
			spriter_timeline['@id'] = skel_bone_map[skel_bone_i].timeline;
			spriter_timeline['@name'] = skel_bone_i;
			spriter_timeline.key = [];
			spriter_animation.timeline.push(spriter_timeline);
		}

		// create timeline for each spine skeleton slot
		for (var skel_slot_i in spine_skeleton.skel_slots)
		{
			var skel_slot = spine_skeleton.skel_slots[skel_slot_i];

			var skin_slot = skin.skin_slots[skel_slot_i];
			if (skin_slot)
			{
				var skin_attachment = skin_slot.skin_attachments[skel_slot.attachment];
				if (skin_attachment)
				{
					var spriter_timeline = {};
					spriter_timeline['@id'] = skel_slot_map[skel_slot_i].timeline;
					spriter_timeline['@name'] = "object " + skel_slot_i;
					spriter_timeline.key = [];
					spriter_animation.timeline.push(spriter_timeline);
				}
			}
		}

		// sample each time step
		for (var time_i = 0; time_i < time_array.length; ++time_i)
		{
			var time = time_array[time_i];
			var key_time = Math.round(time);//time_array[time_i];

			spine_pose.setTime(time);
			spine_pose.strike();

			// add a key to the mainline
			var spriter_mainline_key = {};
			spriter_mainline_key['@id'] = spriter_animation.mainline.key.length;
			if (key_time > 0) { spriter_mainline_key['@time'] = key_time; }
			spriter_mainline_key.bone_ref = [];
			spriter_mainline_key.object_ref = [];
			spriter_animation.mainline.key.push(spriter_mainline_key);

			for (var skel_bone_i in spine_skeleton.skel_bones)
			{
				var skel_bone = spine_skeleton.skel_bones[skel_bone_i];
				var tween_skel_bone = spine_pose.m_tweened_skel_bones[skel_bone_i];

				// add bone ref to mainline
				var spriter_bone_ref = {};
				spriter_bone_ref['@id'] = skel_bone_map[skel_bone_i].id;
				if (skel_bone.parent)
				{
					spriter_bone_ref['@parent'] = skel_bone_map[skel_bone.parent].id;
				}
				spriter_bone_ref['@timeline'] = skel_bone_map[skel_bone_i].timeline;
				spriter_bone_ref['@key'] = spriter_mainline_key['@id'];
				spriter_mainline_key.bone_ref.push(spriter_bone_ref);

				// add bone key to timeline
				var spriter_timeline = spriter_animation.timeline[spriter_bone_ref['@timeline']];

				var spriter_timeline_key = {};
				spriter_timeline_key['@id'] = spriter_bone_ref['@key'];//spriter_timeline.key.length;
				if (key_time > 0) { spriter_timeline_key['@time'] = key_time; }
				//spriter_timeline_key['@spin'] = 0;
				spriter_timeline_key.bone = [];
				spriter_timeline.key.push(spriter_timeline_key);

				var spriter_bone_x = parseFloat(tween_skel_bone.x.toFixed(6));
				var spriter_bone_y = parseFloat(tween_skel_bone.y.toFixed(6));
				var spriter_bone_angle = parseFloat(tween_skel_bone.rotation.toFixed(6));
				var spriter_bone_scale_x = parseFloat(tween_skel_bone.scaleX.toFixed(6));
				var spriter_bone_scale_y = parseFloat(tween_skel_bone.scaleY.toFixed(6));

				var spriter_bone = {};
				if (spriter_bone_x != 0) { spriter_bone['@x'] = spriter_bone_x; }
				if (spriter_bone_y != 0) { spriter_bone['@y'] = spriter_bone_y; }
				if (spriter_bone_angle != 0) { spriter_bone['@angle'] = spriter_bone_angle; }
				if (spriter_bone_scale_x != 1) { spriter_bone['@scale_x'] = spriter_bone_scale_x; }
				if (spriter_bone_scale_y != 1) { spriter_bone['@scale_y'] = spriter_bone_scale_y; }
				spriter_timeline_key.bone.push(spriter_bone);
			}

			for (var skel_slot_i in spine_skeleton.skel_slots)
			{
				var skel_slot = spine_pose.m_tweened_skel_slots[skel_slot_i];

				var skin_slot = skin.skin_slots[skel_slot_i];
				if (skin_slot)
				{
					var skin_attachment = skin_slot.skin_attachments[skel_slot.attachment];
					if (skin_attachment)
					{
						var name = skin_attachment.name || skel_slot.attachment;
						var dirname = path.dirname(name);
						var basename = path.basename(name);
						var spine_folder_object = spine_folders_object[dirname];
						var spine_file_object = spine_folder_object.spine_files_object[basename];

						// add object ref to mainline
						var spriter_object_ref = {};
						spriter_object_ref['@id'] = skel_slot_map[skel_slot_i].id;
						if (skel_slot.bone)
						{
							spriter_object_ref['@parent'] = skel_bone_map[skel_slot.bone].id;
						}
						spriter_object_ref['@timeline'] = skel_slot_map[skel_slot_i].timeline;
						spriter_object_ref['@key'] = spriter_mainline_key['@id'];
						spriter_object_ref['@z_index'] = spriter_object_ref['@id'];
						spriter_mainline_key.object_ref.push(spriter_object_ref);

						// add object key to timeline
						var spriter_timeline = spriter_animation.timeline[spriter_object_ref['@timeline']];

						var spriter_timeline_key = {};
						spriter_timeline_key['@id'] = spriter_object_ref['@key'];//spriter_timeline.key.length;
						if (key_time > 0) { spriter_timeline_key['@time'] = key_time; }
						//spriter_timeline_key['@spin'] = 0;
						spriter_timeline_key.object = [];
						spriter_timeline.key.push(spriter_timeline_key);

						var spriter_object_x = parseFloat(skin_attachment.x.toFixed(6));
						var spriter_object_y = parseFloat(skin_attachment.y.toFixed(6));
						var spriter_object_angle = parseFloat(skin_attachment.rotation.toFixed(6));
						var spriter_object_scale_x = parseFloat(skin_attachment.scaleX.toFixed(6));
						var spriter_object_scale_y = parseFloat(skin_attachment.scaleY.toFixed(6));
						var spriter_object_r = parseFloat(skel_slot.color.r.toFixed(6));
						var spriter_object_g = parseFloat(skel_slot.color.g.toFixed(6));
						var spriter_object_b = parseFloat(skel_slot.color.b.toFixed(6));
						var spriter_object_a = parseFloat(skel_slot.color.a.toFixed(6));

						var spriter_object = {};
						spriter_object['@folder'] = spine_folder_object.id;
						spriter_object['@file'] = spine_file_object.id;
						if (spriter_object_x != 0) { spriter_object['@x'] = spriter_object_x; }
						if (spriter_object_y != 0) { spriter_object['@y'] = spriter_object_y; }
						spriter_object['@pivot_x'] = 0.5;
						spriter_object['@pivot_y'] = 0.5;
						if (spriter_object_angle != 0) { spriter_object['@angle'] = spriter_object_angle; }
						if (spriter_object_scale_x != 1) { spriter_object['@scale_x'] = spriter_object_scale_x; }
						if (spriter_object_scale_y != 1) { spriter_object['@scale_y'] = spriter_object_scale_y; }
						//if (spriter_object_r != 1) { spriter_object['@r'] = spriter_object_r; }
						//if (spriter_object_g != 1) { spriter_object['@g'] = spriter_object_g; }
						//if (spriter_object_b != 1) { spriter_object['@b'] = spriter_object_b; }
						if (spriter_object_a != 1) { spriter_object['@a'] = spriter_object_a; }
						spriter_timeline_key.object.push(spriter_object);
					}
				}
			}
		}

		// apply spin
		for (var spriter_timeline_i = 0; spriter_timeline_i < spriter_animation.timeline.length; ++spriter_timeline_i)
		{
			var spriter_timeline = spriter_animation.timeline[spriter_timeline_i];

			for (var spriter_timeline_key_i = 0; spriter_timeline_key_i < spriter_timeline.key.length; ++spriter_timeline_key_i)
			{
				var spriter_this_timeline_key = spriter_timeline.key[spriter_timeline_key_i];
				var spriter_next_timeline_key = spriter_timeline.key[(spriter_timeline_key_i + 1) % spriter_timeline.key.length];

				if (spriter_this_timeline_key.bone && spriter_next_timeline_key.bone)
				{
					var spriter_this_bone = spriter_this_timeline_key.bone[0];
					var spriter_next_bone = spriter_next_timeline_key.bone[0];

					var spriter_this_angle = spriter_this_bone['@angle'] || 0;
					var spriter_next_angle = spriter_next_bone['@angle'] || 0;

					if (spriter_next_angle < spriter_this_angle)
					{
						spriter_this_timeline_key['@spin'] = -1;
					}
					else if (spriter_next_angle > spriter_this_angle)
					{
						// spriter_this_timeline_key['@spin'] = 1; // default
					}
					else
					{
						spriter_this_timeline_key['@spin'] = 0;
					}
				}
				else if (spriter_this_timeline_key.object && spriter_next_timeline_key.object)
				{
					var spriter_this_object = spriter_this_timeline_key.object[0];
					var spriter_next_object = spriter_next_timeline_key.object[0];

					var spriter_this_angle = spriter_this_object['@angle'] || 0;
					var spriter_next_angle = spriter_next_object['@angle'] || 0;

					if (spriter_next_angle < spriter_this_angle)
					{
						spriter_this_timeline_key['@spin'] = -1;
					}
					else if (spriter_next_angle > spriter_this_angle)
					{
						// spriter_this_timeline_key['@spin'] = 1; // default
					}
					else
					{
						spriter_this_timeline_key['@spin'] = 0;
					}
				}
			}
		}

		// wrap angles
		for (var spriter_timeline_i = 0; spriter_timeline_i < spriter_animation.timeline.length; ++spriter_timeline_i)
		{
			var spriter_timeline = spriter_animation.timeline[spriter_timeline_i];

			for (var spriter_timeline_key_i = 0; spriter_timeline_key_i < spriter_timeline.key.length; ++spriter_timeline_key_i)
			{
				var spriter_timeline_key = spriter_timeline.key[spriter_timeline_key_i];

				if (spriter_timeline_key.bone)
				{
					var spriter_bone = spriter_timeline_key.bone[0];

					var spriter_angle = spriter_bone['@angle'] || 0;

					while (spriter_angle < 0) { spriter_angle += 360; }

					spriter_angle = parseFloat(spriter_angle.toFixed(6))

					if (spriter_angle != 0) { spriter_bone['@angle'] = spriter_angle; }
				}
				else if (spriter_timeline_key.object)
				{
					var spriter_object = spriter_timeline_key.object[0];

					var spriter_angle = spriter_object['@angle'] || 0;

					while (spriter_angle < 0) { spriter_angle += 360; }

					spriter_angle = parseFloat(spriter_angle.toFixed(6))

					if (spriter_angle != 0) { spriter_object['@angle'] = spriter_angle; }
				}
			}
		}
	}

	var spine_pose = new spine.pose(spine_data);

	// add spine skeleton
	add_animation(spine_pose);

	// add each spine animation
	for (var spine_anim_i in spine_data.m_animations)
	{
		add_animation(spine_pose, spine_anim_i);
	}

	// convert to xml string
	var spriter_scml_xml_string = '<?xml version="1.0" encoding="UTF-8"?>\n' + json2xml(spriter_scml_json, '\t');

	// output
	fs.writeFileSync(spriter_scml_filename, spriter_scml_xml_string);
}

main(process.argv);

