import ThemedButton from "../ui/ThemedButton";

function ProfileActions() {
  return (
    <div className="space-y-2">
      <ThemedButton className="mr-4">닉네임 변경</ThemedButton>
      <ThemedButton>프로필 사진 변경</ThemedButton>
    </div>
  );
}

export default ProfileActions;
