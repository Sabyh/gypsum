import * as Validall from 'validall';

export const usersSchema: Validall.ISchema = {
  email: {
    $and: [
      { $required: true, $message: 'no_email' },
      { $type: 'string', $is: 'email', $message: 'invalid_email' }
    ]
  },
  password: {
    $and: [
      { $required: true, $message: 'no_password' },
      { $type: 'string', $message: 'invalid_password' }
    ]
  },
  passwordSalt: 'string',
  verified: {
    $type: 'boolean',
    $default: false
  }
};

export const usersSchemaOptions: Validall.ISchemaOptions = {
  required: false,
  strict: false,
  filter: true
};