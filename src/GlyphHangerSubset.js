const shell = require( "shelljs" );
const parsePath = require( "parse-filepath" );
const fs = require( "fs" );
const filesize = require( "filesize" );
const path = require( "path" );
const chalk = require( "chalk" );
const glob = require( "glob" );
const GlyphHangerFormat = require("./GlyphHangerFormat");
const FontFaceOutput = require("./FontFaceOutput");

class GlyphHangerSubset {
	constructor() {
		this.formats = new GlyphHangerFormat();
		this.cssOutput = false;
	}

	setCSSOutput( cssOutput ) {
		this.cssOutput = !!cssOutput;
	}

	setFamilies( families ) {
		if( families && typeof families === "string" ) {
			let split = families.split(",").map(family => family.trim());
			if( split.length ) {
				this.family = split[0];
			}
		}

		this.families = families;
	}

	setFontFilesGlob( ttfFilesGlob ) {
		this.fontPaths = glob.sync( ttfFilesGlob );
	}

	setFontFiles( ttfFontFiles ) {
		this.fontPaths = ttfFontFiles;
	}

	setFormats( formatsString ) {
		if( formatsString ) {
			this.formats.setFormats( formatsString );
		}
	}

	getFontFace(ttfPath, dir, unicodeRange) {
		let content = [];
		if(this.family) {
			content.push(`  font-family: ${this.family};`);
		}

		content.push(`  src: ${this.getSrcDescriptor(ttfPath, dir)};`);
		content.push(`  unicode-range: ${unicodeRange};`);

		return `@font-face {
${content.join("\n")}
}`;
	}

	getPath( filePath, dir ) {
		if( dir ) {
			return path.join(dir, filePath);
		} else {
			return filePath;
		}
	}

	getSrcDescriptor( ttfPath, dir ) {
		var src = [];
		if( this.formats.hasFormat( "woff2" ) ) {
			src.push(`url(${this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff2"), dir)}) format("woff2")`);
		}
		if( this.formats.hasFormat( "woff-zopfli" ) ) {
			src.push(`url(${this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff", true), dir)}) format("woff")`);
		} else if( this.formats.hasFormat( "woff" ) ) {
			src.push(`url(${this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff"), dir)}) format("woff")`);
		}
		if( this.formats.hasFormat( "ttf" ) ) {
			src.push(`url(${this.getPath(this.getFilenameFromTTFPath(ttfPath), dir)}) format("truetype")`);
		}
		return src.join(", ");
	}

	getFilenames( ttfPath, dir ) {
		var files = [];
		if( this.formats.hasFormat( "ttf" ) ) {
			files.push(this.getPath(this.getFilenameFromTTFPath(ttfPath), dir));
		}
		if( this.formats.hasFormat( "woff" ) ) {
			files.push(this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff"), dir));
		}
		if( this.formats.hasFormat( "woff-zopfli" ) ) {
			files.push(this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff", true), dir));
		}
		if( this.formats.hasFormat( "woff2" ) ) {
			files.push(this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff2"), dir));
		}
		return files;
	}

	getFilenameFromTTFPath( ttfPath, format, useZopfli ) {
		var fontPath = parsePath( ttfPath );
		var outputFilename = fontPath.name + "-subset" + ( useZopfli ? ".zopfli" : "" ) + ( format ? "." + format : fontPath.ext );
		return outputFilename;
	}

	subsetAll( unicodes, formats ) {
		this.fontPaths.forEach(function( fontPath ) {
			if( this.formats.hasFormat( "ttf" ) ) {
				this.subset( fontPath, unicodes );
			}
			if( this.formats.hasFormat( "woff" ) ) {
				this.subset( fontPath, unicodes, "woff", false );
			}
			if( this.formats.hasFormat( "woff-zopfli" ) ) {
				this.subset( fontPath, unicodes, "woff", true );
			}
			if( this.formats.hasFormat( "woff2" ) ) {
				this.subset( fontPath, unicodes, "woff2" );
			}

			if( this.cssOutput ) {
				console.log();
				console.log(this.getFontFace(fontPath, parsePath(fontPath).dir, unicodes));
				console.log();
			}
		}.bind( this ));
	}

	subset( inputFile, unicodes, format, useZopfli ) {
		var outputFilename = this.getFilenameFromTTFPath( inputFile, format, useZopfli );
		var outputFullPath = path.join( parsePath( inputFile ).dir, outputFilename );
		var cmd = [ "pyftsubset" ];
		cmd.push( inputFile );
		cmd.push( "--output-file=" + outputFullPath );
		cmd.push( "--unicodes=" + unicodes );
		cmd.push( "--layout-features='*'" );
		if( format ) {
			format = format.toLowerCase();

			cmd.push( "--flavor=" + format );

			if( format === "woff" && useZopfli ) {
				cmd.push( "--with-zopfli" );
			}
		}

		if( !shell.which( "pyftsubset" ) ) {
			console.log( "`pyftsubset` from fonttools is required for the --subset feature." );
			shell.exit(1);
		}

		if( shell.exec( cmd.join( " " ) ).code !== 0 ) {
			shell.echo( "Error: pyftsubset command failed (" + cmd.join( " " ) + ")." );
			shell.exit(1);
		}

		var inputStat = fs.statSync( inputFile );
		var outputStat = fs.statSync( outputFullPath );
		console.log( "Subsetting", inputFile, "to", outputFilename, "(was " + chalk.red( filesize( inputStat.size ) ) + ", now " + chalk.green( filesize( outputStat.size ) ) + ")" );
	}
}

module.exports = GlyphHangerSubset;