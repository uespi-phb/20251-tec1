export function validateCpf(cpf: string): boolean {
  const cpfNumberOfDigits = 11

  if (cpf === null || cpf == undefined) return false
  cpf = removeNonDigits(cpf)
  if (cpf.length != cpfNumberOfDigits || allDigitsTheSame(cpf)) return false

  const checkDigit1 = calculateCheckDigit(cpf, 9)
  const checkDigit2 = calculateCheckDigit(cpf, 10)
  const checkDigits = cpf.slice(-2)

  return checkDigits === `${checkDigit1}${checkDigit2}`
}

function removeNonDigits(cpf: string): string {
  return cpf.replace(/\D/g, '')
}

function allDigitsTheSame(cpf: string): boolean {
  const firstDigit = cpf[0]
  for (const digit of cpf) {
    if (digit != firstDigit) return false
  }
  return true
}

function calculateCheckDigit(cpf: string, length: number) {
  let factor = length + 1
  let sum = 0
  for (let digit of cpf.substring(0, length)) {
    sum += parseInt(digit) * factor--
  }
  const remainder = sum % 11
  return remainder >= 2 ? 11 - remainder : 0
}
