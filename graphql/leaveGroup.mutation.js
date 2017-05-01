import gql from 'graphql-tag';

const LEAVE_GROUP_MUTATION = gql`
  mutation leaveGroup($id: ID!, $userId: ID!) {
    removeFromGroupUsers(usersUserId: $userId, groupsGroupId: $id) {
      groupsGroup {
        id
      }
      usersUser {
        id
      }
    }
  }
`;

export default LEAVE_GROUP_MUTATION;