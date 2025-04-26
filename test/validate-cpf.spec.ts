import { validateCpf } from '@/validate-cpf'

describe('validateCpf', () => {
  test.each(['300.090.870-60', '300090870-60', '30009087060'])('Should validate a valid CPF: %s', (cpf: string) => {
    // Act
    const isValid = validateCpf(cpf)
    // Assert
    expect(isValid).toBe(true)
  })

  test.each([undefined, null, '300090870', '300090870600', '12345678901', '00000000000'])(
    'Should not validate an invalid CPF: %s',
    (cpf: unknown) => {
      // Act
      const isValid = validateCpf(cpf as string)
      // Assert
      expect(isValid).toBe(false)
    },
  )
})
