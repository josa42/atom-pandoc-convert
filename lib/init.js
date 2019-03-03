'use babel'

import { existsSync } from 'fs'
import { CompositeDisposable } from 'atom'
import { execFile } from 'child_process'
import { dirname } from 'path'
import pandocBin from 'pandoc-bin'
import targets from './targets'
import SelectPathView from './views/select-path-view'

const {
  commands,
  config,
  notifications,
  workspace
} = atom

const cache = {}

module.exports = {

  config: {
    pandocBinary: {
      description: 'Path to your `pandoc` binary. Default is the packaged version of pandoc.',
      type: 'string',
      default: ''
    },
    pandocExtensions: {
      description: 'List of extensions to enable(+) or disable(-) when converting from MARKDOWN (https://pandoc.org/MANUAL.html#extensions)',
      type: 'string',
      default: '+yaml_metadata_block'
    },
    pandocAutosave: {
      description: 'Autosave file if unsaved',
      type: 'boolean',
      default: true
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

      this.subscriptions.add(commands.add('atom-workspace', action, () => {
        this.convertCommand(target)
      }))
    })
  },

  deactivate() {
    this.subscriptions.dispose()
  },

  convertCommand(target) {

    const editor = workspace.getActiveTextEditor()
    const pandocAutosave = config.get('pandoc-convert.pandocAutosave')

    if (!editor) {
      return this.error('Current item is not an editor.')
    }

    if (editor.isModified() || !editor.getPath()) {
      if(pandocAutosave) { editor.save() }

      else { return this.error('Text is modified. Please safe first.') }
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
    notifications.addError(`[pandoc-convert]<br>${message}`)
  },

  success(message) {
    notifications.addSuccess(`[pandoc-convert]<br>${message}`)
  },

  convert(format, ipath, opath) {
    const pandocPath = config.get('pandoc-convert.pandocBinary') || pandocBin.path
    const pandocExtensions = config.get('pandoc-convert.pandocExtensions')

    const iext = ipath.split('.').pop()

    const from = (iext == 'md') ? `--from=markdown${pandocExtensions}` : ''

    if (!existsSync(pandocPath)) {
      return this.error(`Binary \`${pandocPath}\` does not exist.`)
    }

    const cwd = dirname(ipath)

    execFile(pandocPath, [
      '--standalone',
      from,
      `--to=${format}`,
      `--output=${opath}`,
      ipath
    ], { cwd }, (error) => {
      if (error) {
        this.error(error.message)
      } else {
        this.success(`**Created:** \`${opath}\``)
      }
    })
  },

  defaultOuputPath(ext) {
    const editor = workspace.getActiveTextEditor()
    const dpath = `${editor.getPath().split('.')[0]}.${ext}`

    if (cache[dpath]) {
      return cache[dpath]
    }

    return dpath
  }
}
