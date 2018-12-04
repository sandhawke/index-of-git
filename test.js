const test = require('tape')
const Index = require('.')
const simpleGit = require('simple-git/promise')
const vihash = require('vihash')

/*
// factor out this bit as temp-git
// or at least t.tempdir() feature on a wrapper for tape?
const path = require('path')
const os = require('os')
const atEnd = require('tape-end-hook')
const simpleGit = require('simple-git/promise')
const del = require('del')

// make the temporary test directories

async function freshGit (t) {
  const dirname = await fs.mkdtemp(path.join(os.tmpdir(), 'archmap-test-'))
        .catch(console.error)
  console.error('using test dir: ', dirname)
  atEnd(t, async () => {
    console.error('keeping test dir for now: ', dirname)
    // const paths = await del(dirname, {force: true})
    // console.error('deleting ', paths)
  })
  const sg = simpleGit(dirname)
  return await sg.init()
}

test(async (t) => {
  const g = freshGit()

})
*/

test(async (t) => {
  const g = simpleGit()
  const c = new Index(g, vihash, [['sha256'], ['sha512']])

  // this is copied with slight edit from vihash; since we also copied over
  // those data files, these should be in this code repo, and thus match
  t.equal('', await c.get('sha256-47DEQpj8HBSa-_TImW-5JCeuQeRkm5NMpJWZG3hSuFU='))
  t.equal('a', await c.get('sha256-ypeBEsobvcr6wjGzmiPcTaeG7_gUfE5yuYB3ha_uSLs='))
  t.equal('b', await c.get('sha256-PiPoFgA5WUoziU9lZOGxNIu9egCI1CxKy3PurtWcAJ0='))
  t.equal('hello', await c.get('sha256-LPJNul-wow4m6DsqxbninhsWHlwfp0JecwQzYpOLmCQ='))
  t.equal(undefined, await c.get('sha256-something_else___='))
  t.end()
})
