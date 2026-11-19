export interface StripeTestCard {
  number: string
  expiry: string
  cvc: string
}

export const stripeTestCards = {
  visaSuccess: { number: '4242424242424242', expiry: '12 / 34', cvc: '123' }
} satisfies Record<string, StripeTestCard>
