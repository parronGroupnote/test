
/************************************/
/*---------- Dependencies ----------*/
/************************************/

import React, { Component, PropTypes } from 'react';
import {
  ActivityIndicator,
  ListView,
  View,
  Platform,
  TouchableHighlight,
} from 'react-native';
import moment from 'moment';
import Icon from 'react-native-vector-icons/FontAwesome';
import update from 'immutability-helper';
import styled from 'styled-components/native';
import { Actions } from 'react-native-router-flux';
import { graphql, compose } from 'react-apollo';
import { map } from 'lodash';

import USER_QUERY from '../graphql/user.query';
import MESSAGE_ADDED_SUBSCRIPTION from '../graphql/messageAdded.subscription';
import GROUP_ADDED_SUBSCRIPTION from '../graphql/groupAdded.subscription';

/*******************************/
/*---------- Helpers ----------*/
/*******************************/
// helper function checks for duplicate documents
// TODO it's pretty inefficient to scan all the documents every time.
// maybe only scan the first 10, or up to a certain timestamp
function isDuplicateDocument(newDocument, existingDocuments) {
  return newDocument.id !== null && existingDocuments.some(doc => newDocument.id === doc.id);
}

// format createdAt with moment
const formatCreatedAt = createdAt => moment(createdAt).calendar(null, {
  sameDay: '[Today]',
  nextDay: '[Tomorrow]',
  nextWeek: 'dddd',
  lastDay: '[Yesterday]',
  lastWeek: 'dddd',
  sameElse: 'DD/MM/YYYY',
});

/**********************************/
/*---------- Components ----------*/
/**********************************/

/*---------- Header ----------*/
/******************************/
const Header = () => (
  <HeaderView>
    <NewGroupButton title={'New Group'} onPress={Actions.newGroup} />
  </HeaderView>
);

/*---------- Group ----------*/
/*****************************/
class Group extends Component {
  constructor(props) {
    super(props);
    this.state = {
      selected: false
    }
    this.goToMessages = this.props.goToMessages.bind(this, this.props.group);
  }
  onPress = () => {
    this.setState({
      selected: true
    })
    this.goToMessages()
    setTimeout(()=>
      this.setState({
        selected: false
      }), 600)
  }
  render() {
    const { id, name, messages } = this.props.group;
    return (
      <TouchableHighlight key={id} onPress={this.onPress} underlayColor={'rgba(0,0,0,0.05)'}>
        <View>
          <GroupView selected={this.state.selected}>
            <GroupImage source={{uri: 'https://cdn1.iconfinder.com/data/icons/unique-round-blue/93/user-512.png'}}/>
            <GroupContentView>
              <GroupTitleView>
                <GroupNameText numberOfLines={1}>{`${name}`}</GroupNameText>
                <GroupLastMessageDate>
                  {messages.length ? formatCreatedAt(messages[0].createdAt) : '--'}
                </GroupLastMessageDate>
              </GroupTitleView>
              <GroupUsernameText>
                {messages.length ? `${messages[0].from.username}:` : ''}
              </GroupUsernameText>
              <GroupLastMessageText numberOfLines={1}>
                {messages.length ? messages[0].text : '--'}
              </GroupLastMessageText>
            </GroupContentView>
            <Icon
              name="angle-right"
              size={24}
              color={'#8c8c8c'}
            />
          </GroupView>
          <GroupDivider>
            <GroupDividerEmpty/>
            <GroupDividerLine/>
          </GroupDivider>
        </View>
      </TouchableHighlight>
    );
  }
}
Group.propTypes = {
  goToMessages: PropTypes.func.isRequired,
  group: PropTypes.shape({
    id: PropTypes.string,
    name: PropTypes.string,
    messages: PropTypes.array,
  }),
};

/*---------- Groups ----------*/
/******************************/
class Groups extends Component {
  constructor(props) {
    super(props);
    this.state = {
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    };
    this.goToMessages = this.goToMessages.bind(this);
  }
  goToMessages(group) {
    Actions.messages({ groupId: group.id, title: group.name, image: 'https://cdn1.iconfinder.com/data/icons/unique-round-blue/93/user-512.png' });
  }
  componentWillReceiveProps(nextProps) {
    if (!nextProps.loading && nextProps.user && nextProps.user !== this.props.user) {
      // convert groups Array to ListView.DataSource
      // we will use this.state.ds to populate our ListView
      this.setState({
        // cloneWithRows computes a diff and decides whether to rerender
        ds: this.state.ds.cloneWithRows(nextProps.user.groups),
      });
    }
    if (!this.messagesSubscription && !nextProps.loading) {
      this.messagesSubscription = nextProps.subscribeToMore({
        document: MESSAGE_ADDED_SUBSCRIPTION,
        variables: { groupIds: map(nextProps.user.groups, 'id') },
        updateQuery: (previousResult, { subscriptionData }) => {
          const previousGroups = previousResult.User.groups;
          // alert(JSON.stringify(subscriptionData))
          const newMessage = subscriptionData.data.Message.node;
          
          const groupIndex = map(previousGroups,'id')
                               .indexOf(newMessage.group.id);
          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.
          if (isDuplicateDocument(newMessage,
               previousGroups[groupIndex].messages)) {
            return previousResult;
          }
          return update(previousResult, {
            User: {
              groups: {
                [groupIndex]: {
                  messages: { $set: [newMessage] },
                },
              },
            },
          });
        },
      });
    }
    if (!this.groupSubscription && !nextProps.loading) {
      this.groupSubscription = nextProps.subscribeToMore({
        document: GROUP_ADDED_SUBSCRIPTION,
        variables: { userId: "cj1xrbho04ewe0181nwa8jpqg" }, // last time we'll fake the user!
        updateQuery: (previousResult, { subscriptionData }) => {
          console.log('previousResult', previousResult);
          console.log('subscriptionData', subscriptionData);
          const previousGroups = previousResult.User.groups;
          const newGroup = subscriptionData.data.Group.node;
          // if it's our own mutation
          // we might get the subscription result
          // after the mutation result.

          if (isDuplicateDocument(newGroup, previousGroups)) {
            return previousResult;
          }
          return update(previousResult, {
            User: {
              groups: { $push: [newGroup] },
            },
          });
        },
      });
    }
  }
render() {
    const { loading, user } = this.props;
    // render loading placeholder while we fetch messages
    if (loading) {
      return (
        <ScenarioView center>
          <ActivityIndicator />
        </ScenarioView>
      );
    }

    if (user && !user.groups.length) {
      return (
        <ScenarioView>
          <Header />
          <WarningText>{'You do not have any groups.'}</WarningText>
        </ScenarioView>
      );
    }

    // render list of groups for user
    return (
      <ScenarioView>
        <ListView
          enableEmptySections
          dataSource={this.state.ds}
          renderHeader={() => <Header />}
          renderRow={(group => (
            <Group group={group} goToMessages={this.goToMessages}/>
          ))}
        />
      </ScenarioView>
    );
  }
}
Groups.propTypes = {
  loading: PropTypes.bool,
  user: PropTypes.shape({
    id: PropTypes.string.isRequired,
    email: PropTypes.string.isRequired,
    groups: PropTypes.arrayOf(
      PropTypes.shape({
        id: PropTypes.string.isRequired,
        name: PropTypes.string.isRequired,
      }),
    ),
  }),
};

/*******************************/
/*---------- GraphQL ----------*/
/*******************************/
const userQuery = graphql(USER_QUERY, {
  options: () => ({ variables: { id: "cj1xrbho04ewe0181nwa8jpqg" } }),
  props: ({ data: { loading, User, error, subscribeToMore } }) => ({
    loading, user: User, error, subscribeToMore
  }),
});

/******************************/
/*---------- Export ----------*/
/******************************/
export default compose(
  userQuery,
)(Groups);

/*****************************************/
/*---------- Styled components ----------*/
/*****************************************/
const ScenarioView = styled.View`
  margin-bottom: 50; 
  margin-top: ${Platform.OS === 'ios' ? 64 : 54};
  flex: 1;
  justify-content: ${props => props.center ? 'center' : 'flex-start'};
`;

const NewGroupButton = styled.Button`

`;

const GroupDivider = styled.View`
  flex: 1;
  flex-direction: row;
`

const GroupDividerEmpty = styled.View`
  width: 74;
  border-bottom-color: white;
  border-bottom-width: 1;
`

const GroupDividerLine = styled.View`
  flex: 1;
  border-bottom-color: #eee;
  border-bottom-width: 1;
`;

const GroupView = styled.View`
  flex: 1;
  flex-direction: row;
  align-items: center;
  background-color: ${props => props.selected ? 'rgba(0,0,0,0.15)' : 'white'};
  padding-horizontal: 10;
  padding-vertical: 8;
`

const GroupImage = styled.Image`
  width: 54;
  height: 54;
  border-radius: 27;
`;

const GroupContentView = styled.View`
  flex: 1;
  flex-direction: column;
  padding-left: 8;
`;

const GroupTitleView = styled.View`
  flex-direction: row;
`;

const GroupNameText = styled.Text`
  font-weight: bold;
  flex: 0.7;
`;

const GroupLastMessageDate = styled.Text`
  flex: 0.3;
  color: #8c8c8c;
  font-size: 11;
  text-align: right;
`;

const GroupUsernameText = styled.Text`
  padding-vertical: 4;
`;

const GroupLastMessageText = styled.Text`
  color: #8c8c8c;
`;

const WarningText = styled.Text`
  text-align: center;
  padding: 12;
`;

const HeaderView = styled.View`
  align-items: flex-end;
  padding: 6;
  border-color: #eee;
  border-bottom-width: 1;
`