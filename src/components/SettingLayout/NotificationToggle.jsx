function NotificationToggle() {
  return (
    <div className="space-y-2">
      <label className="flex items-center gap-2">
        <input type="checkbox" className="accent-blue-500" />
        <span>푸시 알림 받기</span>
      </label>
      <label className="flex items-center gap-2">
        <input type="checkbox" className="accent-blue-500" />
        <span>이메일 알림 받기</span>
      </label>
    </div>
  );
}

export default NotificationToggle;
