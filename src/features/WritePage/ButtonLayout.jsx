import { useState } from "react";
import { saveNoteToFirestore } from "@/utils/firebaseNoteDataUtil";
import { useNavigate } from "react-router-dom";
import { auth, storage } from "@/services/firebase";
import ThemedButton from "@/components/ui/ThemedButton";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import LoadingPage from "@/components/LoadingPage";

function ButtonLayout({ editor, title, category }) {
  const navigate = useNavigate();
  const [uploading, setUploading] = useState(false);
  const [imageFile, setImageFile] = useState(null);
  const [error, setError] = useState(null);

  // 이미지 선택 핸들러
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB 제한
        setError("이미지 크기는 5MB를 초과할 수 없습니다.");
        return;
      }
      if (!file.type.startsWith('image/')) {
        setError("이미지 파일만 업로드 가능합니다.");
        return;
      }
      setImageFile(file);
      setError(null);
    }
  };

  // 이미지 업로드 함수
  const uploadImage = async () => {
    if (!imageFile) {
      throw new Error("썸네일 이미지를 선택해주세요.");
    }

    const user = auth.currentUser;
    if (!user) {
      throw new Error("로그인이 필요합니다.");
    }

    try {
      const storageRef = ref(storage, `notes/${user.uid}/${Date.now()}_${imageFile.name}`);
      await uploadBytes(storageRef, imageFile);
      const url = await getDownloadURL(storageRef);
      return url;
    } catch (error) {
      console.error("이미지 업로드 실패:", error);
      throw new Error("이미지 업로드에 실패했습니다.");
    }
  };

  const validateInput = () => {
    if (!title.trim()) {
      throw new Error("제목을 입력해주세요.");
    }
    if (!category.trim()) {
      throw new Error("카테고리를 선택해주세요.");
    }
    if (!editor || !editor.getHTML().trim()) {
      throw new Error("내용을 입력해주세요.");
    }
    if (!imageFile) {
      throw new Error("썸네일 이미지를 선택해주세요.");
    }
  };

  const handleSubmit = async () => {
    const user = auth.currentUser;
    if (!user) {
      setError("로그인이 필요합니다.");
      return;
    }

    try {
      setError(null);
      setUploading(true);
      
      validateInput();

      const uploadedImageUrl = await uploadImage();
      const html = editor.getHTML();
      
      const noteData = {
        title: title.trim(),
        content: html,
        category: category.trim(),
        userUid: user.uid,
        image: uploadedImageUrl,
        likes: 0,
        views: 0,
        commentCount: 0,
      };

      await saveNoteToFirestore(noteData);
      navigate("/");
    } catch (error) {
      setError(error.message);
      console.error("노트 저장 실패:", error);
    } finally {
      setUploading(false);
    }
  };

  if (uploading) {
    return <LoadingPage />;
  }

  return (
    <div className="flex flex-col space-y-4 p-4">
      <div className="space-y-2">
        <label className="block text-sm font-medium">
          썸네일 이미지 <span className="text-red-500">*</span>
        </label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          disabled={uploading}
          className="block w-full text-sm"
          required
        />
        {!imageFile && !error && (
          <p className="text-sm text-red-500">
            썸네일 이미지는 필수입니다.
          </p>
        )}
        {imageFile && (
          <p className="text-sm">
            선택된 파일: {imageFile.name}
          </p>
        )}
      </div>

      {error && (
        <div className="text-red-500 text-sm p-2 rounded">
          {error}
        </div>
      )}

      <div className="flex justify-end space-x-4">
        <ThemedButton onClick={() => navigate("/")}>
          취소
        </ThemedButton>
        <ThemedButton 
          onClick={handleSubmit} 
          disabled={uploading || !imageFile}
        >
          {uploading ? "저장 중..." : "저장"}
        </ThemedButton>
      </div>
    </div>
  );
}

export default ButtonLayout;
