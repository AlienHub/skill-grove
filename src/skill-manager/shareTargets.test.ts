import { describe, expect, test } from 'bun:test'
import { buildAvailableShareTargets, toggleShareTargetSelection } from './shareTargets'

describe('buildAvailableShareTargets', () => {
  test('excludes the current source and existing sources while preserving target order', () => {
    expect(
      buildAvailableShareTargets(
        ['/agents', '/codex', '/claude', '/cursor'],
        '/agents',
        ['/agents', '/codex']
      )
    ).toEqual(['/claude', '/cursor'])
  })
})

describe('toggleShareTargetSelection', () => {
  test('adds an unselected target and keeps configured order', () => {
    const targets = ['/agents', '/codex', '/claude']

    expect(toggleShareTargetSelection(['/claude'], '/agents', targets)).toEqual(['/agents', '/claude'])
  })

  test('removes a selected target', () => {
    const targets = ['/agents', '/codex', '/claude']

    expect(toggleShareTargetSelection(['/agents', '/claude'], '/agents', targets)).toEqual(['/claude'])
  })
})
