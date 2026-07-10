// CI-safe mock for expo-clipboard.
module.exports = {
  __esModule: true,
  setStringAsync: jest.fn().mockResolvedValue(true),
  getStringAsync: jest.fn().mockResolvedValue(''),
};
