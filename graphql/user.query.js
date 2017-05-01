import gql from 'graphql-tag';
// get the user and all user's groups
import MESSAGE_FRAGMENT from './message.fragment';

const USER_QUERY = gql`
  query user($id: ID!) {
    User(id: $id) {
      id
      email
      username
      contacts {
        id
        username
      }
      groups {
        id
        name
        messages(last: 1) {
          ... MessageFragment
        }
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;
export default USER_QUERY;