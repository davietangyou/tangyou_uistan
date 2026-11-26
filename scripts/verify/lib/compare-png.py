#!/usr/bin/env python3
"""Compare two PNGs with a mean-absolute and percent-pixel tolerance."""
import json
import sys
from pathlib import Path

from PIL import Image, ImageChops, ImageStat


def main():
    if len(sys.argv) < 3:
        print('Usage: compare-png.py a.png b.png [--max-mean 2] [--max-pct 0.5]', file=sys.stderr)
        sys.exit(2)
    a_path, b_path = Path(sys.argv[1]), Path(sys.argv[2])
    args = sys.argv[3:]
    max_mean = 2.0
    max_pct = 0.5
    if '--max-mean' in args:
        max_mean = float(args[args.index('--max-mean') + 1])
    if '--max-pct' in args:
        max_pct = float(args[args.index('--max-pct') + 1])

    a = Image.open(a_path).convert('RGB')
    b = Image.open(b_path).convert('RGB')
    if a.size != b.size:
        report = {
            'ok': False,
            'reason': 'size-mismatch',
            'a': {'path': str(a_path), 'size': list(a.size)},
            'b': {'path': str(b_path), 'size': list(b.size)},
        }
        print(json.dumps(report, ensure_ascii=False))
        sys.exit(1)

    diff = ImageChops.difference(a, b)
    stat = ImageStat.Stat(diff)
    # mean across RGB channels, 0-255
    mean = sum(stat.mean) / 3.0
    # pixels that differ by more than 8 in any channel
    px = list(diff.getdata())
    changed = sum(1 for p in px if p[0] > 8 or p[1] > 8 or p[2] > 8)
    pct = 100.0 * changed / max(len(px), 1)
    ok = mean <= max_mean and pct <= max_pct
    report = {
        'ok': ok,
        'mean': round(mean, 4),
        'changedPct': round(pct, 4),
        'maxMean': max_mean,
        'maxPct': max_pct,
        'size': list(a.size),
        'a': str(a_path),
        'b': str(b_path),
    }
    print(json.dumps(report, ensure_ascii=False))
    sys.exit(0 if ok else 1)


if __name__ == '__main__':
    main()
