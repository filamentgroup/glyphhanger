#!/usr/bin/env node
var argv = require( "minimist" )( process.argv.slice(2) );
var GlyphHanger = require( "./src/GlyphHanger" );
var GlyphHangerFormat = require( "./src/GlyphHangerFormat" );
var GlyphHangerWhitelist = require( "./src/GlyphHangerWhitelist" );
var GlyphHangerSubset = require( "./src/GlyphHangerSubset" );
var GlyphHangerFontFace = require( "./src/GlyphHangerFontFace" );
var MultipleSpiderPigs = require( "./src/MultipleUrlSpiderPig" );
const debug = require( "debug" )( "glyphhanger:cli" );

var whitelist = new GlyphHangerWhitelist( argv.w || argv.whitelist, {
	US_ASCII: argv.US_ASCII,
	LATIN: argv.LATIN
});

var gh = new GlyphHanger();
gh.setUnicodesOutput( argv.string );
gh.setWhitelist( whitelist );
gh.setSubset( argv.subset );
gh.setJson( argv.json );
gh.setClassName( argv.classname );
gh.setFamilies( argv.family );
gh.setTimeout( argv.timeout );
gh.setVisibilityCheck( argv.onlyVisible );
gh.setCSSSelector( argv.cssSelector );

var subset = new GlyphHangerSubset();
subset.setOutputDirectory(argv.output);

if( argv.formats ) {
	subset.setFormats( argv.formats );
}
if( argv.subset ) {
	subset.setFontFilesGlob( argv.subset );
}

var fontface = new GlyphHangerFontFace();
fontface.setFamilies( argv.family );
fontface.setCSSOutput( argv.css );

if( argv.subset ) {
	fontface.setSubset( subset );
}

// glyphhanger --version
// glyphhanger --help
// glyphhanger
// glyphhanger http://localhost/
// glyphhanger http://localhost/ --timeout									(change timeout, in ms, default is 30000)
// glyphhanger http://localhost/ http://localhost2/					(multiple urls are welcome)
// glyphhanger http://localhost/ --spider 									(limit default 10)
// glyphhanger http://localhost/ --spider-limit							(limit default 10)
// glyphhanger http://localhost/ --spider-limit=0 					(no limit)
// glyphhanger http://localhost/ --spider-limit=1						(limit 1)
// glyphhanger --whitelist=ABCD															(convert characters to unicode range)
// glyphhanger --US_ASCII																		(convert characters to unicode range)
// glyphhanger --US_ASCII --whitelist=ABCD									(convert characters to unicode range)
// glyphhanger --LATIN
// glyphhanger --subset=*.ttf																(file format conversion)
// glyphhanger --subset=*.ttf --whitelist=ABCD							(reduce to whitelist characters)
// glyphhanger --subset=*.ttf --US_ASCII										(reduce to US_ASCII characters)
// glyphhanger --subset=*.ttf --US_ASCII --whitelist=ABCD		(reduce to US_ASCII union with whitelist)
// glyphhanger --family='My Serif'													(outputs results for specific family)
// glyphhanger --family='My Serif' --css										(outputs results for specific family with a font-face block)
// glyphhanger --subset=*.ttf --family='My Serif'						(subset group of fonts to results for specific family)
// glyphhanger --subset=*.ttf --family='My Serif' -css			(subset group of fonts to results for specific family and a font-face block)
// glyphhanger --subset=*.ttf --output=dist/								(change the output directory for subset files)

if( argv.version ) {
	var pkg = require( "./package.json" );
	console.log( pkg.version );
} else if( argv.help ) {
	gh.outputHelp();
} else if( argv._ && argv._.length ) {
	(async function() {
		// Spider
		if( argv.spider || argv[ 'spider-limit' ] || argv[ 'spider-limit' ] === 0 ) {
			let sp = new MultipleSpiderPigs();
			sp.setLimit(argv[ 'spider-limit' ]);
			await sp.fetchUrls(argv._);

			let urls = sp.getUrlsWithLimit();
			await sp.finish();
			debug( "Urls (after limit): %o", urls );

			await gh.fetchUrls( urls );
		} else {
			await gh.fetchUrls( argv._ );
		}

		gh.output();

		try {
			fontface.setUnicodeRange( gh.getUnicodeRange() );
			fontface.writeCSSFiles();
		} catch(e) {
			console.log("GlyphHangerFontFace Error: ", e);
		}

		try {
			if( argv.subset ) {
				subset.subsetAll( gh.getUnicodeRange() );
			}
		} catch(e) {
			console.log("GlyphHangerSubset Error: ", e);
		}

		try {
			fontface.output();
		} catch(e) {
			console.log("GlyphHangerFontFace Error: ", e);
		}
	})();
} else { // not using URLs
	if( argv.subset ) {
		gh.output();

		try {
			// --subset with or without --whitelist
			subset.subsetAll( !whitelist.isEmpty() ? whitelist.getWhitelistAsUnicodes() : whitelist.getUniversalRangeAsUnicodes() );
		} catch(e) {
			console.log("GlyphHangerSubset Error: ", e);
		}

		try {
			if(!whitelist.isEmpty()) {
				fontface.setUnicodeRange( whitelist.getWhitelistAsUnicodes());
			}
			fontface.writeCSSFiles();
			fontface.output();
		} catch(e) {
			console.log("GlyphHangerFontFace Error: ", e);
		}
	} else if( !whitelist.isEmpty() ) {
		// not subsetting, just output the code points (can convert whitelist string to code points)
		gh.outputUnicodes();

		try {
			fontface.setUnicodeRange( whitelist.getWhitelistAsUnicodes());
			fontface.writeCSSFiles();
			fontface.output();
		} catch(e) {
			console.log("GlyphHangerFontFace Error: ", e);
		}
	} else {
		gh.outputHelp();
	}

}
