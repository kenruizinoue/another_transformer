// CI-safe mock for expo-sharing.
module.exports = {
  __esModule: true,
  isAvailableAsync: jest.fn().mockResolvedValue(true),
  shareAsync: jest.fn().mockResolvedValue(undefined),
};
