const chalk = require( "chalk" );
const path = require( "path" );
const CharacterSet = require( "characterset" );
const puppeteer = require('puppeteer');
const GlyphHangerWhitelist = require( "./GlyphHangerWhitelist" );
const debug = require("debug")("glyphhanger");

class GlyphHanger {
	constructor() {
		this.sets = {
			"*": new CharacterSet()
		};

		this.whitelist = new GlyphHangerWhitelist();
	}

	async getBrowser() {
		if( !this.browser ) {
			this.browser = await puppeteer.launch();
		}

		return this.browser;
	}

	setSubset( subset ) {
		this.subset = !!subset;
	}

	setFetchUrlsCallback( callback ) {
		this.fetchUrlsCallback = callback;
	}

	setJson( outputJson ) {
		this.outputJson = !!outputJson;
	}

	setVerbose( verbose ) {
		this.isVerbose = !!verbose;
	}

	setClassName( classname ) {
		this.className = classname;
	}

	setUnicodesOutput( showString ) {
		this.unicodes = !showString;
	}

	getIsVerbose() {
		return !this.subset && this.isVerbose;
	}

	getIsCodePoints() {
		return this.subset ? true : this.unicodes;
	}

	setWhitelist( whitelistObj ) {
		this.whitelist = whitelistObj;
	}

	addToSets( results ) {
		for( var family in results ) {
			if( !( family in this.sets ) ) {
				this.sets[family] = new CharacterSet();
				this.sets[family] = this.sets[family].union( this.whitelist.getCharacterSet() );
			}
			this.sets[family].add.apply( this.sets[family], results[family] );
		}
	}

	getUniversalSet() {
		return this.sets['*'];
	};

	getSets() {
		return this.sets;
	}

	async _getPage(url) {
		let browser = await this.getBrowser();
		let page = await browser.newPage();

		await page.goto(url, {
			waitUntil: ["load", "networkidle0"]
		});

		return page;
	}

	async _fetchUrl( url ) {
		debug( "requesting: %o", url );

		let page = await this._getPage(url);

		page.on("console", function(msg) {
			debug("(headless browser console): %o", msg.text());
		});

		await page.addScriptTag({
			path: "node_modules/characterset/lib/characterset.js"
		});

		await page.addScriptTag({
			path: "glyphhanger.js"
		});

		let json = await page.evaluate( function(docClassName) {
			if(docClassName && docClassName !== "undefined") {
				// add to both the documentElement and document.body because why not
				document.documentElement.className += " " + docClassName;

				if( "body" in document ) {
					document.body.className += " " + docClassName;
				}
			}

			var hanger = new GlyphHanger();
			hanger.init( document.body );

			return hanger.toJSON();
		}, this.className);

		this.addToSets(json);
	}

	async fetchUrls( urls ) {
		for( let url of urls ) {
			await this._fetchUrl(url);
		}

		let browser = await this.getBrowser();
		await browser.close();
	}

	getOutputForSet(set) {
		if( this.getIsCodePoints() ) {
			return set.toHexRangeString();
		} else {
			return set.toArray().map(function( code ) {
				return String.fromCharCode( code );
			}).join('');
		}
	}

	complete() {
		this.output();

		if( this.fetchUrlsCallback ) {
			this.fetchUrlsCallback( this.sets['*'].toHexRangeString() );
		}
	}

	outputUnicodes( chars ) {
		console.log( this.unicodes ? this.whitelist.getWhitelistAsUnicodes() : this.whitelist.getWhitelist() );
	}

	output() {
		var outputStr = [];

		if( this.outputJson ) {
			// JSON format
			var jsonLines = [];
			for( var family in this.sets ) {
				jsonLines.push("\"" + family + "\": \"" + this.getOutputForSet( this.sets[family] ) + "\"");
			}
			outputStr.push("{" + jsonLines.join(",") + "}");
		} else if( this.getIsVerbose() ) {
			// output each family set individually, but not in json format
			for( var family in this.sets ) {
				var glyphCount = this.sets[family].getSize();
				var familyStr = [];
				familyStr.push( "font-family: " + family + ", " + glyphCount + " glyph" + (glyphCount !== 1 ? 's' : '') );
				familyStr.push( this.getOutputForSet( this.sets[family] ) );

				outputStr.push(familyStr.join(": "));
			}
		} else {
			// output the combined universal set
			outputStr.push( this.getOutputForSet( this.sets['*'] ) );
		}

		console.log( outputStr.join("\n") );	
	}

	outputHelp() {
		var out = [];

		out.push( chalk.red( "glyphhanger error: requires at least one URL or whitelist." ) );
		out.push( "" );
		out.push( "usage: glyphhanger ./test.html" );
		out.push( "       glyphhanger http://example.com" );
		out.push( "       glyphhanger https://google.com https://www.filamentgroup.com" );
		out.push( "       glyphhanger http://example.com --subset=*.ttf" );
		out.push( "       glyphhanger --whitelist=abcdef --subset=*.ttf" );
		out.push( "" );
		out.push( "arguments: " );
		out.push( "  --verbose" );
		out.push( "  --version" );
		out.push( "  --whitelist=abcdef" );
		out.push( "       A list of whitelist characters (optionally also --US_ASCII)." );
		out.push( "  --string" );
		out.push( "       Output the actual characters instead of Unicode code point values." );
		out.push( "  --subset=*.ttf" );
		out.push( "       Automatically subsets one or more font files using fonttools `pyftsubset`." );
		out.push( "  --formats=ttf,woff,woff2,woff-zopfli" );
		out.push( "       woff2 requires brotli, woff-zopfli requires zopfli, installation instructions: https://github.com/filamentgroup/glyphhanger#installing-pyftsubset" );
		out.push( "" );
		out.push( "  --spider" );
		out.push( "       Gather local URLs from the main page and navigate those URLs." );
		out.push( "  --spider-limit=10" );
		out.push( "       Maximum number of URLs gathered from the spider (default: 10, use 0 to ignore)." );
		console.log( out.join( "\n" ) );
	}
}

module.exports = GlyphHanger;