/**
 * Copyright (c) Flyover Games, LLC
 */

process.on('SIGEXIT', function ()
{
	console.log("SIGEXIT");
	process.exit();
});

var port = parseInt(process.argv[2], 10) || 3080;
//console.log("port", port);

var express = require('express');
var app = express();
app.use(express.static(__dirname));
//app.use(express.logger());
//app.use(express.favicon());
//app.use(express.bodyParser());

app.listen(port);

