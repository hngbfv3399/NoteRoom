import { saveNoteToFirestore } from "../../utils/firebaseNoteDataUtil";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import timezone from "dayjs/plugin/timezone";
import { useNavigate } from "react-router-dom";
function ButtonLayout({ editor, title,category }) {
  const navigate = useNavigate();
  const handleSubmit = async (e) => {
    dayjs.extend(utc);
    dayjs.extend(timezone);
    e.preventDefault();
    if (editor) {
      const html = editor.getHTML();
      const noteData = {
        id: uuidv4(),
        title: title,
        content: html,
        likes: 0,
        commentCount: 0,
        comment: [],
        views: 0,
        category: category,
        date: dayjs().tz('Asia/Seoul').toISOString(),
        image:
          "https://images.pexels.com/photos/1108099/pexels-photo-1108099.jpeg?auto=compress&cs=tinysrgb&w=1200",
      };
      if (!title || title.trim() === "" || !category || category.trim() === "") {
        alert("제대로 좀 하소ㅋ");
        return;
      }
      await saveNoteToFirestore(noteData);
      alert("저장이 완료 되었습니다.")
      console.log(noteData);
      
      navigate('/'); 
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <button type="submit">완료</button>
      </form>
    </div>
  );
}
export default ButtonLayout;
