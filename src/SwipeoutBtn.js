import React, { PropTypes } from 'react';
import {
  Text,
  View,
} from 'react-native';
import NativeButton from './NativeButton';
import styles from './styles';

const SwipeoutBtn = (btn) => {
  const styleSwipeoutBtn = [styles.swipeoutBtn];

  //  apply "type" styles (delete || primary || secondary)
  if (btn.type === 'delete') styleSwipeoutBtn.push(styles.colorDelete);
  else if (btn.type === 'primary') styleSwipeoutBtn.push(styles.colorPrimary);
  else if (btn.type === 'secondary') styleSwipeoutBtn.push(styles.colorSecondary);

  //  apply background color
  if (btn.backgroundColor) styleSwipeoutBtn.push([{ backgroundColor: btn.backgroundColor }]);

  styleSwipeoutBtn.push([{
    height: btn.height,
    width: btn.width,
  }]);

  const styleSwipeoutBtnComponent = [{
    height: btn.height,
    width: btn.width,
  }];

  const styleSwipeoutBtnText = [styles.swipeoutBtnText];

  //  apply text color
  if (btn.color) styleSwipeoutBtnText.push([{ color: btn.color }]);

  return (
      <NativeButton
        onPress={btn.onPress}
        style={styles.swipeoutBtnTouchable}
        underlayColor={btn.underlayColor}
        disabled={btn.disabled}
        style={styleSwipeoutBtn}
        textStyle={styleSwipeoutBtnText}>
        {
          (btn.component ?
            <View style={styleSwipeoutBtnComponent}>{btn.component}</View>
            :
            btn.text
          )
        }
      </NativeButton>
    );
};

SwipeoutBtn.propTypes = {
  backgroundColor: PropTypes.string,
  color: PropTypes.string,
  component: PropTypes.node,
  onPress: PropTypes.func,
  text: PropTypes.string,
  type: PropTypes.string,
  underlayColor: PropTypes.string,
};

SwipeoutBtn.defaultProps = {
  backgroundColor: null,
  color: null,
  component: null,
  underlayColor: null,
  height: 0,
  key: null,
  onPress: null,
  disabled: false,
  text: 'Click me',
  type: '',
  width: 0,
};

export default SwipeoutBtn;
