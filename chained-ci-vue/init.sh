#!/usr/bin/env sh

export RUN_SCRIPT=${0}
export INV_FOLDER=${1}
export ROOT_FOLDER=${PWD}

mkdir ${ROOT_FOLDER}/public
mkdir -p ${ROOT_FOLDER}/public/${INV_FOLDER}/host_vars
mkdir -p ${ROOT_FOLDER}/public/${INV_FOLDER}/group_vars

yaml2json(){
  SRC=$1
  DEST="public/${SRC%.*}.json";
  echo "convert ${SRC} to ${DEST}"
  yq '.' ${SRC} > ${DEST}
}

updateConf(){
  ITEM=$1
  VALUE=$(echo $2| sed 's/:/\\:/g')
  echo "set $ITEM to $VALUE"
  sed -i -e "s|^var $ITEM = .*$|var $ITEM = \"$VALUE\";|" ${ROOT_FOLDER}/public/js/config.js
}

updateConfObj(){
  ITEM=$1
  VALUE=$(echo $2| sed 's/:/\\:/g')
  echo "set $ITEM to $VALUE"
  sed -i -e "s|^var $ITEM = .*$|var $ITEM = $VALUE;|" ${ROOT_FOLDER}/public/js/config.js
}

## Install Yq
pip install --user yq
include_splitted=$( yq -r '.include' ${CI_CONFIG_PATH})
# Convert chained_ci files to json
if [ -z "${include_splitted}" ]; then
  # Monolitic gitlab ci, doing nothing
  echo "no need to merge splitted files"
else
  # Non monolitic gitlab ci, add the yaml part into main one
  for part_file in $(yq -r '.include[]' ${CI_CONFIG_PATH}); do
         sed 's/---//' $part_file >> ${CI_CONFIG_PATH}
  done
fi
yaml2json ${CI_CONFIG_PATH}

for sc in ${INV_FOLDER}/host_vars/*.yml; do
  yaml2json $sc
done
yaml2json ${INV_FOLDER}/group_vars/all.yml

# Copy site
cp -rf chained-ci-vue/js public/
cp -rf chained-ci-vue/index.html public/
cp -rf chained-ci-vue/style.css public/

# Generate config
updateConf gitlabUrl ${CI_PROJECT_URL%"$CI_PROJECT_PATH"}
updateConf chainedCiProjectId ${CI_PROJECT_ID}
updateConf scenarioFolder "${INV_FOLDER}/"
updateConf chainedCiUrl ${CI_PROJECT_URL}
updateConf gitlabCiFilename "${CI_CONFIG_PATH%.*}.json"
updateConf pipelines_size ${pipeline_size:-10}
updateConf rootUrl "${CI_PROJECT_NAME}/"

# get all gitlab used
tokenTargets=$(jq -r '.gitlab.git_projects | map(try(.url | split("/")| .[2]))| sort | unique | @csv' ${ROOT_FOLDER}/public/${INV_FOLDER}/group_vars/all.json)
updateConfObj tokenTargets "[${tokenTargets}]"
