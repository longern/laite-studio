import { css } from "@emotion/react";
import { useEffect, useRef, useState } from "react";

import "./App.css";
import Editor from "./Editor";
import Dots from "./assets/dots.svg";

function SettingsDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const dialogRef = useRef<HTMLDialogElement | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [baseUrl, setBaseUrl] = useState("");

  useEffect(() => {
    if (!dialogRef.current) return;
    if (open) {
      setApiKey(window.localStorage.getItem("OPENAI_API_KEY") || "");
      setBaseUrl(window.localStorage.getItem("OPENAI_BASE_URL") || "");
      dialogRef.current.showModal();
    } else dialogRef.current.close();
  }, [open]);

  const handleSave = () => {
    if (apiKey) window.localStorage.setItem("OPENAI_API_KEY", apiKey);
    else window.localStorage.removeItem("OPENAI_API_KEY");
    if (baseUrl) window.localStorage.setItem("OPENAI_BASE_URL", baseUrl);
    else window.localStorage.removeItem("OPENAI_BASE_URL");
    onClose();
  };

  return !open ? null : (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      css={css`
        border-radius: 4px;
      `}
    >
      <div
        css={css`
          min-width: 320px;
          display: flex;
          flex-direction: column;
          gap: 16px;
          & h2 {
            margin: 0;
          }
          & label {
            display: flex;
            align-items: center;
            gap: 8px;
          }
          & input {
            flex-grow: 1;
            padding: 12px;
            border: none;
            font-size: 16px;
            text-align: right;
          }
        `}
      >
        <h2>Settings</h2>
        <div>
          <label>
            <span>API Key</span>
            <input
              type="text"
              placeholder="sk-***"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          </label>
        </div>
        <div>
          <label>
            <span>Base URL</span>
            <input
              type="text"
              placeholder="https://api.openai.com/v1"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
            />
          </label>
        </div>
        <div
          css={css`
            display: flex;
            & > button {
              margin-left: 8px;
            }
          `}
        >
          <div
            css={css`
              flex-grow: 1;
            `}
          />
          <button
            css={css`
              background-color: transparent;
              &:hover {
                background-color: rgba(128, 128, 128, 0.3);
              }
            `}
            onClick={onClose}
          >
            Cancel
          </button>
          <button
            css={css`
              &:hover {
                background-color: #444;
              }
              color: white;
            `}
            onClick={handleSave}
          >
            Save
          </button>
        </div>
      </div>
    </dialog>
  );
}

function App() {
  const [showEditor, setShowEditor] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
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
            position: relative;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
          `}
        >
          <button
            aria-label="Menu"
            css={css`
              position: absolute;
              display: flex;
              top: 8px;
              right: 8px;
              padding: 12px;
              background-color: transparent;
              &:hover {
                background-color: rgba(128, 128, 128, 0.3);
              }
            `}
            onClick={() => setShowSettings(true)}
          >
            <img src={Dots} alt="Dots" width={24} height={24} />
          </button>
          <SettingsDialog
            open={showSettings}
            onClose={() => setShowSettings(false)}
          />
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
                &:hover {
                  background-color: #8ac7db;
                }
              `}
              onClick={handleImport}
            >
              Import Image
            </button>
            <button
              css={css`
                background-color: #333;
                &:hover {
                  background-color: #444;
                }
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
