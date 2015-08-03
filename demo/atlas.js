goog.provide('atlas');
goog.provide('atlas.Data');
goog.provide('atlas.Page');
goog.provide('atlas.Site');

/**
 * @constructor
 */
atlas.Page = function ()
{
	var page = this;
	page.name = "";
	page.w = 0;
	page.h = 0;
	page.format = "RGBA8888";
	page.min_filter = "linear";
	page.mag_filter = "linear";
	page.wrap_s = "clamp-to-edge";
	page.wrap_t = "clamp-to-edge";
}

/**
 * @constructor
 */
atlas.Site = function ()
{
	var site = this;
	site.page = -1;
	site.x = 0;
	site.y = 0;
	site.w = 0;
	site.h = 0;
	site.rotate = false;
	site.offset_x = 0;
	site.offset_y = 0;
	site.original_w = 0;
	site.original_h = 0;
	site.index = -1;
}

/**
 * @constructor
 */
atlas.Data = function ()
{
	var data = this;
	data.pages = [];
	data.sites = {};
}

/**
 * @return {atlas.}
 * @param {string} text
 */
atlas.Data.prototype.import = function (text)
{
	var data = this;

	data.pages = [];
	data.sites = {};

	function trim (s) { return s.replace(/^\s+|\s+$/g, ""); }

	var page = null;
	var site = null;

	var lines = text.split(/\n|\r\n/);
	var match = null;

	lines.forEach(function (line)
	{
		if (trim(line).length === 0)
		{
			page = null;
			site = null;
		}
		else if (match = line.match(/^size: (.*),(.*)$/))
		{
			page.w = parseInt(match[1], 10);
			page.h = parseInt(match[2], 10);
		}
		else if (match = line.match(/^format: (.*)$/))
		{
			page.format = match[1];
		}
		else if (match = line.match(/^filter: (.*),(.*)$/))
		{
			page.min_filter = match[1].toLowerCase();
			page.mag_filter = match[2].toLowerCase();
		}
		else if (match = line.match(/^repeat: (.*)$/))
		{
			var repeat = match[1];
			page.wrap_s = ((repeat === 'x') || (repeat === 'xy'))?('repeat'):('clamp-to-edge');
			page.wrap_t = ((repeat === 'y') || (repeat === 'xy'))?('repeat'):('clamp-to-edge');
		}
		else if (match = line.match(/^orig: (.*)[,| x] (.*)$/))
		{
			var original_w = parseInt(match[1], 10);
			var original_h = parseInt(match[2], 10);
			console.log("page:orig", original_w, original_h);
		}
		else if (page === null)
		{
			page = new atlas.Page();
			page.name = line;
			data.pages.push(page);
		}
		else
		{
			if (match = line.match(/^  rotate: (.*)$/))
			{
				site.rotate = (match[1] !== 'false');
			}
			else if (match = line.match(/^  xy: (.*), (.*)$/))
			{
				site.x = parseInt(match[1], 10);
				site.y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  size: (.*), (.*)$/))
			{
				site.w = parseInt(match[1], 10);
				site.h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  orig: (.*), (.*)$/))
			{
				site.original_w = parseInt(match[1], 10);
				site.original_h = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  offset: (.*), (.*)$/))
			{
				site.offset_x = parseInt(match[1], 10);
				site.offset_y = parseInt(match[2], 10);
			}
			else if (match = line.match(/^  index: (.*)$/))
			{
				site.index = parseInt(match[1], 10);
			}
			else
			{
				if (site)
				{
					site.original_w = site.original_w || site.w;
					site.original_h = site.original_h || site.h;
				}
				
				site = new atlas.Site();
				site.page = data.pages.length - 1;
				data.sites[line] = site;
			}
		}
	});

	return data;
}
