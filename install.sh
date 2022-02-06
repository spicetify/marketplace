#!/bin/sh
# Copyright 2019 khanhas. GPL license.
# Edited from project Denoland install script (https://github.com/denoland/deno_install)

set -e

    latest_release_uri="https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip"
    echo "DOWNLOADING    $latest_release_uri"

    download_uri="https://github.com/CharlieS1103/spicetify-marketplace/archive/refs/heads/main.zip"

SPICETIFY_CONFIG_DIR="${SPICETIFY_CONFIG:-$HOME/.config/spicetify}"
INSTALL_DIR="$SPICETIFY_CONFIG_DIR/CustomApps"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "MAKING FOLDER  $INSTALL_DIR";
    mkdir -p "$INSTALL_DIR"
fi

TAR_FILE="$INSTALL_DIR/spicetify-marketplace-main.zip"

echo "DOWNLOADING   $download_uri"
curl --fail --location --progress-bar --output "$TAR_FILE" "$download_uri"
cd "$INSTALL_DIR"

echo "EXTRACTING"
unzip -q -d "$INSTALL_DIR/spicetify-marketplace-tmp" -o "$TAR_FILE"

echo "REMOVING"
rm "$TAR_FILE"

cd "$INSTALL_DIR/spicetify-marketplace-tmp"
# Check ~\.spicetify.\CustomApps directory already exists
# sp_dot_dir="$(dirname "$(../../spicetify -c)")/CustomApps/spicetify-marketplace"
# if [ ! -d "$sp_dot_dir" ]; then
#     echo "MAKING FOLDER  $sp_dot_dir";
#     mkdir -p "$sp_dot_dir"
# fi
echo "COPYING"
# echo "$sp_dot_dir"
rm -rf "$INSTALL_DIR/spicetify-marketplace/"
mv "$INSTALL_DIR/spicetify-marketplace-tmp/spicetify-marketplace-main" "$INSTALL_DIR/spicetify-marketplace"
# cp -rf "$INSTALL_DIR/spicetify-marketplace/." "$sp_dot_dir"
echo "INSTALLING"
cd "$INSTALL_DIR/spicetify-marketplace"

if spicetify config custom_apps spicetify-marketplace ; then
    echo "Added to config!"
    echo "APPLYING"
    spicetify apply
else
    echo "Command failed"
    echo "Please run \`spicetify config custom_apps spicetify-marketplace\` manually "
    echo "Next run \`spicetify apply\`"
fi
