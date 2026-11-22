import Axios from 'axios'
import type { AxiosRequestConfig } from 'axios'

const baseAxios = Axios.create({
  baseURL: '',
  headers: { 'Content-Type': 'application/json' },
})

baseAxios.interceptors.response.use(
  (response) => response,
  (error: unknown) => Promise.reject(error),
)

/**
 * orval 커스텀 뮤테이터.
 * AxiosRequestConfig를 받아 response.data만 반환한다.
 */
export const axiosInstance = <T>(
  config: AxiosRequestConfig,
  options?: AxiosRequestConfig,
): Promise<T> =>
  baseAxios({ ...config, ...options }).then((res) => res.data as T)

export default axiosInstance
