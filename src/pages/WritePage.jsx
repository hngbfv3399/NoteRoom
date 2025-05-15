import { useNavigate } from "react-router-dom";
function WritePage() {
    const navigate = useNavigate();
    const goToHome = ()=>{
        navigate('/');
    }
    return (
        <div>
            글 작성 페이지임
            <button className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600" onClick={goToHome}>홈으로 돌아가기</button>
        </div>
    )
}
export default WritePage;