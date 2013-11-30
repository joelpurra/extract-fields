#!/bin/bash
set -e

# This script assumes you're running a webserver, that phantomjs can connect to and perform its magic.

# Usage
#
# $ ./extract-field-info.sh "http://localhost/path/to/html/subfolder"
#
# Note: no trailing slash in the site root URL.
#

siteRoot=$1

extractjs="src/extract-field-info.js"

cd $(dirname "${0}")/../

outdir=example/output

mkdir -p $outdir

phantomjs "$extractjs" fields "$siteRoot/my-first-form.html" > $outdir/my-first-form.txt
phantomjs "$extractjs" fields "$siteRoot/another-form.html" > $outdir/another-form.txt
phantomjs "$extractjs" shared "$siteRoot/my-first-form.html" "$siteRoot/another-form.html" > $outdir/shared.txt

cd - > /dev/null
