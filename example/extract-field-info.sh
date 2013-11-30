#!/bin/bash
set -e

# This script assumes you're running a webserver, that phantomjs can connect to and perform its magic.

if [ -z "$1" ]
then
	echo Usage: `basename $0` "http://localhost/path/to/html/subfolder"
	echo Note: Note: no trailing slash in the site root URL.
	exit 1
fi

siteRoot=$1

extractjs="src/extract-field-info.js"

cd $(dirname "${0}")/../

outdir=example/output

mkdir -p $outdir

phantomjs "$extractjs" fields "$siteRoot/my-first-form.html" > $outdir/my-first-form.txt 2>/dev/null
phantomjs "$extractjs" fields "$siteRoot/another-form.html" > $outdir/another-form.txt 2>/dev/null
phantomjs "$extractjs" shared "$siteRoot/my-first-form.html" "$siteRoot/another-form.html" > $outdir/shared.txt 2>/dev/null

cd - > /dev/null
