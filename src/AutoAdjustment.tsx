import { css } from "@emotion/react";
import { useEffect, useRef, useState } from "react";

type FromEntries<T extends readonly (readonly [PropertyKey, unknown])[]> = {
  [K in T[number][0]]: Extract<T[number], [K, unknown]>[1];
};

function histogram(canvas: HTMLCanvasElement) {
  const offlineCanvas = new OffscreenCanvas(144, 144);
  const offlineCtx = offlineCanvas.getContext("2d");
  if (!offlineCtx) throw new Error("Failed to create 2D context");
  offlineCtx.filter = "grayscale(100%)";
  offlineCtx.drawImage(canvas, 0, 0, 144, 144);
  const imageData = offlineCtx.getImageData(0, 0, 144, 144);
  const data = imageData.data;
  const histogram = new Array(256).fill(0);
  for (let i = 0; i < data.length; i += 4) {
    const value = data[i];
    histogram[value]++;
  }
  const max = Math.max(...histogram);
  return histogram.map((value) => value / max);
}

async function generateImageAnalysis(canvas: HTMLCanvasElement) {
  const { default: OpenAI } = await import("openai");
  const apiKey = window.localStorage.getItem("OPENAI_API_KEY") ?? undefined;
  const baseURL = window.localStorage.getItem("OPENAI_BASE_URL");

  const client = new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
  const contentCompletion = await client.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image_url",
            image_url: { url: canvas.toDataURL(), detail: "low" },
          },
          {
            type: "text",
            text: `Describe the image in a few sentences.`,
          },
        ],
      },
    ],
  });
  const contentComprehension =
    contentCompletion.choices[0].message.content ?? "";

  const histogramData = histogram(canvas);
  const mergedHistogram = [];
  const step = Math.floor(histogramData.length / 32);
  for (let i = 0; i < 32; i++) {
    const slice = histogramData.slice(i * step, (i + 1) * step);
    const sum = slice.reduce((acc, value) => acc + value, 0);
    mergedHistogram.push(sum);
  }
  const max = Math.max(...mergedHistogram);
  const normalizedHistogram = mergedHistogram.map((value) => value / max);

  const adjustCompletion = await client.chat.completions.create({
    model: "o1-preview",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Here is the content of an image.
${contentComprehension}
Histogram of the image: ${normalizedHistogram.join(",")}.
Please analyse the histogram, detect if there is some problems in brightness, contrast, highlights, shadows.
Then output your analysis and how to adjust the image (property and concrete value. Do not use Markdown here. Example format: [contrast] +15) to make it better. Each property in a line.`,
          },
        ],
      },
    ],
  });
  const adjustActions = adjustCompletion.choices[0].message.content!;

  const properties = [
    "brightness",
    "contrast",
    "highlights",
    "shadows",
  ] as const;
  const matches = adjustActions.matchAll(/(\[[A-Za-z]+\]) ([+-]\d+)/g);
  const actions = Object.fromEntries(
    Array.from(matches).map((match) => {
      const [property, value] = match.slice(1);
      return [property.slice(1, -1).toLowerCase(), parseInt(value)] as const;
    })
  );
  const narrowedEntries = properties
    .filter((property) => property in actions)
    .map((property) => {
      return [property, actions[property]] as const;
    });
  const narrowedActions = Object.fromEntries(narrowedEntries) as FromEntries<
    typeof narrowedEntries
  >;

  return {
    reasoning: contentComprehension + "\n\n" + adjustActions,
    actions: narrowedActions,
  };
}

function adjustImage(
  canvas: HTMLCanvasElement,
  actions: {
    brightness?: number;
    contrast?: number;
    highlights?: number;
    shadows?: number;
  }
) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const newCanvas = new OffscreenCanvas(canvas.width, canvas.height);
  const newCtx = newCanvas.getContext("2d");
  if (!newCtx) return;
  const filters = [];
  if (actions.brightness) {
    filters.push(`brightness(${actions.brightness + 100}%)`);
  }
  if (actions.contrast) {
    filters.push(`contrast(${actions.contrast + 100}%)`);
  }
  newCtx.filter = filters.join(" ");
  newCtx.drawImage(canvas, 0, 0);
  return newCanvas;
}

function AutoAdjustment({
  inputRef,
  open,
  onClose,
}: {
  inputRef: React.RefObject<HTMLCanvasElement>;
  open: boolean;
  onClose: () => void;
}) {
  const [reasoning, setReasoning] = useState<string>("");
  const [showAdjusted, setShowAdjusted] = useState(true);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const dialogRef = useRef<HTMLDialogElement>(null);
  const adjustedImageRef = useRef<OffscreenCanvas | undefined>(undefined);

  useEffect(() => {
    if (!dialogRef.current) return;
    if (open) {
      dialogRef.current.showModal();
      const canvas = canvasRef.current;
      const input = inputRef.current;
      if (!canvas || !input) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      canvas.width = input.width;
      canvas.height = input.height;
      ctx.drawImage(input, 0, 0);
      generateImageAnalysis(canvas).then(({ reasoning, actions }) => {
        setReasoning(reasoning);
        adjustedImageRef.current = adjustImage(canvas, actions);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(adjustedImageRef.current!, 0, 0);
      });
    } else {
      setReasoning("");
      dialogRef.current.close();
    }
  }, [open]);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || !inputRef.current) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!showAdjusted || !adjustedImageRef.current)
      ctx.drawImage(inputRef.current, 0, 0);
    else ctx.drawImage(adjustedImageRef.current, 0, 0);
  }, [showAdjusted]);

  return (
    <dialog
      ref={dialogRef}
      css={css`
        max-width: 100%;
        max-height: 100%;
        padding: 0;
        margin: 0;
        width: 100%;
        height: 100%;
      `}
    >
      <div
        css={css`
          position: relative;
          background-color: black;
          width: 100%;
          height: 100%;
        `}
      >
        <button
          css={css`
            position: absolute;
            top: 16px;
            right: 16px;
            width: 32px;
            height: 32px;
            padding: 0;
            border-radius: 9999px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: white;
          `}
          onClick={onClose}
        >
          <span>×</span>
        </button>
        <div
          css={css`
            width: 100%;
            height: 100%;
            display: flex;
            gap: 16px;
            flex-direction: column;
            @media (min-width: 800px) {
              flex-direction: row;
            }
          `}
        >
          <canvas
            ref={canvasRef}
            css={css`
              min-width: 0;
              min-height: 0;
              width: 100%;
              height: 100%;
              object-fit: contain;
            `}
            onPointerDown={() => setShowAdjusted(false)}
            onPointerUp={() => setShowAdjusted(true)}
          ></canvas>
          <textarea
            value={reasoning}
            readOnly
            rows={5}
            css={css`
              background-color: transparent;
              color: white;
              flex-shrink: 0;
              padding: 8px;
              @media (min-width: 800px) {
                min-width: 320px;
              }
            `}
          ></textarea>
        </div>
      </div>
    </dialog>
  );
}

export default AutoAdjustment;
