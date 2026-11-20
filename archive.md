# Full frame archive

The GitHub release holds 12 compressed archives. Each contains full-resolution JPEG screenshots named `frames/frame-NNNNNN.jpg`. Parts 01–11 contain 1,800 frames each. Part 12 contains the remaining 765. Times in [the frame index](index/frames.csv) are measured from the start of the recording. [GitHub release](https://github.com/huzshk0707/tenant-turner-demo/releases/tag/vimeo-688083346)

| Part | First timestamp | Frame range |
| --- | --- | --- |
| `frames-01.tar.zst` | 00:00 | 000001–001800 |
| `frames-02.tar.zst` | 01:00 | 001801–003600 |
| `frames-03.tar.zst` | 02:00 | 003601–005400 |
| `frames-04.tar.zst` | 03:00 | 005401–007200 |
| `frames-05.tar.zst` | 04:00 | 007201–009000 |
| `frames-06.tar.zst` | 05:00 | 009001–010800 |
| `frames-07.tar.zst` | 06:00 | 010801–012600 |
| `frames-08.tar.zst` | 07:00 | 012601–014400 |
| `frames-09.tar.zst` | 08:00 | 014401–016200 |
| `frames-10.tar.zst` | 09:00 | 016201–018000 |
| `frames-11.tar.zst` | 10:00 | 018001–019800 |
| `frames-12.tar.zst` | 11:00 | 019801–020565 |

Download the parts you need from the release or use the GitHub CLI to download all of them. Run the checksum command from the download directory, then extract into a separate folder. The commands below use `tar` and `zstd`.

```sh
gh release download vimeo-688083346 --repo huzshk0707/tenant-turner-demo --pattern 'frames-*.tar.zst' --pattern SHA256SUMS
sha256sum -c SHA256SUMS
mkdir extracted
for part in frames-*.tar.zst; do
  zstd -dc "$part" | tar -xf - -C extracted
done
```

The extracted directory contains 20,565 JPEGs. The archive masks selected regions on screens that show lead records, owner report delivery addresses, lockbox credentials or authorized contact records. [Frame index and export details](index/README.md)
