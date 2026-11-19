import { optionalIntegerEnv, requireEnv } from '../utils/env'

export const invalidCredentialsUser = {
  email: 'qa-e2e-invalid@bcasapp.com',
  password: 'wrong-password'
}

export const studentSignupPassword = 'Test123!'

export interface Credentials {
  email: string
  password: string
}

const CREDENTIALS_ENV_PREFIX = {
  dashboardUser: 'E2E_TEST_USER',
  student: 'E2E_TEST_STUDENT',
  agent: 'E2E_TEST_AGENT'
} as const

export function getCredentials(role: keyof typeof CREDENTIALS_ENV_PREFIX): Credentials {
  const prefix = CREDENTIALS_ENV_PREFIX[role]

  return {
    email: requireEnv(`${prefix}_EMAIL`),
    password: requireEnv(`${prefix}_PASSWORD`)
  }
}

// Defaults match the SQA school seeded in dev
export const sqaSchoolName = process.env.E2E_SQA_SCHOOL_NAME || 'SQA website testing'
export const sqaSchoolId = optionalIntegerEnv('E2E_SQA_SCHOOL_ID', 345)
export const sqaCourseId = optionalIntegerEnv('E2E_SQA_COURSE_ID', 752)
export const recoveryTestEmail = 'qa-e2e-recovery@bcasapp.com'
export const unregisteredTestEmail = 'qa-e2e-unregistered@bcasapp.com'
