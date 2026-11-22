import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { BrowserRouter, Link, Navigate, Route, Routes, useLocation } from 'react-router-dom'
import { Dashboard } from '@/pages/Dashboard'
import { WbsPage } from '@/pages/Wbs'
import { ProjectHome } from '@/pages/ProjectHome'
import { NasFilesPage } from '@/pages/NasFiles'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 30_000,
    },
  },
})

function Sidebar() {
  const { pathname } = useLocation()
  const isDashboard = pathname === '/dashboard' || pathname === '/'

  const projectMatch = pathname.match(/\/projects\/(\d+)\//)
  const projectId = projectMatch ? projectMatch[1] : null
  const isProjectContext = projectId !== null

  const isHome  = isProjectContext && pathname.includes('/home')
  const isWbs   = isProjectContext && pathname.includes('/wbs')
  const isFiles = isProjectContext && pathname.includes('/files')

  return (
    <aside className="fixed inset-y-0 left-0 w-56 bg-slate-900 text-slate-100 flex flex-col z-10">
      {/* 로고 */}
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-700">
        <div className="w-7 h-7 rounded-md bg-blue-500 flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1" fill="white" />
            <rect x="9" y="1" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="1" y="9" width="6" height="6" rx="1" fill="white" fillOpacity="0.6" />
            <rect x="9" y="9" width="6" height="6" rx="1" fill="white" />
          </svg>
        </div>
        <span className="font-semibold text-sm tracking-wide">ProjTrack</span>
      </div>

      {/* 네비게이션 */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {isProjectContext ? (
          <>
            <Link
              to="/dashboard"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors mb-2"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M8 10L4 6L8 2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              포트폴리오
            </Link>

            <p className="text-xs text-slate-500 font-medium px-2 mb-1 uppercase tracking-wider">
              프로젝트 #{projectId}
            </p>

            <Link
              to={`/projects/${projectId}/home`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isHome
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 1L2 6v8h4v-5h4v5h4V6L8 1z" />
              </svg>
              사업 홈
            </Link>

            <Link
              to={`/projects/${projectId}/wbs`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isWbs
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 3h12v2H2V3zm0 4h8v2H2V7zm0 4h10v2H2v-2z" />
              </svg>
              WBS/간트
            </Link>

            <Link
              to={`/projects/${projectId}/files`}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isFiles
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h7l3 3v9H2V2z m7 0v3h3" fill="none" stroke="currentColor" strokeWidth="1.2" />
                <path d="M5 8h6M5 10h4" stroke="currentColor" strokeWidth="1" strokeLinecap="round" />
              </svg>
              증적 파일
            </Link>
          </>
        ) : (
          <>
            <p className="text-xs text-slate-500 font-medium px-2 mb-2 uppercase tracking-wider">메뉴</p>

            <Link
              to="/dashboard"
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                isDashboard
                  ? 'bg-blue-600 text-white font-medium'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                <path d="M2 2h5v5H2V2zm0 7h5v5H2V9zm7-7h5v5H9V2zm0 7h5v5H9V9z" />
              </svg>
              포트폴리오
            </Link>
          </>
        )}
      </nav>

      {/* 하단 사용자 */}
      <div className="px-4 py-4 border-t border-slate-700">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-xs font-bold text-white">
            김
          </div>
          <div className="text-xs">
            <p className="text-slate-200 font-medium">김민준</p>
            <p className="text-slate-500">디지털혁신팀</p>
          </div>
        </div>
      </div>
    </aside>
  )
}

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 ml-56 flex flex-col min-h-screen">
        {children}
      </div>
    </div>
  )
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          <Route
            path="/dashboard"
            element={
              <Layout>
                <Dashboard />
              </Layout>
            }
          />
          <Route
            path="/projects/:projectId/home"
            element={
              <Layout>
                <ProjectHome />
              </Layout>
            }
          />
          <Route
            path="/projects/:projectId/wbs"
            element={
              <Layout>
                <WbsPage />
              </Layout>
            }
          />
          <Route
            path="/projects/:projectId/files"
            element={
              <Layout>
                <NasFilesPage />
              </Layout>
            }
          />
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  )
}
