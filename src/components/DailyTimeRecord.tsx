import React, { useMemo, useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSaturday, isSunday, parseISO, isSameDay, addMonths, subMonths } from 'date-fns';
import { Employee, AttendanceRecord } from '../types';
import { cn } from '../lib/utils';
import { Printer, ChevronLeft, Calendar, ChevronRight, Eye, List, Grid3x3 } from 'lucide-react';

interface DailyTimeRecordProps {
  employee: Employee;
  attendance: AttendanceRecord[];
  month?: string; // yyyy-MM (optional, defaults to current month)
  initialPeriod?: 'quincena1' | 'quincena2' | 'monthly';
  initialViewMode?: 'preview' | 'print';
  onBack?: () => void;
}

export default function DailyTimeRecord({ employee, attendance, month: initialMonth, initialPeriod = 'monthly', initialViewMode = 'preview', onBack }: DailyTimeRecordProps) {
  // UI State
  const [currentPeriod, setCurrentPeriod] = React.useState<'quincena1' | 'quincena2' | 'monthly'>(initialPeriod);
  const [viewMode, setViewMode] = useState<'preview' | 'print'>(initialViewMode);
  const [calendarMode, setCalendarMode] = useState<'table' | 'calendar'>('table');
  
  // Month selection
  const [selectedMonth, setSelectedMonth] = useState<Date>(() => {
    if (initialMonth) {
      const [year, mNum] = initialMonth.split('-').map(Number);
      return new Date(year, mNum - 1);
    }
    return new Date();
  });

  const month = `${selectedMonth.getFullYear()}-${String(selectedMonth.getMonth() + 1).padStart(2, '0')}`;
  
  const { startDate, endDate, days } = useMemo(() => {
    const firstDay = startOfMonth(selectedMonth);
    const lastDay = endOfMonth(selectedMonth);

    let start = firstDay;
    let end = lastDay;

    if (currentPeriod === 'quincena1') {
      end = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 15);
    } else if (currentPeriod === 'quincena2') {
      start = new Date(selectedMonth.getFullYear(), selectedMonth.getMonth(), 16);
    }

    return {
      startDate: start,
      endDate: end,
      days: eachDayOfInterval({ start, end })
    };
  }, [selectedMonth, currentPeriod]);

  const dtrData = useMemo(() => {
    return days.map(day => {
      let record = null;
      try {
        record = attendance.find(r => {
          try {
            return isSameDay(parseISO(r.date), day);
          } catch (e) {
            return false;
          }
        });
      } catch (e) {
        console.error('Error filtering attendance:', e);
      }
      
      let amIn = '';
      let amOut = '';
      let pmIn = '';
      let pmOut = '';
      let undertimeHrs = '08';
      let undertimeMins = '00';
      let totalHours = 0;
      let status = 'absent';

      if (record) {
        try {
          const tIn = new Date(record.timeIn);
          const tOut = record.timeOut ? new Date(record.timeOut) : null;

          // If timeIn is before noon
          if (tIn.getHours() < 12) {
            amIn = format(tIn, 'h:mm a');
          } else {
            pmIn = format(tIn, 'h:mm a');
          }

          if (tOut) {
            if (tOut.getHours() < 13) {
              amOut = format(tOut, 'h:mm a');
            } else {
              pmOut = format(tOut, 'h:mm a');
            }
            
            totalHours = record.totalHours || 0;
            status = record.status || 'absent';
            
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
        } catch (e) {
          console.error('Error processing record:', e);
        }
      }

      let remarks = '';
      if (isSaturday(day)) remarks = 'SATURDAY';
      if (isSunday(day)) remarks = 'SUNDAY';
      if (!remarks && !record) remarks = 'NO RECORD';

      return {
        date: day,
        dayNum: format(day, 'dd'),
        dayName: format(day, 'EEE'),
        amIn,
        amOut,
        pmIn,
        pmOut,
        undertimeHrs: uttimeHrs,
        undertimeMins,
        remarks,
        status,
        totalHours,
        record
      };
    });
  }, [days, attendance]);

  // Calculate summary statistics
  const summary = useMemo(() => {
    const totalDaysPresent = dtrData.filter(d => d.status === 'present' || d.status === 'late').length;
    const totalDaysAbsent = dtrData.filter(d => d.status === 'absent').length;
    const totalHoursWorked = dtrData.reduce((acc, d) => acc + (d.totalHours || 0), 0);
    const daysWithUndertime = dtrData.filter(d => d.undertimeHrs || d.undertimeMins).length;
    
    return {
      totalDaysPresent,
      totalDaysAbsent,
      totalHoursWorked: totalHoursWorked.toFixed(2),
      daysWithUndertime
    };
  }, [dtrData]);

  // Preview mode renders
  const renderPreviewTableView = () => (
    <div className="space-y-6">
      {/* Month Selector and Controls */}
      <div className="flex items-center justify-between bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <button
            onClick={() => setSelectedMonth(subMonths(selectedMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            title="Previous month"
          >
            <ChevronLeft size={20} />
          </button>
          
          <div className="min-w-fit">
            <input
              type="month"
              value={month}
              onChange={(e) => {
                const [year, mNum] = e.target.value.split('-').map(Number);
                setSelectedMonth(new Date(year, mNum - 1));
              }}
              className="px-4 py-2 border border-slate-300 rounded-lg font-bold text-slate-700 cursor-pointer hover:border-talibon-red transition-colors"
            />
          </div>
          
          <button
            onClick={() => setSelectedMonth(addMonths(selectedMonth, 1))}
            className="p-2 hover:bg-slate-100 rounded-lg transition-all"
            title="Next month"
          >
            <ChevronRight size={20} />
          </button>

          <div className="h-8 w-px bg-slate-200"></div>

          <button
            onClick={() => setSelectedMonth(new Date())}
            className="px-4 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold text-sm transition-all"
          >
            Today
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCalendarMode('table')}
            className={cn(
              "p-2 rounded-lg transition-all",
              calendarMode === 'table'
                ? "bg-talibon-red text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            )}
            title="Table view"
          >
            <List size={20} />
          </button>
          <button
            onClick={() => setCalendarMode('calendar')}
            className={cn(
              "p-2 rounded-lg transition-all",
              calendarMode === 'calendar'
                ? "bg-talibon-red text-white"
                : "bg-slate-100 hover:bg-slate-200 text-slate-600"
            )}
            title="Calendar view"
          >
            <Grid3x3 size={20} />
          </button>
        </div>
      </div>

      {/* Summary Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-slate-500 text-sm font-semibold">Days Present</p>
          <p className="text-2xl font-black text-talibon-red mt-1">{summary.totalDaysPresent}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-slate-500 text-sm font-semibold">Days Absent</p>
          <p className="text-2xl font-black text-slate-600 mt-1">{summary.totalDaysAbsent}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-slate-500 text-sm font-semibold">Total Hours Worked</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{summary.totalHoursWorked}</p>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all">
          <p className="text-slate-500 text-sm font-semibold">Days w/ Undertime</p>
          <p className="text-2xl font-black text-orange-500 mt-1">{summary.daysWithUndertime}</p>
        </div>
      </div>

      {/* View Content */}
      {calendarMode === 'table' ? renderTableView() : renderCalendarView()}
    </div>
  );

  const renderTableView = () => {
    try {
      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Date</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Day</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Status</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Time In</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Time Out</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Total Hours</th>
                  <th className="px-4 py-3 text-center text-xs font-bold text-slate-600 uppercase tracking-wider">Undertime</th>
                  <th className="px-4 py-3 text-left text-xs font-bold text-slate-600 uppercase tracking-wider">Remarks</th>
                </tr>
              </thead>
              <tbody>
                {dtrData && dtrData.length > 0 ? (
                  dtrData.map((d, idx) => (
                    <tr key={idx} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-semibold text-slate-900">{format(d.date, 'MMM dd')}</td>
                      <td className="px-4 py-3 text-slate-600 font-medium">{d.dayName}</td>
                      <td className="px-4 py-3 text-center">
                        {d.remarks && (isSaturday(d.date) || isSunday(d.date)) ? (
                          <span className="inline-block px-2 py-1 bg-slate-200 text-slate-700 rounded text-xs font-bold">
                            {d.remarks}
                          </span>
                        ) : d.status === 'present' ? (
                          <span className="inline-block px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold">
                            PRESENT
                          </span>
                        ) : d.status === 'late' ? (
                          <span className="inline-block px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold">
                            LATE
                          </span>
                        ) : d.status === 'undertime' ? (
                          <span className="inline-block px-2 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold">
                            UNDERTIME
                          </span>
                        ) : (
                          <span className="inline-block px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold">
                            ABSENT
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-center font-mono text-sm">{d.amIn || d.pmIn || '—'}</td>
                      <td className="px-4 py-3 text-center font-mono text-sm">{d.amOut || d.pmOut || '—'}</td>
                      <td className="px-4 py-3 text-center font-semibold">
                        {d.totalHours ? `${d.totalHours.toFixed(2)}h` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center text-sm">
                        {d.undertimeHrs || d.undertimeMins ? (
                          <span className="font-mono text-orange-600 font-bold">
                            {d.undertimeHrs}h {d.undertimeMins}m
                          </span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-4 py-3 text-slate-600 text-sm max-w-xs truncate">{d.remarks || '—'}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="px-4 py-8 text-center text-slate-500 font-semibold">
                      No attendance records found for this period
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      );
    } catch (e) {
      console.error('Error rendering table view:', e);
      return <div className="p-4 text-red-600">Error rendering table view</div>;
    }
  };

  const renderCalendarView = () => {
    try {
      return (
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="grid grid-cols-7 gap-2">
            {/* Day headers */}
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
              <div key={day} className="text-center font-bold text-slate-600 text-sm py-2 border-b border-slate-200">
                {day}
              </div>
            ))}

            {/* Empty cells for days before the month starts */}
            {Array.from({ length: startDate.getDay() }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square" />
            ))}

            {/* Days of month */}
            {dtrData && dtrData.length > 0 ? (
              dtrData.map((d, idx) => {
                let bgColor = 'bg-white';
                let textColor = 'text-slate-900';
                let borderColor = 'border-slate-200';

                if (isSaturday(d.date) || isSunday(d.date)) {
                  bgColor = 'bg-slate-100';
                  textColor = 'text-slate-600';
                } else if (d.status === 'present') {
                  bgColor = 'bg-green-50';
                  textColor = 'text-green-900';
                  borderColor = 'border-green-200';
                } else if (d.status === 'late') {
                  bgColor = 'bg-yellow-50';
                  textColor = 'text-yellow-900';
                  borderColor = 'border-yellow-200';
                } else if (d.status === 'undertime') {
                  bgColor = 'bg-orange-50';
                  textColor = 'text-orange-900';
                  borderColor = 'border-orange-200';
                } else if (d.status === 'absent') {
                  bgColor = 'bg-red-50';
                  textColor = 'text-red-900';
                  borderColor = 'border-red-200';
                }

                return (
                  <div
                    key={idx}
                    className={cn(
                      'aspect-square p-2 rounded-lg border transition-all hover:shadow-md cursor-help',
                      bgColor,
                      borderColor,
                      'group relative'
                    )}
                    title={`${format(d.date, 'MMM dd, yyyy')}: ${d.status || 'absent'}`}
                  >
                    <div className="flex flex-col h-full">
                      <div className={cn('font-bold text-sm text-right', textColor)}>{d.dayNum}</div>
                      <div className="flex-1 flex flex-col justify-start gap-1 mt-1 text-[10px]">
                        {d.amIn && <div className="text-blue-600 font-semibold truncate">{d.amIn}</div>}
                        {d.pmOut && <div className="text-purple-600 font-semibold truncate">{d.pmOut}</div>}
                        {d.totalHours && <div className="text-slate-700 font-bold">{d.totalHours.toFixed(1)}h</div>}
                      </div>
                      {/* Status indicator dot */}
                      <div className="absolute top-1 left-1 w-2 h-2 rounded-full mt-1" style={{
                        backgroundColor: d.status === 'present' ? '#10b981' : d.status === 'late' ? '#f59e0b' : d.status === 'undertime' ? '#f97316' : '#ef4444'
                      }} />
                    </div>

                    {/* Tooltip on hover */}
                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 bg-slate-900 text-white px-3 py-2 rounded-lg text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10">
                      <div className="font-bold">{format(d.date, 'MMM dd')}</div>
                      <div>Status: {d.status || 'absent'}</div>
                      {d.totalHours && <div>Hours: {d.totalHours.toFixed(2)}h</div>}
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="col-span-7 py-8 text-center text-slate-500">
                No attendance records for this period
              </div>
            )}
          </div>
        </div>
      );
    } catch (e) {
      console.error('Error rendering calendar view:', e);
      return <div className="p-4 text-red-600">Error rendering calendar view</div>;
    }
  };

  const renderPreviewMode = () => (
    <div className="space-y-6">
      <header className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          {onBack && (
            <button onClick={onBack} className="p-2 hover:bg-slate-100 rounded-lg transition-all">
              <ChevronLeft />
            </button>
          )}
          <div>
            <h2 className="text-2xl font-black text-slate-900 tracking-tight uppercase leading-none">
              Daily Time Record - {employee.firstName} {employee.lastName}
            </h2>
            <p className="text-sm text-slate-500 mt-1">ID: {employee.id.slice(-5).toUpperCase()}</p>
          </div>
        </div>
        <button 
          onClick={() => window.print()}
          className="px-6 py-3 bg-slate-900 text-white rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-talibon-red transition-all flex items-center gap-2 shadow-lg"
        >
          <Printer size={16} /> Print
        </button>
      </header>

      {renderPreviewTableView()}
    </div>
  );

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
      {/* View Mode Toggle (Print Hidden) */}
      {viewMode === 'preview' && (
        <div className="fixed top-20 right-10 flex gap-2 print:hidden z-10">
          <button
            onClick={() => setViewMode('preview')}
            className={cn(
              "px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2",
              viewMode === 'preview'
                ? "bg-talibon-red text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            )}
          >
            <Eye size={14} /> Preview
          </button>
          <button
            onClick={() => setViewMode('print')}
            className={cn(
              "px-4 py-2 rounded-lg font-bold uppercase text-xs tracking-widest transition-all flex items-center gap-2",
              viewMode === 'print'
                ? "bg-talibon-red text-white shadow-lg"
                : "bg-white text-slate-600 border border-slate-200 hover:border-slate-300"
            )}
          >
            <FileText size={14} /> Official Form
          </button>
        </div>
      )}

      {/* Render based on view mode */}
      {viewMode === 'preview' ? renderPreviewMode() : (
        <>
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
                    { id: 'quincena1', label: '1st Quincena' },
                    { id: 'quincena2', label: '2nd Quincena' },
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
        </>
      )}
    </div>
  );
}
