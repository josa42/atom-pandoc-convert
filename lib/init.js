'use babel'

import { existsSync } from 'fs'
import { CompositeDisposable } from 'atom'
import { execFile } from 'child_process'
import quickInput from 'atom-quick-input'
import { dirname } from 'path'
import pandocBin from 'pandoc-bin'
import targets from './targets'

const { atom } = global

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
    pandocFilters: {
      description: 'Comma separated list of pandoc filters. Each will be passed via the `--filter=` command line argument',
      type: 'string',
      default: ''
    }
  },

  activate () {
    if (atom.inDevMode() && !atom.inSpecMode()) {
      console.log('activate pandoc-convert')
    }

    this.subscriptions = new CompositeDisposable()

    Object.keys(targets).forEach(target => {
      const action = `pandoc-convert:${target.replace(/_/g, '-')}`

      this.subscriptions.add(commands.add('atom-workspace', action, () => {
        this.convertCommand(target)
      }))
    })
  },

  deactivate () {
    this.subscriptions.dispose()
  },

  convertCommand (target) {
    const editor = workspace.getActiveTextEditor()

    if (!editor) {
      return this.error('Current item is not an editor.')
    }

    if (editor.isModified() || !editor.getPath()) {
      return this.error('Text is modified. Please safe first.')
    }

    const format = targets[target].format || target
    const ext = targets[target].ext
    const dpath = this.defaultOuputPath(ext)
    const ipath = editor.getPath()

    quickInput(dpath).then((opath) => {
      if (opath) {
        cache[dpath] = opath
        this.convert(format, ipath, opath)
      }
    })
  },

  error (message) {
    notifications.addError(`[pandoc-convert]<br>${message}`)
  },

  success (message) {
    notifications.addSuccess(`[pandoc-convert]<br>${message}`)
  },

  convert (format, ipath, opath) {
    const pandocPath = config.get('pandoc-convert.pandocBinary') || pandocBin.path
    const pandocFilters = config.get('pandoc-convert.pandocFilters')

    // Command line arguments
    let args = [
      '--standalone',
      `--to=${format}`,
      `--output=${opath}`,
      ipath
    ]

    if(pandocFilters !== "") {
      // Create array of comma separated values
      let filters = pandocFilters.split(", ")

      // Add filter arguments for commandline
      for(let i = 0; i < filters.length; i++) {
        let filter = filters[i]
        args.unshift("--filter="+filter)
      }
    }

    if (!existsSync(pandocPath)) {
      return this.error(`Binary \`${pandocPath}\` does not exist.`)
    }

    const cwd = dirname(ipath)

    execFile(pandocPath, args, { cwd }, (error) => {
      if (error) {
        this.error(error.message)
      } else {
        this.success(`**Created:** \`${opath}\``)
      }
    })
  },

  defaultOuputPath (ext) {
    const editor = workspace.getActiveTextEditor()
    const dpath = `${editor.getPath()}.${ext}`

    if (cache[dpath]) {
      return cache[dpath]
    }

    return dpath
  }
}
