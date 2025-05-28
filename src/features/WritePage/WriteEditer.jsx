import React, { useEffect, useState } from "react";
import { EditorContent } from "@tiptap/react";
import MenuBar from "./MenuBar";
import ButtonLayout from "./ButtonLayout";
import "@/styles/WriteEditerStyle.css";
import LoadingPage from "@/components/LoadingPage";
import { useSelector } from 'react-redux';

// 분리된 컴포넌트들 import
import ImageResizeControls from './components/ImageResizeControls';
import TitleInput from './components/TitleInput';
import CategorySelect from './components/CategorySelect';
import { loadEditorExtensions } from './utils/editorUtils';

function EditorController({ onEditorReady, setTitle, title, selectedCategory, handleChange }) {
  const [isLoading, setIsLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);
  const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
  const [editorExtensions, setEditorExtensions] = useState(null);
  const { current } = useSelector((state) => state.theme);

  // 🚀 에디터 확장들을 동적으로 로드
  useEffect(() => {
    const initializeExtensions = async () => {
      try {
        const extensions = await loadEditorExtensions();
        console.log('에디터 확장 로드 완료:', extensions);
        setEditorExtensions(extensions);
      } catch (error) {
        console.error('에디터 확장 로드 실패:', error);
        // 폴백으로 기본 StarterKit 사용
        const StarterKit = await import('@tiptap/starter-kit');
        setEditorExtensions([StarterKit.default]);
      }
    };

    initializeExtensions();
  }, []);

  useEffect(() => {
    setIsMounted(true);
    
    const handleResize = () => {
      const viewportHeight = window.visualViewport?.height || window.innerHeight;
      const windowHeight = window.innerHeight;
      const heightDifference = windowHeight - viewportHeight;
      
      setIsKeyboardVisible(heightDifference > 150);
    };

    const handleVisualViewportChange = () => {
      handleResize();
    };

    window.addEventListener('resize', handleResize);
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleVisualViewportChange);
    }

    return () => {
      window.removeEventListener('resize', handleResize);
      if (window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleVisualViewportChange);
      }
    };
  }, []);

  // 에디터 상태 관리
  const [editor, setEditor] = useState(null);

  // 에디터 초기화
  useEffect(() => {
    if (!editorExtensions || !isMounted) return;

    console.log('에디터 초기화 시작...');
    
    try {
      // Editor 클래스를 직접 import하여 사용
      import('@tiptap/react').then(({ Editor }) => {
        const newEditor = new Editor({
          extensions: editorExtensions,
          editorProps: {
            attributes: {
              class: `prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none`,
              spellcheck: 'false',
              'data-testid': 'editor-content',
            },
            handleDOMEvents: {
              // 드래그 앤 드롭 이벤트만 처리하고 텍스트 입력 관련 이벤트는 제거
              dragenter: () => {
                // 기본 동작을 방지하지 않고 버블링 허용
                return false;
              },
              dragover: () => {
                // 기본 동작을 방지하지 않고 버블링 허용
                return false;
              },
              dragleave: () => {
                // 기본 동작을 방지하지 않고 버블링 허용
                return false;
              },
              drop: (_view, event) => {
                // 이미지 파일이 아닌 경우에만 기본 동작을 방지하지 않고 버블링 허용
                const files = event.dataTransfer?.files;
                if (files && files[0] && files[0].type.startsWith('image/')) {
                  // 이미지 파일인 경우 전역 핸들러가 처리하도록 버블링 허용
                  return false;
                }
                // 텍스트나 다른 파일인 경우 에디터가 처리하도록 함
                return false;
              },
            },
          },
          onSelectionUpdate: () => {
            // 선택 상태 변경 시 처리 (디버깅 로그 제거)
          },
          // 에디터 업데이트 시 디버깅 로그 추가
          onUpdate: ({ editor: updatedEditor }) => {
            console.log('에디터 업데이트:', updatedEditor.getHTML());
          },
        });

        console.log('에디터 생성 완료:', newEditor);
        setEditor(newEditor);
      }).catch(error => {
        console.error('에디터 생성 실패:', error);
      });
    } catch (error) {
      console.error('에디터 초기화 실패:', error);
    }

    // 클린업
    return () => {
      if (editor) {
        console.log('에디터 정리 중...');
        editor.destroy();
      }
    };
  }, [editorExtensions, isMounted]);

  useEffect(() => {
    if (editor && isMounted && editorExtensions) {
      setIsLoading(false);
      onEditorReady(editor);
    }
  }, [editor, isMounted, onEditorReady, editorExtensions]);

  // 확장들이 로드되지 않았거나 에디터가 로딩 중일 때
  if (isLoading || !editorExtensions || !editor) {
    return <LoadingPage />;
  }

  return (
    <div 
      className={`editor-wrapper flex flex-col min-h-screen px-4 sm:px-6 lg:px-8 py-8 w-full`}
    >
      {/* 제목 입력 */}
      <div className="w-full max-w-4xl mx-auto mb-6">
        <TitleInput title={title} setTitle={setTitle} />
      </div>
      
      {/* 카테고리 선택 */}
      <div className="w-full max-w-4xl mx-auto mb-8">
        <CategorySelect selectedCategory={selectedCategory} handleChange={handleChange} />
      </div>
      
      {/* 에디터 툴바 */}
      <div className="w-full max-w-6xl mx-auto mb-4">
        <MenuBar editor={editor} />
      </div>
      
      {/* 에디터 본문 - 전체 화면 너비 활용 */}
      <div className="w-full max-w-7xl mx-auto flex-grow">
        <div 
          className={`editor-content relative h-full rounded-xl border-2 overflow-hidden shadow-lg`}
        >
          <ImageResizeControls editor={editor} />
          <div className="p-6 sm:p-8 lg:p-12 h-full">
            <EditorContent 
              editor={editor} 
              className={`min-h-[70vh] prose prose-lg lg:prose-xl max-w-none focus:outline-none ${current === 'dark' ? 'prose-invert' : ''}`}
            />
          </div>
          
          {/* 에디터 하단 정보 */}
          <div className="px-6 lg:px-12 py-3 border-t flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <span className="opacity-60">
                글자 수: {editor?.storage.characterCount.characters() || 0}
              </span>
              <span className="opacity-60">
                단어 수: {editor?.storage.characterCount.words() || 0}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <div className="w-2 h-2 rounded-full" />
              <span className="opacity-60">
                자동 저장됨
              </span>
            </div>
          </div>
        </div>
      </div>
      
      {/* 하단 여백 - ButtonLayout을 위한 공간 (키보드 상태에 따라 조정) */}
      <div className={isKeyboardVisible ? "h-16" : "h-32"}></div>
    </div>
  );
}

export default function WriteEditor({ editId }) {
  const [editor, setEditor] = useState(null);
  const [title, setTitle] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoadingNote, setIsLoadingNote] = useState(!!editId);

  const handleChange = (e) => {
    setSelectedCategory(e.target.value);
  };

  // 기존 노트 불러오기
  useEffect(() => {
    if (editId && editor && editor.isInitialized) {
      const loadExistingNote = async () => {
        try {
          setIsLoadingNote(true);
          const { getNoteById } = await import("@/utils/firebaseNoteDataUtil");
          const noteData = await getNoteById(editId);
          
          if (noteData) {
            setTitle(noteData.title || "");
            setSelectedCategory(noteData.category || "");
            
            // 에디터에 content 설정
            const content = noteData.content || "";
          
            if (content) {
              // TipTap 에디터에 content 설정 - 안전한 방법 사용
              try {
                console.log("에디터 상태 확인:", {
                  isDestroyed: editor.isDestroyed,
                  isFocused: editor.isFocused,
                  isEmpty: editor.isEmpty
                });
                
                // 방법 1: 에디터 초기화 후 content 설정
                editor.commands.clearContent();
              
                setTimeout(() => {
                  if (editor && !editor.isDestroyed) {
                    try {
                      // HTML 문자열을 직접 설정
                      editor.commands.setContent(content, false, {
                        preserveWhitespace: 'full'
                      });
                    
                      // 설정 후 즉시 확인
                      editor.getHTML();
                    
                      setTimeout(() => {
                        const currentContent = editor.getHTML();
                      
                        console.log("설정 후 확인:", {
                          currentContent: currentContent.length,
                          isEmpty: editor.isEmpty,
                          characterCount: editor.storage.characterCount?.characters() || 0
                        });
                        
                        // 만약 여전히 비어있다면 강제로 HTML 삽입
                        if (currentContent.length <= 20) { // <p></p> 정도의 길이
                          editor.commands.insertContent(content);
                          
                          // 강제 삽입 후 다시 확인
                          setTimeout(() => {
                            editor.getHTML();
                          }, 100);
                        }
                      }, 200);
                    } catch (setContentError) {
                      console.error("setContent 실패:", setContentError);
                      
                      // 방법 2: insertContent 사용
                      try {
                        editor.commands.insertContent(content);
                      
                        setTimeout(() => {
                          editor.getHTML();
                        }, 100);
                      } catch (insertError) {
                        console.error("insertContent도 실패:", insertError);
                        
                        // 방법 3: 직접 DOM 조작 (최후의 수단)
                        try {
                          const editorElement = editor.view.dom;
                          editorElement.innerHTML = content;
                        
                          setTimeout(() => {
                            editorElement.innerHTML;
                          }, 100);
                        } catch (domError) {
                          console.error("DOM 조작도 실패:", domError);
                        }
                      }
                    }
                  } else {
                    console.error("에디터가 파괴되었거나 없음");
                  }
                }, 300);
                
              } catch (error) {
                console.error("전체 content 설정 실패:", error);
              }
            } else {
              console.log("content가 비어있음");
            }
          } else {
            console.log("noteData가 없음");
          }
        } catch (error) {
          console.error("노트 불러오기 실패:", error);
          alert("노트를 불러오는 중 오류가 발생했습니다.");
        } finally {
          setIsLoadingNote(false);
        }
      };

      loadExistingNote();
    } else {
      console.log("editId나 editor가 없음");
    }
  }, [editId, editor]);

  return (
    <>
      {isLoadingNote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <p>노트를 불러오는 중...</p>
          </div>
        </div>
      )}
      <EditorController
        onEditorReady={setEditor}
        setTitle={setTitle}
        title={title}
        selectedCategory={selectedCategory}
        handleChange={handleChange}
      />
      <ButtonLayout
        editor={editor}
        title={title}
        category={selectedCategory}
        editId={editId}
      />
    </>
  );
}
