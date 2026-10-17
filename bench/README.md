# Engine benchmark

Compares the three transcription engines on the same recordings. The result is
one table: word error rate, time to result and cost per engine and language.

## Protocol

1. **Record the samples** with the app on the phone that will run the benchmark.
   Aim for 9 to 12 recordings covering the grid below, 30 seconds to 5 minutes
   each. Read a prepared text so a reference transcript exists, or transcribe
   by hand afterwards.

   | Language | Quiet room | Noisy (street, café) |
   |---|---|---|
   | English | 2 or more | 1 or more |
   | Spanish | 2 or more | 1 or more |
   | Japanese | 2 or more | 1 or more |

2. **Write the reference** for each sample as `bench/samples/<id>.ref.txt`,
   corrected by hand. Ids follow `<lang>-<condition>-<n>`, for example
   `es-noisy-02`.

3. **Transcribe each sample three times**, once per engine, with the matching
   language selected in Settings. Copy each transcript to
   `bench/samples/<id>.<engine>.txt` (`apple`, `whisper`, `openai`). Note the
   time from tapping Transcribe to the text appearing, in seconds.

4. **Score** each transcript:

   ```bash
   npm run bench:wer -- bench/samples/es-noisy-02.ref.txt bench/samples/es-noisy-02.whisper.txt
   ```

   Word error rate is substitutions + deletions + insertions over the number
   of reference words, after lowercasing and stripping punctuation. Japanese is
   scored per character instead of per word, since it has no spaces; the tool
   switches automatically when the reference has no spaces.

5. **Cost**: Apple and Whisper are free. OpenAI's price for
   `gpt-4o-mini-transcribe` is listed per minute of audio on
   https://openai.com/api/pricing; multiply by the sample length.

6. Fill the table below and keep the sample files in the repo (the audio stays
   out; only the text files are committed).

## Results

Phone: (model, iOS version). Date: (date).

| Sample | Length | Apple WER | Apple s | Whisper WER | Whisper s | OpenAI WER | OpenAI s | OpenAI cost |
|---|---|---|---|---|---|---|---|---|
| en-quiet-01 | | | | | | | | |
| en-quiet-02 | | | | | | | | |
| en-noisy-01 | | | | | | | | |
| es-quiet-01 | | | | | | | | |
| es-quiet-02 | | | | | | | | |
| es-noisy-01 | | | | | | | | |
| ja-quiet-01 | | | | | | | | |
| ja-quiet-02 | | | | | | | | |
| ja-noisy-01 | | | | | | | | |

Averages per engine and language go in the write-up, with the raw table here.
