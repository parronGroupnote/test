
/************************************/
/*---------- Dependencies ----------*/
/************************************/
import React, { Component, PropTypes } from 'react';
import { Router, Scene, Actions } from 'react-native-router-flux';
import { connect } from 'react-redux';
import styled from 'styled-components/native';

import {Text, Animated, StyleSheet,TouchableOpacity, View, Image, Platform} from 'react-native';
import Groups from './groups.component';
import Messages from './messages.component';
import FinalizeGroup from './finalize-group.component';
import GroupDetails from './group-details.component';
import NewGroup from './new-group.component';

/**********************************/
/*---------- Components ----------*/
/**********************************/
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
/*---------- Test ----------*/
/****************************/
const TestScene = props => (
  <CenteredView>
    <TitleText>
      {props.title}
    </TitleText>
  </CenteredView>
);

/*---------- Tab icon ----------*/
/********************************/
// icons for our Tab Scene
class TabIcon extends Component {
  render() {
    return (
      <CenteredView>
        <TabText selected={this.props.selected}>
          {this.props.title}
        </TabText>
      </CenteredView>
    );
  }
}
TabIcon.propTypes = {
  selected: PropTypes.bool,
  title: PropTypes.string.isRequired,
};

/*---------- Scenes ----------*/
/******************************/
// create scenes via Actions.create() or it will be re-created every time Router renders
export const Scenes = Actions.create(
  <Scene key="root">
    <Scene key="tabs" tabs direction="customX">
      <Scene key="chatsTab" title="Chats" icon={TabIcon}>
        <Scene
          key="groups"       

          component={Groups}
          title="Chats"
        />
      </Scene>
      <Scene key="settingsTab" title="Settings" icon={TabIcon}>
        <Scene 
          key="settings"
          component={TestScene}
          title="Settings"
        />
      </Scene>
    </Scene>
     <Scene key="newGroup" direction="customY">
      <Scene
        key="newGroupModal"
        component={NewGroup}
        title="New Group"
        schema="modal"
        panHandlers={null}
      />
      <Scene
        key="finalizeGroup"
        component={FinalizeGroup}
        title="New Group"
      />
    </Scene>
    <Scene
      key="messages"
      component={Messages}
      direction="customX"
      renderTitle={(navProps)=><CustomTitle {...navProps}/>}
    />
    <Scene key="groupDetails" component={GroupDetails} title="Group Info" />
  </Scene>,
);

export const Routes = connect()(Router);

class CustomTitle extends Component {
  constructor(props){
    super(props)
}
  render(){
    return(
        <Animated.View
          lineBreakMode="tail"
          numberOfLines={1}
          style={
            {
              opacity: this.props.position.interpolate({
                inputRange: [this.props.index - 1, this.props.index, this.props.index + 1],
                outputRange: [0, 0, 1],
              }),
              left: this.props.position.interpolate({
                inputRange: [this.props.index - 1, this.props.index + 1],
                outputRange: [200, 0],
              }),
              right: this.props.position.interpolate({
                inputRange: [this.props.index - 1, this.props.index + 1],
                outputRange: [-200, 200],
              }),
            }
          }>

      <TouchableOpacity
          style={styles.titleWrapper}
          onPress={()=>Actions.groupDetails({ id: this.props.groupId })}
        >
          <View style={styles.title}>
            <Image
              style={styles.titleImage}
              source={{ uri: this.props.image }}
            />
            <Text>{this.props.title}</Text>
            
          </View>
        </TouchableOpacity>
        </Animated.View>
    )
  }
}
/*****************************************/
/*---------- Styled components ----------*/
/*****************************************/
const CenteredView = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: white;
`;

const TitleText = styled.Text``;

const TabText = styled.Text`
  color: ${props => props.selected ? 'blue' : '#777'} ;
  font-size: 10;
  justifyContent: center;
`;
