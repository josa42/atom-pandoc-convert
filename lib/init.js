"use babel"

import { execFile } from 'child_process'
import pandocBin from 'pandoc-bin'
import targets from './targets'
import SelectPathView from './views/select-path-view'

const cache = {}

module.exports = {

  config: {},

  activate() {
    if (atom.inDevMode()) {
      console.log('activate pandoc-convert')
    }

    this.selectPathView = new SelectPathView()

    Object.keys(targets).forEach(target => {
      const action = `pandoc-convert:${target.replace(/_/g, '-')}`

      atom.commands.add('atom-workspace', action, () => {

        const format = targets[target].format || target
        const ext = targets[target].ext
        const dpath = this.defaultOuputPath(ext)
        const ipath = this.inputPath()

        this.selectPathView.show(dpath, opath => {
          cache[dpath] = opath
          this.convert(format, ipath, opath)
        })
      })
    })
  },

  convert(format, ipath, opath) {
    execFile(pandocBin.path, [
      '--standalone',
      `--to=${format}`,
      `--output=${opath}`,
      ipath
    ], (error) => {
      if (error) {
        atom.notifications.addError(error.message)
      } else {
        atom.notifications.addSuccess(`**Created:** ${opath}`)
      }
    })
  },

  inputPath(ext) {
    const editor = atom.workspace.getActiveTextEditor()
    return editor.getPath()
  },

  defaultOuputPath(ext) {
    const editor = atom.workspace.getActiveTextEditor()
    const dpath = `${editor.getPath()}.${ext}`

    if (cache[dpath]) {
      return cache[dpath]
    }

    return dpath
  }
}
