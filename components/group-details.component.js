// TODO: update group functionality
import React, { Component, PropTypes } from 'react';
import {
  ActivityIndicator,
  Button,
  Image,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { graphql, compose } from 'react-apollo';
import update from 'immutability-helper';

import GROUP_QUERY from '../graphql/group.query';
import DELETE_GROUP_MUTATION from '../graphql/deleteGroup.mutation';
import LEAVE_GROUP_MUTATION from '../graphql/leaveGroup.mutation';

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 54, // nav bar height
    flex: 1,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  detailsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listView: {

  },
  groupImageContainer: {
    paddingTop: 20,
    paddingHorizontal: 20,
    paddingBottom: 6,
    alignItems: 'center',
  },
  groupName: {
    color: 'black',
  },
  groupNameBorder: {
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    flex: 1,
    paddingVertical: 8,
  },
  groupImage: {
    width: 54,
    height: 54,
    borderRadius: 27,
  },
  participants: {
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    borderTopWidth: 1,
    paddingHorizontal: 20,
    paddingVertical: 6,
    backgroundColor: '#dbdbdb',
    color: '#777',
  },
  user: {
    alignItems: 'center',
    borderBottomWidth: 1,
    borderColor: '#dbdbdb',
    flexDirection: 'row',
    padding: 10,
  },
  username: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
});

export class GroupDetails extends Component {
  constructor(props) {
    super(props);

    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 })
        .cloneWithRows([]),
    };

    this.deleteGroup = this.deleteGroup.bind(this);
    this.leaveGroup = this.leaveGroup.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    const newData = nextProps.data;
    const oldData = this.props.data;

    if (!!newData.Group && !!newData.Group.users && newData.Group !== oldData.Group) {
      this.setState({
        selected: nextProps.selected,
        ds: this.state.ds.cloneWithRows(newData.Group.users),
      });
    }
  }

  deleteGroup() {
    this.props.deleteGroup({ id: this.props.id })
      .then((res) => {
        Actions.tabs({ type: 'reset' });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  leaveGroup() {
    this.props.leaveGroup({ id: this.props.id, userId: 1 }) // fake user for now
      .then((res) => {
        Actions.tabs({ type: 'reset' });
      })
      .catch((e) => {
        console.error(e);
      });
  }

  render() {
    const { data } = this.props;

    // render loading placeholder while we fetch messages
    if (!data || data.loading) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }

    return (
      <View style={styles.container}>
        <ListView
          style={styles.listView}
          enableEmptySections
          dataSource={this.state.ds}
          renderHeader={() => (
            <View>
              <View style={styles.detailsContainer}>
                <TouchableOpacity style={styles.groupImageContainer} onPress={this.pickGroupImage}>
                  <Image
                    style={styles.groupImage}
                    source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
                  />
                  <Text>edit</Text>
                </TouchableOpacity>
                <View style={styles.groupNameBorder}>
                  <Text style={styles.groupName}>{data.Group.name}</Text>
                </View>
              </View>
              <Text style={styles.participants}>
                {`participants: ${data.Group.users.length}`.toUpperCase()}
              </Text>
            </View>
          )}
          renderFooter={() => (
            <View>
              <Button title={'Leave Group'} onPress={this.leaveGroup} />
              <Button title={'Delete Group'} onPress={this.deleteGroup} />
            </View>
          )}
          renderRow={user => (
            <View style={styles.user}>
              <Image
                style={styles.avatar}
                source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
              />
              <Text style={styles.username}>{user.username}</Text>
            </View>
          )}
        />
      </View>
    );
  }
}

GroupDetails.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    Group: PropTypes.object,
  }).isRequired,
  deleteGroup: PropTypes.func.isRequired,
  leaveGroup: PropTypes.func.isRequired,
  id: PropTypes.string.isRequired,
};

const group = graphql(GROUP_QUERY, {
  options: ({ id }) => ({ variables: { groupId: id } }),
});

const deleteGroup = graphql(DELETE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    deleteGroup: () =>
      mutate({
        variables: { id: ownProps.id },
        updateQueries: {
          user: (previousResult, { mutationResult }) => {
            const removedGroup = mutationResult.data.deleteGroup;

            return update(previousResult, {
              User: {
                groups: {
                  $set: previousResult.User.groups
                    .filter(g => removedGroup.id !== g.id),
                },
              },
            });
          },
        },
      }),
  }),
});

const leaveGroup = graphql(LEAVE_GROUP_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    leaveGroup: () =>
      mutate({
        variables: { id: ownProps.id, userId: "cj1xrbho04ewe0181nwa8jpqg" }, // fake user for now
        updateQueries: {
          user: (previousResult, { mutationResult }) => {
            console.log(previousResult);
            const removedGroup = mutationResult.data.removeFromGroupUsers;

            return update(previousResult, {
              User: {
                groups: {
                  $set: previousResult.User.groups
                    .filter(g => removedGroup.groupsGroup.id !== g.id),
                },
              },
            });
          },
        },
      }),
  }),
});

export default compose(
  group,
  deleteGroup,
  leaveGroup,
)(GroupDetails);