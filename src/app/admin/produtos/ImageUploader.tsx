"use client";

import { useState, useRef } from "react";

interface ImageUploaderProps {
    existingImages: string[];
    onImagesChange: (existing: string[], newFiles: File[]) => void;
}

export function ImageUploader({ existingImages, onImagesChange }: ImageUploaderProps) {
    const [existing, setExisting] = useState<string[]>(existingImages);
    const [newFiles, setNewFiles] = useState<File[]>([]);
    const [previews, setPreviews] = useState<string[]>([]);
    const [dragging, setDragging] = useState(false);
    const inputRef = useRef<HTMLInputElement>(null);

    function handleFiles(files: FileList | null) {
        if (!files) return;

        const validFiles: File[] = [];
        const newPreviews: string[] = [];

        for (let i = 0; i < files.length; i++) {
            const file = files[i];
            if (file.type.startsWith("image/")) {
                validFiles.push(file);
                newPreviews.push(URL.createObjectURL(file));
            }
        }

        const updatedFiles = [...newFiles, ...validFiles];
        const updatedPreviews = [...previews, ...newPreviews];

        setNewFiles(updatedFiles);
        setPreviews(updatedPreviews);
        onImagesChange(existing, updatedFiles);
    }

    function removeExisting(index: number) {
        const updated = existing.filter((_, i) => i !== index);
        setExisting(updated);
        onImagesChange(updated, newFiles);
    }

    function removeNew(index: number) {
        URL.revokeObjectURL(previews[index]);
        const updatedFiles = newFiles.filter((_, i) => i !== index);
        const updatedPreviews = previews.filter((_, i) => i !== index);
        setNewFiles(updatedFiles);
        setPreviews(updatedPreviews);
        onImagesChange(existing, updatedFiles);
    }

    return (
        <div>
            <div
                className={`admin-dropzone ${dragging ? "dragging" : ""}`}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={(e) => {
                    e.preventDefault();
                    setDragging(false);
                    handleFiles(e.dataTransfer.files);
                }}
                onClick={() => inputRef.current?.click()}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => handleFiles(e.target.files)}
                    style={{ display: "none" }}
                />
                <div className="admin-dropzone-text">
                    <strong>Click o arrastra</strong> imágenes aquí
                    <br />
                    <span style={{ fontSize: "12px" }}>JPG, PNG, WebP — procesadas a 1080px WebP</span>
                </div>
            </div>

            {(existing.length > 0 || previews.length > 0) && (
                <div className="admin-preview-grid">
                    {existing.map((url, i) => (
                        <div key={`existing-${i}`} className="admin-preview-item">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Imagen ${i + 1}`} />
                            <button
                                type="button"
                                className="admin-preview-remove"
                                onClick={() => removeExisting(i)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                    {previews.map((url, i) => (
                        <div key={`new-${i}`} className="admin-preview-item">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={url} alt={`Nueva ${i + 1}`} />
                            <button
                                type="button"
                                className="admin-preview-remove"
                                onClick={() => removeNew(i)}
                            >
                                ✕
                            </button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
