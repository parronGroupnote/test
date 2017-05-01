function CustomHorizontal(/* NavigationSceneRendererProps */ props) {
  const {
    position,
    scene,
  } = props;

  const index = scene.index;

  const inputRange = [index - 1, index, index + 1];

  const previousTransition = props.scenes[1] && props.scenes[1].navigationState.direction === 'customY' 
    ? 0 
    : -SCREEN_WIDTH/5

  const translateX = position.interpolate({
    inputRange,
    outputRange: [SCREEN_WIDTH, 0, previousTransition],
  });

  return {
    transform: [
      { translateX },
    ],
  };
}

function CustomVertical(/* NavigationSceneRendererProps */ props) {
  const {
    position,
    scene,
  } = props;

  const index = scene.index;

  const inputRange = [index - 1, index, index + 1];

  const translateY = position.interpolate({
    inputRange,
    outputRange: [SCREEN_HEIGHT, 0, 0],
  });

  return {
    transform: [
      { translateY },
    ],
  };
}