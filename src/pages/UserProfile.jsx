import { useParams } from 'react-router-dom';

function UserProfile(){
    const { userId } = useParams();
    
    return(
        <div>
            유저 프로필 페이지임<br />
            유저 이름 {userId}
        </div>
    )
}

export default UserProfile;