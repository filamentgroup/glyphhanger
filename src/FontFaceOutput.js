const FontStats = require("font-stats");

function FontFaceOutput() {
	this.sets = [];
}


FontFaceOutput.prototype.addFamily = function( ttfFile, woffFile, woff2File ) {
	let stats = new FontStats(ttfFile);
	console.log( stats.stats );
};

module.exports = FontFaceOutput;