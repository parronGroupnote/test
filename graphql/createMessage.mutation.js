import gql from 'graphql-tag';
import MESSAGE_FRAGMENT from './message.fragment';
const CREATE_MESSAGE_MUTATION = gql`
  mutation createMessage($text: String!, $fromId: ID!, $groupId: ID!) {
    createMessage(text: $text, fromId: $fromId, groupId: $groupId) {
      ... MessageFragment
    }
  }
  ${MESSAGE_FRAGMENT}
`;
export default CREATE_MESSAGE_MUTATION;