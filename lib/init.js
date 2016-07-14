"use babel"

import { existsSync } from 'fs'
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
        this.convertCommand(target)
      }))
    })
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  convertCommand(target) {

    const editor = atom.workspace.getActiveTextEditor()

    if (!editor) {
      return this.error(`Current item is not an editor.`)
    }

    if (editor.isModified() || !editor.getPath()) {
      return this.error(`Text is modified. Please safe first.`)
    }

    const format = targets[target].format || target
    const ext = targets[target].ext
    const dpath = this.defaultOuputPath(ext)
    const ipath = editor.getPath()

    this.selectPathView.show(dpath, opath => {
      cache[dpath] = opath
      this.convert(format, ipath, opath)
    })
  },

  error(message) {
    atom.notifications.addError(`[pandoc-convert]<br>${message}`)
  },

  success(message) {
    atom.notifications.addSuccess(`[pandoc-convert]<br>${message}`)
  },

  convert(format, ipath, opath) {

    const pandocPath = atom.config.get('pandoc-convert.pandocBinary') || pandocBin.path

    if (!existsSync(pandocPath)) {
      return this.error(`Binary \`${pandocPath}\` does not exist.`)
    }

    execFile(pandocPath, [
      '--standalone',
      `--to=${format}`,
      `--output=${opath}`,
      ipath
    ], (error) => {
      if (error) {
        this.error(error.message)
      } else {
        this.success(`**Created:** \`${opath}\``)
      }
    })
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
