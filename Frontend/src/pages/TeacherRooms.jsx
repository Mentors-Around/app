import { useState, useEffect } from 'react';

const TeacherRooms = () => {
  const [activeTab, setActiveTab] = useState('create'); // 'create' or 'my-rooms'
  const [createdRoomCode, setCreatedRoomCode] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    subject: '',
    level: '',
    maxStudents: 10,
    date: '',
    time: '',
    duration: '',
    mode: 'Online',
    price: '',
    description: ''
  });

  useEffect(() => {
    document.title = 'Group Rooms — TrueEd';
    window.scrollTo(0, 0);
  }, []);

  const handleCreate = (e) => {
    e.preventDefault();
    // Simulate API call
    setTimeout(() => {
      setCreatedRoomCode(`ROOM-${Math.floor(1000 + Math.random() * 9000)}`);
      window.scrollTo(0, 0);
    }, 600);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(createdRoomCode);
    alert('Code copied to clipboard!');
  };

  const resetForm = () => {
    setCreatedRoomCode(null);
    setForm({
      name: '', subject: '', level: '', maxStudents: 10,
      date: '', time: '', duration: '', mode: 'Online', price: '', description: ''
    });
  };

  const dummyRooms = [
    { id: 1, name: 'Crash Course: Organic Chemistry', subject: 'Chemistry', date: 'Oct 25, 2023 - 05:00 PM', students: 12, max: 20, mode: 'Online', price: 499 },
    { id: 2, name: 'Board Prep: Calculus Masterclass', subject: 'Mathematics', date: 'Oct 28, 2023 - 10:00 AM', students: 8, max: 15, mode: 'Offline', price: 799 }
  ];

  return (
    <div className="max-w-4xl mx-auto pb-10">
      <div className="mb-8">
        <h1 className="font-sora text-3xl font-bold text-navy mb-2">Group Rooms</h1>
        <p className="text-muted">Host group classes, set a per-student price, and share your room code.</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-slate-200 mb-8">
        <button 
          onClick={() => { setActiveTab('create'); setCreatedRoomCode(null); }}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${activeTab === 'create' ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:text-navy'}`}
        >
          Create New Room
        </button>
        <button 
          onClick={() => setActiveTab('my-rooms')}
          className={`py-3 px-4 font-semibold text-sm border-b-2 transition ${activeTab === 'my-rooms' ? 'border-navy text-navy' : 'border-transparent text-slate-500 hover:text-navy'}`}
        >
          My Active Rooms
        </button>
      </div>

      {activeTab === 'create' ? (
        createdRoomCode ? (
          <div className="bg-white p-10 rounded-brand shadow-brand border-2 border-green-200 text-center animate-fade-in">
            <div className="w-20 h-20 bg-green-50 text-success rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
              <i className="fa-solid fa-check" />
            </div>
            <h2 className="font-sora text-2xl font-bold text-navy mb-2">Room Created Successfully!</h2>
            <p className="text-muted mb-8">Share this code with your students so they can join directly.</p>
            
            <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl max-w-sm mx-auto mb-8 relative">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">Room Code</p>
              <div className="font-sora font-extrabold text-4xl text-navy tracking-widest">{createdRoomCode}</div>
              <button onClick={handleCopyCode} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center text-slate-400 hover:text-navy bg-white border border-slate-200 rounded-md transition shadow-sm">
                <i className="fa-regular fa-copy" />
              </button>
            </div>

            <div className="flex gap-4 justify-center">
              <button onClick={resetForm} className="py-3 px-6 bg-white border-2 border-slate-200 text-navy font-bold rounded-lg hover:bg-slate-50 transition">
                Create Another
              </button>
              <button onClick={() => setActiveTab('my-rooms')} className="py-3 px-6 bg-navy text-white font-bold rounded-lg hover:bg-navy-light transition shadow-md">
                View My Rooms
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleCreate} className="bg-white p-6 sm:p-8 rounded-brand shadow-sm border border-slate-200 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-navy mb-2">Room Name</label>
                <input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="e.g. Crash Course: Organic Chemistry" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Subject</label>
                <input required type="text" value={form.subject} onChange={e => setForm({...form, subject: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="e.g. Chemistry" />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Class / Level</label>
                <input required type="text" value={form.level} onChange={e => setForm({...form, level: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="e.g. Class 12" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2 flex justify-between">
                  <span>Max Students</span>
                  <span className="text-amber bg-amber/10 px-2 py-0.5 rounded text-xs">{form.maxStudents} seats</span>
                </label>
                <input type="range" min="2" max="30" value={form.maxStudents} onChange={e => setForm({...form, maxStudents: e.target.value})} className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-navy mt-3" />
                <div className="flex justify-between text-[10px] text-slate-400 font-bold mt-2">
                  <span>2</span>
                  <span>30</span>
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Price per student (₹)</label>
                <input required type="number" min="0" value={form.price} onChange={e => setForm({...form, price: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" placeholder="e.g. 500" />
              </div>

              <div>
                <label className="block text-sm font-semibold text-navy mb-2">Date</label>
                <input required type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Time</label>
                  <input required type="time" value={form.time} onChange={e => setForm({...form, time: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition" />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-navy mb-2">Duration</label>
                  <select required value={form.duration} onChange={e => setForm({...form, duration: e.target.value})} className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition">
                    <option value="">Select</option>
                    <option value="60">1 Hour</option>
                    <option value="90">1.5 Hours</option>
                    <option value="120">2 Hours</option>
                  </select>
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-navy mb-2">Teaching Mode</label>
                <div className="flex gap-4">
                  {['Online', 'Offline'].map(mode => (
                    <label key={mode} className={`flex-1 flex items-center justify-center gap-2 py-3 border-2 rounded-lg cursor-pointer transition ${form.mode === mode ? 'border-navy bg-navy/5 text-navy font-bold' : 'border-slate-200 text-slate-500 font-medium hover:border-slate-300'}`}>
                      <input type="radio" name="mode" value={mode} checked={form.mode === mode} onChange={e => setForm({...form, mode: e.target.value})} className="hidden" />
                      <i className={`fa-solid ${mode === 'Online' ? 'fa-laptop' : 'fa-house-user'}`} />
                      {mode}
                    </label>
                  ))}
                </div>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-semibold text-navy mb-2">Room Description</label>
                <textarea required value={form.description} onChange={e => setForm({...form, description: e.target.value})} rows="3" className="w-full py-3 px-4 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-navy transition resize-none" placeholder="What will you cover in this session?" />
              </div>
            </div>

            <div className="pt-4 border-t border-slate-100 flex justify-end">
              <button type="submit" className="py-3.5 px-8 bg-navy text-white rounded-lg font-sora font-semibold hover:bg-navy-light hover:-translate-y-0.5 transition shadow-brand flex items-center gap-2">
                <i className="fa-solid fa-plus" /> Create Room
              </button>
            </div>
          </form>
        )
      ) : (
        <div className="space-y-4">
          {dummyRooms.map(room => (
            <div key={room.id} className="bg-white p-6 rounded-brand shadow-sm border border-slate-200 flex flex-col sm:flex-row justify-between gap-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h3 className="font-sora font-bold text-navy text-lg">{room.name}</h3>
                  <span className="text-[10px] font-bold text-sky bg-sky/10 px-2 py-0.5 rounded uppercase tracking-wider">{room.subject}</span>
                </div>
                <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 font-medium mb-4">
                  <span className="flex items-center gap-1.5"><i className="fa-regular fa-calendar" /> {room.date}</span>
                  <span className="flex items-center gap-1.5"><i className={`fa-solid ${room.mode === 'Online' ? 'fa-laptop' : 'fa-house-user'}`} /> {room.mode}</span>
                  <span className="flex items-center gap-1.5 font-bold text-navy"><i className="fa-solid fa-indian-rupee-sign text-[10px]" /> {room.price}/student</span>
                </div>
                <div className="bg-slate-50 inline-flex items-center gap-3 py-2 px-4 rounded-lg border border-slate-100">
                  <div className="flex -space-x-2">
                    {[1,2,3].map(i => <div key={i} className="w-6 h-6 rounded-full bg-slate-300 border-2 border-white" />)}
                  </div>
                  <span className="text-sm font-semibold text-navy">{room.students} / {room.max} Students Joined</span>
                </div>
              </div>
              <div className="flex sm:flex-col gap-3 justify-end sm:justify-start">
                <button className="flex-1 py-2 px-4 bg-slate-100 text-navy font-semibold rounded hover:bg-slate-200 transition text-sm">
                  Edit Room
                </button>
                <button className="flex-1 py-2 px-4 bg-red-50 text-error font-semibold rounded hover:bg-red-100 transition text-sm">
                  Cancel Room
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TeacherRooms;
