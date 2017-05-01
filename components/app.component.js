
/************************************/
/*---------- Dependencies ----------*/
/************************************/
import React, { Component } from 'react';
import {
  AppRegistry,
  StyleSheet,
  Text,
  View
} from 'react-native';

import { ApolloProvider } from 'react-apollo';
import { createStore, combineReducers, applyMiddleware } from 'redux';
import { composeWithDevTools } from 'redux-devtools-extension';
import { SubscriptionClient, addGraphQLSubscriptions } from 'subscriptions-transport-ws';
import ApolloClient, { createNetworkInterface } from 'apollo-client';

import { Routes, Scenes } from './routes.component';

/******************************/
/*---------- Apollo ----------*/
/******************************/
const networkInterface = createNetworkInterface({ uri: 'https://api.graph.cool/simple/v1/cj1wpyzjrcy3f0137w99z1sma' });
// Create WebSocket client
const wsClient = new SubscriptionClient('wss://subscriptions.graph.cool/v1/cj1wpyzjrcy3f0137w99z1sma', {
  reconnect: true,
  connectionParams: {
    // Pass any arguments you want for initialization
  },
});

// Extend the network interface with the WebSocket
const networkInterfaceWithSubscriptions = addGraphQLSubscriptions(
  networkInterface,
  wsClient,
);
const client = new ApolloClient({
  networkInterface: networkInterfaceWithSubscriptions,
});
const store = createStore(
  combineReducers({
    apollo: client.reducer(),
  }),
  {}, // initial state
  composeWithDevTools(
    applyMiddleware(client.middleware()),
  ),
);

/*********************************/
/*---------- Component ----------*/
/*********************************/
export default 
class chatty extends Component {
  render() {
    return (
      <ApolloProvider store={store} client={client}>
        <Routes scenes={Scenes} />
      </ApolloProvider>
    );
  }
}