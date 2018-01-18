#!/usr/bin/env node
var argv = require( "minimist" )( process.argv.slice(2) );
var glob = require( "glob" );
var GlyphHangerFormat = require( "./src/GlyphHangerFormat" );
var GlyphHangerWhitelist = require( "./src/GlyphHangerWhitelist" );
var PhantomGlyphHanger = require( "./src/PhantomGlyphHanger" );
var PhantomGlyphHangerSpider = require( "./src/PhantomGlyphHangerSpider" );
var GlyphHangerSubset = require( "./src/GlyphHangerSubset" );

var formats = new GlyphHangerFormat( argv.formats );
var whitelist = new GlyphHangerWhitelist( argv.w || argv.whitelist, argv.US_ASCII );

var pgh = new PhantomGlyphHanger();
pgh.setVerbose( argv.verbose );
if( argv.unicodes ) {
	console.log( '--unicodes was made default in v2.0. To output characters instead of code points, use --string' );
	require( "shelljs" ).exit(1);
}
pgh.setUnicodesOutput( argv.string );
pgh.setWhitelist( whitelist );
pgh.setSubset( argv.subset );

var subset = new GlyphHangerSubset();
subset.setFormats( formats );

if( argv.subset ) {
	var fontFiles = glob.sync( argv.subset );

	subset.setFontFiles( fontFiles );

	pgh.setFetchUrlsCallback(function( unicodes ) {
		subset.subsetAll( unicodes );
	});
}

if( argv.version ) {
	var pkg = require( "./package.json" );
	console.log( pkg.version );
} else if( ( !argv._ || !argv._.length ) && whitelist.usingWhitelist() ) {
	if( argv.subset ) {
		subset.subsetAll( whitelist.getWhitelistAsUnicodes() );
	} else {
		pgh.output();
	}
} else if( !argv._ || !argv._.length ) {
	pgh.outputHelp();
} else if( argv.spider || argv[ 'spider-limit' ] || argv[ 'spider-limit' ] === 0 ) {
	var spider = new PhantomGlyphHangerSpider();
	spider.setLimit( argv[ 'spider-limit' ] );

	spider.findUrls( argv._, function( urls ) {
		if( argv.verbose ) {
			urls.forEach(function( url, index ) {
				console.log( "glyphhanger-spider found (" + ( index + 1 ) + "): " + url );
			});
		}

		pgh.fetchUrls( urls );
	});
} else {
	pgh.fetchUrls( argv._ );
}
