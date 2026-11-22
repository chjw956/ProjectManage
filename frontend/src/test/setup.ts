import { setupServer } from 'msw/node'
import { ganttHandlers } from './handlers/ganttHandlers'
import { milestoneHandlers } from './handlers/milestoneHandlers'
import { projectHandlers } from './handlers/projectHandlers'
import { projectHomeHandlers } from './handlers/projectHomeHandlers'
import { nasHandlers } from './handlers/nasHandlers'
import { issueHandlers } from './handlers/issueHandlers'

export const server = setupServer(
  ...projectHandlers,
  ...projectHomeHandlers,
  ...ganttHandlers,
  ...milestoneHandlers,
  ...nasHandlers,
  ...issueHandlers,
)
