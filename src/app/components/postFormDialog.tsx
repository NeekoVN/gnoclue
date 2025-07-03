/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { extractLastHashtag, removeLastHashtag } from "../utils/hashtagParser";
import { createPost } from "../services/post";

const PostFormDialog: React.FC = () => {
  const [text, setText] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);
    try {
      await createPost({
        content: text,
        tags: hashtags,
        images: [], // Not implemented yet
      });
      setSuccess("Post created!");
      setText("");
      setHashtags([]);
      // Optionally close dialog
      (
        document.getElementById("post-form-dialog") as HTMLDialogElement
      )?.close?.();
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="overlay blur"></div>
      <dialog
        id="post-form-dialog"
        className="!px-0 !w-[90%] !h-full !max-w-[800px] !max-h-[60vh] !flex !flex-col !justify-between border"
        style={{ backgroundColor: "var(--surface)" }}
        suppressHydrationWarning={true}>
        <form
          onSubmit={handleSubmit}
          className="flex flex-col h-full justify-between">
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
            <div className="field w-full min-h-[200px] textarea label border round extra">
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
            {error && (
              <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
            {success && (
              <div className="mb-2 p-2 bg-green-100 text-green-700 rounded">
                {success}
              </div>
            )}
          </div>
          <nav className="right-align no-space !pe-6 py-4">
            <button
              type="button"
              className="transparent link"
              data-ui="#post-form-dialog"
              disabled={submitting}>
              Cancel
            </button>
            <button
              type="submit"
              className="transparent link"
              disabled={submitting || !text.trim()}>
              {submitting ? "Posting..." : "Confirm"}
            </button>
          </nav>
        </form>
      </dialog>
    </>
  );
};

export default PostFormDialog;
