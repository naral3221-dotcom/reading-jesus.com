/**
 * GroupNotice Entity
 *
 * 그룹 공지사항 도메인 엔티티. 비즈니스 규칙과 검증 로직을 포함합니다.
 */

export interface GroupNoticeProps {
  id: string
  groupId: string
  authorId: string
  title: string
  content: string
  isPinned: boolean
  createdAt: Date
  updatedAt: Date
  // Author 정보 (조인된 데이터)
  author?: {
    nickname: string
    avatarUrl: string | null
  }
}

export interface CreateGroupNoticeInput {
  groupId: string
  authorId: string
  title: string
  content: string
  isPinned?: boolean
}

export interface UpdateGroupNoticeInput {
  title?: string
  content?: string
  isPinned?: boolean
}

export class GroupNotice {
  private constructor(private readonly props: GroupNoticeProps) {}

  /**
   * GroupNotice 엔티티를 생성합니다.
   * @throws 제목이 비어있거나 100자 초과시 에러
   * @throws 내용이 비어있거나 5000자 초과시 에러
   */
  static create(props: GroupNoticeProps): GroupNotice {
    GroupNotice.validate(props)
    return new GroupNotice(props)
  }

  private static validate(props: GroupNoticeProps): void {
    if (!props.title || props.title.trim().length === 0) {
      throw new Error('공지 제목은 필수입니다.')
    }
    if (props.title.length > 100) {
      throw new Error('공지 제목은 100자를 초과할 수 없습니다.')
    }
    if (!props.content || props.content.trim().length === 0) {
      throw new Error('공지 내용은 필수입니다.')
    }
    if (props.content.length > 5000) {
      throw new Error('공지 내용은 5000자를 초과할 수 없습니다.')
    }
  }

  // Getters
  get id(): string {
    return this.props.id
  }

  get groupId(): string {
    return this.props.groupId
  }

  get authorId(): string {
    return this.props.authorId
  }

  get title(): string {
    return this.props.title
  }

  get content(): string {
    return this.props.content
  }

  get isPinned(): boolean {
    return this.props.isPinned
  }

  get createdAt(): Date {
    return this.props.createdAt
  }

  get updatedAt(): Date {
    return this.props.updatedAt
  }

  get author(): GroupNoticeProps['author'] {
    return this.props.author
  }

  // Business Logic

  /**
   * 공지를 수정합니다.
   */
  update(input: UpdateGroupNoticeInput): GroupNotice {
    const newProps = {
      ...this.props,
      title: input.title !== undefined ? input.title : this.props.title,
      content: input.content !== undefined ? input.content : this.props.content,
      isPinned: input.isPinned !== undefined ? input.isPinned : this.props.isPinned,
      updatedAt: new Date(),
    }
    GroupNotice.validate(newProps)
    return new GroupNotice(newProps)
  }

  /**
   * 고정 상태를 토글합니다.
   */
  togglePin(): GroupNotice {
    return new GroupNotice({
      ...this.props,
      isPinned: !this.props.isPinned,
      updatedAt: new Date(),
    })
  }

  /**
   * 특정 사용자가 작성자인지 확인합니다.
   */
  isAuthor(userId: string): boolean {
    return this.props.authorId === userId
  }

  /**
   * DTO로 변환합니다.
   */
  toDTO(): GroupNoticeProps {
    return { ...this.props }
  }
}
