import { Core } from '@115master/drive115'
import { QueryClient } from '@tanstack/vue-query'

const THIRTY_MINUTES = 30 * 60 * 1000

export function createAppQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 0,
        gcTime: THIRTY_MINUTES,
        refetchOnWindowFocus: false,
        retry: (failureCount, error) => (
          failureCount < 1 && Core.toDrive115Error(error).retryable
        ),
      },
    },
  })
}

export const queryClient = createAppQueryClient()
