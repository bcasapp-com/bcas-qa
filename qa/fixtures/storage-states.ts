import path from 'path'

export const AGENT_STORAGE_STATE = path.resolve(__dirname, '../.auth/agent.json')

// Internal agent of the BCAS dashboard, with permissions over every user
export const DASHBOARD_USER_STORAGE_STATE = path.resolve(__dirname, '../.auth/dashboard-user.json')
