import type { ModelFiles } from '../whisper-model';
import { WhisperModel } from '../whisper-model';

function makeFiles(overrides: Partial<ModelFiles> = {}): ModelFiles {
  return {
    modelPath: 'file:///doc/whisper/ggml-base.en.bin',
    exists: jest.fn().mockResolvedValue(false),
    download: jest.fn().mockResolvedValue(true),
    remove: jest.fn().mockResolvedValue(undefined),
    ...overrides,
  };
}

describe('WhisperModel', () => {
  it('is not downloaded when the file is missing', async () => {
    const model = new WhisperModel(makeFiles({ exists: jest.fn().mockResolvedValue(false) }));
    expect(await model.isReady()).toBe(false);
    expect(model.getState()).toBe('not-downloaded');
  });

  it('is ready when the file exists', async () => {
    const model = new WhisperModel(makeFiles({ exists: jest.fn().mockResolvedValue(true) }));
    expect(await model.isReady()).toBe(true);
    expect(model.getState()).toBe('ready');
  });

  it('downloads the model and becomes ready', async () => {
    const files = makeFiles({
      exists: jest.fn().mockResolvedValue(false),
      download: jest.fn().mockResolvedValue(true),
    });
    const model = new WhisperModel(files);

    expect(await model.ensureReady()).toBe(true);
    expect(files.download).toHaveBeenCalledWith(expect.any(String), files.modelPath, undefined);
    expect(model.getState()).toBe('ready');
  });

  it('goes to error when the download is interrupted', async () => {
    const model = new WhisperModel(
      makeFiles({
        exists: jest.fn().mockResolvedValue(false),
        download: jest.fn().mockResolvedValue(false),
      }),
    );

    expect(await model.ensureReady()).toBe(false);
    expect(model.getState()).toBe('error');
  });

  it('goes to error when the download throws', async () => {
    const model = new WhisperModel(
      makeFiles({
        exists: jest.fn().mockResolvedValue(false),
        download: jest.fn().mockRejectedValue(new Error('network')),
      }),
    );

    expect(await model.ensureReady()).toBe(false);
    expect(model.getState()).toBe('error');
  });

  it('removes the model and resets to not-downloaded', async () => {
    const files = makeFiles({ exists: jest.fn().mockResolvedValue(true) });
    const model = new WhisperModel(files);
    await model.isReady();

    await model.remove();
    expect(files.remove).toHaveBeenCalledWith(files.modelPath);
    expect(model.getState()).toBe('not-downloaded');
  });
});
