# Native login wordmark flow

## Objective

Make the native iPhone login entrance feel deliberate and legible. The wordmark is the single visual anchor from the final onboarding beat into the login header.

## First entry

1. Show the existing three onboarding pain-point phrases at the centre of the screen.
2. After the final phrase has cleared, reveal `TriWaveX` large at the centre. Only `X` uses the TriWaveX aqua blue.
3. Hold the large wordmark briefly. There is no subtitle in this beat.
4. Move and scale that same wordmark in one continuous animation into the final login-header position.
5. Reveal the login controls after the wordmark settles.

## Returning entry

1. Skip all pain-point phrases.
2. Show the same large centred `TriWaveX` wordmark briefly.
3. Use the same continuous move-and-scale transition to the login header.
4. Reveal the login controls once the wordmark is settled.

## Motion and accessibility

- No separate icon, blue background, duplicated mark, bounce, or abrupt content swap.
- Use only opacity and transform-like SwiftUI properties: scale and vertical offset.
- Retain the blue `X` throughout.
- The first-entry route can be slower; the returning route is shorter but still readable.
- With Reduce Motion enabled, retain the clear state changes through short fades and omit the large vertical movement.

## Validation

- The animated title is visually centred before it moves.
- It reaches the exact login header size and position without a second title appearing.
- The login controls never compete with the centred wordmark.
- Test first entry, returning entry, and Reduce Motion on an iPhone build.
