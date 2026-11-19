type Id = string | number

export const routes = {
  login: '/login',
  dashboard: '/dashboard',
  schoolDashboard: (schoolId: Id): string => `/school-dashboard/${schoolId}`,
  forgotPassword: '/reset-password',
  studentFirstView: '/user/loan/',
  signup: '/signup',
  loanRequest: (loanId: Id): string => `/user/loan/${loanId}/request`,
  completeProfile: (loanId: Id): string => `/user/loan/${loanId}/request/complete-profile`,
  signingContract: (loanId: Id): string => `/user/loan/${loanId}/request/signing-contract`,
  kycRecommendations: (loanId: Id): string => `/user/loan/${loanId}/request/kyc/recommendations`,
  kyc: (loanId: Id): string => `/user/loan/${loanId}/request/kyc`,
  studentLoanDetail: (loanId: Id): string => `/user/loan/${loanId}/detail`,
  newLoan: (schoolId: Id): string => `/school-dashboard/${schoolId}/loan/create`,
  loanDetail: (schoolId: Id, loanId: Id): string =>
    `/school-dashboard/${schoolId}/loan/${loanId}/detail`,
  loanEdit: (schoolId: Id, loanId: Id): string =>
    `/school-dashboard/${schoolId}/loan/${loanId}/edit`
}
