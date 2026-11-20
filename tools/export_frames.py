#!/usr/bin/env python3
"""Export every frame of a local MP4 and build a timestamp index."""

import argparse
import csv
import json
import subprocess
from fractions import Fraction
from pathlib import Path


FRAMES_PER_ARCHIVE = 1800


def probe(source):
    command = [
        'ffprobe', '-v', 'error', '-select_streams', 'v:0',
        '-show_entries', 'stream=width,height,time_base:packet=pts',
        '-of', 'json', str(source),
    ]
    report = json.loads(subprocess.check_output(command))
    stream = report['streams'][0]
    pts = sorted(packet['pts'] for packet in report['packets'])
    if not pts or len(pts) != len(set(pts)):
        raise ValueError('Expected one unique presentation timestamp per video packet.')
    return pts, Fraction(stream['time_base'])


def write_index(destination, pts, time_base):
    with destination.open('w', newline='', encoding='utf-8') as handle:
        writer = csv.writer(handle, lineterminator='\n')
        writer.writerow(['frame_number', 'time_seconds', 'presentation_timestamp', 'image', 'archive'])
        for number, timestamp in enumerate(pts, start=1):
            part = (number - 1) // FRAMES_PER_ARCHIVE + 1
            seconds = (timestamp - pts[0]) * time_base
            writer.writerow([
                number, f'{float(seconds):.6f}', timestamp, f'frames/frame-{number:06}.jpg',
                f'frames-{part:02}.tar.zst',
            ])


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('source', type=Path, help='Local source video')
    parser.add_argument('output', type=Path, help='New output directory')
    args = parser.parse_args()
    pts, time_base = probe(args.source)
    args.output.mkdir()
    frame_dir = args.output / 'frames'
    frame_dir.mkdir()
    subprocess.run([
        'ffmpeg', '-nostdin', '-xerror', '-i', str(args.source), '-map', '0:v:0',
        '-an', '-sn', '-fps_mode', 'passthrough', '-c:v', 'mjpeg', '-q:v', '3',
        '-start_number', '1', str(frame_dir / 'frame-%06d.jpg'),
    ], check=True)
    actual = sorted(path.name for path in frame_dir.glob('frame-*.jpg'))
    expected = [f'frame-{number:06}.jpg' for number in range(1, len(pts) + 1)]
    if actual != expected:
        raise RuntimeError(f'Frame extraction does not match PTS index: {len(actual)} images, {len(pts)} timestamps.')
    write_index(args.output / 'frames.csv', pts, time_base)
    print(f'{len(actual):,} frames indexed in {args.output}')


if __name__ == '__main__':
    main()
