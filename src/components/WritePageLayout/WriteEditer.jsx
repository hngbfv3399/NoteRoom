import React from 'react'
import { EditorContent, useEditor } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Color from '@tiptap/extension-color'
import ListItem from '@tiptap/extension-list-item'
import TextStyle from '@tiptap/extension-text-style'
import MenuBar from './MenuBar'
import '../../styles/WriteEditerStyle.css'

const editorExtensions = [
  StarterKit.configure({
    bulletList: { keepMarks: true, keepAttributes: false },
    orderedList: { keepMarks: true, keepAttributes: false },
  }),
  Color.configure({ types: [TextStyle.name, ListItem.name] }),
  TextStyle.configure({ types: [ListItem.name] }),
]

function EditorController() {
  const editor = useEditor({
    extensions: editorExtensions,
    content: '<p>Hello World!</p>',
  })

  if (!editor) return null
  return (
    <div className="editor-wrapper h-[60vh] px-4 pt-16 overflow-y-auto relative">
      <div className="w-full max-w-md bg-white border-b border-gray-300 z-50">
        <MenuBar editor={editor} />
      </div>

      <EditorContent
        editor={editor}
        className="outline-none mt-3 pl-5"
        style={{ minHeight: '60vh' }}
      />
    </div>
  )
}

export default function WriteEditor() {
  return <EditorController />
}
