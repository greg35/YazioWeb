
import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Printer } from 'lucide-react';
import { useLanguage } from './LanguageContext';

const WeeklyView = ({ data, onClose }) => {
    const { t } = useLanguage();
    const [currentWeekStart, setCurrentWeekStart] = useState(new Date());

    useEffect(() => {
        // Set initial start of week to the most recent Monday
        const today = new Date();
        const day = today.getDay();
        const diff = today.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
        const monday = new Date(today.setDate(diff));
        monday.setHours(0, 0, 0, 0);
        setCurrentWeekStart(monday);
    }, []);

    const getWeekDays = (startDate) => {
        const days = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(startDate);
            d.setDate(startDate.getDate() + i);
            days.push(d);
        }
        return days;
    };

    const weekDays = getWeekDays(currentWeekStart);

    const prevWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentWeekStart(newDate);
    };

    const nextWeek = () => {
        const newDate = new Date(currentWeekStart);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentWeekStart(newDate);
    };

    const getDayData = (date) => {
        const dateStr = date.toISOString().split('T')[0];
        return data.find(d => d.date === dateStr);
    };

    const getMealItems = (dayData, mealType) => {
        if (!dayData?.originalData?.consumed) return [];

        const consumed = dayData.originalData.consumed;
        const allProducts = [
            ...(consumed.products || []),
            ...(consumed.simple_products || []),
            ...(consumed.recipe_portions || [])
        ];

        return allProducts.filter(item => item.daytime === mealType);
    };

    const formatNumber = (num) => Math.round(num || 0);

    return (
        <div className="fixed inset-0 bg-white z-50 overflow-auto text-slate-900 font-sans">
            {/* Header - No Print */}
            <div className="sticky top-0 bg-white border-b border-slate-200 p-4 flex justify-between items-center print:hidden z-10 shadow-sm">
                <div className="flex items-center gap-4">
                    <h2 className="text-2xl font-bold text-slate-800">{t('weekly_report')}</h2>
                    <div className="flex items-center bg-slate-100 rounded-lg p-1 border border-slate-200">
                        <button onClick={prevWeek} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors">
                            <ChevronLeft className="w-5 h-5" />
                        </button>
                        <span className="px-4 font-medium text-slate-700 min-w-[200px] text-center">
                            {weekDays[0]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - {weekDays[6]?.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        </span>
                        <button onClick={nextWeek} className="p-1 hover:bg-slate-200 rounded text-slate-600 transition-colors">
                            <ChevronRight className="w-5 h-5" />
                        </button>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => window.print()}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg font-semibold bg-violet-600 hover:bg-violet-700 text-white transition-all"
                    >
                        <Printer className="w-5 h-5" />
                        {t('print')}
                    </button>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-500 hover:text-slate-800"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
            </div>

            {/* Printable Content */}
            <div className="p-8 min-w-[1000px]">
                <div className="mb-8 hidden print:block">
                    <h1 className="text-3xl font-bold text-slate-900">{t('weekly_nutrition_report')}</h1>
                    <p className="text-slate-500">
                        {weekDays[0]?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })} - {weekDays[6]?.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
                    </p>
                </div>

                <div className="grid grid-cols-7 gap-4">
                    {weekDays.map((date, index) => {
                        const dayData = getDayData(date);
                        const isToday = new Date().toDateString() === date.toDateString();

                        return (
                            <div key={index} className={`flex flex-col gap-4 ${isToday ? 'bg-violet-50/50 -m-2 p-2 rounded-xl ring-1 ring-violet-200 print:ring-0 print:bg-transparent print:m-0 print:p-0' : ''}`}>
                                {/* Day Header */}
                                <div className="border-b-2 border-slate-200 pb-2">
                                    <div className="flex justify-between items-center">
                                        <div className="font-bold text-lg text-slate-800">{date.toLocaleDateString(undefined, { weekday: 'short' })}</div>
                                        {dayData && (
                                            <div className="font-bold text-slate-700 text-sm">{formatNumber(dayData.calories)} kcal</div>
                                        )}
                                    </div>
                                    <div className="flex justify-between items-center mt-1">
                                        <div className="text-sm text-slate-500">{date.toLocaleDateString(undefined, { day: 'numeric', month: 'numeric' })}</div>
                                        {dayData && (
                                            <div className="text-xs text-slate-500">
                                                {t('protein').charAt(0)}:{formatNumber(dayData.protein)}g / {t('carbs').charAt(0)}:{formatNumber(dayData.carbs)}g / {t('fat').charAt(0)}:{formatNumber(dayData.fat)}g
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Meals */}
                                <div className="flex-1 space-y-4">
                                    {['breakfast', 'lunch', 'dinner', 'snack'].map(mealType => {
                                        const items = getMealItems(dayData, mealType);
                                        if (items.length === 0) return null;

                                        return (
                                            <div key={mealType} className="space-y-1">
                                                <div className="text-xs font-bold uppercase text-slate-400 tracking-wider">{t(mealType)}</div>
                                                <div className="space-y-2">
                                                    {items.map((item, idx) => (
                                                        <div key={idx} className="text-xs border-l-2 border-slate-200 pl-2">
                                                            <div className="font-medium text-slate-700 line-clamp-2" title={item.name}>
                                                                {item.name || t('unknown')}
                                                            </div>
                                                            <div className="text-slate-500 flex gap-2 mt-0.5">
                                                                <span>{formatNumber(item.nutrients?.['energy.energy'])} kcal</span>
                                                                {item.amount > 0 && <span>({item.serving ? `${item.amount} ${t(item.base_unit || 'g')} (${item.serving_quantity} ${t(item.serving)})` : `${item.amount} ${t(item.base_unit || 'g')}`})</span>}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        );
                                    })}
                                    {!dayData && (
                                        <div className="text-xs text-slate-400 italic text-center py-4">{t('no_data_short')}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

export default WeeklyView;

