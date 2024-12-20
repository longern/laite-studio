import { css } from "@emotion/react";
import { useState } from "react";

import "./App.css";
import Editor from "./Editor";

function App() {
  const [showEditor, setShowEditor] = useState(false);
  const [image, setImage] = useState<HTMLImageElement | undefined>(undefined);

  function readImage(file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.alt = file.name;
      img.onload = () => {
        setImage(img);
        setShowEditor(true);
      };
      img.src = e.target!.result as string;
    };
    reader.readAsDataURL(file);
  }

  const handleImport = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = () => {
      const files = input.files;
      if (!files || !files.length) return;
      const file = files[0];
      readImage(file);
    };
    input.click();
  };

  const handleCamera = () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.capture = "camera";
    input.onchange = () => {
      const files = input.files;
      if (!files || !files.length) return;
      const file = files[0];
      readImage(file);
    };
    input.click();
  };

  return (
    <>
      {showEditor ? (
        <Editor
          image={image}
          onBack={() => {
            setShowEditor(false);
            setImage(undefined);
          }}
        />
      ) : (
        <div
          css={css`
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <div
            css={css`
              display: flex;
              flex-direction: column;
              gap: 16px;
              text-align: center;
            `}
          >
            <button
              css={css`
                background-color: lightblue;
                color: black;
              `}
              onClick={handleImport}
            >
              Import Image
            </button>
            <button
              css={css`
                background-color: #333;
              `}
              onClick={handleCamera}
            >
              Camera
            </button>
          </div>
        </div>
      )}
    </>
  );
}

export default App;
