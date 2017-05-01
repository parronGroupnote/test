import gql from 'graphql-tag';
const MESSAGE_FRAGMENT = gql`
  fragment MessageFragment on Message {
    id
    group {
      id
    }
    from {
      id
      username
    }
    createdAt
    text
  }
`;
export default MESSAGE_FRAGMENT;