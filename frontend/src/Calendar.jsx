import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const Calendar = ({ data, onSelectDay, onClose }) => {
  const { t } = useLanguage();
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const days = new Date(year, month + 1, 0).getDate();
    const firstDay = new Date(year, month, 1).getDay();
    return { days, firstDay };
  };

  const { days, firstDay } = getDaysInMonth(currentDate);

  // Adjust firstDay to start on Monday (0 = Monday, 6 = Sunday)
  // standard getDay(): 0 = Sunday, 1 = Monday...
  // We want: 0 = Monday, ..., 6 = Sunday
  const startDay = firstDay === 0 ? 6 : firstDay - 1;

  const prevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1, d2) => {
    return d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();
  };

  const getDayData = (day) => {
    const dateStr = `${currentDate.getFullYear()}-${String(currentDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return data.find(d => d.date === dateStr);
  };

  const renderDays = () => {
    const daysArray = [];

    // Empty cells for days before start of month
    for (let i = 0; i < startDay; i++) {
      daysArray.push(<div key={`empty-${i}`} className="h-24 bg-slate-800/30 rounded-lg"></div>);
    }

    // Days of the month
    for (let i = 1; i <= days; i++) {
      const dayData = getDayData(i);
      const isToday = isSameDay(new Date(), new Date(currentDate.getFullYear(), currentDate.getMonth(), i));

      daysArray.push(
        <button
          key={i}
          onClick={() => dayData && onSelectDay(dayData)}
          disabled={!dayData}
          className={`h-24 p-2 rounded-lg border transition-all flex flex-col items-start justify-between relative group
            ${dayData
              ? 'bg-slate-800 border-slate-700 hover:border-violet-500 hover:bg-slate-700 cursor-pointer'
              : 'bg-slate-800/30 border-transparent cursor-default opacity-50'}
            ${isToday ? 'ring-2 ring-violet-500' : ''}
          `}
        >
          <span className={`text-sm font-medium ${isToday ? 'text-violet-400' : 'text-slate-400'}`}>{i}</span>

          {dayData && (
            <div className="w-full">
              <div className="flex items-center gap-1 text-xs text-orange-400 font-medium">
                <span>{Math.round(dayData.calories)}</span>
                <span className="text-[10px] text-slate-500">kcal</span>
              </div>
              <div className="w-full bg-slate-700 h-1.5 rounded-full mt-1 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500"
                  style={{ width: `${Math.min((dayData.calories / 2500) * 100, 100)}%` }} // Assuming 2500 target for visual
                />
              </div>
            </div>
          )}
        </button>
      );
    }

    return daysArray;
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-slate-900 rounded-2xl border border-slate-700 shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-slate-700 flex justify-between items-center bg-slate-900 rounded-t-2xl">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-white">{t('calendar')}</h2>
            <div className="flex items-center bg-slate-800 rounded-lg p-1 border border-slate-700">
              <button onClick={prevMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <span className="px-4 font-medium text-slate-200 min-w-[140px] text-center">
                {currentDate.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
              </span>
              <button onClick={nextMonth} className="p-1 hover:bg-slate-700 rounded text-slate-400 hover:text-white transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-800 rounded-lg transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-6 overflow-y-auto">
          <div className="grid grid-cols-7 gap-4 mb-4">
            {[t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat'), t('sun')].map(day => (
              <div key={day} className="text-center text-slate-500 font-medium text-sm uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-4">
            {renderDays()}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Calendar;
