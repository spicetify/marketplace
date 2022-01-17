#!/bin/sh
# Copyright 2019 khanhas. GPL license.
# Edited from project Denoland install script (https://github.com/denoland/deno_install)
set -e


    latest_release_uri="https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip"
    echo "DOWNLOADING    $latest_release_uri"

    download_uri="https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip"

spicetify_install="${SPICETIFY_INSTALL:-$HOME/spicetify-cli/CustomApps}"

if [ ! -d "$spicetify_install" ]; then
    echo "MAKING FOLDER  $spicetify_install";
    mkdir -p "$spicetify_install"
fi

tar_file="$spicetify_install/.zip"

echo "DOWNLOADING   $download_uri"
curl --fail --location --progress-bar --output "$tar_file" "$download_uri"
cd "$spicetify_install"

echo "EXTRACTING"
unzip -q -d "$spicetify_install/spicetify-marketplace" -o "$tar_file"

echo "REMOVING"
rm "$tar_file"

# Check ~\.spicetify.\CustomApps directory already exists
sp_dot_dir="$(dirname "$(spicetify -c)")/CustomApps/spicetify-marketplace"
if [ ! -d "$sp_dot_dir" ]; then
    echo "MAKING FOLDER  $sp_dot_dir";
    mkdir -p "$sp_dot_dir"
fi
echo "COPYING"
cp -rf "$spicetify_install/spicetify-marketplace/." "$sp_dot_dir"

echo "PATCHING INSTALL"
rm -r "$spicetify_install/spicetify-marketplace"
mv "$spicetify_install/spicetify-marketplace-main" "$spicetify_install/spicetify-marketplace"
echo "INSTALLING"
cd "$spicetify_install/spicetify-marketplace"
if ../../spicetify config custom_apps spicetify-marketplace ; then
    echo "Added to config!"
    echo "APPLYING"
    ../../spicetify apply
else
    echo "Command failed"
    echo "Please run \`spicetify config custom_apps spicetify-marketplace\` manually "
    echo "Next run \`spicetify apply\`"
fi