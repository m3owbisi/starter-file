"use client";

import React, { useState } from "react";
import {
  Tag,
  Plus,
  X,
  Loader2,
} from "lucide-react";

interface TagManagerProps {
  experimentId: string;
  runId: string;
  currentTags: string[];
  onClose: () => void;
  onTagsUpdated?: (tags: string[]) => void;
}

const TagManager: React.FC<TagManagerProps> = ({
  experimentId,
  runId,
  currentTags,
  onClose,
  onTagsUpdated,
}) => {
  const [tags, setTags] = useState<string[]>(currentTags);
  const [newTag, setNewTag] = useState("");
  const [loading, setLoading] = useState(false);

  const handleAddTag = async () => {
    if (!newTag.trim()) return;
    const tagToAdd = newTag.trim().toLowerCase();
    
    if (tags.includes(tagToAdd)) {
      setNewTag("");
      return;
    }

    try {
      setLoading(true);
      const response = await fetch(
        `/api/experiments/${experimentId}/runs/${runId}/tags`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tags: [tagToAdd] }),
        }
      );

      const data = await response.json();
      if (data.success) {
        setTags(data.data);
        onTagsUpdated?.(data.data);
        setNewTag("");
      }
    } catch (error) {
      console.error("error adding tag:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/experiments/${experimentId}/runs/${runId}/tags?tags=${tagToRemove}`,
        { method: "DELETE" }
      );

      const data = await response.json();
      if (data.success) {
        setTags(data.data);
        onTagsUpdated?.(data.data);
      }
    } catch (error) {
      console.error("error removing tag:", error);
    } finally {
      setLoading(false);
    }
  };

  // common tags suggestions
  const commonTags = [
    "baseline",
    "best-model",
    "production",
    "experimental",
    "deprecated",
    "review",
    "promising",
    "failed",
  ];

  const suggestedTags = commonTags.filter((tag) => !tags.includes(tag));

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-900 rounded-2xl w-full max-w-md p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <Tag size={20} className="text-[#3c50e0]" />
            manage tags
          </h3>
          <button
            onClick={onClose}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* current tags */}
        <div className="mb-6">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            current tags
          </label>
          <div className="flex flex-wrap gap-2 min-h-[40px]">
            {tags.length === 0 ? (
              <p className="text-gray-400 text-sm">no tags added yet</p>
            ) : (
              tags.map((tag) => (
                <span
                  key={tag}
                  className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#3c50e0]/10 text-[#3c50e0] text-sm rounded-lg group"
                >
                  {tag}
                  <button
                    onClick={() => handleRemoveTag(tag)}
                    disabled={loading}
                    className="hover:bg-[#3c50e0]/20 rounded p-0.5 opacity-60 group-hover:opacity-100 transition-opacity"
                  >
                    <X size={12} />
                  </button>
                </span>
              ))
            )}
          </div>
        </div>

        {/* add new tag */}
        <div className="mb-6">
          <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
            add new tag
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value.toLowerCase())}
              onKeyPress={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="enter tag name..."
              className="flex-1 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#3c50e0]/20 focus:border-[#3c50e0]"
            />
            <button
              onClick={handleAddTag}
              disabled={loading || !newTag.trim()}
              className="px-4 py-2.5 bg-[#3c50e0] text-white rounded-xl font-medium hover:bg-[#3c50e0]/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
            >
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Plus size={16} />
              )}
              add
            </button>
          </div>
        </div>

        {/* suggested tags */}
        {suggestedTags.length > 0 && (
          <div>
            <label className="block text-sm text-gray-500 dark:text-gray-400 mb-2">
              suggestions
            </label>
            <div className="flex flex-wrap gap-2">
              {suggestedTags.map((tag) => (
                <button
                  key={tag}
                  onClick={() => {
                    setNewTag(tag);
                  }}
                  disabled={loading}
                  className="px-3 py-1.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 text-sm rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* close button */}
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full px-4 py-2.5 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 rounded-xl font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
          >
            done
          </button>
        </div>
      </div>
    </div>
  );
};

export default TagManager;
