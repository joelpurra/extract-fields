#!/bin/bash

forms=( "html/my-first-form.html" "html/another-form.html" )

cd $(dirname "${0}")

for form in "${forms[@]}"
do
   :
	sed -n 's/.*name="\([^"]*\)".*/\1/p' $form | perl -ne '$H{$_}++ or print' | egrep -v 'description|viewport' > "$form.field-names.txt"
done

cat `find . -name '*.field-names.txt' -print` | perl -ne '0==$H{$_}-- or print' > `dirname ${forms[0]}`/shared-field-names.txt

cd - > /dev/null
