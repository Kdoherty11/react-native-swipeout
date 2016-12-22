import React, {
  Component,
  PropTypes,
} from 'react';
import {
  PanResponder,
  View,
} from 'react-native';
import tweenState from 'react-tween-state';
import SwipeoutBtn from './SwipeoutBtn';
import NativeButton from './NativeButton';
import styles from './styles';

const Swipeout = React.createClass({
  mixins: [tweenState.Mixin],

  propTypes: {
    autoClose: PropTypes.bool,
    backgroundColor: PropTypes.string,
    close: PropTypes.bool,
    left: PropTypes.array,
    onOpen: PropTypes.func,
    right: PropTypes.array,
    scroll: PropTypes.func,
    style: View.propTypes.style,
    sensitivity: PropTypes.number,
  },

  getDefaultProps: function() {
    return {
      rowID: -1,
      sectionID: -1,
      sensitivity: 0,
    };
  },

  getInitialState: function() {
    return {
      autoClose: this.props.autoClose || false,
      btnWidth: 0,
      btnsLeftWidth: 0,
      btnsRightWidth: 0,
      contentHeight: 0,
      contentPos: 0,
      contentWidth: 0,
      openedRight: false,
      swiping: false,
      tweenDuration: 160,
      timeStart: null,
    };
  },

  componentWillMount: function() {
    this._panResponder = PanResponder.create({
      onStartShouldSetPanResponder: (event, gestureState) => true,
      onMoveShouldSetPanResponder: (event, gestureState) =>
        Math.abs(gestureState.dx) > this.props.sensitivity &&
        Math.abs(gestureState.dy) > this.props.sensitivity,
      onPanResponderGrant: this._handlePanResponderGrant,
      onPanResponderMove: this._handlePanResponderMove,
      onPanResponderRelease: this._handlePanResponderEnd,
      onPanResponderTerminate: this._handlePanResponderEnd,
      onShouldBlockNativeResponder: (event, gestureState) => true,
    });
  },

  componentWillReceiveProps: function(nextProps) {
    if (nextProps.close) this._close();
  },

  _buttonsRightWidth: function() {
    let w = 0;
    const width = this.state.contentWidth;
     if (this.props.right && this.props.right.length) {
       this.props.right.forEach(function(el) {
         if (el.styleButton && el.styleButton.width)
           w += el.styleButton.width;
         else
           w += width / 5;
       });
     }
     return w;
  },

  _handlePanResponderGrant: function(e: Object, gestureState: Object) {
    if(this.props.onOpen){
      this.props.onOpen(this.props.sectionID, this.props.rowID);
    }
    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      const btnsRightWidth = this._buttonsRightWidth();
      this.setState({
        btnsRightWidth,
        btnWidth: (width/5),
        btnsLeftWidth: this.props.left ? (width/5)*this.props.left.length : 0,
        swiping: true,
        timeStart: (new Date()).getTime(),
      });
    });
  },

  _handlePanResponderMove: function(e: Object, gestureState: Object) {
    let posX = gestureState.dx;
    const posY = gestureState.dy;
    const leftWidth = this.state.btnsLeftWidth;
    const rightWidth = this.state.btnsRightWidth;
    if (this.state.openedRight) posX = gestureState.dx - rightWidth;
    else if (this.state.openedLeft) posX = gestureState.dx + leftWidth;

    //  prevent scroll if moveX is true
    const moveX = Math.abs(posX) > Math.abs(posY);
    if (this.props.scroll) {
      if (moveX) this.props.scroll(false);
      else this.props.scroll(true);
    }
    if (this.state.swiping) {
      //  move content to reveal swipeout
      if (posX < 0 && this.props.right) this.setState({ contentPos: Math.min(posX, 0) });
      else if (posX > 0 && this.props.left) this.setState({ contentPos: Math.max(posX, 0) });
    }
  },

  _handlePanResponderEnd: function(e: Object, gestureState: Object) {
    const posX = gestureState.dx;
    const contentPos = this.state.contentPos;
    const contentWidth = this.state.contentWidth;
    const btnsLeftWidth = this.state.btnsLeftWidth;
    const btnsRightWidth = this.state.btnsRightWidth;

    //  minimum threshold to open swipeout
    const openX = contentWidth*0.33;

    //  should open swipeout
    let openLeft = posX > openX || posX > btnsLeftWidth/2;
    let openRight = posX < -openX || posX < -btnsRightWidth/2;

    //  account for open swipeouts
    if (this.state.openedRight) openRight = posX-openX < -openX;
    if (this.state.openedLeft) openLeft = posX+openX > openX;

    //  reveal swipeout on quick swipe
    const timeDiff = (new Date()).getTime() - this.state.timeStart < 200;
    if (timeDiff) {
      openRight = posX < -openX/10 && !this.state.openedLeft;
      openLeft = posX > openX/10 && !this.state.openedRight;
    }

    if (this.state.swiping) {
      if (openRight && contentPos < 0 && posX < 0) {
        // open swipeout right
        this._tweenContent('contentPos', -btnsRightWidth);
        this.setState({ contentPos: -btnsRightWidth, openedLeft: false, openedRight: true });
      } else if (openLeft && contentPos > 0 && posX > 0) {
        // open swipeout left
        this._tweenContent('contentPos', btnsLeftWidth);
        this.setState({ contentPos: btnsLeftWidth, openedLeft: true, openedRight: false });
      } else {
        // close swipeout
        this._tweenContent('contentPos', 0);
        this.setState({ contentPos: 0, openedLeft: false, openedRight: false });
      }
    }

    //  Allow scroll
    if (this.props.scroll) this.props.scroll(true);
  },

  _tweenContent: function(state, endValue) {
    this.tweenState(state, {
      easing: tweenState.easingTypes.easeInOutQuad,
      duration: endValue === 0 ? this.state.tweenDuration*1.5 : this.state.tweenDuration,
      endValue: endValue,
    });
  },

  _rubberBandEasing: function(value, limit) {
    if (value < 0 && value < limit) return limit - Math.pow(limit - value, 0.85);
    else if (value > 0 && value > limit) return limit + Math.pow(value - limit, 0.85);
    return value;
  },

  //  close swipeout on button press
  _autoClose: function(btn) {
    const onPress = btn.onPress;
    if (onPress) onPress();
    if (this.state.autoClose) this._close();
  },

  _close: function() {
    this._tweenContent('contentPos', 0);
    this.setState({
      openedRight: false,
      openedLeft: false,
    });
  },

  openRightButton: function() {
    this.refs.swipeoutContent.measure((ox, oy, width, height) => {
      const btnsRightWidth = this._buttonsRightWidth();

      this.setState({
        btnsRightWidth,
        btnWidth: (width/5),
        btnsLeftWidth: this.props.left ? (width/5)*this.props.left.length : 0,
        contentHeight: height,
        contentWidth: width,
      });

      // open swipeout right
      this._tweenContent('contentPos', -btnsRightWidth);
      this.setState({ contentPos: -btnsRightWidth, openedLeft: false, openedRight: true });
    });
  },

  render: function() {
    const contentWidth = this.state.contentWidth;
    const posX = this.getTweeningValue('contentPos');

    const styleSwipeout = [styles.swipeout, this.props.style];
    if (this.props.backgroundColor) {
      styleSwipeout.push([{ backgroundColor: this.props.backgroundColor }]);
    }

    const limit = posX > 0 ? this.state.btnsLeftWidth : -this.state.btnsRightWidth;

    const styleLeftPos = {
      left: {
        left: 0,
        overflow: 'hidden',
        width: Math.min(limit*(posX/limit), limit),
      },
    };
    const styleRightPos = {
      right: {
        left: Math.abs(contentWidth + Math.max(limit, posX)),
        right: 0,
      },
    };
    const styleContentPos = {
      content: {
        left: this._rubberBandEasing(posX, limit),
      },
    };

    const styleContent = [styles.swipeoutContent, styleContentPos.content];
    const styleRight = [styles.swipeoutBtns, styleRightPos.right];
    const styleLeft = [styles.swipeoutBtns, styleLeftPos.left];

    const isRightVisible = posX < 0;
    const isLeftVisible = posX > 0;


    return (
      <View style={styleSwipeout}>
        <View
          ref="swipeoutContent"
          style={styleContent}
          onLayout={this._onLayout}
          {...this._panResponder.panHandlers}>
          {this.props.children}
        </View>
        { this._renderButtons(this.props.right, isRightVisible, styleRight) }
        { this._renderButtons(this.props.left, isLeftVisible, styleLeft) }
      </View>
    );
  },

  _onLayout: function(event) {
    const { width, height } = event.nativeEvent.layout;
    this.setState({
      contentWidth: width,
      contentHeight: height,
    });
  },

  _renderButtons: function(buttons, isVisible, style) {
    if (buttons && isVisible) {
      return ( 
        <View style={style}>
          { buttons.map(this._renderButton) }
        </View>
      );
    } else {
      return (
        <View/>
      );
    }
  },

  _renderButton: function(btn, i) {
    return (
      <SwipeoutBtn
          backgroundColor={btn.backgroundColor}
          color={btn.color}
          component={btn.component}
          disabled={btn.disabled}
          height={this.state.contentHeight}
          key={i}
          onPress={() => this._autoClose(btn)}
          text={btn.text}
          type={btn.type}
          underlayColor={btn.underlayColor}
          width={this.state.btnWidth}/>
      );
  }
})

Swipeout.NativeButton = NativeButton;
Swipeout.SwipeoutButton = SwipeoutBtn;

export default Swipeout;
