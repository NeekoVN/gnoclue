"use client";

import React, { useState, useRef } from "react";
import dynamic from "next/dynamic";
import { extractLastHashtag, removeLastHashtag } from "../utils/hashtagParser";

const PostFormDialog: React.FC = () => {
  const [text, setText] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);

  const handleCompositionStart = () => {
    isComposing.current = true;
  };

  const handleCompositionEnd = () => {
    isComposing.current = false;
    if (textareaRef.current) {
      const currentText = textareaRef.current.value;
      const lastHashtag = extractLastHashtag(currentText);
      if (lastHashtag) {
        setHashtags((prev) => [...prev, lastHashtag]);
        setText(removeLastHashtag(currentText));
      }
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === " " && !isComposing.current) {
      const lastHashtag = extractLastHashtag(text);
      if (lastHashtag) {
        setHashtags((prev) => [...prev, lastHashtag]);
        setText(removeLastHashtag(text));
        e.preventDefault();
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
  };

  const deleteHashtag = (indexToDelete: number) => {
    setHashtags((prev) => prev.filter((_, index) => index !== indexToDelete));
  };

  return (
    <>
      <div className="overlay blur"></div>
      <dialog
        id="post-form-dialog"
        className="!px-0 !w-full !h-full !max-w-[800px] !max-h-[60vh] !flex !flex-col !justify-between"
        style={{ backgroundColor: "var(--surface)" }}>
        <div>
          <h6 className="center-align">Create a post</h6>
          <hr className="large max" />
        </div>
        <div className="flex-1 flex flex-col items-start !px-6 overflow-y-auto">
          <div className="flex flex-wrap">
            {hashtags.map((tag, idx) => (
              <button
                key={tag + idx}
                className="chip"
                onClick={() => deleteHashtag(idx)}>
                <i>close</i>
                <span style={{ color: "var(--primary)", fontWeight: "bold" }}>
                  {tag}
                </span>
              </button>
            ))}
          </div>
          <div className="field w-full textarea label border round fill">
            <span className="helper">Type # to add a hashtag</span>
            <textarea
              ref={textareaRef}
              value={text}
              onKeyDown={handleKeyDown}
              onChange={handleChange}
              onCompositionStart={handleCompositionStart}
              onCompositionEnd={handleCompositionEnd}></textarea>
            {/* eslint-disable-next-line react/no-unescaped-entities */}
            <label>What's on your mind?</label>
          </div>
          <button className="!mx-0 fill">
            <i>image</i>
            <span>Upload an image</span>
            <input type="file" accept="image/png, image/jpeg, image/jpg" />
          </button>
        </div>
        <nav className="right-align no-space !pe-6 py-4">
          <button className="transparent link" data-ui="#post-form-dialog">
            Cancel
          </button>
          <button className="transparent link" data-ui="#post-form-dialog">
            Confirm
          </button>
        </nav>
      </dialog>
    </>
  );
};

export default dynamic(() => Promise.resolve(PostFormDialog), { ssr: false });
