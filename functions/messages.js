const MESSAGES = {
    EN: {
      scream:{
        not_found: 'Scream not found',
          already_liked: 'Scream already liked'
      },
        user:{
          empty_field: 'Must not be empty',
          email_empty: 'Email must not be empty',
          email_not_valid: 'Email must be valid',
          password_not_match: 'Passwords must match',
          handle_taken: 'This handle is already taken',
          email_has_used: 'This email has already used',
            image_uploaded: 'Image uploaded successfully',
            wrong_file_type: 'Wrong file type submitted',
            details_updated: 'Details added successfully'
        },
        generic: {
          server_error: 'something went wrong!'
        },
        auth: {
          not_authorized: 'Not authorized',
            no_token: 'No token found',
            error_token:'Error while verifying token'
        }
    },
    ES: {}
};

module.exports = MESSAGES;