# [extract-fields](https://github.com/joelpurra/extract-fields)

Scripts to extract HTML form field information from one or several webpages.



## Usage

Make sure you have installed [phantomjs](http://phantomjs.org/) first.

```bash
$ phantomjs extract-field-info.js
# extract-field-info.js: extracts general form field info from HTML pages over HTTP.
# Usage: extract-field-info.js <mode> [arguments]
#   MODE 		 ARGUMENTS
#   ---- 		 ---------
#   help
#   fields 		  address
#   shared 		  address1  address2  more
```



## Examples

### Command line

Extract the field information for [google.com](http://google.com/).

```bash
$ phantomjs src/extract-field-info.js fields "http://google.com/" 2>/dev/null
```

The final `2>/dev/null` is just there to hide some phantomjs error output about font performance.


### `extract-field-info.sh`

Reads the files in the `examples/html/` folder.

In one terminal, start [jekyll](http://jekyllrb.com/) as a webserver.

```bash
$ cd example/html/
$ jekyll serve --watch
```

In a second terminal, run the extraction script.

```bash
$ cd example/
$ ./example/extract-field-info.sh "http://localhost:4000"
```

Look in `example/output/` for the result.


### `extract-field-names.sh`

Reads the files in the `examples/html/` folder.

```bash
$ cd example/
$ ./example/extract-field-name.sh
```

Look in `example/output/html/` for the result.



## License

Copyright (c) 2012, 2013, [Joel Purra](http://joelpurra.com/) All rights reserved.

When using extract-fields, comply to the [MIT license](http://joelpurra.mit-license.org/2012-2013). Please see the LICENSE file for details, and the [MIT License on Wikipedia](http://en.wikipedia.org/wiki/MIT_License).



[![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/joelpurra/extract-fields/trend.png)](https://bitdeli.com/free "Bitdeli Badge")
