import { describe, expect, it } from 'vitest'
import { PlayerCoreType } from '../../../hooks/playerCore/types'
import { canSwitchAudioTrack } from '../audioTrack'

const streams = [{ id: 1 }, { id: 2 }]

describe('canSwitchAudioTrack', () => {
  it('requires a playable AvPlayer core', () => {
    expect(canSwitchAudioTrack(undefined)).toBe(false)
    expect(canSwitchAudioTrack({
      canplay: false,
      type: PlayerCoreType.AvPlayer,
      audioStreams: streams,
      isSupportStream: () => true,
    })).toBe(false)
    expect(canSwitchAudioTrack({
      canplay: true,
      type: PlayerCoreType.Native,
    })).toBe(false)
  })

  it('requires at least two supported audio streams', () => {
    expect(canSwitchAudioTrack({
      canplay: true,
      type: PlayerCoreType.AvPlayer,
      audioStreams: streams.slice(0, 1),
      isSupportStream: () => true,
    })).toBe(false)
    expect(canSwitchAudioTrack({
      canplay: true,
      type: PlayerCoreType.AvPlayer,
      audioStreams: streams,
      isSupportStream: stream => stream.id === 1,
    })).toBe(false)
    expect(canSwitchAudioTrack({
      canplay: true,
      type: PlayerCoreType.AvPlayer,
      audioStreams: streams,
      isSupportStream: () => true,
    })).toBe(true)
  })
})
