import {
  ChatroomSetting,
  defaultChatroomSetting,
  defaultSettingForMode,
  deriveChatroomMode,
  denormalizeForSave,
  ONE_ON_ONE_FIXED,
  validateChatroomSetting,
  aiBatchPersonaError,
  isBlankPersona,
} from './chatroomSetting'

test('blank persona detection matches run validation, including whitespace and overrides only', () => {
  const blank = { persona: '  ', internal_name: '', nickname: '', model_id: null, temperature: null }
  expect(isBlankPersona(blank)).toBe(true)
  expect(isBlankPersona({ ...blank, model_id: 'model', temperature: 0.5 })).toBe(true)
  expect(isBlankPersona({ ...blank, persona: 'Discuss' })).toBe(false)
  expect(isBlankPersona({ ...blank, internal_name: 'planner' })).toBe(false)
  expect(isBlankPersona({ ...blank, nickname: 'Alex' })).toBe(false)
  expect(isBlankPersona({ ...blank, prompt_attachment_ids: ['asset'] })).toBe(false)
})

test('persona count blocks AI-only runs but not saving drafts', () => {
  const setting = defaultSettingForMode('ai_only')
  const persona = { persona: 'Discuss trade-offs', internal_name: '', nickname: '', model_id: null, temperature: null }
  expect(aiBatchPersonaError(0, 3, [])).toBe('')
  expect(aiBatchPersonaError(0, 3, [persona])).toContain('3 AI participants but only 1 non-empty persona.')
  expect(aiBatchPersonaError(0, 3, [persona, persona, persona])).toBe('')
  expect(aiBatchPersonaError(0, 2, [persona, persona, persona])).toBe('')
  expect(aiBatchPersonaError(1, 3, [persona])).toBe('')
  expect(aiBatchPersonaError(0, 2, [persona, { ...persona, persona: '' }])).toContain('only 1 non-empty persona.')
  expect(validateChatroomSetting({ ...setting, ai_count: 3, ai_personas: [persona] }).ok).toBe(true)
})

const baseGroupSetting = (): ChatroomSetting => ({
  ...defaultSettingForMode('group'),
  // override with a known-good full set
  human_count: 2,
  ai_count: 1,
  replace_human_with_ai: false,
  max_wait_seconds: 60,
  max_duration_seconds: 600,
})

test('AI-only settings accept new hard caps and reject values above them', () => {
  const setting = { ...defaultSettingForMode('ai_only'), max_turns: 1000, max_total_chars: 500000 }
  expect(validateChatroomSetting(setting).ok).toBe(true)
  expect(validateChatroomSetting({ ...setting, max_turns: 1001 }).ok).toBe(false)
  expect(validateChatroomSetting({ ...setting, max_total_chars: 500001 }).ok).toBe(false)
})

describe('validateChatroomSetting', () => {
  it('allows resumable only for one-human one-AI assistant rooms', () => {
    const supported = {
      ...defaultChatroomSetting(),
      resumable: true,
      mimic_human: false,
    }
    expect(validateChatroomSetting(supported).ok).toBe(true)

    expect(validateChatroomSetting({ ...supported, mimic_human: true }).errors.resumable)
      .toContain('one human')
    expect(validateChatroomSetting({ ...supported, human_count: 2 }).errors.resumable)
      .toContain('one human')
    expect(validateChatroomSetting({ ...supported, ai_count: 2 }).errors.resumable)
      .toContain('one human')
  })

  it('returns ok=true for a valid group setting', () => {
    expect(validateChatroomSetting(baseGroupSetting())).toEqual({ ok: true, errors: {} })
  })

  it('returns ok=true for a valid one-human one-ai setting', () => {
    const setting: ChatroomSetting = {
      ...defaultChatroomSetting(),
    }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(true)
  })

  it('rejects AI-only rooms with fewer than two AIs', () => {
    const setting = { ...baseGroupSetting(), human_count: 0 }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.ai_count).toBeDefined()
  })

  it('accepts AI-only defaults and clears human lifecycle fields on save', () => {
    const setting = defaultSettingForMode('ai_only')
    expect(validateChatroomSetting(setting).ok).toBe(true)
    expect(deriveChatroomMode(setting)).toBe('ai_only')
    const saved = denormalizeForSave({
      ...setting, resumable: true, replace_human_with_ai: true,
      simulate_pairing_seconds: 15, max_wait_seconds: 30,
    })
    expect(saved).toMatchObject({
      human_count: 0, ai_count: 2, resumable: false,
      replace_human_with_ai: false, simulate_pairing_seconds: 0,
      max_wait_seconds: 0, target_human_count: 0, ai_strategy_value: 2,
    })
  })

  it('allows absent message-length guidance while retaining real limits', () => {
    const setting = defaultSettingForMode('ai_only')
    expect(setting.max_message_chars).toBeNull()
    expect(validateChatroomSetting(setting).errors.max_message_chars).toBeUndefined()
    expect(denormalizeForSave(setting).max_message_chars).toBeNull()
  })

  it.each(['max_message_chars', 'max_total_chars', 'max_turns'] as const)(
    'rejects invalid batch limit %s',
    (field) => {
      const setting = defaultSettingForMode('ai_only')
      for (const value of [0, -1, 1.5, NaN, Infinity, 500001]) {
        expect(validateChatroomSetting({ ...setting, [field]: value }).errors[field]).toBeDefined()
      }
    },
  )

  it('accepts replace_human_with_ai because total participants are derived from human_count + ai_count', () => {
    const setting: ChatroomSetting = {
      ...baseGroupSetting(),
      replace_human_with_ai: true,
      human_count: 4,
      ai_count: 2,
    }
    expect(validateChatroomSetting(setting).ok).toBe(true)
  })

  it('denormalizes replace_human_with_ai into total_participant_count', () => {
    const setting: ChatroomSetting = {
      ...baseGroupSetting(),
      replace_human_with_ai: true,
      human_count: 2,
      ai_count: 3,
    }
    const out = denormalizeForSave(setting)
    expect(out.ai_join_strategy).toBe('total_participant_count')
    expect(out.ai_strategy_value).toBe(5)
    expect(out.target_human_count).toBe(2)
  })

  it('rejects max_wait_seconds = 700 (cap is 600)', () => {
    const setting = { ...baseGroupSetting(), max_wait_seconds: 700 }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.max_wait_seconds).toBeDefined()
  })

  it('rejects negative max_wait_seconds', () => {
    const setting = { ...baseGroupSetting(), max_wait_seconds: -1 }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.max_wait_seconds).toBeDefined()
  })

  it('rejects fractional timer and wait values that the backend cannot store', () => {
    const setting = {
      ...baseGroupSetting(),
      timer_max_minutes: 0.5,
      max_wait_seconds: 1.5,
    }
    const result = validateChatroomSetting(setting)
    expect(result.errors.timer_max_minutes).toBeDefined()
    expect(result.errors.max_wait_seconds).toBeDefined()
  })

  it('rejects max_duration_seconds = 5000 (cap is 3600)', () => {
    const setting = { ...baseGroupSetting(), max_duration_seconds: 5000 }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.max_duration_seconds).toBeDefined()
  })

  it('enforces max_duration_seconds for one-human defaults too', () => {
    const setting: ChatroomSetting = {
      ...defaultChatroomSetting(),
      max_duration_seconds: 5000,
    }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.max_duration_seconds).toBeDefined()
  })

  it('rejects ai_count = 8 (cap is 7)', () => {
    const setting = { ...baseGroupSetting(), ai_count: 8 }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.ai_count).toBeDefined()
  })

  it('rejects ai_count = -1', () => {
    const setting = { ...baseGroupSetting(), ai_count: -1 }
    const result = validateChatroomSetting(setting)
    expect(result.ok).toBe(false)
    expect(result.errors.ai_count).toBeDefined()
  })

  it('accepts ai_count = 0 and = 7 (boundaries)', () => {
    const a = { ...baseGroupSetting(), ai_count: 0 }
    const b = { ...baseGroupSetting(), ai_count: 7 }
    expect(validateChatroomSetting(a).ok).toBe(true)
    expect(validateChatroomSetting(b).ok).toBe(true)
  })

  it.each(['you', 'YOU', ' Participant '])('rejects reserved AI nickname %j', (aiNickname) => {
    const setting = {
      ...defaultChatroomSetting(),
      mimic_human: false,
      ai_nickname: aiNickname,
    }
    const result = validateChatroomSetting(setting)
    expect(result.errors.ai_nickname).toBeDefined()
  })

  it.each(['You', 'participant', ' PARTICIPANT '])(
    'rejects reserved persona display name %j',
    (nickname) => {
      const setting = {
        ...defaultChatroomSetting(),
        ai_personas: [{
          internal_name: 'condition_1',
          nickname,
          persona: '',
          model_id: null,
          temperature: null,
        }],
      }
      const result = validateChatroomSetting(setting)
      expect(result.errors.ai_personas).toBeDefined()
    },
  )

  it('accepts ordinary room and persona AI nicknames', () => {
    const setting = {
      ...defaultChatroomSetting(),
      ai_nickname: 'Assistant',
      ai_personas: [{
        internal_name: 'condition_1',
        nickname: 'Alex',
        persona: '',
        model_id: null,
        temperature: null,
      }],
    }
    expect(validateChatroomSetting(setting).ok).toBe(true)
  })
})

describe('denormalizeForSave', () => {
  it('derives fixed runtime values for one-human one-ai and preserves max_duration_seconds', () => {
    const input: ChatroomSetting = {
      ...defaultChatroomSetting(),
      // arbitrary bad group field values to verify they are overwritten
      target_human_count: 99,
      ai_join_strategy: 'total_participant_count',
      ai_strategy_value: 7,
      max_wait_seconds: 600,
      max_duration_seconds: 1200,
    }
    const out = denormalizeForSave(input)
    expect(out.target_human_count).toBe(ONE_ON_ONE_FIXED.target_human_count)
    expect(out.ai_join_strategy).toBe(ONE_ON_ONE_FIXED.ai_join_strategy)
    expect(out.ai_strategy_value).toBe(ONE_ON_ONE_FIXED.ai_strategy_value)
    expect(out.max_wait_seconds).toBe(input.simulate_pairing_seconds)
    // preserved across both modes
    expect(out.max_duration_seconds).toBe(1200)
  })

  it('ignores simulated pairing when one-human mimic_human is off', () => {
    const input: ChatroomSetting = {
      ...defaultChatroomSetting(),
      mimic_human: false,
      simulate_pairing_seconds: 15,
    }
    const out = denormalizeForSave(input)
    expect(out.simulate_pairing_seconds).toBe(0)
    expect(out.max_wait_seconds).toBe(0)
  })

  it('derives runtime group fields from participant counts', () => {
    const input: ChatroomSetting = {
      ...defaultSettingForMode('group'),
      human_count: 4,
      ai_count: 2,
      replace_human_with_ai: true,
      max_wait_seconds: 120,
      max_duration_seconds: 1800,
    }
    const out = denormalizeForSave(input)
    expect(out.human_count).toBe(4)
    expect(out.ai_count).toBe(2)
    expect(out.replace_human_with_ai).toBe(true)
    expect(out.target_human_count).toBe(4)
    expect(out.ai_join_strategy).toBe('total_participant_count')
    expect(out.ai_strategy_value).toBe(6)
  })

  it('does not mutate the input', () => {
    const input: ChatroomSetting = {
      ...defaultChatroomSetting(),
      target_human_count: 99,
    }
    const before = JSON.stringify(input)
    denormalizeForSave(input)
    expect(JSON.stringify(input)).toBe(before)
  })
})

describe('defaultSettingForMode', () => {
  it('defaultChatroomSetting returns one-human one-ai values', () => {
    const setting = defaultChatroomSetting()
    expect(setting.show_avatars).toBe(true)
    expect(setting.ai_nickname).toBe('')
    expect(deriveChatroomMode(setting)).toBe('one_on_one')
    expect(setting.target_human_count).toBe(ONE_ON_ONE_FIXED.target_human_count)
    expect(setting.ai_join_strategy).toBe(ONE_ON_ONE_FIXED.ai_join_strategy)
    expect(setting.ai_strategy_value).toBe(ONE_ON_ONE_FIXED.ai_strategy_value)
    expect(setting.max_wait_seconds).toBe(ONE_ON_ONE_FIXED.max_wait_seconds)
    // round-trip through validate
    expect(validateChatroomSetting(setting).ok).toBe(true)
  })

  it('preserves a disabled avatar setting when saving', () => {
    const setting = { ...defaultChatroomSetting(), show_avatars: false }
    expect(denormalizeForSave(setting).show_avatars).toBe(false)
  })

  it('group returns sensible defaults that pass validation', () => {
    const setting = defaultSettingForMode('group')
    expect(deriveChatroomMode(setting)).toBe('group')
    expect(setting.human_count).toBe(2)
    expect(setting.ai_count).toBe(1)
    expect(setting.replace_human_with_ai).toBe(false)
    expect(setting.target_human_count).toBe(2)
    expect(setting.ai_join_strategy).toBe('fixed_ai_count')
    expect(setting.ai_strategy_value).toBe(1)
    expect(setting.max_wait_seconds).toBe(60)
    expect(setting.max_duration_seconds).toBe(360)
    expect(validateChatroomSetting(setting).ok).toBe(true)
  })
})
