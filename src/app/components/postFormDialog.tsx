/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import React, { useState, useRef } from "react";
import { extractLastHashtag, removeLastHashtag } from "../utils/hashtagParser";
import { createPost, presignMediaUpload } from "../services/post";
import { useAuth } from "../contexts/AuthContext";
import { IPost, IMediaObject } from "../types/post";

const PostFormDialog: React.FC = () => {
  const [text, setText] = useState("");
  const [hashtags, setHashtags] = useState<string[]>([]);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const isComposing = useRef(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();

  // Media upload state
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{
    [key: string]: number;
  }>({});
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Media upload handlers
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => {
      const isValidType = file.type.startsWith("image/");
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError("Some files were skipped. Only images up to 10MB are allowed.");
    }

    setSelectedFiles((prev) => [...prev, ...validFiles]);
    setError(null);
  };

  const removeFile = (indexToRemove: number) => {
    setSelectedFiles((prev) =>
      prev.filter((_, index) => index !== indexToRemove)
    );
  };

  const uploadFile = async (
    file: File,
    presignedItem: any
  ): Promise<IMediaObject> => {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();

      xhr.upload.addEventListener("progress", (e) => {
        if (e.lengthComputable) {
          const progress = Math.round((e.loaded / e.total) * 100);
          setUploadProgress((prev) => ({
            ...prev,
            [file.name]: progress,
          }));
        }
      });

      xhr.addEventListener("load", () => {
        if (xhr.status === 200) {
          const mediaObject: IMediaObject = {
            type: "image",
            key: presignedItem.key,
            contentType: presignedItem.contentType,
            byteLength: file.size,
          };
          resolve(mediaObject);
        } else {
          reject(new Error(`Upload failed: ${xhr.statusText}`));
        }
      });

      xhr.addEventListener("error", () => {
        reject(new Error("Upload failed"));
      });

      xhr.open("PUT", presignedItem.putUrl);
      xhr.setRequestHeader("Content-Type", presignedItem.contentType);
      xhr.send(file);
    });
  };

  const closeDialog = () => {
    // Reset form state
    setText("");
    setHashtags([]);
    setSelectedFiles([]);
    setUploadProgress({});
    setError(null);

    // Use BeerCSS way to close dialog by triggering the data-ui mechanism
    const cancelButton = document.querySelector(
      '[data-ui="#post-form-dialog"]'
    ) as HTMLButtonElement;
    if (cancelButton) {
      cancelButton.click();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    // Generate unique temporary ID for tracking optimistic update
    const tempId = `temp-${Date.now()}-${Math.random()}`;

    try {
      let mediaObjects: IMediaObject[] = [];

      // Upload files if any selected
      if (selectedFiles.length > 0) {
        setUploading(true);

        // Presign uploads
        const presignRequests = selectedFiles.map((file) => ({
          type: "image" as const,
          byteLength: file.size,
          contentType: file.type || "image/jpeg",
        }));

        const presignResponse = await presignMediaUpload(presignRequests);

        // Upload all files in parallel
        const uploadPromises = selectedFiles.map((file, index) =>
          uploadFile(file, presignResponse.items[index])
        );

        mediaObjects = await Promise.all(uploadPromises);
        setUploading(false);
      }

      // Create optimistic post for immediate UI feedback
      if (user) {
        const optimisticPost: IPost = {
          _id: tempId,
          userId: user,
          content: text,
          tags: hashtags,
          media: mediaObjects,
          upvotes: [],
          downvotes: [],
          commentCount: 0,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        // Dispatch custom event to add optimistic post to feed
        window.dispatchEvent(
          new CustomEvent("newPostOptimistic", {
            detail: optimisticPost,
          })
        );
      }

      // Create the actual post
      const createdPost = await createPost({
        content: text,
        tags: hashtags,
        media: mediaObjects,
      });

      // Dispatch custom event to replace optimistic post with real post
      window.dispatchEvent(
        new CustomEvent("newPostCreated", {
          detail: {
            optimisticId: tempId,
            realPost: createdPost,
          },
        })
      );

      setText("");
      setHashtags([]);
      setSelectedFiles([]);
      setUploadProgress({});

      // Close the dialog using the same mechanism as the cancel button
      closeDialog();
    } catch (err: any) {
      // Remove optimistic post on error
      window.dispatchEvent(
        new CustomEvent("newPostError", {
          detail: tempId,
        })
      );

      setError(err.response?.data?.message || "Failed to create post");
    } finally {
      setSubmitting(false);
      setUploading(false);
    }
  };

  return (
    <>
      <div className="overlay blur"></div>
      <dialog
        id="post-form-dialog"
        className="!px-0 !w-[90%] !max-w-[700px] !max-h-[60vh] !flex !flex-col !justify-between border"
        style={{ backgroundColor: "var(--surface)" }}
        suppressHydrationWarning={true}
      >
        <form
          onSubmit={handleSubmit}
          className="flex flex-col !h-full justify-between"
        >
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
                  onClick={() => deleteHashtag(idx)}
                >
                  <i>close</i>
                  <span style={{ color: "var(--primary)", fontWeight: "bold" }}>
                    {tag}
                  </span>
                </button>
              ))}
            </div>

            {/* Selected files display */}
            {selectedFiles.length > 0 && (
              <div className="w-full mb-4">
                <h6>Selected Images:</h6>
                <div className="flex flex-wrap gap-2">
                  {selectedFiles.map((file, idx) => (
                    <div key={idx} className="relative">
                      <div className="chip">
                        <i>image</i>
                        <span className="truncate max-w-[100px]">
                          {file.name}
                        </span>
                        <button
                          onClick={() => removeFile(idx)}
                          className="ml-1 text-red-500 hover:text-red-700"
                        >
                          <i>close</i>
                        </button>
                      </div>
                      {uploadProgress[file.name] !== undefined && (
                        <div className="mt-1">
                          <progress
                            value={uploadProgress[file.name]}
                            max="100"
                            className="w-full h-2"
                          />
                          <span className="text-xs text-gray-600">
                            {uploadProgress[file.name]}%
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="field w-full min-h-[200px] textarea label border round extra">
              <span className="helper">Type # to add a hashtag</span>
              <textarea
                ref={textareaRef}
                value={text}
                onKeyDown={handleKeyDown}
                onChange={handleChange}
                onCompositionStart={handleCompositionStart}
                onCompositionEnd={handleCompositionEnd}
              ></textarea>
              {/* eslint-disable-next-line react/no-unescaped-entities */}
              <label>What's on your mind?</label>
            </div>

            <div className="w-full flex gap-2">
              <button
                className="fill flex-1"
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <i>image</i>
                <span>Add Images</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png, image/jpeg, image/jpg"
                  multiple
                  onChange={handleFileSelect}
                  className="hidden"
                />
              </button>
            </div>

            {error && (
              <div className="mb-2 p-2 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}
          </div>
          <nav className="right-align no-space !pe-6 py-4">
            <button
              type="button"
              className="transparent link"
              data-ui="#post-form-dialog"
              disabled={submitting || uploading}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || uploading || !text.trim()}
            >
              {submitting || uploading ? "Posting..." : "Confirm"}
            </button>
          </nav>
        </form>
      </dialog>
    </>
  );
};

export default PostFormDialog;
