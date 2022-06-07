#!/bin/sh
# Copyright 2019 khanhas. GPL license.
# Edited from project Denoland install script (https://github.com/denoland/deno_install)

set -e

    download_uri="https://github.com/spicetify/spicetify-marketplace/archive/refs/heads/dist.zip"

SPICETIFY_CONFIG_DIR="${SPICETIFY_CONFIG:-$HOME/.config/spicetify}"
INSTALL_DIR="$SPICETIFY_CONFIG_DIR/CustomApps"

if [ ! -d "$INSTALL_DIR" ]; then
    echo "MAKING FOLDER  $INSTALL_DIR";
    mkdir -p "$INSTALL_DIR"
fi

TAR_FILE="$INSTALL_DIR/marketplace-dist.zip"

echo "DOWNLOADING $download_uri"
curl --fail --location --progress-bar --output "$TAR_FILE" "$download_uri"
cd "$INSTALL_DIR"

echo "EXTRACTING"
unzip -q -d "$INSTALL_DIR/marketplace-tmp" -o "$TAR_FILE"

cd "$INSTALL_DIR/marketplace-tmp"
echo "COPYING"
rm -rf "$INSTALL_DIR/spicetify-marketplace/" "$INSTALL_DIR/marketplace/"
mv "$INSTALL_DIR/marketplace-tmp/spicetify-marketplace-dist" "$INSTALL_DIR/marketplace"

echo "INSTALLING"
cd "$INSTALL_DIR/marketplace"

# Remove old custom app name if exists
spicetify config custom_apps spicetify-marketplace-

if spicetify config custom_apps marketplace ; then
    echo "Added to config!"
    echo "APPLYING"
    spicetify apply
else
    echo "Command failed"
    echo "Please run \`spicetify config custom_apps marketplace\` manually "
    echo "Next run \`spicetify apply\`"
fi

echo "CLEANING UP"
rm -rf "$TAR_FILE" "$INSTALL_DIR/marketplace-tmp/"
