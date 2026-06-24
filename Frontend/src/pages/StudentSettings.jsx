import { useEffect } from 'react';
const StudentSettings = () => {
  useEffect(() => { document.title = 'Settings — TrueEd'; }, []);
  return (
    <div className="max-w-[1000px] mx-auto">
      <h1 className="font-sora text-2xl font-bold text-navy mb-6">Settings</h1>
      
      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8 mb-8">
        <h2 className="font-sora text-xl font-bold text-navy mb-6">Notification Settings</h2>
        <div className="text-center py-12 text-muted">
          <i className="fa-solid fa-person-digging text-4xl mb-4 opacity-50" />
          <p>This section is under construction.</p>
        </div>
      </div>

      <div className="bg-white rounded-brand shadow-brand p-6 md:p-8">
        <h2 className="font-sora text-xl font-bold text-navy mb-6">Help & Support</h2>
        <div className="text-center py-12 text-muted">
          <i className="fa-solid fa-headset text-4xl mb-4 opacity-50" />
          <p>This section is under construction.</p>
        </div>
      </div>
    </div>
  );
};
export default StudentSettings;
