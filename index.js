/*
  This is basically an un-hash function  :-)

  Reverse a sha256 (or whatever) if it happens to be the hash of some
  version of some file in this repo.  Because the word "hash" is used
  for both our sha256 and git (SHA-1) internals, we'll use these
  terms:

   - A "name" (or blobname) is a reference to a version of a file in
   the repo, consisting of a commit hash and file path, suitable for
   passing to "git show", like
   bb7028a5306602c857588c5d2d86f2731840af64:color

   - A "vihash" is a version-integrity style hash of the contents of
  that blob, like "sha256-2489wiofasr90q234u0rtjawfjws".  That's the
  syntax used by W3C Subresource Integrity except it's base64url, not
  base64.  sigh.

  At some point we might want to make a disk file,
  version-integrity-cache.txt or something, which we append to, and
  read at startup, if this ever gets slow on repos with a lot of
  history.  Or maybe even a db, but that seems like overkill.

*/

const debug = require('debug')('index-of-git')

// these are just defaults, if you change them we shouldn't require them
const simpleGit = require('simple-git/promise')
const vihashFunction = require('vihash')

class Index {
  constructor (options) {
    Object.assign(this, options)
    if (!this.gitroot) this.gitroot = '.'
    if (!this.git) this.git = simpleGit(this.gitroot)
    if (!this.hasher) this.hasher = vihashFunction
    if (!this.variants) {
      this.variants = [
        ['sha256'], // run vihash first with this algo
        ['sha512'] // then with this one
      ]
    }

    this.vihashToName = new Map()
    this.namesUsed = new Set()
    this.filled = false
  }

  // Note that there could be lots of names matching, if they have the
  // same content.
  async getSomeName (vihash) {
    // when do we need to refill, add stuff?
    if (!this.filled) await this.fill()
    return this.vihashToName.get(vihash)
  }

  async get (vihash) {
    const name = await this.getSomeName(vihash)
    debug('blobname for vihash=%o was %o', vihash, name)
    if (!name) {
      debug('no match for vihash', vihash)
      return undefined
    }
    const body = await this.getBodyFromName(name)
    debug('body for vihash=%o was %o', vihash, body.slice(0, 30 + (body.length > 30 ? '...' : '')))
    return body
  }

  async getBodyFromName (name) {
    // debug('fetching body for name=%s', name)
    const body = await this.git.show([name])
    // debug('body for name=%s was %j', name, body)
    return body
  }

  async fill () {
    debug('fill() running')
    const blobNames = await this.getBlobNames()
    // debug('blobnames %O', blobNames)
    for (const name of blobNames) {
      if (!this.namesUsed.has(name)) {
        // debug('reading body for %j', name)
        const body = await this.getBodyFromName(name)
        for (const variant of this.variants) {
          const vihash = this.hasher(body, ...variant)
          this.vihashToName.set(vihash, name)
        }
        this.namesUsed.add(name)
      }
    }
    this.filled = true
    // debug('fill() complete, cache = %O', this)
  }

  async getBlobNames () {
    const result = []
    debug('reading log')
    const log = await this.git.log()
    // debug('log was: %O', log)
    for (const line of log.all) {
      const commit = line.hash
      // debug('git show --name-only --pretty=format: %j', commit)
      const files = await this.git.show(['--name-only',
        '--pretty=format:',
        commit].slice(0))
      // debug('files: %O', files)
      for (let file of files.split('\n')) {
        if (file === '') continue
        const name = line.hash + ':' + file
        // debug('blobname', name)
        result.push(name)
      }
    }
    debug('found %d git blobnames', result.length)
    return result
  }
}

module.exports = Index
