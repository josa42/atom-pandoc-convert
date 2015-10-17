"use babel"

import { TextEditorView } from 'atom-space-pen-views'

class SelectPathView extends TextEditorView {

  constructor() {
    super({ mini: true })

    this.addClass('pandoc-convert-path-input')

    this.blur(() => this.hide())

    atom.commands.add(this.element, {
      'core:confirm': (event) => {
        event.stopPropagation()
        this.confirm()
      },

      'core:cancel': (event) => {
        event.stopPropagation()
        this.hide()
      }
    })
  }

  show(text = '', delegate = null) {

    if (!this.panel) {
      this.panel = atom.workspace.addModalPanel({ item: this })
    }

    this.delegate = delegate
    this.setText(text)
    this.panel.show()
    this.focus()
  }

  hide() {
    this.delegate = null
    this.setText('')
    this.panel.hide()
  }

  confirm() {
    if (this.delegate) {
      this.delegate(this.getText())
    }
    this.hide()
  }
}

export default SelectPathView
