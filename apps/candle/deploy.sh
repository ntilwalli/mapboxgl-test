#!/bin/bash

echo "Deleting cyclejs directory"
rm -rf custom_deps/cyclejs
echo "Copying existing cyclejs repo"
cp -r ../../../cycle/cyclejs custom_deps
echo "Deleting all non dom directories"
find custom_deps/cyclejs -type d -mindepth 1 | grep -v dom | xargs rm -rf
echo "Deleting all .git directories from cyclejs"
find custom_deps/cyclejs -name ".git" -exec rm -rf '{}' +
echo "Deleting all node_modules directories from cyclejs"
find custom_deps/cyclejs -name "node_modules" -exec rm -rf '{}' +
git add custom_deps/cyclejs
git add custom_deps/cyclejs/dom/dist -f

