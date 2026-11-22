import { StrictMode } from 'react'
import { render, screen, waitFor } from '@testing-library/react'
import { FileViewer } from './FileViewer'
import { loadDocsApi, resetDocsApiLoaderForTest } from './docsApi'
import type { NasFileInfo } from './types'

const xlsx: NasFileInfo = {
  name: '가상 증빙.xlsx',
  fileKey: 'uuid-excel-001',
  size: 1540,
  lastModified: '2026-11-22T20:29:51',
  extension: 'xlsx',
}

type Win = { DocsAPI?: unknown }
const win = window as unknown as Win

/** document.head에 붙는 OnlyOffice api.js script를 가로채, 테스트에서 직접 load/error를 일으킨다. */
function interceptScripts() {
  const scripts: HTMLScriptElement[] = []
  const original = document.head.appendChild.bind(document.head)
  const spy = vi.spyOn(document.head, 'appendChild').mockImplementation(<T extends Node>(node: T) => {
    if (node instanceof HTMLScriptElement && node.src.includes('/api/documents/api.js')) {
      scripts.push(node)
      return node
    }
    return original(node)
  })
  return { scripts, restore: () => spy.mockRestore() }
}

/** DocsAPI 스텁: 생성 횟수·설정을 기록 */
function installDocsApi() {
  const created: { id: string; config: Record<string, unknown> }[] = []
  const destroyed: string[] = []
  win.DocsAPI = {
    DocEditor: class {
      id: string
      constructor(id: string, config: Record<string, unknown>) {
        this.id = id
        created.push({ id, config })
      }
      destroyEditor() {
        destroyed.push(this.id)
      }
    },
  }
  return { created, destroyed }
}

beforeEach(() => {
  delete win.DocsAPI
  resetDocsApiLoaderForTest()
})

describe('loadDocsApi', () => {
  it('동시에 여러 번 호출해도 script는 1개만 붙이고, 모두 실제 로드 완료까지 기다린다', async () => {
    const { scripts, restore } = interceptScripts()
    let settled = 0
    const a = loadDocsApi().then(() => settled++)
    const b = loadDocsApi().then(() => settled++)

    expect(scripts).toHaveLength(1)
    await Promise.resolve()
    expect(settled).toBe(0) // 로드 전에는 끝나지 않음 (예전 버그: 두 번째 호출이 바로 통과)

    scripts[0].onload?.(new Event('load'))
    await Promise.all([a, b])
    expect(settled).toBe(2)
    restore()
  })

  it('로드 실패 후 다시 호출하면 새로 시도한다', async () => {
    const { scripts, restore } = interceptScripts()
    const first = loadDocsApi()
    scripts[0].onerror?.(new Event('error'))
    await expect(first).rejects.toThrow(/OnlyOffice 문서 서버/)

    void loadDocsApi()
    expect(scripts).toHaveLength(2)
    restore()
  })
})

describe('FileViewer (OnlyOffice)', () => {
  it('StrictMode(effect 2회 실행)에서도 script 로드 후 에디터를 정확히 1번 만든다', async () => {
    const { scripts, restore } = interceptScripts()
    render(
      <StrictMode>
        <FileViewer file={xlsx} mode="view" onClose={() => {}} />
      </StrictMode>,
    )
    expect(screen.getByText('파일을 불러오는 중...')).toBeInTheDocument()
    await waitFor(() => expect(scripts).toHaveLength(1))

    const { created } = installDocsApi()
    scripts[0].onload?.(new Event('load'))

    await waitFor(() => expect(created).toHaveLength(1))
    expect(created[0].config).toMatchObject({ documentType: 'cell', document: { key: 'uuid-excel-001' } })
    expect(screen.getByTestId('oo-editor').querySelector(`#${CSS.escape(created[0].id)}`)).not.toBeNull()
    expect(screen.queryByText('파일을 불러오는 중...')).not.toBeInTheDocument()
    restore()
  })

  it('OnlyOffice가 onError를 보내면(예: Download failed) 오류 코드와 내용을 표시한다', async () => {
    const { created } = installDocsApi()
    render(<FileViewer file={xlsx} mode="view" onClose={() => {}} />)
    await waitFor(() => expect(created).toHaveLength(1))

    const events = created[0].config.events as { onError: (e: unknown) => void }
    events.onError({ data: { errorCode: -4, errorDescription: 'Download failed.' } })

    expect(await screen.findByText('OnlyOffice 오류 (-4): Download failed.')).toBeInTheDocument()
  })

  it('문서 서버 스크립트를 불러오지 못하면 무한 로딩 대신 연결 오류를 표시한다', async () => {
    const { scripts, restore } = interceptScripts()
    render(<FileViewer file={xlsx} mode="view" onClose={() => {}} />)
    await waitFor(() => expect(scripts).toHaveLength(1))
    scripts[0].onerror?.(new Event('error'))

    expect(await screen.findByText(/OnlyOffice 문서 서버\(.+\)에 연결할 수 없습니다/)).toBeInTheDocument()
    restore()
  })

  it('창을 닫으면(unmount) 에디터를 정리한다', async () => {
    const { created, destroyed } = installDocsApi()
    const { unmount } = render(<FileViewer file={xlsx} mode="edit" onClose={() => {}} />)
    await waitFor(() => expect(created).toHaveLength(1))
    unmount()
    expect(destroyed).toEqual([created[0].id])
  })
})
