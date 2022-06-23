#!/bin/bash

function main() {
    commit_name="$1"

    git config --global user.email "qjslib@ibm.com"
    git config --global user.name "QJSLib CI"

    cp -rf docs/* qjslib.wiki/

    cd qjslib.wiki

    if [[ $(git status --porcelain) ]]; then
        git add .
        git commit -m "${{github.ref_name}}"
    fi
}

main "$@"
