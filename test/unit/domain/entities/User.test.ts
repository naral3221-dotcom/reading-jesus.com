import { describe, it, expect } from 'vitest'
import { User, UserProps } from '@/domain/entities/User'

describe('User Entity', () => {
  const validUserProps: UserProps = {
    id: 'user-123',
    nickname: '테스트유저',
    avatarUrl: null,
    hasCompletedOnboarding: true,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    churchId: null,
    churchJoinedAt: null,
  }

  describe('create', () => {
    it('유효한 속성으로 User를 생성할 수 있다', () => {
      const user = User.create(validUserProps)

      expect(user.id).toBe('user-123')
      expect(user.nickname).toBe('테스트유저')
      expect(user.avatarUrl).toBeNull()
      expect(user.hasCompletedOnboarding).toBe(true)
    })

    it('닉네임이 빈 문자열이면 에러를 던진다', () => {
      expect(() => {
        User.create({ ...validUserProps, nickname: '' })
      }).toThrow('닉네임은 필수입니다')
    })

    it('닉네임이 20자를 초과하면 에러를 던진다', () => {
      expect(() => {
        User.create({ ...validUserProps, nickname: 'a'.repeat(21) })
      }).toThrow('닉네임은 20자 이하여야 합니다')
    })
  })

  describe('joinChurch', () => {
    it('교회에 가입할 수 있다', () => {
      const user = User.create(validUserProps)
      const churchId = 'church-456'

      const joinedUser = user.joinChurch(churchId)

      expect(joinedUser.churchId).toBe(churchId)
      expect(joinedUser.churchJoinedAt).not.toBeNull()
    })

    it('이미 교회에 가입한 경우 에러를 던진다', () => {
      const user = User.create({
        ...validUserProps,
        churchId: 'existing-church',
        churchJoinedAt: new Date(),
      })

      expect(() => {
        user.joinChurch('new-church')
      }).toThrow('이미 교회에 가입되어 있습니다')
    })
  })

  describe('leaveChurch', () => {
    it('교회를 탈퇴할 수 있다', () => {
      const user = User.create({
        ...validUserProps,
        churchId: 'church-456',
        churchJoinedAt: new Date(),
      })

      const leftUser = user.leaveChurch()

      expect(leftUser.churchId).toBeNull()
      expect(leftUser.churchJoinedAt).toBeNull()
    })

    it('교회에 가입하지 않은 상태에서 탈퇴하면 에러를 던진다', () => {
      const user = User.create(validUserProps)

      expect(() => {
        user.leaveChurch()
      }).toThrow('가입된 교회가 없습니다')
    })
  })

  describe('updateNickname', () => {
    it('닉네임을 변경할 수 있다', () => {
      const user = User.create(validUserProps)

      const updatedUser = user.updateNickname('새닉네임')

      expect(updatedUser.nickname).toBe('새닉네임')
      expect(updatedUser.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime())
    })

    it('빈 닉네임으로 변경하면 에러를 던진다', () => {
      const user = User.create(validUserProps)

      expect(() => {
        user.updateNickname('')
      }).toThrow('닉네임은 필수입니다')
    })
  })

  describe('completeOnboarding', () => {
    it('온보딩을 완료 처리할 수 있다', () => {
      const user = User.create({ ...validUserProps, hasCompletedOnboarding: false })

      const completedUser = user.completeOnboarding()

      expect(completedUser.hasCompletedOnboarding).toBe(true)
    })
  })

  describe('isChurchMember', () => {
    it('교회 가입 여부를 확인할 수 있다', () => {
      const memberUser = User.create({
        ...validUserProps,
        churchId: 'church-123',
        churchJoinedAt: new Date(),
      })
      const nonMemberUser = User.create(validUserProps)

      expect(memberUser.isChurchMember()).toBe(true)
      expect(nonMemberUser.isChurchMember()).toBe(false)
    })
  })
})
