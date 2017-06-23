'use babel'

const { atom } = global

describe('pandoc-convert', () => {
  it('activates', () => {
    expect(atom.packages.getActivePackage('pandoc-convert')).toBeTruthy()
  })
})
