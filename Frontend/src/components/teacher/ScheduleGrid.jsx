const ScheduleGrid = ({ schedule }) => (
  <div className="bg-white rounded-brand shadow-brand p-5">
    <h3 className="font-sora font-semibold text-navy mb-4">Weekly Schedule</h3>
    <div className="overflow-x-auto">
      <div className="grid grid-cols-7 gap-1.5 min-w-[500px]">
        {schedule.map((day) => (
          <div key={day.day}>
            <p className="text-center text-xs font-bold text-navy mb-2">{day.day}</p>
            {day.slots.map((slot, i) => (
              <div
                key={i}
                className={`px-1.5 py-2 rounded-lg text-[0.65rem] text-center mb-1.5 border cursor-pointer transition ${
                  slot.status === 'booked' ? 'time-slot-booked' : 'time-slot-free hover:bg-green-50'
                }`}
              >
                <div className="font-semibold">{slot.time}</div>
                {slot.status === 'booked'
                  ? <div className="truncate opacity-80">{slot.student}</div>
                  : <div className="text-success/80">Free</div>
                }
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  </div>
);
export default ScheduleGrid;
