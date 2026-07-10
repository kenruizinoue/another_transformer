// CI-safe mock for expo-print.
module.exports = {
  __esModule: true,
  printToFileAsync: jest.fn().mockResolvedValue({ uri: 'file:///tmp/transcript.pdf' }),
};
