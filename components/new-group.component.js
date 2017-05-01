import { _ } from 'lodash';
import React, { Component } from 'react';
import PropTypes from 'prop-types';
import {
  ActivityIndicator,
  Image,
  ListView,
  Platform,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { Actions } from 'react-native-router-flux';
import { graphql, compose } from 'react-apollo';
import AlphabetListView from 'react-native-alphabetlistview';
import update from 'immutability-helper';
import Icon from 'react-native-vector-icons/FontAwesome';

import SelectedUserList from './selected-user-list.component';
import USER_QUERY from '../graphql/user.query';

const sortObject = o => Object.keys(o).sort().reduce((r, k) => (r[k] = o[k], r), {});

const styles = StyleSheet.create({
  container: {
    marginTop: Platform.OS === 'ios' ? 64 : 54, // nav bar height
    flex: 1,
  },
  cellContainer: {
    alignItems: 'center',
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  cellImage: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  cellLabel: {
    flex: 1,
    fontSize: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  selected: {
    flexDirection: 'row',
  },
  loading: {
    justifyContent: 'center',
    flex: 1,
  },
  navIcon: {
    color: 'blue',
    fontSize: 18,
    paddingTop: 2,
  },
  checkButtonContainer: {
    paddingRight: 12,
    paddingVertical: 6,
  },
  checkButton: {
    borderWidth: 1,
    borderColor: '#dbdbdb',
    padding: 4,
    height: 24,
    width: 24,
  },
  checkButtonIcon: {
    marginRight: -4, // default is 12
  },
});

class SectionHeader extends Component {
  render() {
    // inline styles used for brevity, use a stylesheet when possible
    const textStyle = {
      textAlign: 'center',
      color: '#fff',
      fontWeight: '700',
      fontSize: 16,
    };

    const viewStyle = {
      backgroundColor: '#ccc',
    };
    return (
      <View style={viewStyle}>
        <Text style={textStyle}>{this.props.title}</Text>
      </View>
    );
  }
}
SectionHeader.propTypes = {
  title: PropTypes.string,
};

class SectionItem extends Component {
  render() {
    return (
      <Text style={{ color: 'blue' }}>{this.props.title}</Text>
    );
  }
}
SectionItem.propTypes = {
  title: PropTypes.string,
};

class Cell extends Component {
  constructor(props) {
    super(props);
    this.toggle = this.toggle.bind(this);
    this.state = {
      isSelected: props.isSelected(props.item),
    };
  }

  componentWillReceiveProps(nextProps) {
    this.setState({
      isSelected: nextProps.isSelected(nextProps.item),
    });
  }

  toggle() {
    this.props.toggle(this.props.item);
  }

  render() {
    return (
      <View style={styles.cellContainer}>
        <Image
          style={styles.cellImage}
          source={{ uri: 'https://facebook.github.io/react/img/logo_og.png' }}
        />
        <Text style={styles.cellLabel}>{this.props.item.username}</Text>
        <View style={styles.checkButtonContainer}>
          <Icon.Button
            backgroundColor={this.state.isSelected ? 'blue' : 'white'}
            borderRadius={12}
            color={'white'}
            iconStyle={styles.checkButtonIcon}
            name={'check'}
            onPress={this.toggle}
            size={16}
            style={styles.checkButton}
          />
        </View>
      </View>
    );
  }
}
Cell.propTypes = {
  isSelected: PropTypes.func,
  item: PropTypes.shape({
    username: PropTypes.string.isRequired,
  }).isRequired,
  toggle: PropTypes.func.isRequired,
};

class NewGroup extends Component {
  constructor(props) {
    super(props);

    this.state = {
      selected: props.selected || [],
      contacts: !!props.data && !!props.data.User ?
        _.groupBy(props.data.User.contacts, friend => friend.username.charAt(0).toUpperCase()) : [],
      ds: new ListView.DataSource({ rowHasChanged: (r1, r2) => r1 !== r2 }),
    };

    this.finalizeGroup = this.finalizeGroup.bind(this);
    this.isSelected = this.isSelected.bind(this);
    this.toggle = this.toggle.bind(this);
  }

  componentDidMount() {
    this.refreshNavigation(this.state.selected);
  }

  componentWillReceiveProps(nextProps, nextState) {
    const newData = nextProps.data;
    const oldData = this.props.data;

    const state = {};
    if (newData.User && newData.User.contacts && newData.User !== oldData.User) {
      state.contacts = sortObject(
        _.groupBy(newData.User.contacts, friend => friend.username.charAt(0).toUpperCase()),
      );
    }

    if (nextProps.selected) {
      Object.assign(state, {
        selected: nextProps.selected,
        ds: this.state.ds.cloneWithRows(nextProps.selected),
      });
    }

    this.setState(state);
  }

  componentWillUpdate(nextProps, nextState) {
    if (!!this.state.selected.length !== !!nextState.selected.length) {
      this.refreshNavigation(nextState.selected);
    }
  }

  refreshNavigation(selected) {
    Actions.refresh({
      onLeft: Actions.pop,
      leftTitle: 'Cancel',
      rightTitle: selected ? 'Next' : undefined,
      onRight: selected ? this.finalizeGroup : undefined,
      selected,
    });
  }

  finalizeGroup() {
    Actions.finalizeGroup({
      selected: this.state.selected,
      friendCount: this.props.data.User.contacts.length,
      userId: this.props.data.User.id,
    });
  }

  isSelected(user) {
    return ~this.state.selected.indexOf(user);
  }

  toggle(user) {
    const index = this.state.selected.indexOf(user);
    if (~index) {
      const selected = update(this.state.selected, { $splice: [[index, 1]] });

      return this.setState({
        selected,
        ds: this.state.ds.cloneWithRows(selected),
      });
    }

    const selected = [...this.state.selected, user];

    return this.setState({
      selected,
      ds: this.state.ds.cloneWithRows(selected),
    });
  }

  render() {
    const { data } = this.props;

    console.log(data);

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
        {this.state.selected.length ? <View style={styles.selected}>
          <SelectedUserList
            dataSource={this.state.ds}
            remove={this.toggle}
          />
        </View> : undefined}
        {_.keys(this.state.contacts).length ? <AlphabetListView
          style={{ flex: 1 }}
          data={this.state.contacts}
          cell={Cell}
          cellHeight={30}
          cellProps={{
            isSelected: this.isSelected,
            toggle: this.toggle,
          }}
          sectionListItem={SectionItem}
          sectionHeader={SectionHeader}
          sectionHeaderHeight={22.5}
        /> : undefined}
      </View>
    );
  }
}

NewGroup.propTypes = {
  data: PropTypes.shape({
    loading: PropTypes.bool.isRequired,
    User: PropTypes.object,
  }),
  selected: PropTypes.array,
};

const user = graphql(USER_QUERY, {
  options: () => ({ variables: { id: "cj1xrbho04ewe0181nwa8jpqg" } }),
});


export default compose(
  user,
)(NewGroup);