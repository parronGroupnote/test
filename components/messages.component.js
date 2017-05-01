import { _ } from 'lodash';
import {
   ActivityIndicator,
  KeyboardAvoidingView,
  Image,
  RefreshControl,
  ListView,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import React, { Component, PropTypes } from 'react';
import randomColor from 'randomcolor';
import Message from './message.component';
import { graphql, compose } from 'react-apollo';
import GROUP_QUERY from '../graphql/group.query';
import CREATE_MESSAGE_MUTATION from '../graphql/createMessage.mutation';
import MessageInput from './message-input.component';
import update from 'immutability-helper';
import { Actions } from 'react-native-router-flux';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/messageAdded.subscription';
import styled from 'styled-components/native';

const styles = StyleSheet.create({
  container: {
    alignItems: 'stretch',
    backgroundColor: '#e5ddd5',
    flex: 1,
    flexDirection: 'column',

  },
  loading: {
    justifyContent: 'center',
  },
  titleWrapper: {
    alignItems: 'center',
    marginTop: 10,
    position: 'absolute',
    ...Platform.select({
      ios: {
        top: 15,
      },
      android: {
        top: 5,
      },
    }),
    left: 0,
    right: 0,
  },
  title: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  titleImage: {
    marginRight: 6,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});

export class Messages extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
      usernameColors: {},
      refreshing: false,
    };
    this.send = this.send.bind(this);
    this.groupDetails = this.groupDetails.bind(this);
    this.onRefresh = this.onRefresh.bind(this);
  }
  componentWillReceiveProps(nextProps) {
    const oldData = this.props;
    const newData = nextProps;
    const usernameColors = {};
    // check for new messages
    if (newData.group) {
      if (newData.group.users) {
        // apply a color to each user
        newData.group.users.map((user) => {
          usernameColors[user.username] = this.state.usernameColors[user.username] || randomColor();
        });
      }
    if (!!newData.group.messages &&
        (!oldData.group || newData.group.messages !== oldData.group.messages)) {
        // convert messages Array to ListView.DataSource
        // we will use this.state.ds to populate our ListView
        this.setState({
          ds: this.state.ds.cloneWithRows(
            // reverse the array so newest messages
            // show up at the bottom
            newData.group.messages.slice().reverse()
          ),
          usernameColors,
        });
      }
      // we don't resubscribe on changed props
    // because it never happens in our app
    if (!this.subscription && !newData.loading) {
      this.subscription = newData.subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { groupIds: [newData.groupId] },
        updateQuery: (previousResult, { subscriptionData }) => {
          const newMessage = subscriptionData.data.Message.node;
          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.

          if (isDuplicateMessage(
            newMessage, previousResult.Group.messages)
          ) {
            return previousResult;
          }
          return update(previousResult, {
            Group: {
              messages: {
                $unshift: [newMessage],
              },
            },
          });
        },
      });
    }
    }
  }
  onRefresh() {
    this.setState({ refreshing: true });
    this.props.loadMoreEntries().then(() => {
      this.setState({
        refreshing: false,
      });
    });
  }
  groupDetails() {
    Actions.groupDetails({ id: this.props.groupId });
  }
  send(text) {
    this.props.createMessage({
      groupId: this.props.groupId,
      fromId: "cj1xrbho04ewe0181nwa8jpqg", // faking the user for now
      text,
    });
    this.setState({
      shouldScrollToBottom: true,
    });
  }

  render() {
    // render list of messages for group
    const { loading, group } = this.props;
    // render loading placeholder while we fetch messages
    if (loading && !group) {
      return (
        <View style={[styles.loading, styles.container]}>
          <ActivityIndicator />
        </View>
      );
    }
    return (
      <KeyboardAvoidingView
        behavior={'position'}
        contentContainerStyle={styles.container}
        style={styles.container}
      >
      <FalseHeader/>
        <ListView
            ref={(ref) => { this.listView = ref; }}
          style={styles.listView}
          enableEmptySections
          dataSource={this.state.ds}
          refreshControl={
            <RefreshControl
              refreshing={this.state.refreshing}
              onRefresh={this.onRefresh}
            />
          }
          onContentSizeChange={() => {
            if (this.state.shouldScrollToBottom) {
              this.listView.scrollToEnd({ animated: true });
              this.setState({
                shouldScrollToBottom: false,
              });
            }
          }}
          renderRow={message => (
            <Message
              color={this.state.usernameColors[message.from.username]}
              message={message}
              isCurrentUser={message.from.id === "cj1xrbho04ewe0181nwa8jpqg"} // for now until we implement auth
            />
          )}
        />
        <MessageInput send={this.send} />
      </KeyboardAvoidingView>
    );
  }
}
Messages.propTypes = {
  group: PropTypes.shape({
    messages: PropTypes.array,
    users: PropTypes.array,
  }),
  loading: PropTypes.bool,
  groupId: PropTypes.string.isRequired,
  loadMoreEntries: PropTypes.func,
  title: PropTypes.string.isRequired,
};

const ITEMS_PER_PAGE = 10;
// const groupQuery = graphql(GROUP_QUERY, {
//   options: ({ groupId }) => ({ variables: { 
//     groupId 
    
//   } }),
//   props: ({ data: { loading, Group, error } }) => ({
//     loading, group: Group, error
//   }),
// });

const groupQuery = graphql(GROUP_QUERY, {
  options: ({ groupId }) => ({
    variables: {
      groupId,
      offset: 0,
      limit: ITEMS_PER_PAGE,
    },
  }),
  props: ({ data: { fetchMore, loading, Group, error, subscribeToMore } }) => ({
    loading,
    group: Group,
    error,
    subscribeToMore,
    loadMoreEntries() {
      return fetchMore({
        // query: ... (you can specify a different query. 
        // GROUP_QUERY is used by default)
        variables: {
          // We are able to figure out offset because it matches
          // the current messages length
          offset: Group.messages.length,
        },
        updateQuery: (previousResult, { fetchMoreResult }) => {
          // we will make an extra call to check if no more entries
          if (!fetchMoreResult) { return previousResult; }
          // push results (older messages) to end of messages list
          return update(previousResult, {
            Group: {
              messages: { $push: fetchMoreResult.Group.messages },
            },
          });
        },
      });
    },
  }),
});

// helper function checks for duplicate comments
// it's pretty inefficient to scan all the comments every time, but we're gonna keep things simple-ish for now
function isDuplicateMessage(newMessage, existingMessages) {
  return newMessage.id !== null && 
    existingMessages.some(message => newMessage.id === message.id);
}

const createMessage = graphql(CREATE_MESSAGE_MUTATION, {
  props: ({ ownProps, mutate }) => ({
    createMessage: ({ text, fromId, groupId }) =>
      mutate({
        variables: { text, fromId, groupId },
        optimisticResponse: {
          __typename: 'Mutation',
          createMessage: {
            __typename: 'Message',
            id: null, // don't know id yet, but it doesn't matter
            text, // we know what the text will be
            createdAt: new Date().toISOString(), // the time is now!
            from: {
              __typename: 'User',
              id: "cj1xrbho04ewe0181nwa8jpqg", // still faking the user
              username: 'user' // still faking the user
              // maybe we should stop faking the user soon!
            },
          },
        },
        updateQueries: {
          group: (previousResult, { mutationResult }) => {
            const newMessage = mutationResult.data.createMessage;
            if (isDuplicateMessage(newMessage,
                previousResult.Group.messages)) {
              return previousResult;
            }
            return update(previousResult, {
              Group: {
                messages: {
                  $unshift: [newMessage],
                },
              },
            });
          },
        },
      }),
  }),
});
export default compose(
  groupQuery,
  createMessage,
)(Messages);

const FalseHeader = styled.View`
    height: ${Platform.OS === 'ios' ? 64 : 54};
    background-color: #EFEFF2;
    border-bottom-width: 0.5;
    border-bottom-color: #828287;
`;