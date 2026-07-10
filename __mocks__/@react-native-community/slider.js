// Render the native slider as a plain View in tests, forwarding props (testID,
// onValueChange, onSlidingComplete, value) so behavior can be exercised.
const React = require('react');
const { View } = require('react-native');

function Slider(props) {
  return React.createElement(View, props);
}

module.exports = Slider;
module.exports.default = Slider;
