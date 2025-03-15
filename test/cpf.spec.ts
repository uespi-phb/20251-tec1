import { validateCpf } from '@/cpf'

describe('validateCpf', () => {
  test('Should validade a valid CPF', () => {
    // Arrange
    const cpf = '011.160.040-54'
    // Action
    const isValid = validateCpf(cpf)
    // Assert
    expect(isValid).toBe(true)
  })
})
