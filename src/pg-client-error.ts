export class PgClientError extends Error {
  constructor(message: string) {
    super(message)
  }
}

export class PgClientConnectionError extends PgClientError {
  constructor(message?: string) {
    if (!message) {
      message = 'Connection error'
    }
    super(message)
  }
}
