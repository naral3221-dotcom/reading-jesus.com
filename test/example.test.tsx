import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'

// 간단한 컴포넌트 테스트 예제
function HelloWorld({ name }: { name: string }) {
  return <div>Hello, {name}!</div>
}

describe('테스트 환경 검증', () => {
  it('Vitest가 정상 동작해야 한다', () => {
    expect(1 + 1).toBe(2)
  })

  it('문자열 매칭이 동작해야 한다', () => {
    expect('reading-jesus').toContain('jesus')
  })

  it('배열 테스트가 동작해야 한다', () => {
    const arr = [1, 2, 3]
    expect(arr).toHaveLength(3)
    expect(arr).toContain(2)
  })
})

describe('React Testing Library 검증', () => {
  it('컴포넌트가 렌더링되어야 한다', () => {
    render(<HelloWorld name="World" />)
    expect(screen.getByText('Hello, World!')).toBeInTheDocument()
  })

  it('다른 props로 렌더링되어야 한다', () => {
    render(<HelloWorld name="예수님" />)
    expect(screen.getByText('Hello, 예수님!')).toBeInTheDocument()
  })
})

describe('jest-dom 매처 검증', () => {
  it('toBeInTheDocument가 동작해야 한다', () => {
    render(<div data-testid="test-div">테스트</div>)
    expect(screen.getByTestId('test-div')).toBeInTheDocument()
  })

  it('toHaveTextContent가 동작해야 한다', () => {
    render(<div data-testid="content">내용입니다</div>)
    expect(screen.getByTestId('content')).toHaveTextContent('내용입니다')
  })
})
