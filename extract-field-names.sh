#!/bin/bash

forms=( "html/my-first-form.html" "html/another-form.html" )

cd $(dirname "${0}")

for form in "${forms[@]}"
do
   :
	sed -n 's/.*name="\([^"]*\)".*/\1/p' $form | perl -ne '$H{$_}++ or print' | egrep -v 'description|viewport' > "$form.field-names.txt"
done

cat `find . -name '*.field-names.txt' -print` | perl -ne '0==$H{$_}-- or print' > `dirname ${forms[0]}`/shared-field-names.txt

# Optional
# Prepend the file with YAML front matter, to have
# Jekyll regenerate the _site/ output for us.
# From
# 	http://stackoverflow.com/questions/54365/prepend-to-a-file-one-liner-shell
# 	http://stackoverflow.com/a/3272296/
# 	http://stackoverflow.com/a/5297363/
# TODO: build new array
#for form in "field-names-${forms[0]}" "field-names-${forms[1]}" "shared-field-names"
#do
#	:
#	printf "%s\n" '0a' '---' '---' '.' 'wq' | ed -s $form.txt
#done

cd - > /dev/null
