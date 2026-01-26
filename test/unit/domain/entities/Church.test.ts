import { describe, it, expect } from 'vitest'
import { Church, ChurchProps } from '@/domain/entities/Church'

describe('Church Entity', () => {
  const validChurchProps: ChurchProps = {
    id: 'church-123',
    code: 'mychurch',
    name: '테스트교회',
    denomination: '장로회',
    address: '서울시 강남구',
    regionCode: 'seoul-gangnam',
    writeToken: 'write-token-123',
    adminToken: 'admin-token-456',
    isActive: true,
    allowAnonymous: false,
    scheduleYear: 2026,
    scheduleStartDate: new Date('2026-01-01'),
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
  }

  describe('create', () => {
    it('유효한 속성으로 Church를 생성할 수 있다', () => {
      const church = Church.create(validChurchProps)

      expect(church.id).toBe('church-123')
      expect(church.code).toBe('mychurch')
      expect(church.name).toBe('테스트교회')
      expect(church.isActive).toBe(true)
    })

    it('교회 코드가 빈 문자열이면 에러를 던진다', () => {
      expect(() => {
        Church.create({ ...validChurchProps, code: '' })
      }).toThrow('교회 코드는 필수입니다')
    })

    it('교회 코드가 2자 미만이면 에러를 던진다', () => {
      expect(() => {
        Church.create({ ...validChurchProps, code: 'a' })
      }).toThrow('교회 코드는 2자 이상이어야 합니다')
    })

    it('교회 코드가 영문 소문자, 숫자, 하이픈만 허용한다', () => {
      expect(() => {
        Church.create({ ...validChurchProps, code: 'MyChurch' })
      }).toThrow('교회 코드는 영문 소문자, 숫자, 하이픈만 사용할 수 있습니다')
    })

    it('교회 이름이 빈 문자열이면 에러를 던진다', () => {
      expect(() => {
        Church.create({ ...validChurchProps, name: '' })
      }).toThrow('교회 이름은 필수입니다')
    })
  })

  describe('deactivate / activate', () => {
    it('교회를 비활성화할 수 있다', () => {
      const church = Church.create(validChurchProps)

      const deactivated = church.deactivate()

      expect(deactivated.isActive).toBe(false)
    })

    it('교회를 활성화할 수 있다', () => {
      const church = Church.create({ ...validChurchProps, isActive: false })

      const activated = church.activate()

      expect(activated.isActive).toBe(true)
    })
  })

  describe('enableAnonymous / disableAnonymous', () => {
    it('익명 모드를 활성화할 수 있다', () => {
      const church = Church.create(validChurchProps)

      const enabled = church.enableAnonymous()

      expect(enabled.allowAnonymous).toBe(true)
    })

    it('익명 모드를 비활성화할 수 있다', () => {
      const church = Church.create({ ...validChurchProps, allowAnonymous: true })

      const disabled = church.disableAnonymous()

      expect(disabled.allowAnonymous).toBe(false)
    })
  })

  describe('updateName', () => {
    it('교회 이름을 변경할 수 있다', () => {
      const church = Church.create(validChurchProps)

      const updated = church.updateName('새교회이름')

      expect(updated.name).toBe('새교회이름')
    })

    it('빈 이름으로 변경하면 에러를 던진다', () => {
      const church = Church.create(validChurchProps)

      expect(() => {
        church.updateName('')
      }).toThrow('교회 이름은 필수입니다')
    })
  })

  describe('validateWriteToken', () => {
    it('올바른 작성 토큰을 검증할 수 있다', () => {
      const church = Church.create(validChurchProps)

      expect(church.validateWriteToken('write-token-123')).toBe(true)
      expect(church.validateWriteToken('wrong-token')).toBe(false)
    })

    it('writeToken이 없으면 항상 false를 반환한다', () => {
      const church = Church.create({ ...validChurchProps, writeToken: null })

      expect(church.validateWriteToken('any-token')).toBe(false)
    })
  })

  describe('validateAdminToken', () => {
    it('올바른 관리자 토큰을 검증할 수 있다', () => {
      const church = Church.create(validChurchProps)

      expect(church.validateAdminToken('admin-token-456')).toBe(true)
      expect(church.validateAdminToken('wrong-token')).toBe(false)
    })
  })

  describe('getUrl', () => {
    it('교회 URL을 반환한다', () => {
      const church = Church.create(validChurchProps)

      expect(church.getUrl()).toBe('/church/mychurch')
    })
  })
})
