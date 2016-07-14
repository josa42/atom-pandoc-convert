"use babel"

import { CompositeDisposable } from 'atom'
import { execFile } from 'child_process'
import pandocBin from 'pandoc-bin'
import targets from './targets'
import SelectPathView from './views/select-path-view'

const cache = {}

module.exports = {

  config: {
    pandocBinary: {
      description: 'Path to your `pandoc` binary. Default is the packaged version of pandoc.',
      type: 'string',
      default: ''
    }
  },

  activate() {
    if (atom.inDevMode() && !atom.inSpecMode()) {
      console.log('activate pandoc-convert')
    }

    this.subscriptions = new CompositeDisposable()
    this.selectPathView = new SelectPathView()

    Object.keys(targets).forEach(target => {
      const action = `pandoc-convert:${target.replace(/_/g, '-')}`

      this.subscriptions.add(atom.commands.add('atom-workspace', action, () => {

        const format = targets[target].format || target
        const ext = targets[target].ext
        const dpath = this.defaultOuputPath(ext)
        const ipath = this.inputPath()

        this.selectPathView.show(dpath, opath => {
          cache[dpath] = opath
          this.convert(format, ipath, opath)
        })
      }))
    })
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  convert(format, ipath, opath) {

    const pandocPath = atom.config.get('pandoc-convert.pandocBinary') || pandocBin.path

    execFile(pandocPath, [
      '--standalone',
      `--to=${format}`,
      `--output=${opath}`,
      ipath
    ], (error) => {
      if (error) {
        atom.notifications.addError(`[pandoc-convert]<br>${error.message}`)
      } else {
        atom.notifications.addSuccess(`[pandoc-convert]<br>**Created:** \`${opath}\``)
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
