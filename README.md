# National Pokédex Tracker — GitHub Pages edition

This folder contains a static copy of the National Pokédex tracker and the collection data included with the download. It uses plain HTML, CSS, and JavaScript, so GitHub Pages can serve it without a build step or backend.

## Publish on GitHub Pages

1. Extract this ZIP. To preview it on your computer, use a local web server; opening `index.html` directly may prevent the browser from loading the data file.
2. Put the included files and folders in the root of a GitHub repository.
3. In the repository, open **Settings → Pages**.
4. Under **Build and deployment**, choose **Deploy from a branch**, then choose your main branch and the `/ (root)` folder.
5. Open the Pages URL after GitHub finishes publishing.

For a project site published under a repository path, keep the entire folder structure together. The included links and data paths are relative to the site folder.

## Features

- National Pokédex tracker with search, status filter, and sorting
- Click-to-cycle Missing → Seen → Caught statuses
- Collection statistics and completion percentage
- Card sorter with configurable binder rows and columns
- Excel, CSV, and JSON import/export
- Browser-local status storage and cached static files for repeat offline use

The bundled `vendor/exceljs.min.js` spreadsheet library is provided under the MIT license; its license text is in `vendor/EXCELJS-LICENSE.txt`.

## Data and privacy

The ZIP includes the collection snapshot that was current when it was downloaded. Status edits made on the static site are stored only in that browser's local storage; they do not sync back to the original account or to other devices. Keep the ZIP private if the collection snapshot is personal.

Pokémon sprites use the public PokéAPI sprite URLs in the data. The tracker, collection, and spreadsheet tools work without those images; showing sprites requires an internet connection unless you separately provide the image files.

The static edition has no account login, database, or cloud sync. It is a standalone copy for GitHub Pages, not a connection to the original hosted app.
