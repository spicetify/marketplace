# spicetify-marketplace

Download Extensions and Themes Directly from within [Spicetify](https://github.com/khanhas/spicetify-cli). 

Based on the [reddit Custom App](https://github.com/khanhas/spicetify-cli/wiki/Custom-Apps#reddit)

## Disclaimer
All extensions are from community. They might contain unwanted code. Be careful what you install, or review the code before use. We hold no responsibility for these extensions or anything installed via this custom app. If you find a malicious extension, please [submit an issue](https://github.com/CharlieS1103/spicetify-marketplace/issues/new?template=malicious-extension-report.md) and we can add it to the [blacklist](blacklist.json). 

## Notes: 
This project is a work-in-progress and is not finished, polished, or guaranteed to work. Use at your own risk. 

## Install

### Auto Install (Windows)
Open Powershell and paste the following:

```powershell
Invoke-WebRequest -UseBasicParsing "https://raw.githubusercontent.com/CharlieS1103/spicetify-marketplace/master/install.ps1" | Invoke-Expression
```
### Auto Install (MacOS and Linux)
Open a terminal and paste the following:

```shell
curl -fsSL https://raw.githubusercontent.com/CharlieS1103/spicetify-marketplace/main/install.sh | sh
```

### Manual Install (recommended)

Copy the `spicetify-marketplace` folder into your [Spicetify](https://github.com/khanhas/spicetify-cli) custom apps directory:
| **Platform** | **Path**                                                                               |
|------------|------------------------------------------------------------------------------------------|
| **Linux**      | `~/.config/spicetify/CustomApps/` or `$XDG_CONFIG_HOME/.config/spicetify/CustomApps/`|
| **MacOS**      | `~/.config/spicetify/CustomApps/` or `$SPICETIFY_CONFIG/CustomApps/`                 |
| **Windows**    | `%userprofile%/.spicetify/CustomApps/`                                               |

After putting the marketplace folder into the correct custom apps folder, run the following command to enable it:
```
spicetify config custom_apps spicetify-marketplace
spicetify apply
```
Note: Using the `config` command to add the custom app will always append the file name to the existing custom apps list. It does not replace the whole key's value.

Or you can manually edit your `config-xpui.ini` file. Add your desired custom apps folder names in the `custom_apps` key, separated them by the | character.
Example:

```ini
[AdditionalOptions]
...
custom_apps = reddit | spicetify-marketplace
```

Then run:

```
spicetify apply
```


## Basic card loading functionality: 
1. `componentDidMount` triggers `newRequest`, which triggers `loadAmount(30)`
2. `loadAmount` calls `loadPage` in a loop until it has the requested amount of cards or runs out of results
3. `loadPage` calls `getRepos(page)` to get the next page of extensions. It queries the GitHub API for any repos with the "spicetify-extensions" topic. We'll likely add our own tag in the future, like "spicetify-marketplace". 
4. The it loops through all the results and runs `fetchRepoExtensions()` or `getThemeRepos()`, which fetches a `manifest.json` file from the repo's root folder. If it finds one, we generate a card based on the info. 
* Or if the active tab is "Installed", `loadPage` calls `getLocalStorageDataFromKey(LOCALSTORAGE_KEYS.installedSnippets)` to get the extensions from the localstorage and generate the cards from there. 
* Or if the active tab is "Snippets", `loadPage` calls `fetchCssSnippets()` and generates cards from the most recent `snippets.json` on GitHub. 

## manifest.json
In order to show up in the custom app, your repo needs to follow these requirements:
* Have the matching **GitHub topic tag** ("**spicetify-extensions**" or "**spicetify-themes**")
* Have a **`manifest.json`** in the root folder
    * `name`: Your extension name
    * `description`: Description for your extension
    * `preview`: A path to your preview image. Must be relative to your project root
    * `main`: The filename for your extension's main js file. Must be relative to your project root
    * `readme`: The filename for your extension's README file. Must be relative to your project root
    * `branch`: Optional branch to specify. Will use default branch if none.
    * `authors`: Optional array of authors with names and urls. Will use repo owner if none.
* Or for Themes:
    * `name`: Your theme name
    * `description`: Description for your theme
    * `preview`: A path to your preview image. Must be relative to your project root
    * `usercss`: A path to your user.css file. Must be relative to your project root
    * `schemes`: A path to your color.ini file. Must be relative to your project root
    * `readme`: The filename for your extension's README file. Must be relative to your project root 
    * `branch`: Optional branch to specify. Will use default branch if none.
    * `authors`: Optional array of authors with names and urls. Will use repo owner if none.
    
(Extension e.g.): 
```json
{
    "name": "Spicetify-Hide-Podcasts",
    "description": "Spicetify extension to hide podcasts.",
    "preview": "screenshot.png",
    "main": "hidePodcasts.js",
    "readme": "README.md",
    "authors": [
        { "name": "theRealPadster", "url": "https://github.com/theRealPadster" }
    ]
}
```
If you have multiple extensions in the same repo (subfolder e.g.):
```json
[
  {
    "name": "extensionName(No .js included)",
    "description": "Spicetify extension to show how to make a manifest.",
    "preview": "filepathFromGitRepo/myExt.png",
    "main": "filepathFromGitRepo/myExt.js",
    "readme": "filepathFromGitRepo/README.md"
  },
  {
   "name": "extensionNameTwo(No .js included)",
   "description": "Another Spicetify extension to show how to make a manifest.",
   "preview": "http://i.imgur.com/foo.png",
   "main": "filepathFromGitRepoTwo/myExtTwo.js",
   "readme": "filepathFromGitRepoTwo/THIS_IS_MY_README.md",
   "branch": "some-branch"
  },
]
```
For themes:
```json
{
    "name": "themeName",
    "description": "theme description",
    "preview": "filepathFromGitRepo/theme.png",
    "readme": "README.md",
    "usercss": "filepathFromGitRepo/user.css",
    "schemes": "filepathFromGitRepo/color.ini",
    "branch": "beta-release",
    "authors": [
        { "name": "theRealPadster", "url": "https://github.com/theRealPadster" },
        { "name": "CharlieS1103", "url": "https://github.com/CharlieS1103" }
    ]
}
```
_Please note that if all your extensions are in the root folder, you don't need to include a filepath._

## Snippets
CSS snippets are rather basic to implement. We fetch them from this repo, so you'll need to submit a [pull request](https://github.com/CharlieS1103/spicetify-marketplace/compare). In order to be valid JSON, the CSS needs to be in one line. You can use [this website](https://tools.knowledgewalls.com/online-multiline-to-single-line-converter) to make the css snippet single line. Once you have your code segment ready, edit snippets.json and add the following, before submitting your PR. 
```json
{
    "title": "Title",
    "description": "description",
    "code": "The single line css you have"
}
```

## Styling + Build Process
- The stylesheet is built using Sass (scss) with the [Parcel](https://parceljs.org/) bundler
- The main stylesheet is style/style.scss, which builds all the components, and compiles into style.css
- For development, you can run `npm run watch` to live update the files as you save them
- For building, you can run `npm run build` to just build the style.css file once
