import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';

const GROUP_ADDED_SUBSCRIPTION = gql`
  subscription onGroupAdded($userId: [ID!]){
    Group(
        filter: {
        mutation_in: [CREATED]
        node: {
            users_every: {
                id_in: $userId
            }
        }
        }
    ) {
        mutation
        node {
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
export default GROUP_ADDED_SUBSCRIPTION;
