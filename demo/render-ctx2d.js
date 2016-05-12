goog.provide('RenderCtx2D');

/**
 * @constructor
 * @param {CanvasRenderingContext2D} ctx
 */
RenderCtx2D = function(ctx) {
  var render = this;
  render.ctx = ctx;
  render.images = {};
  render.skin_info_map = {};
  render.region_vertex_position = new Float32Array([-1, -1, 1, -1, 1, 1, -1, 1]); // [ x, y ]
  render.region_vertex_texcoord = new Float32Array([0, 1, 1, 1, 1, 0, 0, 0]); // [ u, v ]
  render.region_vertex_triangle = new Uint16Array([0, 1, 2, 0, 2, 3]); // [ i0, i1, i2 ]
}

/**
 * @return {void}
 * @param {spine.Data} spine_data
 * @param {atlas.Data} atlas_data
 */
RenderCtx2D.prototype.dropData = function(spine_data, atlas_data) {
  var render = this;
  render.images = {};
  render.skin_info_map = {};
}

/**
 * @return {void}
 * @param {spine.Data} spine_data
 * @param {atlas.Data} atlas_data
 * @param {Object.<string,HTMLImageElement>} images
 */
RenderCtx2D.prototype.loadData = function(spine_data, atlas_data, images) {
  var render = this;

  spine_data.iterateSkins(function(skin_key, skin) {
    var skin_info = render.skin_info_map[skin_key] = {};
    var slot_info_map = skin_info.slot_info_map = {};

    skin.iterateAttachments(function(slot_key, skin_slot, attachment_key, attachment) {
      if (!attachment) {
        return;
      }

      switch (attachment.type) {
        case 'mesh':
          var slot_info = slot_info_map[slot_key] = slot_info_map[slot_key] || {};
          var attachment_info_map = slot_info.attachment_info_map = slot_info.attachment_info_map || {};
          var attachment_info = attachment_info_map[attachment_key] = {};
          attachment_info.type = attachment.type;
          var vertex_count = attachment_info.vertex_count = attachment.vertices.length / 2;
          var vertex_position = attachment_info.vertex_position = new Float32Array(attachment.vertices);
          var vertex_texcoord = attachment_info.vertex_texcoord = new Float32Array(attachment.uvs);
          var vertex_triangle = attachment_info.vertex_triangle = new Uint16Array(attachment.triangles);
          break;
        case 'weightedmesh':
          var slot_info = slot_info_map[slot_key] = slot_info_map[slot_key] || {};
          var attachment_info_map = slot_info.attachment_info_map = slot_info.attachment_info_map || {};
          var attachment_info = attachment_info_map[attachment_key] = {};
          attachment_info.type = attachment.type;
          var vertex_count = attachment_info.vertex_count = attachment.uvs.length / 2;
          var vertex_setup_position = attachment_info.vertex_setup_position = new Float32Array(2 * vertex_count);
          var vertex_blend_position = attachment_info.vertex_blend_position = new Float32Array(2 * vertex_count);
          var vertex_texcoord = attachment_info.vertex_texcoord = new Float32Array(attachment.uvs);
          var vertex_triangle = attachment_info.vertex_triangle = new Uint16Array(attachment.triangles);
          var position = new spine.Vector();
          for (var vertex_index = 0, index = 0; vertex_index < vertex_count; ++vertex_index) {
            var blender_count = attachment.vertices[index++];
            var setup_position_x = 0;
            var setup_position_y = 0;
            for (var blender_index = 0; blender_index < blender_count; ++blender_index) {
              var bone_index = attachment.vertices[index++];
              var x = position.x = attachment.vertices[index++];
              var y = position.y = attachment.vertices[index++];
              var weight = attachment.vertices[index++];
              var bone_key = spine_data.bone_keys[bone_index];
              var bone = spine_data.bones[bone_key];
              spine.Space.transform(bone.world_space, position, position);
              setup_position_x += position.x * weight;
              setup_position_y += position.y * weight;
            }
            var vertex_setup_position_offset = vertex_index * 2;
            vertex_setup_position[vertex_setup_position_offset++] = setup_position_x;
            vertex_setup_position[vertex_setup_position_offset++] = setup_position_y;
          }
          vertex_blend_position.set(vertex_setup_position);
          break;
      }
    });
  });

  render.images = images;
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 */
RenderCtx2D.prototype.updatePose = function(spine_pose, atlas_data) {
  var render = this;
  var default_skin_info = render.skin_info_map['default'];

  spine_pose.iterateAttachments(function(slot_key, slot, skin_slot, attachment_key, attachment) {
    if (!attachment) {
      return;
    }
    switch (attachment.type) {
      case 'mesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        var anim = spine_pose.data.anims[spine_pose.anim_key];
        var anim_ffd = anim && anim.ffds && anim.ffds[spine_pose.skin_key];
        var ffd_slot = anim_ffd && anim_ffd.ffd_slots[slot_key];
        var ffd_attachment = ffd_slot && ffd_slot.ffd_attachments[attachment_key];
        var ffd_keyframes = ffd_attachment && ffd_attachment.ffd_keyframes;
        var ffd_keyframe_index = spine.Keyframe.find(ffd_keyframes, spine_pose.time);
        if (ffd_keyframe_index !== -1) {
          // ffd

          var pct = 0;
          var ffd_keyframe0 = ffd_keyframes[ffd_keyframe_index];
          var ffd_keyframe1 = ffd_keyframes[ffd_keyframe_index + 1];
          if (ffd_keyframe1) {
            pct = ffd_keyframe0.curve.evaluate((spine_pose.time - ffd_keyframe0.time) / (ffd_keyframe1.time - ffd_keyframe0.time));
          } else {
            ffd_keyframe1 = ffd_keyframe0;
          }

          for (var index = 0; index < attachment_info.vertex_position.length; ++index) {
            var v0 = ffd_keyframe0.vertices[index - ffd_keyframe0.offset] || 0;
            var v1 = ffd_keyframe1.vertices[index - ffd_keyframe1.offset] || 0;
            attachment_info.vertex_position[index] = attachment.vertices[index] + spine.tween(v0, v1, pct);
          }
        }
        break;
      case 'weightedmesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        var anim = spine_pose.data.anims[spine_pose.anim_key];
        var anim_ffd = anim && anim.ffds && anim.ffds[spine_pose.skin_key];
        var ffd_slot = anim_ffd && anim_ffd.ffd_slots[slot_key];
        var ffd_attachment = ffd_slot && ffd_slot.ffd_attachments[attachment_key];
        var ffd_keyframes = ffd_attachment && ffd_attachment.ffd_keyframes;
        var ffd_keyframe_index = spine.Keyframe.find(ffd_keyframes, spine_pose.time);
        if (ffd_keyframe_index !== -1) {
          // ffd

          var pct = 0;
          var ffd_keyframe0 = ffd_keyframes[ffd_keyframe_index];
          var ffd_keyframe1 = ffd_keyframes[ffd_keyframe_index + 1];
          if (ffd_keyframe1) {
            var pct = ffd_keyframe0.curve.evaluate((spine_pose.time - ffd_keyframe0.time) / (ffd_keyframe1.time - ffd_keyframe0.time));
          } else {
            ffd_keyframe1 = ffd_keyframe0;
          }

          var vertex_blend_position = attachment_info.vertex_blend_position;
          var position = new spine.Vector();
          for (var vertex_index = 0, index = 0, ffd_index = 0; vertex_index < attachment_info.vertex_count; ++vertex_index) {
            var blender_count = attachment.vertices[index++];
            var blend_position_x = 0;
            var blend_position_y = 0;
            for (var blender_index = 0; blender_index < blender_count; ++blender_index) {
              var bone_index = attachment.vertices[index++];
              position.x = attachment.vertices[index++];
              position.y = attachment.vertices[index++];
              var weight = attachment.vertices[index++];
              var bone_key = spine_pose.bone_keys[bone_index];
              var bone = spine_pose.bones[bone_key];
              var v0 = ffd_keyframe0.vertices[ffd_index - ffd_keyframe0.offset] || 0;
              var v1 = ffd_keyframe1.vertices[ffd_index - ffd_keyframe1.offset] || 0;
              position.x += spine.tween(v0, v1, pct);
              ++ffd_index;
              var v0 = ffd_keyframe0.vertices[ffd_index - ffd_keyframe0.offset] || 0;
              var v1 = ffd_keyframe1.vertices[ffd_index - ffd_keyframe1.offset] || 0;
              position.y += spine.tween(v0, v1, pct);
              ++ffd_index;
              spine.Space.transform(bone.world_space, position, position);
              blend_position_x += position.x * weight;
              blend_position_y += position.y * weight;
            }
            var vertex_position_offset = vertex_index * 2;
            vertex_blend_position[vertex_position_offset++] = blend_position_x;
            vertex_blend_position[vertex_position_offset++] = blend_position_y;
          }
        } else {
          // no ffd

          var vertex_blend_position = attachment_info.vertex_blend_position;
          var position = new spine.Vector();
          for (var vertex_index = 0, index = 0; vertex_index < attachment_info.vertex_count; ++vertex_index) {
            var blender_count = attachment.vertices[index++];
            var blend_position_x = 0;
            var blend_position_y = 0;
            for (var blender_index = 0; blender_index < blender_count; ++blender_index) {
              var bone_index = attachment.vertices[index++];
              position.x = attachment.vertices[index++];
              position.y = attachment.vertices[index++];
              var weight = attachment.vertices[index++];
              var bone_key = spine_pose.bone_keys[bone_index];
              var bone = spine_pose.bones[bone_key];
              spine.Space.transform(bone.world_space, position, position);
              blend_position_x += position.x * weight;
              blend_position_y += position.y * weight;
            }
            var vertex_position_offset = vertex_index * 2;
            vertex_blend_position[vertex_position_offset++] = blend_position_x;
            vertex_blend_position[vertex_position_offset++] = blend_position_y;
          }
        }
        break;
    }
  });
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 */
RenderCtx2D.prototype.drawPose = function(spine_pose, atlas_data) {
  var render = this;
  var ctx = render.ctx;
  var default_skin_info = render.skin_info_map['default'];

  render.updatePose(spine_pose, atlas_data);

  spine_pose.iterateAttachments(function(slot_key, slot, skin_slot, attachment_key, attachment) {
    if (!attachment) {
      return;
    }
    if (attachment.type === 'boundingbox') {
      return;
    }

    var site = atlas_data && atlas_data.sites[attachment_key];
    var page = site && site.page;
    var image_key = (page && page.name) || attachment_key;
    var image = render.images[image_key];

    if (!image || !image.complete) {
      return;
    }

    ctx.save();

    // TODO: slot.color.rgb
    ctx.globalAlpha *= slot.color.a;

    switch (slot.blend) {
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

    switch (attachment.type) {
      case 'region':
        var bone = spine_pose.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctxApplySpace(ctx, attachment.local_space);
        ctxApplyAtlasSitePosition(ctx, site);
        ctx.scale(attachment.width / 2, attachment.height / 2);
        // TODO: attachment.color.rgb
        ctx.globalAlpha *= attachment.color.a;
        ctxDrawImageMesh(ctx, render.region_vertex_triangle, render.region_vertex_position, render.region_vertex_texcoord, image, site, page);
        break;
      case 'mesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        var bone = spine_pose.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctxApplyAtlasSitePosition(ctx, site);
        // TODO: attachment.color.rgb
        ctx.globalAlpha *= attachment.color.a;
        ctxDrawImageMesh(ctx, attachment_info.vertex_triangle, attachment_info.vertex_position, attachment_info.vertex_texcoord, image, site, page);
        break;
      case 'weightedmesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        ctxApplyAtlasSitePosition(ctx, site);
        // TODO: attachment.color.rgb
        ctx.globalAlpha *= attachment.color.a;
        ctxDrawImageMesh(ctx, attachment_info.vertex_triangle, attachment_info.vertex_blend_position, attachment_info.vertex_texcoord, image, site, page);
        break;
    }

    ctx.restore();
  });
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 */
RenderCtx2D.prototype.drawDebugPose = function(spine_pose, atlas_data) {
  var render = this;
  var ctx = render.ctx;
  var default_skin_info = render.skin_info_map['default'];
  var stroke_style = 'rgba(255,255,255,1.0)';
  var fill_style;// = 'rgba(255,255,255,0.25)';

  render.updatePose(spine_pose, atlas_data);

  spine_pose.iterateAttachments(function(slot_key, slot, skin_slot, attachment_key, attachment) {
    if (!attachment) {
      return;
    }

    var site = atlas_data && atlas_data.sites[attachment_key];

    ctx.save();

    switch (attachment.type) {
      case 'region':
        var bone = spine_pose.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctxApplySpace(ctx, attachment.local_space);
        ctxApplyAtlasSitePosition(ctx, site);
        ctx.beginPath();
        ctx.rect(-attachment.width / 2, -attachment.height / 2, attachment.width, attachment.height);
        if (fill_style) {
          ctx.fillStyle = fill_style;
          ctx.fill();
        }
        ctx.strokeStyle = stroke_style;
        ctx.stroke();
        break;
      case 'boundingbox':
        var bone = spine_pose.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctx.beginPath();
        var x = 0;
        attachment.vertices.forEach(function(value, index) {
          if (index & 1) {
            ctx.lineTo(x, value);
          } else {
            x = value;
          }
        });
        ctx.closePath();
        ctx.strokeStyle = 'cyan';
        ctx.stroke();
        break;
      case 'mesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        var bone = spine_pose.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctxApplyAtlasSitePosition(ctx, site);
        ctxDrawMesh(ctx, attachment_info.vertex_triangle, attachment_info.vertex_position, stroke_style, fill_style);
        break;
      case 'weightedmesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        ctxApplyAtlasSitePosition(ctx, site);
        ctxDrawMesh(ctx, attachment_info.vertex_triangle, attachment_info.vertex_blend_position, stroke_style, fill_style);
        break;
    }

    ctx.restore();
  });

  spine_pose.iterateBones(function(bone_key, bone) {
    ctxDrawBone(ctx, bone_key, bone);
  });

  ctxDrawIkConstraints(ctx, spine_pose.data, spine_pose.bones);
}

/**
 * @return {void}
 * @param {spine.Pose} spine_pose
 * @param {atlas.Data} atlas_data
 */
RenderCtx2D.prototype.drawDebugData = function(spine_pose, atlas_data) {
  var render = this;
  var ctx = render.ctx;
  var default_skin_info = render.skin_info_map['default'];
  var stroke_style = 'rgba(255,255,255,1.0)';
  var fill_style;// = 'rgba(255,255,255,0.25)';

  spine_pose.data.iterateAttachments(spine_pose.skin_key, function(slot_key, slot, skin_slot, attachment_key, attachment) {
    if (!attachment) {
      return;
    }

    var site = atlas_data && atlas_data.sites[attachment_key];

    ctx.save();

    switch (attachment.type) {
      case 'region':
        var bone = spine_pose.data.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctxApplySpace(ctx, attachment.local_space);
        ctxApplyAtlasSitePosition(ctx, site);
        ctx.beginPath();
        ctx.rect(-attachment.width / 2, -attachment.height / 2, attachment.width, attachment.height);
        if (fill_style) {
          ctx.fillStyle = fill_style;
          ctx.fill();
        }
        ctx.strokeStyle = stroke_style;
        ctx.stroke();
        break;
      case 'boundingbox':
        var bone = spine_pose.data.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctx.beginPath();
        var x = 0;
        attachment.vertices.forEach(function(value, index) {
          if (index & 1) {
            ctx.lineTo(x, value);
          } else {
            x = value;
          }
        });
        ctx.closePath();
        ctx.strokeStyle = 'cyan';
        ctx.stroke();
        break;
      case 'mesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        var bone = spine_pose.data.bones[slot.bone_key];
        ctxApplySpace(ctx, bone.world_space);
        ctxApplyAtlasSitePosition(ctx, site);
        ctxDrawMesh(ctx, attachment_info.vertex_triangle, attachment_info.vertex_position, stroke_style, fill_style);
        break;
      case 'weightedmesh':
        var skin_info = render.skin_info_map[spine_pose.skin_key];
        var slot_info = skin_info.slot_info_map[slot_key] || default_skin_info.slot_info_map[slot_key];
        var attachment_info = slot_info.attachment_info_map[attachment_key];
        ctxApplyAtlasSitePosition(ctx, site);
        ctxDrawMesh(ctx, attachment_info.vertex_triangle, attachment_info.vertex_setup_position, stroke_style, fill_style);
        break;
    }

    ctx.restore();
  });

  spine_pose.data.iterateBones(function(bone_key, bone) {
    ctxDrawBone(ctx, bone_key, bone);
  });

  ctxDrawIkConstraints(ctx, spine_pose.data, spine_pose.data.bones);
}

function ctxApplySpace(ctx, space) {
  if (space) {
    ctx.translate(space.position.x, space.position.y);
    ctx.rotate(space.rotation.rad);
    ctx.transform(space.shear.x.cos, space.shear.x.sin, -space.shear.y.sin, space.shear.y.cos, 0, 0);
    ctx.transform(space.scale.a, space.scale.c, space.scale.b, space.scale.d, 0, 0);
  }
}

function ctxApplyAtlasSitePosition(ctx, site) {
  if (site) {
    ctx.scale(1 / site.original_w, 1 / site.original_h);
    ctx.translate(2 * site.offset_x - (site.original_w - site.w), (site.original_h - site.h) - 2 * site.offset_y);
    ctx.scale(site.w, site.h);
  }
}

function ctxDrawCircle(ctx, color, scale) {
  scale = scale || 1;
  ctx.beginPath();
  ctx.arc(0, 0, 12 * scale, 0, 2 * Math.PI, false);
  ctx.strokeStyle = color || 'grey';
  ctx.stroke();
}

function ctxDrawPoint(ctx, color, scale) {
  scale = scale || 1;
  ctx.beginPath();
  ctx.arc(0, 0, 12 * scale, 0, 2 * Math.PI, false);
  ctx.strokeStyle = color || 'blue';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(24 * scale, 0);
  ctx.strokeStyle = 'red';
  ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(0, 0);
  ctx.lineTo(0, 24 * scale);
  ctx.strokeStyle = 'green';
  ctx.stroke();
}

function ctxDrawMesh(ctx, triangles, positions, stroke_style, fill_style) {
  ctx.beginPath();
  for (var index = 0; index < triangles.length;) {
    var triangle = triangles[index++] * 2;
    var x0 = positions[triangle],
      y0 = positions[triangle + 1];
    var triangle = triangles[index++] * 2;
    var x1 = positions[triangle],
      y1 = positions[triangle + 1];
    var triangle = triangles[index++] * 2;
    var x2 = positions[triangle],
      y2 = positions[triangle + 1];
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.lineTo(x0, y0);
  }
  if (fill_style) {
    ctx.fillStyle = fill_style;
    ctx.fill();
  }
  ctx.strokeStyle = stroke_style || 'grey';
  ctx.stroke();
}

function ctxDrawImageMesh(ctx, triangles, positions, texcoords, image, site, page) {
  var site_texmatrix = new Float32Array(9);
  var site_texcoord = new Float32Array(2);
  mat3x3Identity(site_texmatrix);
  mat3x3Scale(site_texmatrix, image.width, image.height);
  mat3x3ApplyAtlasPageTexcoord(site_texmatrix, page);
  mat3x3ApplyAtlasSiteTexcoord(site_texmatrix, site);

  /// http://www.irrlicht3d.org/pivot/entry.php?id=1329
  for (var index = 0; index < triangles.length;) {
    var triangle = triangles[index++] * 2;
    var position = positions.subarray(triangle, triangle + 2);
    var x0 = position[0], y0 = position[1];
    var texcoord = mat3x3Transform(site_texmatrix, texcoords.subarray(triangle, triangle + 2), site_texcoord);
    var u0 = texcoord[0], v0 = texcoord[1];

    var triangle = triangles[index++] * 2;
    var position = positions.subarray(triangle, triangle + 2);
    var x1 = position[0], y1 = position[1];
    var texcoord = mat3x3Transform(site_texmatrix, texcoords.subarray(triangle, triangle + 2), site_texcoord);
    var u1 = texcoord[0], v1 = texcoord[1];

    var triangle = triangles[index++] * 2;
    var position = positions.subarray(triangle, triangle + 2);
    var x2 = position[0], y2 = position[1];
    var texcoord = mat3x3Transform(site_texmatrix, texcoords.subarray(triangle, triangle + 2), site_texcoord);
    var u2 = texcoord[0], v2 = texcoord[1];

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(x0, y0);
    ctx.lineTo(x1, y1);
    ctx.lineTo(x2, y2);
    ctx.closePath();
    ctx.clip();
    x1 -= x0;
    y1 -= y0;
    x2 -= x0;
    y2 -= y0;
    u1 -= u0;
    v1 -= v0;
    u2 -= u0;
    v2 -= v0;
    var id = 1 / (u1 * v2 - u2 * v1);
    var a = id * (v2 * x1 - v1 * x2);
    var b = id * (v2 * y1 - v1 * y2);
    var c = id * (u1 * x2 - u2 * x1);
    var d = id * (u1 * y2 - u2 * y1);
    var e = x0 - (a * u0 + c * v0);
    var f = y0 - (b * u0 + d * v0);
    ctx.transform(a, b, c, d, e, f);
    ctx.drawImage(image, 0, 0);
    ctx.restore();
  }
}

function ctxDrawBone(ctx, bone_key, bone) {
  ctx.save();
  ctxApplySpace(ctx, bone.world_space);
  if (bone.length > 0) {
    ctx.beginPath();
    ctx.arc(0, 0, 0.05 * bone.length, 0, 2 * Math.PI);
    ctx.moveTo(0, 0);
    ctx.lineTo(0.05 * bone.length, -0.05 * bone.length);
    ctx.lineTo(bone.length, 0);
    ctx.lineTo(0.05 * bone.length, 0.05 * bone.length);
    ctx.closePath();
  } else {
    ctx.beginPath();
    ctx.arc(0, 0, 4, 0, 2 * Math.PI);
    ctx.moveTo(8, 0); ctx.lineTo(16, 0);
    ctx.moveTo(-8, 0); ctx.lineTo(-16, 0);
    ctx.moveTo(0, 8); ctx.lineTo(0, 16);
    ctx.moveTo(0, -8); ctx.lineTo(0, -16);
  }
  ctx.strokeStyle = bone.color.toString();
  ctx.stroke();
  ctx.scale(1, -1);
  ctx.fillStyle = 'black';
  ctx.fillText(bone_key, 0, 0);
  ctx.restore();
}

function ctxDrawIkConstraints(ctx, data, bones) {
  data.ikc_keys.forEach(function(ikc_key) {
    var ikc = data.ikcs[ikc_key];
    var target = bones[ikc.target_key];
    switch (ikc.bone_keys.length) {
      case 1:
        var bone = bones[ikc.bone_keys[0]];

        ctx.beginPath();
        ctx.moveTo(target.world_space.position.x, target.world_space.position.y);
        ctx.lineTo(bone.world_space.position.x, bone.world_space.position.y);
        ctx.strokeStyle = 'yellow';
        ctx.stroke();

        ctx.save();
        ctxApplySpace(ctx, target.world_space);
        ctxDrawCircle(ctx, 'yellow', 1.5);
        ctx.restore();

        ctx.save();
        ctxApplySpace(ctx, bone.world_space);
        ctxDrawCircle(ctx, 'yellow', 0.5);
        ctx.translate(bone.length, 0);
        ctxDrawCircle(ctx, 'yellow', 1.5);
        ctx.restore();
        break;
      case 2:
        var parent = bones[ikc.bone_keys[0]];
        var child = bones[ikc.bone_keys[1]];

        ctx.beginPath();
        ctx.moveTo(target.world_space.position.x, target.world_space.position.y);
        ctx.lineTo(child.world_space.position.x, child.world_space.position.y);
        ctx.lineTo(parent.world_space.position.x, parent.world_space.position.y);
        ctx.strokeStyle = 'yellow';
        ctx.stroke();

        ctx.save();
        ctxApplySpace(ctx, target.world_space);
        ctxDrawCircle(ctx, 'yellow', 1.5);
        ctx.restore();

        ctx.save();
        ctxApplySpace(ctx, child.world_space);
        ctxDrawCircle(ctx, 'yellow', 0.75);
        ctx.translate(child.length, 0);
        ctxDrawCircle(ctx, 'yellow', 1.5);
        ctx.restore();

        ctx.save();
        ctxApplySpace(ctx, parent.world_space);
        ctxDrawCircle(ctx, 'yellow', 0.5);
        ctx.restore();
        break;
    }
  });
}
