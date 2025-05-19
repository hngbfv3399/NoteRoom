import React from "react";

function MenuBar({ editor }) {
  if (!editor) return null;

  function isActiveColor(targetColor) {
    return editor.getAttributes("textStyle").color === targetColor;
  }

  return (
    <div className="control-group border-b border-gray-300 mb-2">
      <div className="button-group flex overflow-x-auto whitespace-nowrap gap-2 p-2">
        {/* Bold */}
        <button
          onClick={() => editor.chain().toggleBold().focus().run()}
          disabled={!editor.can().chain().toggleBold().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center
            ${
              editor.isActive("bold")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            } 
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          B
        </button>

        {/* Italic */}
        <button
          onClick={() => editor.chain().toggleItalic().focus().run()}
          disabled={!editor.can().chain().toggleItalic().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center italic hover:bg-gray-100
            ${
              editor.isActive("italic")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            } 
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          I
        </button>

        {/* Strike */}
        <button
          onClick={() => editor.chain().toggleStrike().focus().run()}
          disabled={!editor.can().chain().toggleStrike().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center line-through hover:bg-gray-100
            ${
              editor.isActive("strike")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            } 
            disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          S
        </button>

        {/* Headings */}
        {[1, 2, 3, 4, 5, 6].map((level) => (
          <button
            key={level}
            onClick={() =>
              editor.chain().toggleHeading({ level }).focus().run()
            }
            className={`inline-block px-3 py-2 border rounded-md text-sm text-center hover:bg-gray-100
              ${
                editor.isActive("heading", { level })
                  ? "bg-indigo-500 text-white"
                  : "bg-white text-gray-800"
              }`}
          >
            H{level}
          </button>
        ))}

        {/* Bullet List */}
        <button
          onClick={() => editor.chain().toggleBulletList().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center hover:bg-gray-100
            ${
              editor.isActive("bulletList")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            }`}
        >
          •
        </button>

        {/* Ordered List */}
        <button
          onClick={() => editor.chain().toggleOrderedList().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center hover:bg-gray-100
            ${
              editor.isActive("orderedList")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            }`}
        >
          1.
        </button>

        {/* Code Block */}
        <button
          onClick={() => editor.chain().toggleCodeBlock().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center hover:bg-gray-100
            ${
              editor.isActive("codeBlock")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            }`}
        >
          {"</>"}
        </button>

        {/* Blockquote */}
        <button
          onClick={() => editor.chain().toggleBlockquote().focus().run()}
          className={`inline-block px-3 py-2 border rounded-md text-sm text-center hover:bg-gray-100
            ${
              editor.isActive("blockquote")
                ? "bg-indigo-500 text-white"
                : "bg-white text-gray-800"
            }`}
        >
          ❝
        </button>

        {/* Horizontal Rule */}
        <button
          onClick={() => editor.chain().setHorizontalRule().focus().run()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 hover:bg-gray-100 text-sm"
        >
          ―
        </button>

        {/* Hard Break */}
        <button
          onClick={() => editor.chain().setHardBreak().focus().run()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 hover:bg-gray-100 text-sm"
        >
          ↵
        </button>

        {/* Undo */}
        <button
          onClick={() => editor.chain().undo().focus().run()}
          disabled={!editor.can().undo()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
        >
          ⎌ 되돌리기
        </button>

        {/* Redo */}
        <button
          onClick={() => editor.chain().redo().focus().run()}
          disabled={!editor.can().redo()}
          className="inline-block px-3 py-2 border rounded-md bg-white text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 text-sm"
        >
          ↻ 다시하기
        </button>

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
            <button
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
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default MenuBar;
