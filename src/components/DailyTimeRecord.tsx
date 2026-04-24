import React, { useMemo } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, parseISO, isSameDay } from 'date-fns';
import { Employee, AttendanceRecord } from '../types';
import { cn } from '../lib/utils';
import { Printer, ChevronLeft, Calendar } from 'lucide-react';

interface DailyTimeRecordProps {
  employee: Employee;
  attendance: AttendanceRecord[];
  month: string; // yyyy-MM
  initialPeriod?: 'quincena1' | 'quincena2' | 'monthly';
  onBack?: () => void;
}

export default function DailyTimeRecord({ employee, attendance, month, initialPeriod = 'monthly', onBack }: DailyTimeRecordProps) {
  const [currentPeriod, setCurrentPeriod] = React.useState<'quincena1' | 'quincena2' | 'monthly'>(initialPeriod);
  
  const { startDate, endDate, days } = useMemo(() => {
    const [year, mNum] = month.split('-').map(Number);
    const firstDay = startOfMonth(new Date(year, mNum - 1));
    const lastDay = endOfMonth(firstDay);

    let start = firstDay;
    let end = lastDay;

    if (currentPeriod === 'quincena1') {
      end = new Date(year, mNum - 1, 15);
    } else if (currentPeriod === 'quincena2') {
      start = new Date(year, mNum - 1, 16);
    }

    return {
      startDate: start,
      endDate: end,
      days: eachDayOfInterval({ start, end })
    };
  }, [month, currentPeriod]);

  const dtrData = useMemo(() => {
    return days.map(day => {
      const record = attendance.find(r => isSameDay(parseISO(r.date), day));
      
      // Heuristic mapping for standard 8-5 schedule
      // AM IN: first log in morning
      // PM OUT: last log in afternoon
      // Note: Current system only has one pair per day.
      let amIn = '';
      let amOut = '';
      let pmIn = '';
      let pmOut = '';
      let undertimeHrs = '08';
      let undertimeMins = '00';

      if (record) {
        const tIn = new Date(record.timeIn);
        const tOut = record.timeOut ? new Date(record.timeOut) : null;

        // If timeIn is before noon
        if (tIn.getHours() < 12) {
          amIn = format(tIn, 'h:mm');
        } else {
          pmIn = format(tIn, 'h:mm');
        }

        if (tOut) {
          if (tOut.getHours() < 13) {
            amOut = format(tOut, 'h:mm');
          } else {
            pmOut = format(tOut, 'h:mm');
          }
          
          // If they have a full day record, clear undertime
          if (record.totalHours && record.totalHours >= 8) {
            undertimeHrs = '';
            undertimeMins = '';
          } else if (record.totalHours) {
            const missing = 8 - record.totalHours;
            undertimeHrs = Math.floor(missing).toString().padStart(2, '0');
            undertimeMins = Math.round((missing % 1) * 60).toString().padStart(2, '0');
          }
        }
      }

      let remarks = '';
      if (isSaturday(day)) remarks = 'SATURDAY';
      if (isSunday(day)) remarks = 'SUNDAY';

      return {
        date: day,
        dayNum: format(day, 'dd'),
        amIn,
        amOut,
        pmIn,
        pmOut,
        undertimeHrs,
        undertimeMins,
        remarks
      };
    });
  }, [days, attendance]);

  const renderDTRSide = () => (
    <div className="w-[48%] border border-black p-4 text-[10px] font-serif bg-white text-black leading-tight">
      <div className="text-center mb-1">
        <p className="font-bold text-[8px]">CIVIL SERVICE FORM NO. 48</p>
        <h2 className="font-bold text-xs">DAILY TIME RECORD</h2>
        <div className="mt-1 border-b border-black inline-block px-4">
           <p className="font-bold tracking-widest uppercase">MUNICIPALITY OF TALIBON</p>
        </div>
      </div>

      <div className="mt-4 mb-2">
        <h3 className="text-sm font-bold border-b border-black text-center uppercase py-1">
          {employee.firstName} {employee.lastName}
        </h3>
        <div className="flex justify-between mt-1 px-1">
          <p>ID Number: <span className="font-bold">{employee.id.slice(-5).toUpperCase()}</span></p>
        </div>
        <div className="flex justify-between mt-1 px-1 border-b border-black pb-1">
          <p>For the period of: <span className="font-bold">
            {currentPeriod === 'quincena1' ? `${format(startDate, 'MMMM 01-15, yyyy')}` : 
             currentPeriod === 'quincena2' ? `${format(startDate, 'MMMM 16')}-${format(endDate, 'dd, yyyy')}` :
             `${format(startDate, 'MMMM dd')} - ${format(endDate, 'dd, yyyy')}`}
          </span></p>
        </div>
        <div className="flex justify-between mt-1 px-1 border-b border-black pb-1">
          <p>Working Hours: <span className="font-bold">8AM-12PM-1PM-5PM</span></p>
        </div>
      </div>

      <table className="w-full border-collapse border border-black">
        <thead>
          <tr>
            <th rowSpan={2} className="border border-black px-1 py-1 w-8">DAYS</th>
            <th colSpan={2} className="border border-black py-0.5">AM</th>
            <th colSpan={2} className="border border-black py-0.5">PM</th>
            <th colSpan={2} className="border border-black py-0.5">Undertime</th>
            <th rowSpan={2} className="border border-black px-1 py-1">Remarks</th>
          </tr>
          <tr className="text-[7px]">
            <th className="border border-black py-0.5 w-10">IN</th>
            <th className="border border-black py-0.5 w-10">OUT</th>
            <th className="border border-black py-0.5 w-10">IN</th>
            <th className="border border-black py-0.5 w-10">OUT</th>
            <th className="border border-black py-0.5">Hrs</th>
            <th className="border border-black py-0.5">Min</th>
          </tr>
        </thead>
        <tbody>
          {dtrData.map((d, idx) => (
            <tr key={idx} className="h-4">
              <td className="border border-black text-center font-bold px-1">{d.dayNum}</td>
              {d.remarks ? (
                <td colSpan={4} className="border border-black text-center font-bold italic tracking-[0.3em] bg-slate-50">
                  {d.remarks}
                </td>
              ) : (
                <>
                  <td className="border border-black text-center">{d.amIn}</td>
                  <td className="border border-black text-center">{d.amOut}</td>
                  <td className="border border-black text-center">{d.pmIn}</td>
                  <td className="border border-black text-center">{d.pmOut}</td>
                </>
              )}
              <td className="border border-black text-center">{d.undertimeHrs}</td>
              <td className="border border-black text-center">{d.undertimeMins}</td>
              <td className="border border-black text-center"></td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-6 px-2 text-[8px]">
        <p className="italic text-center leading-relaxed">
          I certify on my honor that the above is a true and correct report of the hours of work performed, record of which was made daily at the time of arrival and departure from office.
        </p>
        
        <div className="mt-8 text-center border-b border-black font-bold text-xs uppercase py-1">
          {employee.firstName} {employee.lastName}
        </div>
        
        <div className="mt-6">
          <p className="text-center italic">Verified as to prescribed office hours</p>
          <div className="mt-8 border-b border-black w-48 mx-auto"></div>
          <p className="text-center font-bold mt-1">Supervisor</p>
        </div>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      <header className="flex justify-between items-center print:hidden">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
              <ChevronLeft />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">Daily Time Record Terminal</h2>
            <div className="flex gap-2 mt-2 print:hidden">
              {[
                { id: 'quincena1', label: '1st Kensena' },
                { id: 'quincena2', label: '2nd Kensena' },
                { id: 'monthly', label: 'Full Month' }
              ].map(p => (
                <button
                  key={p.id}
                  onClick={() => setCurrentPeriod(p.id as any)}
                  className={cn(
                    "px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest border transition-all",
                    currentPeriod === p.id 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-white text-slate-400 border-slate-100 hover:border-slate-200"
                  )}
                >
                  {p.label}
                </button>
              ))}
            </div>
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mt-2 flex items-center gap-2">
              <Calendar size={12} className="text-talibon-red" /> Civil Service Form No. 48
            </p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-[10px] hover:bg-talibon-red transition-all flex items-center gap-2 shadow-lg"
        >
          <Printer size={16} /> Execute Print Job
        </button>
      </header>

      <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-xl overflow-hidden print:shadow-none print:border-none print:p-0">
        <div className="flex justify-between max-w-5xl mx-auto">
          {renderDTRSide()}
          <div className="w-px bg-slate-200 print:border-l print:border-dashed print:border-black h-full"></div>
          {renderDTRSide()}
        </div>
      </div>
    </div>
  );
}
