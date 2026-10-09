import './app.css';

import { Activity, useState } from 'react';

import ColorPicker from '@/features/color-picker/ColorPicker';
import type { AddResult } from '@/features/color-source/ExtractedColors';
import ImageSource from '@/features/color-source/ImageSource';
import ExampleGallery from '@/features/examples/ExampleGallery';
import SixtyThirtyTen from '@/features/examples/SixtyThirtyTen';
import type { HarmonyId } from '@/features/harmony/harmony';
import { generateHarmony } from '@/features/harmony/harmony';
import Palette from '@/features/palette/Palette';
import type { PaletteState } from '@/features/palette/palette-state';
import {
  addPicks,
  applyAutoHarmony,
  choosePairing,
  clearPairing,
  dropAuto,
  EMPTY_PALETTE,
  paletteColors,
  removeColor,
  togglePick,
} from '@/features/palette/palette-state';
import PickColorsStep from '@/features/pick-colors/PickColorsStep';
import { StepHeader, StepNav } from '@/features/stepper/Stepper';
import { clampStep, STEPS } from '@/features/stepper/steps';
import { normalizeHex, normalizeHexes } from '@/shared/color/convert';

const DEFAULT_HEX = '#3366cc';
const DEFAULT_HARMONY: HarmonyId = 'complementary';
const PICK_COLORS_STEP = 1;

export default function App() {
  const [step, setStep] = useState(0);
  // the furthest step reached; later ones stay locked in the progress bar
  const [furthest, setFurthest] = useState(0);
  const [hex, setHex] = useState(DEFAULT_HEX);
  const [harmony, setHarmony] = useState<HarmonyId>(DEFAULT_HARMONY);
  const [session, setSession] = useState(0);
  const [paletteState, setPaletteState] = useState<PaletteState>(EMPTY_PALETTE);
  const palette = paletteColors(paletteState);

  const setColor = (value: string) => {
    const normalized = normalizeHex(value);
    if (!normalized || normalized === hex) return;
    setHex(normalized);
    // A pairing and any auto-selected wheel colors are built from the base color, so they no longer
    // apply.
    setPaletteState((state) => clearPairing(dropAuto(state)));
  };
  const changeHarmony = (type: HarmonyId) => {
    setHarmony(type);
    // The chosen pairing was drawn from the previous wheel type, so it no longer applies;
    // if the user hasn't picked anything themselves, select the new wheel's colors instead.
    setPaletteState((state) => applyAutoHarmony(clearPairing(state), generateHarmony(hex, type)));
  };
  const restart = () => {
    setStep(0);
    setFurthest(0);
    setHex(DEFAULT_HEX);
    setHarmony(DEFAULT_HARMONY);
    setPaletteState(EMPTY_PALETTE);
    setSession((current) => current + 1); // remounts the steps so the loaded image is dropped too
  };
  // A new image starts the work over: whatever was chosen from the previous one (picks,
  // auto-selected wheel colors, a chosen pairing) is dropped, and the image's most common color
  // becomes the base. The wheel type is a preference, so it stays.
  const startFromImage = (colors: string[]) => {
    setPaletteState(EMPTY_PALETTE);
    // the steps after "Pick your colors" were built on the old image
    setFurthest((reached) => Math.min(reached, PICK_COLORS_STEP));
    const first = normalizeHex(colors[0] ?? '');
    if (first) setHex(first);
  };
  // Colors added from an image become the working set: the first one is the base the wheel is built
  // on (unless the current base is already among them), so step 2 reflects what was picked.
  const addImageColors = (colors: string[]): AddResult => {
    const normalized = normalizeHexes(colors);
    if (normalized.length === 0) return { added: 0, total: 0 };
    const nextBase = normalized.includes(hex) ? hex : normalized[0];
    if (nextBase !== hex) setHex(nextBase);
    // A pairing built on the old base no longer applies, so clear it first and let the freed room
    // count.
    const next = addPicks(nextBase === hex ? paletteState : clearPairing(paletteState), normalized);
    setPaletteState(next);
    const inPalette = paletteColors(next);
    return {
      added: normalized.filter((color) => inPalette.includes(color)).length,
      total: normalized.length,
    };
  };
  // The one way to change step (Back, Next and the progress bar all use it).
  const goTo = (target: number) => {
    const next = clampStep(target);
    setStep(next);
    setFurthest((reached) => Math.max(reached, next));
    // Arriving at "Pick your colors" with nothing chosen selects the wheel's colors.
    if (next === PICK_COLORS_STEP)
      setPaletteState((state) => applyAutoHarmony(state, generateHarmony(hex, harmony)));
  };
  const go = (delta: number) => goTo(step + delta);

  return (
    <main className="app">
      <title>{`${STEPS[step].title} · Color Wheel`}</title>
      <h1 className="app__title">Color Wheel</h1>
      <StepHeader
        index={step}
        furthest={furthest}
        onGoTo={goTo}
        onReset={step < STEPS.length - 1 ? restart : undefined}
      />

      <section key={session} className="app__step" aria-live="polite">
        {/*
          Activity keeps step 1's state (the loaded image) while hidden, and pauses its effects.
        */}
        <Activity mode={step === 0 ? 'visible' : 'hidden'}>
          <ImageSource
            hex={hex}
            onPick={setColor}
            onImageLoaded={startFromImage}
            onAddAll={addImageColors}
          />
          <ColorPicker hex={hex} onChange={setColor} />
        </Activity>
        {step === 1 && (
          <PickColorsStep
            hex={hex}
            harmony={harmony}
            onHarmonyChange={changeHarmony}
            pairing={paletteState.pairing}
            palette={palette}
            context={paletteState.picks.filter((color) => !paletteState.auto.includes(color))}
            onRemoveColor={(color) => setPaletteState((state) => removeColor(state, color))}
            onTogglePick={(color) => setPaletteState((state) => togglePick(state, color))}
            onChoosePairing={(colors) => setPaletteState((state) => choosePairing(state, colors))}
          />
        )}
        {step === 2 && (
          <>
            <Palette
              colors={palette}
              onRemove={(color) => setPaletteState((state) => removeColor(state, color))}
              onClear={() => setPaletteState(EMPTY_PALETTE)}
            />
            <ExampleGallery colors={palette} />
            <SixtyThirtyTen colors={palette} />
          </>
        )}
      </section>

      <StepNav index={step} onBack={() => go(-1)} onNext={() => go(1)} onRestart={restart} />
    </main>
  );
}
