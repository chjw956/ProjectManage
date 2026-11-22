/** OnlyOffice DocsAPI(api.js) 로더 */

const ONLYOFFICE_URL = import.meta.env.VITE_ONLYOFFICE_URL ?? 'http://localhost:8081'
const DOCS_API_URL = `${ONLYOFFICE_URL}/web-apps/apps/api/documents/api.js`

/** OnlyOffice DocsAPI 중 이 화면에서 쓰는 부분 */
export interface DocEditorInstance {
  destroyEditor?: () => void
}
interface DocsApi {
  DocEditor: new (placeholderId: string, config: Record<string, unknown>) => DocEditorInstance
}
export const getDocsApi = () => (window as unknown as { DocsAPI?: DocsApi }).DocsAPI

/**
 * DocsAPI 스크립트를 한 번만 로드한다.
 * 동시에 여러 번 호출돼도(StrictMode의 effect 2회 실행, 빠른 재열기) 같은 Promise를 기다리게 해서,
 * "script 태그는 있는데 아직 로드 전"인 상태에서 에디터 생성을 건너뛰는 경쟁 조건을 막는다.
 */
let docsApiPromise: Promise<void> | null = null
export function loadDocsApi(): Promise<void> {
  if (getDocsApi()) return Promise.resolve()
  if (!docsApiPromise) {
    docsApiPromise = new Promise<void>((resolve, reject) => {
      const script = document.createElement('script')
      script.src = DOCS_API_URL
      script.onload = () => resolve()
      script.onerror = () => {
        docsApiPromise = null // 다음 시도에서 다시 로드
        script.remove()
        reject(new Error(`OnlyOffice 문서 서버(${ONLYOFFICE_URL})에 연결할 수 없습니다`))
      }
      document.head.appendChild(script)
    })
  }
  return docsApiPromise
}

/** 테스트용: 모듈 캐시 초기화 */
export function resetDocsApiLoaderForTest() {
  docsApiPromise = null
}
