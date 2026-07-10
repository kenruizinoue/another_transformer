/* eslint-disable */
/* global device, element, by, expect, waitFor */

// Primary end-to-end flow: record a clip, see it in the list, open it, and
// transcribe. Runs locally on a dev build only. Real audio and on-device
// transcription behave best on a physical device; we iterate on this together.

const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

describe('record to transcript', () => {
  beforeAll(async () => {
    await device.launchApp({
      newInstance: true,
      permissions: { microphone: 'YES', speechRecognition: 'YES' },
    });
  });

  it('opens on the Recordings screen', async () => {
    await expect(element(by.text('Recordings'))).toBeVisible();
  });

  it('records a clip and returns to the list', async () => {
    await element(by.id('new-recording')).tap();
    await waitFor(element(by.id('record-ready')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('record-toggle')).tap(); // start recording
    await wait(2500);
    await element(by.id('record-toggle')).tap(); // stop and dismiss the modal

    await waitFor(element(by.id('recordings-list')))
      .toBeVisible()
      .withTimeout(10000);
  });

  it('opens a recording and transcribes it', async () => {
    await element(by.id('recordings-list')).atIndex(0).tap();
    await waitFor(element(by.id('detail-loaded')))
      .toBeVisible()
      .withTimeout(10000);

    await element(by.id('transcribe')).tap();
    // Transcript may take a moment; give the on-device engine time.
    await waitFor(element(by.id('transcript')))
      .toBeVisible()
      .withTimeout(30000);
  });
});
