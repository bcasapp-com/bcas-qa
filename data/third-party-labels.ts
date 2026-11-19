// The cookie banner and PandaDoc stay in Spanish whatever the app or browser language: the
// banner captions only exist in Spanish in the app config, and PandaDoc takes the language of
// the contract template
export const cookieBannerLabels = {
  reject: 'Rechazar'
}

export const pandadocLabels = {
  acceptAndSign: 'Aceptar y firmar',
  finish: 'Finalizar'
}

// Stripe picks the checkout language from the session or the browser, so every label
// matches the exact English and Spanish texts
export const stripeCheckoutLabels = {
  cardNumber: /^(card number|número de tarjeta)$/i,
  cardExpiry: /^(expiration \(mm\/yy\)|caducidad \(mm\/aa\))$/i,
  cardCvc: /^(security code|código de seguridad)$/i,
  cardholderName: /^(name on card|nombre del titular de la tarjeta)$/i,
  payButton: /^(pay|pagar)$/i
}
