import React from "react";
import ThemedButton from '../ui/ThemedButton'
function MenuBar({ editor }) {
  if (!editor) return null;

  function isActiveColor(targetColor) {
    return editor.getAttributes("textStyle").color === targetColor;
  }

  return (
    <div className="control-group border-b border-gray-300 mb-2">
      <div className="button-group flex overflow-x-auto whitespace-nowrap gap-2 p-2">
        {/* Bold */}
        <ThemedButton
          onClick={() => editor.chain().toggleBold().focus().run()}
          disabled={!editor.can().chain().toggleBold().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          B
        </ThemedButton>

        {/* Italic */}
        <ThemedButton
          onClick={() => editor.chain().toggleItalic().focus().run()}
          disabled={!editor.can().chain().toggleItalic().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center italic
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          I
        </ThemedButton>

        {/* Strike */}
        <ThemedButton
          onClick={() => editor.chain().toggleStrike().focus().run()}
          disabled={!editor.can().chain().toggleStrike().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center line-through
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          S
        </ThemedButton>

        {/* Headings */}
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <ThemedButton
            key={level}
            onClick={() =>
              editor.chain().toggleHeading({ level }).focus().run()
            }
            className={`inline-block px-3 py-2 border rounded-md text-sm text-center`}
          >
            H{level}
          </ThemedButton>
        ))}

        {/* Bullet List */}
        <ThemedButton
          onClick={() => editor.chain().toggleBulletList().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center`}
        >
          •
        </ThemedButton>

        {/* Ordered List */}
        <ThemedButton
          onClick={() => editor.chain().toggleOrderedList().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center`}
        >
          1.
        </ThemedButton>

        {/* Code Block */}
        <ThemedButton
          onClick={() => editor.chain().toggleCodeBlock().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center`}
        >
          {"</>"}
        </ThemedButton>

        {/* Blockquote */}
        <ThemedButton
          onClick={() => editor.chain().toggleBlockquote().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center
`}
        >
          ❝
        </ThemedButton>

        {/* Horizontal Rule */}
        <ThemedButton
          onClick={() => editor.chain().setHorizontalRule().focus().run()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 text-sm"
        >
          ―
        </ThemedButton>

        {/* Hard Break */}
        <ThemedButton
          onClick={() => editor.chain().setHardBreak().focus().run()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 text-sm"
        >
          ↵
        </ThemedButton>

        {/* Undo */}
        <ThemedButton
          onClick={() => editor.chain().undo().focus().run()}
          disabled={!editor.can().undo()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ⎌ 되돌리기
        </ThemedButton>

        {/* Redo */}
        <ThemedButton
          onClick={() => editor.chain().redo().focus().run()}
          disabled={!editor.can().redo()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
        >
          ↻ 다시하기
        </ThemedButton>

        {/* Text Color */}
        <div className="inline-flex gap-2 items-center px-2">
          {[
            { label: "Black", color: "#000000" },
            { label: "Blue", color: "#3B82F6" },
            { label: "Red", color: "#EF4444" },
            { label: "Purple", color: "#8B5CF6" },
            { label: "Green", color: "#10B981" },
            { label: "Orange", color: "#F97316" },
          ].map(({ label, color }) => (
            <ThemedButton
              key={label}
              onClick={() => editor.chain().focus().setColor(color).run()}
              className={`w-8 h-8 rounded-full border transition shrink-0 ${
                isActiveColor(color) ? "ring-2 ring-indigo-500" : ""
              }`}
              style={{
                color,
                borderColor: color,
                filter: isActiveColor(color) ? "invert(2)" : "none",
              }}
              title={`Text ${label}`}
            >
              A
            </ThemedButton>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuBar;
