# migration-bs.kmapper.com

This is the repository of the visualization(s) shown on migration-bs.kmapper.com.

The website uses migration data from the Canton of Basel-Stadt, derived from https://data.bs.ch/explore/dataset/100138/table/, to visualize migration from and to Basel.
It allows to select a month and year and animates the Basel migrations from and to different parts of the world (i. e. Switzerland, Europe, rest of the world).

The underlying data transformations applied beforhand are documented in a separate repository here: https://github.com/cyrill-martin/basel-migration-data/blob/main/migration.ipynb.

## Project Setup

### Recommended IDE Setup

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (and disable Vetur) + [TypeScript Vue Plugin (Volar)](https://marketplace.visualstudio.com/items?itemName=Vue.vscode-typescript-vue-plugin).

### Install Needed Modules

```sh
npm install
```

### Compile and Hot-Reload for Development

```sh
npm run dev
```

### Compile and Minify for Production

```sh
npm run build
```

### Compile, Minify for Production and Deploy to GitHub Pages

```sh
npm run deploy
```
