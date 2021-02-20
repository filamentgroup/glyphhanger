const shell = require( "shelljs" );
const parsePath = require( "parse-filepath" );
const fs = require( "fs" );
const filesize = require( "filesize" );
const path = require( "path" );
const chalk = require( "chalk" );
const glob = require( "glob" );
const GlyphHangerFormat = require("./GlyphHangerFormat");
const debug = require("debug")("glyphhanger:subset");

class GlyphHangerSubset {
	constructor() {
		this.formats = new GlyphHangerFormat();
	}

	setOutputDirectory( outputDir ) {
		if( outputDir ) {
			this.outputDirectory = outputDir;
		}
	}

	getOutputDirectory() {
		return this.outputDirectory;
	}

	setOutputSuffix( suffix ) {
		if( suffix != null ) {
			this.outputSuffix = suffix;
		}
	}

	getOutputSuffix() {
		return this.outputSuffix;
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

	getPath( filePath, dir ) {
		if( dir ) {
			return path.join(dir, filePath);
		} else {
			return filePath;
		}
	}

	getPaths() {
		return this.fontPaths;
	}

	getSrcsObject( ttfPath, dir ) {
		var srcs = {};
		if( this.formats.hasFormat( "woff2" ) ) {
			srcs.woff2 = this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff2"), dir);
		}
		if( this.formats.hasFormat( "woff-zopfli" ) ) {
			srcs.woff = this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff", true), dir);
		} else if( this.formats.hasFormat( "woff" ) ) {
			srcs.woff = this.getPath(this.getFilenameFromTTFPath(ttfPath, "woff"), dir);
		}
		if( this.formats.hasFormat( "ttf" ) ) {
			srcs.truetype = this.getPath(this.getFilenameFromTTFPath(ttfPath), dir);
		}
		return srcs;
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
		var suffix = this.getOutputSuffix();;
		var outputFilename = fontPath.name + (suffix == null ? "-subset" : suffix) + ( useZopfli ? ".zopfli" : "" ) + ( format ? "." + format : fontPath.ext );
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
		}.bind( this ));
	}

	subset( inputFile, unicodes, format, useZopfli ) {
		var outputFilename = this.getFilenameFromTTFPath( inputFile, format, useZopfli );
		var outputDir = this.outputDirectory || parsePath( inputFile ).dir;
		var outputFullPath = path.join( outputDir, outputFilename );
		var cmd = [ "pyftsubset" ];
		cmd.push( "\"" + inputFile + "\"" );
		cmd.push( "--output-file=\"" + outputFullPath + "\"" );
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

		debug("command: %o", cmd.join( " " ));

		if( shell.exec( cmd.join( " " ) ).code !== 0 ) {
			shell.echo( "Error: pyftsubset command failed (" + cmd.join( " " ) + ")." );
			shell.exit(1);
		}

		if( !unicodes ) {
			console.log( chalk.yellow( "Warning: the unicode range for " + outputFilename + " was empty! Is your --family wrong? Was your URL empty?" ) );
		}
		var inputStat = fs.statSync( inputFile );
		var outputStat = fs.statSync( outputFullPath );
		console.log( "Subsetting", inputFile, "to", outputFilename, "(was " + chalk.red( filesize( inputStat.size ) ) + ", now " + chalk.green( filesize( outputStat.size ) ) + ")" );
	}
}

module.exports = GlyphHangerSubset;