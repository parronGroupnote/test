import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';
const MESSAGE_ADDED_SUBSCRIPTION = gql`
  subscription onMessageAdded($groupIds: [ID!]){
    Message(
        filter: {
        mutation_in: [CREATED]
        node: {
            group: {
                id_in: $groupIds
            }
        }
        }
    ) {
        mutation
        node {
            ... MessageFragment
        }
    }
  }
  ${MESSAGE_FRAGMENT}
`;
export default MESSAGE_ADDED_SUBSCRIPTION;