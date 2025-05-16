import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import "../../styles/WriteEditerStyle.css";
import Placeholder from "@tiptap/extension-placeholder";
const editorStyles = {
  minHeight: "300px",
  padding: "1rem",
  lineHeight: 1.6,
};

function WriteEditor() {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Placeholder.configure({
        placeholder: "텍스트를 입력하시오.",
      }),
    ],
    content: "",
  });

  return (
    <>
        <EditorContent
          editor={editor}
          style={editorStyles}
          className="ProseMirror"
        />
    </>
  );
}

export default WriteEditor;
