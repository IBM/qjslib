#!/bin/bash

function main() {
    repo="$1"
    token="$2"
    commit_name="$3"

    git config --global user.email "qjslib@ibm.com"
    git config --global user.name "QJSLib CI"

    git clone "https://${token}@github.com/${repo}.wiki.git"

    cp -rf docs/* qjslib.wiki/

    cd qjslib.wiki

    if [[ $(git status --porcelain) ]]; then
        git add .
        git commit -m "${{github.ref_name}}"
        git push origin master --force
    fi
}

main "$@"
