# spicetify-marketplace
Download Extensions and Themes Directly from within [Spicetify](https://github.com/khanhas/spicetify-cli)

Based on the [reddit Custom App](https://github.com/khanhas/spicetify-cli/wiki/Custom-Apps#reddit)

## Basic functionality: 
1. On `index.js:pageLoad()`, calls `getAllExtensions()`, which queries the GitHub API for any repos with the "spicetify-extension" topic. We'll likely add our own tag in the future, like "spicetify-marketplace". 
2. The it loops through all the results and runs `fetchExtension()`, which fetches a `manifest.json` file from the repo's root folder. If it finds one, we generate a card based on the info. 

## manifest.json
In order to show up in the custom app, your repo needs to follow these requirements:
* Have the matching GitHub tag ("spicetify-extension" currently, will likely change)
* Have a `manifest.json` in the root folder
    * `name`: Your extension name
    * `description`: Description for your extension
    * `preview`: A path to your preview image. Must be relative to your project root
    * `main`: The filename for your extension's main js file. Must be relative to your project root
    
e.g. 
```json
{
    "name": "Spicetify-Hide-Podcasts",
    "description": "Spicetify extension to hide podcasts.",
    "preview": "screenshot.png",
    "main": "hidePodcasts.js"
}
```

## Notes: 
This is all still very hacky, injecting stuff into the reddit custom app, so there are a lot of leftovers that aren't needed. These will be adjusted/removed later. 