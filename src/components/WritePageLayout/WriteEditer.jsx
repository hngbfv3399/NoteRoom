import React from "react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Color from "@tiptap/extension-color";
import ListItem from "@tiptap/extension-list-item";
import TextStyle from "@tiptap/extension-text-style";
import MenuBar from "./MenuBar";
import "../../styles/WriteEditerStyle.css";
import ButtonLayout from "./ButtonLayout";
import  { useEffect,useState  } from "react";

const editorExtensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
];

function EditorController({ onEditorReady,setTitle,title,selectedCategory,handleChange }) {
  const editor = useEditor({
    extensions: editorExtensions,
    content: "<p>Hello World!</p>",
  });
  const categories = ["일상", "정보", "감성", "시", "사진", "동영상"];

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);



  if (!editor) return null;

  return (
    <div className="editor-wrapper h-[60vh] px-4 pt-16 overflow-y-auto relative">
      <input type="text" value={title} onChange={(e)=>setTitle(e.target.value)} className="border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"/>
      <label htmlFor="category-select">카테고리 선택: </label>
      <select id="category-select" value={selectedCategory} onChange={handleChange}>
        <option value="">-- 선택하세요 --</option>
        {categories.map((cat, idx) => (
          <option key={idx} value={cat}>{cat}</option>
        ))}
      </select>
      <div className="w-full max-w-md bg-white border-b border-gray-300 z-50">
        <MenuBar editor={editor} />
      </div>
      <EditorContent
        editor={editor}
        className="outline-none mt-3 pl-5"
        style={{ minHeight: "60vh" }}
      />
    </div>
  );
}



export default function WriteEditor() {
  const [editor, setEditor] = useState(null);
  const [title,setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };
  return (
    <>
      <EditorController handleChange={handleChange} onEditorReady={setEditor} setTitle = {setTitle} title={title} selectedCategory={selectedCategory} setSelectedCategory = {setSelectedCategory} />
      <ButtonLayout editor={editor} title={title} selectedCategory={selectedCategory} category={selectedCategory}/>
    </>
  );
}
