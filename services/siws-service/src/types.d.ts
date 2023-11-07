export type GetUserByIdentifierQuery = {
  data: {
    user: {
      id: string
      identifier: string
      identifier_type: string
    }[]
  }
}

export type CreateUserByIdentifierMutation = {
  data: {
    insert_user_one: {
      id: string
      identifier: string
      identifier_type: string
    }
  }
}
