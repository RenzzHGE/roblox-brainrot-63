# make-shots.py - downscale the 2560x1440 renders to 1280x720 JPEGs (<256 KiB)
# and crop icon-512.png (true centre-crop of the cover) for v1.5.
from PIL import Image
import os

FULL = os.path.expanduser('~/workspace/makefun/roblox-brainrot-01/game-v1.5/render/full')
OUT = os.path.expanduser('~/workspace/makefun/roblox-brainrot-01/game-v1.5/screenshots')
GAME = os.path.expanduser('~/workspace/makefun/roblox-brainrot-01/game-v1.5')

os.makedirs(OUT, exist_ok=True)
for name in ('1-hub', '2-bazaar', '3-boss'):
    src = os.path.join(FULL, name + '.png')
    im = Image.open(src)
    assert im.size == (2560, 1440), f'{name}: unexpected size {im.size}'
    small = im.resize((1280, 720), Image.LANCZOS)
    dst = os.path.join(OUT, name + '.jpg')
    q = 85
    small.save(dst, 'JPEG', quality=q, optimize=True)
    while os.path.getsize(dst) >= 256 * 1024 and q > 40:
        q -= 5
        small.save(dst, 'JPEG', quality=q, optimize=True)
    print(f'{name}.jpg: {os.path.getsize(dst)} B (quality {q})')

# Icon: true centre-crop of the 2560x1440 cover -> 512x512.
cover = Image.open(os.path.join(FULL, '1-hub.png'))
icon = cover.crop((1024, 464, 1024 + 512, 464 + 512))
assert icon.size == (512, 512)
icon.save(os.path.join(GAME, 'icon-512.png'), 'PNG')
print(f'icon-512.png: {os.path.getsize(os.path.join(GAME, "icon-512.png"))} B')
