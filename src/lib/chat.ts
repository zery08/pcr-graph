import type { NodeContext, ProcessRow } from '@/store'

export type ChatRole = 'user' | 'assistant'

export type ChatMessage = {
  id: string
  role: ChatRole
  content: string
  references: string[]
}

export type ChatContext = {
  node: NodeContext | null
  rows: ProcessRow[]
}

export type ChatResponse = {
  text: string
}

const apiUrl = import.meta.env.VITE_LLM_API_URL as string | undefined

const buildSystemPrompt = (context: ChatContext) => {
  return {
    selectedNode: context.node,
    selectedRows: context.rows,
  }
}

export async function sendChatToLlm(params: {
  question: string
  context: ChatContext
  history: ChatMessage[]
}): Promise<ChatResponse> {
  const payload = {
    question: params.question,
    context: buildSystemPrompt(params.context),
    history: params.history.map((message) => ({
      role: message.role,
      content: message.content,
    })),
  }

  if (!apiUrl) {
    const selectedRowsText = params.context.rows
      .map((row) => `${row.id}(${row.process}/${row.status})`)
      .join(', ')
    const contextSummary = [
      params.context.node ? `노드: ${params.context.node.label}` : null,
      selectedRowsText ? `행: ${selectedRowsText}` : null,
    ]
      .filter(Boolean)
      .join(' | ')

    return {
      text: `LLM API URL이 설정되지 않아 데모 응답을 반환합니다.\n질문: ${params.question}\n컨텍스트: ${contextSummary || '없음'}`,
    }
  }

  const response = await fetch(apiUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    throw new Error(`LLM API 호출 실패: ${response.status}`)
  }

  const data = (await response.json()) as { text?: string }
  return {
    text: data.text ?? '응답 본문이 비어 있습니다.',
  }
}
