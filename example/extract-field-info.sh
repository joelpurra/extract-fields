siteRoot=$1

cd $(dirname "${0}")

mkdir -p output/

phantomjs extract-field-info.js fields "$siteRoot/my-first-form.html" > output/my-first-form.txt
phantomjs extract-field-info.js fields "$siteRoot/another-form.html" > output/another-form.txt
phantomjs extract-field-info.js shared "$siteRoot/my-first-form.html" "$siteRoot/another-form.html" > output/shared.txt

cd - > /dev/null
