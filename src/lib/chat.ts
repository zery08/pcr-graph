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

type OpenAiModel = {
  id: string
}

type OpenAiModelsResponse = {
  data?: OpenAiModel[]
}

type OpenAiChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string | null
    }
  }>
}

const apiBaseUrl = (import.meta.env.VITE_OPENAI_BASE_URL as string | undefined)?.replace(/\/$/, '')
const configuredModel = import.meta.env.VITE_OPENAI_MODEL as string | undefined
const apiKey = import.meta.env.VITE_OPENAI_API_KEY as string | undefined

const buildSystemPrompt = (context: ChatContext) => {
  return [
    '당신은 공정 데이터 분석 도우미입니다.',
    '아래 컨텍스트를 우선적으로 참고하여 답변하세요.',
    JSON.stringify(
      {
        selectedNode: context.node,
        selectedRows: context.rows,
      },
      null,
      2,
    ),
  ].join('\n')
}

const buildHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  }

  if (apiKey) {
    headers.Authorization = `Bearer ${apiKey}`
  }

  return headers
}

async function resolveModelId(): Promise<string> {
  if (!apiBaseUrl) {
    return 'demo-model'
  }

  if (configuredModel) {
    return configuredModel
  }

  const modelsResponse = await fetch(`${apiBaseUrl}/v1/models`, {
    method: 'GET',
    headers: buildHeaders(),
  })

  if (!modelsResponse.ok) {
    throw new Error(`모델 목록 조회 실패: ${modelsResponse.status}`)
  }

  const modelsJson = (await modelsResponse.json()) as OpenAiModelsResponse
  const firstModel = modelsJson.data?.[0]?.id

  if (!firstModel) {
    throw new Error('사용 가능한 모델이 없습니다. VITE_OPENAI_MODEL을 지정해 주세요.')
  }

  return firstModel
}

export async function sendChatToLlm(params: {
  question: string
  context: ChatContext
  history: ChatMessage[]
}): Promise<ChatResponse> {
  if (!apiBaseUrl) {
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
      text: `VITE_OPENAI_BASE_URL이 설정되지 않아 데모 응답을 반환합니다.\n질문: ${params.question}\n컨텍스트: ${contextSummary || '없음'}`,
    }
  }

  const model = await resolveModelId()
  const response = await fetch(`${apiBaseUrl}/v1/chat/completions`, {
    method: 'POST',
    headers: buildHeaders(),
    body: JSON.stringify({
      model,
      messages: [
        {
          role: 'system',
          content: buildSystemPrompt(params.context),
        },
        ...params.history.map((message) => ({
          role: message.role,
          content: message.content,
        })),
        {
          role: 'user',
          content: params.question,
        },
      ],
      temperature: 0.2,
    }),
  })

  if (!response.ok) {
    throw new Error(`OpenAI 호환 API 호출 실패: ${response.status}`)
  }

  const data = (await response.json()) as OpenAiChatCompletionResponse
  const text = data.choices?.[0]?.message?.content?.trim()

  return {
    text: text || '응답 본문이 비어 있습니다.',
  }
}
