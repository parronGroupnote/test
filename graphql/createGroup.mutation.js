import gql from 'graphql-tag';

const CREATE_GROUP_MUTATION = gql`
  mutation createGroup($name: String!, $usersIds: [ID!]) {
    createGroup(name: $name, usersIds: $usersIds) {
      id
      name
      users {
        id
      }
    }
  }
`;

export default CREATE_GROUP_MUTATION;