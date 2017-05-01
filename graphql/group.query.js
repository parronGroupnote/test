import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';
const GROUP_QUERY = gql`
  query group($groupId: ID!, $limit: Int, $offset: Int) {
    Group(id: $groupId) {
      id
      name
      users {
        id
        username
      }
      messages(last: $limit, skip: $offset, orderBy: createdAt_DESC) {
        ... MessageFragment
      }
    }
  }
  ${MESSAGE_FRAGMENT}
`;
export default GROUP_QUERY;