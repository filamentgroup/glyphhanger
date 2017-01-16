#!/usr/bin/env node

var path = require( "path" );
var phantomjs = require( "phantomjs-prebuilt" );
var childProcess = require( "child_process" );
var chalk = require( "chalk" );
var argv = require( "minimist" )( process.argv.slice(2) );

var pluginName = "glyphhanger";

var urlsChildArgs = [
	path.join( __dirname, "phantomjs-urls.js" )
];

var childArgs = [
	path.join( __dirname, "phantomjs-glyphhanger.js" )
];

if( !argv._ || !argv._.length ) {
	var out = [];

	out.push( chalk.red( "glyphhanger error: requires at least one URL argument." ) );
	out.push( "" );
	out.push( "usage: glyphhanger ./test.html" );
	out.push( "       glyphhanger http://example.com" );
	out.push( "       glyphhanger https://google.com https://www.filamentgroup.com" );
	out.push( "" );
	out.push( "arguments: " );
	out.push( "  -w abcdef" );
	out.push( "       A list of whitelist characters." );
	out.push( "  --US_ASCII" );
	out.push( "       Shortcut for whitelisting the printable US-ASCII characters" );
	out.push( "  --unicodes" );
	out.push( "       Output code points instead of string values (better compatibility)." );
	out.push( "  --verbose" );
	out.push( "  --spider" );
	out.push( "       Gather urls from the main page and navigate those URLs." );
	out.push( "  --spider-limit=10" );
	out.push( "       Maximum number of URLs gathered from the spider." );

	console.log( out.join( "\n" ) );
	return;
}

// Verbose mode
childArgs.push( argv.verbose ? true : false );

// Output code points
childArgs.push( argv.unicodes ? true : false );

// Whitelisted characters
var whitelist = "";
if( argv.w ) {
	whitelist += argv.w;
}
if( argv.US_ASCII ) {
	whitelist += " ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!\"#$%&'()*+,-./:;<=>?@[\\]^_`{|}~";
}
childArgs.push( whitelist );

// Spider for URLs
urlsChildArgs = urlsChildArgs.concat( argv._ );

function phantomGlyphhanger( urls ) {
	var prefix = pluginName + "-spider found";
	if( argv.verbose ) {
		urls.forEach(function( url, index ) {
			console.log( prefix + " (" + index + "): " + url );
		});
	}

	childProcess.execFile( phantomjs.path, childArgs.concat( urls ), function( error, stdout, stderr ) {
		if( error ) {
			throw error;
		}

		console.log( stdout );
	});
}

if( !argv.spider ) {
	phantomGlyphhanger( argv._ );
} else {
	childProcess.execFile( phantomjs.path, urlsChildArgs, function( error, stdout, stderr ) {
		if( error ) {
			throw error;
		}

		var urls = stdout.trim().split( "\n" );
		phantomGlyphhanger( urls.slice( 0, argv[ 'spider-limit' ]  || 10 ) );
	});
}