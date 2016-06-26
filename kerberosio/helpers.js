module.exports = {
	// Gets the newest file from a directory, filtering by regexp.
	// Example: var f = getNewestFile("./", new RegExp('.*\.mp3'))
	getNewestFile: function (dir, regexp) {
	    var fs = require("fs"),
	     path = require('path'),
	    newest = null,
	    files = fs.readdirSync(dir),
	    one_matched = 0,
	    i

	    for (i = 0; i < files.length; i++) {
	
	        if (regexp.test(files[i]) == false)
	            continue
	        else if (one_matched == 0) {
	            newest = files[i];
	            one_matched = 1;
	            continue
	        }

	        f1_time = fs.statSync(path.join(dir, files[i])).mtime.getTime()
	        f2_time = fs.statSync(path.join(dir, newest)).mtime.getTime()
	        if (f1_time > f2_time)
	            newest[i] = files[i]  
	    }

	    if (newest != null)
	        return (path.join(dir, newest))
	    return null
	}
}
