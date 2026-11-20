# Frame index

[frames.csv](frames.csv) has one row per frame in display order. `frame_number` starts at 1, `time_seconds` is relative to the video start, and `presentation_timestamp` uses Vimeo's MP4 time base of 1/15360 second. `image` is the exact path inside the file named in `archive`.

For example, `frame_number=9001` points to the screenshot at 05:00.000 in `frames-06.tar.zst`. The final frame is `020565` at 11:25.466667. The video ends at 11:25.500.

The source video has a constant 30 fps presentation cadence. Vimeo also offers other playback profiles. This archive uses the 2304 × 1440, 30 fps rendition matching Vimeo’s source metadata.

[export_frames.py](../tools/export_frames.py) recreates the raw JPEG sequence from a local copy of this rendition. It requires Python 3, FFmpeg and FFprobe. The published archive covers sensitive fields with image masks during assembly.

```sh
python3 tools/export_frames.py recording.mp4 export
```
