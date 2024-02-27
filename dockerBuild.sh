#!/bin/bash
ORG=$1


VERSION=$(cat package.json | jq .version -r)

docker buildx build . -t ${ORG}open-mbee/ve:$VERSION --progress=plain --load --no-cache

docker push ${ORG}open-mbee/ve:$VERSION