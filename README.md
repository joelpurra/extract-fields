# [extract-fields](https://github.com/joelpurra/extract-fields)

Scripts to extract HTML form field information from one or several webpages.



> ## ⚠️ This project has been archived
>
> No future updates are planned. Feel free to continue using it, but expect no support.



## Usage

Make sure you have installed [phantomjs](https://phantomjs.org/) first.

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

The final `2>/dev/null` is just there to hide some phantomjs error output about font performance.


### Command line

Extract the field names/values for [google.com](https://google.com/).

```bash
$ phantomjs src/extract-field-info.js fields "https://google.com/" 2>/dev/null
```

Extract the field names/values for [github.com](https://github.com/).

```bash
$ phantomjs src/extract-field-info.js fields "https://github.com/" 2>/dev/null
```

While it doesn't make much sense, let's extract the *shared* field names/values for [google.com](https://google.com/) and [github.com](https://github.com/).

```bash
$ phantomjs src/extract-field-info.js shared "https://google.com/" "https://github.com/" 2>/dev/null
```


### `extract-field-info.sh`

Reads the files in the `examples/html/` folder.

In one terminal, start [jekyll](https://jekyllrb.com/) as a webserver.

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



## See also

- [FormFieldInfo](https://github.com/joelpurra/formfieldinfo), a javascript plugin used to collect information about forms in a page, which is used by the phantomjs script.


## License

Copyright (c) 2012, 2013, 2014, 2015, [Joel Purra](https://joelpurra.com/) All rights reserved.

When using extract-fields, comply to the [MIT license](https://joelpurra.mit-license.org/2012-2013). Please see the LICENSE file for details, and the [MIT License on Wikipedia](https://en.wikipedia.org/wiki/MIT_License).
