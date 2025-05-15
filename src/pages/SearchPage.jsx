import { useParams } from 'react-router-dom';
function SearchPage() {
    const { searchParam } = useParams();
    return(
        <div>
            검색 결과를 보여주는 페이지
            <p> 검색어 : {searchParam}</p>
        </div>
    )
}

export default SearchPage;