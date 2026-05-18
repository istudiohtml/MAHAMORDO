import { describe, expect, it } from 'vitest'
import {
  getOracleSvgAvatar,
  getOracleTemplateAvatar,
  ORACLE_PRELOAD_SVGS,
  resolveOracleSlug,
} from './oracle-assets'

describe('oracle-assets', () => {
  it('resolves current slugs unchanged', () => {
    expect(resolveOracleSlug('ajarn-rahu')).toBe('ajarn-rahu')
  })

  it('maps legacy slugs to canonical', () => {
    expect(resolveOracleSlug('yai-kham')).toBe('mae-mor-jan')
    expect(resolveOracleSlug('mor-dum')).toBe('ajarn-rahu')
  })

  it('returns template jpg paths', () => {
    expect(getOracleTemplateAvatar('ajarn-rahu')).toBe('/avatars/template-ajarn-rahu.jpg')
    expect(getOracleTemplateAvatar('mor-dum')).toBe('/avatars/template-ajarn-rahu.jpg')
  })

  it('prefers explicit avatarUrl', () => {
    expect(getOracleTemplateAvatar('ajarn-rahu', '/custom.png')).toBe('/custom.png')
  })

  it('returns svg paths', () => {
    expect(getOracleSvgAvatar('por-mor-son')).toBe('/avatars/por-mor-son.svg')
  })

  it('exports three preload paths', () => {
    expect(ORACLE_PRELOAD_SVGS).toHaveLength(3)
    expect(ORACLE_PRELOAD_SVGS.every((p) => p.endsWith('.svg'))).toBe(true)
  })
})
