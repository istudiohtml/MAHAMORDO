# Tarot Card Image Prompts — Major Arcana 22 ใบ

Prompts สำหรับ generate รูปไพ่ทาโรต์ทั้ง 22 ใบ ของแอป **มหาหมอดู**
ใช้ได้กับ Midjourney v6+ / DALL·E 3 / Stable Diffusion (SDXL/Flux)

---

## วิธีใช้

1. เลือก **Master Style Prompt** ด้านล่างเป็น base (เพื่อให้ทุกใบดูเป็นชุดเดียวกัน)
2. ต่อด้วย **per-card subject** ของไพ่ที่ต้องการ
3. ปิดท้ายด้วย **Tail / Parameters** (aspect ratio, version, ฯลฯ)
4. Stable Diffusion ให้ใส่ **Negative Prompt** ด้วย

ขนาดไฟล์ที่ควร export:
- `1024 × 1536` px (อัตรา 2:3 — ตรงกับสัดส่วนไพ่ทาโรต์)
- WebP หรือ PNG ใส, transparent ถ้าจะวางบน card-back gradient

---

## Master Style Prompt (ใช้ร่วมทุกใบ)

> ใช้ block นี้นำหน้า per-card prompt เพื่อให้ 22 ใบรู้สึกเป็น *ชุดเดียวกัน*

```
Vertical tarot card illustration, 2:3 portrait, mystical Thai-Southeast-Asian
fusion with classical tarot symbolism, art nouveau ornate gold border with
sacred geometry corners, intricate gold linework reminiscent of Alphonse Mucha
combined with Thai temple murals (lai-thai) and Indian yantra patterns,
chiaroscuro candlelit lighting, deep midnight-black and burgundy background
with burnished antique gold (#D4A853) and warm cream (#F5D98A) highlights,
subtle gold leaf texture, aged parchment grain, soft inner glow radiating
from the central figure, hushed sacred atmosphere, painterly oil texture,
high contrast, museum-quality occult artwork, no text, no letters,
no watermark
```

## Tail / Parameters

- **Midjourney**: ` --ar 2:3 --style raw --stylize 350 --v 6.1`
- **DALL·E 3**: append `2:3 portrait, ultra-detailed, occult fine-art`
- **SDXL / Flux**: `steps 40, cfg 6.5, sampler dpmpp_2m_karras`

## Negative Prompt (Stable Diffusion เท่านั้น)

```
text, letters, words, signature, watermark, logo, modern clothing, photo,
photograph, 3d render, plastic, low quality, blurry, deformed, extra limbs,
extra fingers, bad anatomy, cartoon, anime, chibi, neon, cyberpunk
```

---

## ใบที่ 0 — The Fool · ผู้บ้าคิด

> Theme: ก้าวออกไปสู่สิ่งที่ไม่รู้ จุดเริ่มต้นใหม่

```
A youthful wanderer in flowing Thai-style robes standing at the edge of a
golden cliff, one foot lifted mid-step, a small white loyal dog at the heels,
a wooden traveler's staff with a tiny bundle, a single white lotus flower in
the other hand, looming clouds of dawn light below, distant misty mountains
of the Himavanta, a single bright sun rising on the horizon, expression of
fearless innocence, gold halo of fresh beginnings, butterflies and floating
petals around them
```

---

## ใบที่ 1 — The Magician · นักมายากล

> Theme: ใช้ทักษะที่มีให้เต็มศักยภาพ พลังสร้างสรรค์

```
A confident young sorcerer in deep crimson robes embroidered with gold thread,
right hand raised holding a glowing crystal wand pointed at the sky, left
hand pointing down to the earth, on the altar before him: a chalice, a sword,
a coin, and a wand (the four suits) arranged in sacred geometry, infinity
symbol (lemniscate) glowing above his head, lush garden of red roses and
white lilies surrounding the altar, swirling gold energy connecting heaven
and earth, eyes glowing softly with focused intent
```

---

## ใบที่ 2 — The High Priestess · สตรีปัญญา

> Theme: สัญชาตญาณ ความลับ ความรู้ภายใน

```
A serene priestess seated on a stone throne between two pillars (one black,
one white) inscribed with Sanskrit/Khmer mystic letters, a crescent moon
crown on her head, a half-revealed scroll labeled with a sacred symbol on
her lap, a flowing veil behind her embroidered with pomegranates and stars,
a calm pool of water at her feet reflecting the moon, deep indigo and
midnight-blue robes flecked with silver constellations, her eyes closed in
deep meditation, soft moonlight glow
```

---

## ใบที่ 3 — The Empress · จักรพรรดินี

> Theme: ความอุดมสมบูรณ์ ความเป็นแม่ การสร้างสรรค์

```
A regal motherly figure crowned with twelve golden stars, seated on a plush
velvet throne in a lush Himavanta forest of golden wheat, ripe pomegranates
and blooming lotus, her flowing gown embroidered with floral lai-thai
patterns, a heart-shaped shield with the symbol of Venus beside her, a
gentle waterfall behind, soft cherubim of light floating around, holding a
golden scepter topped with a globe, expression of warm nurturing wisdom,
abundance of fruit and flowers spilling at her feet
```

---

## ใบที่ 4 — The Emperor · จักรพรรดิ

> Theme: อำนาจ ความเป็นผู้นำ โครงสร้าง

```
A stern bearded king seated on a massive stone throne carved with ram heads
on the armrests, wearing heavy red robes lined with gold and royal armor
beneath, an iron crown set with rubies, holding an ankh-topped scepter in
the right hand and a golden orb in the left, jagged red mountains of
dominion in the background, a flowing river of crimson at the foot of the
throne, eyes sharp with authority, banners of conquest behind him
```

---

## ใบที่ 5 — The Hierophant · พระสงฆ์ใหญ่

> Theme: ศรัทธา คำสอน ประเพณี

```
An old wise hierophant seated between two ornate stone pillars in a temple
of gold leaf, wearing layered saffron and crimson Buddhist-style robes
fused with papal vestments, a triple crown on his head, right hand raised
in a teaching mudra of blessing, left hand holding a triple-cross golden
staff, two devotees kneeling before him on a marble floor inscribed with
crossed keys, incense smoke rising in spirals, candles and golden lotus
offerings, atmosphere of sacred silence
```

---

## ใบที่ 6 — The Lovers · รักษดมนต์

> Theme: ความรัก ทางเลือก ความผูกพัน

```
A young man and young woman standing in a Garden-of-Eden-like sacred grove,
nude but tastefully draped with flower garlands, between them a Tree of
Knowledge with a coiled serpent on the woman's side and a Tree of Life with
twelve flames on the man's side, above them a luminous angel of cosmic love
with massive golden wings spread wide, sun rays bursting behind the angel,
blooming red roses and lotus at their feet, soft pink and gold sunset
lighting, eyes meeting in tender devotion
```

---

## ใบที่ 7 — The Chariot · รถม้า

> Theme: ชัยชนะ การควบคุม จิตใจที่มีสติ

```
A determined young warrior standing tall in an ornate stone chariot pulled
by two sphinxes — one black, one white — facing opposite directions, the
warrior wears blue lacquered armor with golden Thai motifs, a starry blue
canopy above with a crescent moon, a wand of victory in the right hand, a
walled golden city in the background, banners flying in the wind, eyes
forward with focused triumph, dust kicked up by the sphinxes' paws
```

---

## ใบที่ 8 — Strength · ความแข็งแกร่ง

> Theme: ความอ่อนโยน อดทน พลังภายใน

```
A serene woman in a flowing white-and-gold robe gently closing the jaws of
a massive lion, her hands resting softly on its mane, infinity symbol
(lemniscate) glowing above her head, the lion calmly bowing in surrender,
golden flower-chain belt around her waist, golden wheat fields and a
single distant mountain in the background, expression of compassionate
courage, soft sunrise light, a peaceful coexistence of wildness and grace
```

---

## ใบที่ 9 — The Hermit · นักสำนวน

> Theme: การไตร่ตรองตัวเอง ปัญญาจากความเงียบ

```
An old monk in a long grey hooded robe standing alone on a snowy mountain
peak under a starry night sky, holding a glowing six-pointed star lantern
in his right hand to light the path, leaning on a long wooden walking
staff in the left, long white beard, eyes downcast in deep contemplation,
moonlight illuminating drifting snow, a single distant valley far below,
warm gold lantern light contrasting cold blue night, atmosphere of
profound solitude
```

---

## ใบที่ 10 — Wheel of Fortune · วงล้อโชคชะตา

> Theme: วัฏจักรชีวิต โชคชะตา จุดเปลี่ยน

```
A massive ornate golden wheel floating in the cosmic sky, inscribed with
Hebrew letters YHVH and zodiac symbols around its rim, four winged
creatures at the four corners — a winged angel, a winged eagle, a winged
lion, and a winged bull — each reading a sacred book, a serpent descending
on the left, a golden sphinx with a sword resting atop the wheel, swirling
nebula and constellations behind the wheel, sense of cosmic motion and
divine order
```

---

## ใบที่ 11 — Justice · ความยุติธรรม

> Theme: สมดุล ความรับผิดชอบ ผลของการกระทำ

```
A regal seated judge between two stone pillars, holding a double-edged sword
upright in the right hand and a golden balance scale in the left, wearing
crimson robes with a square gold buckle, a small crown topped with a clear
crystal, calm impartial expression, a violet curtain behind embroidered
with stars, a single shaft of divine light from above illuminating the
sword and scales, atmosphere of solemn fairness
```

---

## ใบที่ 12 — The Hanged Man · ผู้ค้างคาว

> Theme: การยอมแพ้ การมองจากมุมใหม่ การเสียสละ

```
A young man hanging upside down by one foot from a living T-shaped tree
made of golden wood, his other leg crossed behind to form a figure-4, his
hands relaxed behind his back, a serene smile on his face, a glowing golden
halo radiating around his head, calm acceptance in his eyes, soft cosmic
twilight sky behind, glowing leaves and butterflies floating around the
tree, a sense of voluntary surrender and quiet enlightenment
```

---

## ใบที่ 13 — Death · ความตาย

> Theme: การสิ้นสุด การเปลี่ยนแปลง การเกิดใหม่

```
A dignified armored skeleton riding a pale white horse, holding a black
banner with a single white five-petaled lotus, advancing slowly across a
field at dawn, a fallen king at the horse's hooves, a child kneeling and a
priest praying as the rider approaches, in the far background two pillars
with the rising sun glowing between them symbolizing rebirth, deep crimson
and bone-white palette, atmosphere of inevitable transformation rather
than horror
```

---

## ใบที่ 14 — Temperance · ความสมดุล

> Theme: การผสมผสาน ความพอดี การประนีประนอม

```
A graceful angel with massive iridescent wings standing with one foot on
land and one foot in a clear pool of water, pouring shimmering golden
liquid between two ornate chalices in an impossible flowing arc, a glowing
triangle inside a square symbol on the chest, irises blooming on the
riverbank, a winding path leading to a golden mountain crowned with a
glowing sun in the distance, soft warm light, peaceful balance of opposites
```

---

## ใบที่ 15 — The Devil · ปีศาจ

> Theme: ผูกมัด ความอยาก ภาพลวงตา

```
A horned demon goat-headed figure with bat wings perched on a black stone
pedestal, an inverted pentagram glowing on the forehead, holding a flaming
torch downward in one hand, a man and a woman chained loosely at the neck
to the pedestal — the chains are clearly loose enough to slip off — small
horns and tails growing on them, dark cavernous background with crimson
embers, atmosphere of psychological bondage and self-imposed temptation,
shadows licking at the edges
```

---

## ใบที่ 16 — The Tower · หอคอย

> Theme: การพังทลาย การชำระล้าง ความจริงเปิดเผย

```
A tall stone tower struck by a single jagged bolt of lightning at its
crowned top, the golden crown blasted off and tumbling, two figures falling
from the tower mid-air, flames erupting from windows, raining gold sparks,
black storm clouds and cracked earth below, dramatic chiaroscuro, the
moment of cataclysmic revelation, sense of necessary destruction making
way for truth, embers swirling like fireflies
```

---

## ใบที่ 17 — The Star · ดาว

> Theme: ความหวัง แรงบันดาลใจ การเยียวยา

```
A nude graceful young woman kneeling on the bank of a sacred pool by
moonlight, pouring water from two golden urns — one onto the land creating
five flowing streams, one into the pool causing gentle ripples — a single
massive eight-pointed golden star directly above her surrounded by seven
smaller stars, a tall ibis bird on a flowering tree to the side, soft
silver-blue moonlight, atmosphere of pure renewal and quiet hope, lotus
blossoms floating in the pool
```

---

## ใบที่ 18 — The Moon · ดวงจันทร์

> Theme: สัญชาตญาณ ความหลง ความฝัน

```
A massive full moon with a faint serene face glowing at the top of the sky,
golden droplets (yods) falling from it, a winding path stretching from a
crayfish emerging from a pool of water into the foreground, between two
tall stone towers in the middle distance, a wolf and a domesticated dog
howling at the moon — one on each side of the path, mysterious indigo and
silver night, fog drifting low over the path, atmosphere of dreamlike
uncertainty and hidden truths
```

---

## ใบที่ 19 — The Sun · ดวงอาทิตย์

> Theme: ความสุข ความสำเร็จ ความสว่าง

```
A radiant smiling sun with a calm human face filling the upper half of the
card, alternating straight and wavy golden rays beaming outward, a joyful
naked child with a red feather in their hair riding a calm white horse
sideways, arms wide open in jubilation, a stone garden wall behind them
with four tall sunflowers turned toward the sun, banner of crimson silk
fluttering in the child's hand, brilliant warm gold and cream palette,
pure unguarded joy
```

---

## ใบที่ 20 — Judgement · การตัดสิน

> Theme: เรียกขวัญ การตื่น การตัดสินใจครั้งใหญ่

```
A mighty archangel Gabriel descending from parted clouds blowing a long
golden trumpet adorned with a red-cross banner, below him three figures —
a man, a woman, and a child — rise from open stone tombs with their arms
spread upward in awe, snowy mountains in the background, sense of cosmic
awakening and resurrection, golden divine light streaming down through the
clouds, atmosphere of long-awaited reckoning, soft radiant warmth
```

---

## ใบที่ 21 — The World · โลก

> Theme: ความสำเร็จครบถ้วน การเดินทางสมบูรณ์

```
A graceful nude dancer floating gracefully inside a massive oval wreath of
green laurel leaves bound with red ribbons at top and bottom, holding two
short golden wands one in each hand, one leg crossed behind in a
celebratory dance pose, four winged creatures at the four corners — a human
angel, an eagle, a lion, and a bull — heads emerging from cosmic clouds,
deep starfield behind the wreath, sense of cosmic completion and harmony,
brilliant cosmic gold and emerald palette
```

---

## เคล็ดลับเพิ่มเติม

### ถ้าอยากให้ทุกใบสไตล์ตรงกันมากขึ้น (Midjourney)

1. Generate ใบ "The Magician" ก่อน เพราะรายละเอียดเยอะที่สุด
2. หา seed/--sref ที่ชอบ แล้วใช้ `--sref <url>` กับใบที่เหลือ
3. หรือใช้ `--cref` ของใบที่ดี → ทุกใบจะ inherit สไตล์เดียวกัน

### Variation สำหรับ A/B test

ถ้าอยากทดลองโทน เปลี่ยนวลีนี้ใน Master Prompt:

| วลี                                   | ผล                              |
| ------------------------------------- | ------------------------------- |
| `art nouveau ornate gold border`      | สวยลายเส้นแบบ Mucha             |
| `Thai temple mural lai-thai gold`     | ออกไทยมาก ดูเหมือนภาพในวัด      |
| `Khmer/Angkor relief carving style`   | เหมือนแกะสลักหิน นูนต่ำ         |
| `Persian miniature illumination`      | ละเอียดเล็ก ๆ แบบหนังสือเปอร์เซีย |

### ขนาด & การ post-process

- Generate ที่ `1024 × 1536`
- Resize ลงเป็น `512 × 768` สำหรับใช้ในแอป (เพราะ fan-card แค่ 96×152)
- Export เป็น **WebP quality 85** จะได้ไฟล์เล็ก (~30 KB/ใบ)
- ตั้งชื่อไฟล์: `tarot-{id}-{slug}.webp` เช่น `tarot-00-fool.webp`, `tarot-13-death.webp`

### ตำแหน่ง assets

แนะนำให้วางที่: `public/tarot/tarot-{id}-{slug}.webp`
แล้วเพิ่ม field `image: '/tarot/tarot-00-fool.webp'` ใน `src/data/tarot-cards.ts`
และ render ใน `TarotPickArea.tsx` ทับ card-back / card-front
