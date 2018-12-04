# index-of-git
[![NPM version][npm-image]][npm-url]

Given the SHA of a file that existed at any point in the history of a
git repo, find the text of that file.  This module maintains an
in-memory index to make that search fast.  It could easily be extended
to keep a persistent index, if that turns out to be worthwhile.

It does not currently provide the commit + filename information,
because I don't need that, and it would be a bit more work because
we'd need to track **all** the commit + filename pairs which had
matching content.  And would you want the commits where the filename
didn't change, but still had that content?

## API

```js
const Index = require('index-of-git')

const options = {
      // gitroot: where your repo is, default CWD
      // git: or your own simple-git instance
      // hasher: your own hash function, default vihash
      // variants: lists of argument lists for hasher, default sha256, sha512
}
const ix = new Index(options)

const text = await ix.get('sha256-47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU=')
//  => '' since that's the sha256 of the null string, if there's an empty
//     file anywhere in the repo history
//  => undefined  if there's no empty file anywhere in the repo history

```

[npm-image]: https://img.shields.io/npm/v/index-of-git.svg?style=flat-square
[npm-url]: https://npmjs.org/package/index-of-git
