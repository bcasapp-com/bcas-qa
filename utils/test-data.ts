const DNI_CONTROL_LETTERS = 'TRWAGMYFPDXBNJZSQVHLCKE'
const NIE_PREFIXES = ['X', 'Y', 'Z']

function randomDigits(length: number): string {
  return crypto.randomUUID().replace(/\D/g, '').padEnd(length, '0').slice(0, length)
}

function randomIndex(length: number): number {
  return Math.floor(Math.random() * length)
}

export function pickRandom<T>(items: readonly T[], description: string): T {
  if (items.length === 0) {
    throw new Error(`Nothing to pick from: no ${description}`)
  }

  return items[randomIndex(items.length)]
}

export function generateRandomEmail(): string {
  const id = crypto.randomUUID().replace(/-/g, '')

  return `sqawebsitetesting+${id}@gmail.com`
}

export function generateSpanishPhone(): string {
  return `6${randomDigits(8)}`
}

export function generateExternalId(): string {
  return `SQA-${crypto.randomUUID().slice(0, 8)}`
}

export function generateValidDni(): string {
  const digits = randomDigits(8)

  return `${digits}${DNI_CONTROL_LETTERS[Number(digits) % 23]}`
}

export function generateValidNie(): string {
  const prefixIndex = randomIndex(NIE_PREFIXES.length)
  const digits = randomDigits(7)
  const controlLetter = DNI_CONTROL_LETTERS[Number(`${prefixIndex}${digits}`) % 23]

  return `${NIE_PREFIXES[prefixIndex]}${digits}${controlLetter}`
}
