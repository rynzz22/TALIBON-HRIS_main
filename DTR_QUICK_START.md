# DTR Preview Feature - Quick Start Guide

## 5-Minute Setup & Usage Guide

### For End Users

#### 1. Access DTR Preview
```
Dashboard → Reports → Select Month → Click "Form 48" on Employee Row
```

#### 2. Select Your Month
- Use the **month dropdown** at the top of the page
- Click **"<"** and **">"** to navigate months
- Click **"Today"** to return to current month

#### 3. Choose Your View
```
📋 Table View       → Detailed columnar data, sortable
📅 Calendar View    → Visual grid with color indicators
📄 Official Form    → Government-certified form format
```

#### 4. Understanding the Display

**Status Colors:**
- 🟢 GREEN = Present & full hours worked
- 🟡 YELLOW = Late but completed day  
- 🟠 ORANGE = Undertime (less than 8 hours)
- 🔴 RED = Absent
- ⚫ GRAY = Weekend (Saturday/Sunday)

**Reading the Table:**
```
Date         | Day       | Status  | Time In | Time Out | Hours | Undertime | Remarks
Jul 01       | Monday    | PRESENT | 9:00 AM | 6:00 PM | 8.50h | —         | —
Jul 02       | Tuesday   | LATE    | 9:30 AM | 5:00 PM | 7.50h | 0h 30m    | —
Jul 06       | Saturday  | —       | —       | —       | —     | —         | SATURDAY
```

#### 5. Print Important Records
- Click **"Print"** button for quick browser print
- Choose **"Official Form"** tab for formal government format
- Select print to PDF or physical printer

#### 6. Summary Data
Quick stats at the top show:
- Total Days Present
- Total Days Absent
- Total Hours Worked for the month
- Days with Undertime

---

### For HR/Payroll Officers

#### Common Tasks

**1. Review Employee Attendance for a Period**
```
1. Go to Reports section
2. Select the month you need to review
3. Click "Form 48" for each employee
4. Compare their patterns across days
```

**2. Identify Problem Areas**
- **High Absences**: Look for RED days
- **Frequent Lateness**: Look for YELLOW days
- **Undertime Pattern**: Check ORANGE days count
- **Trends**: Navigate multiple months to spot patterns

**3. Export Records**
- Click "Official Form" tab
- Use browser Print → Save as PDF
- Store in employee file

**4. Generate Reports**
- Use calendar view for quick visual overview
- Use table view for detailed analysis
- Check summary stats for aggregate numbers

#### Batch Operations
```
For multiple employees:
1. Stay on main Reports page
2. Review all in table format
3. Click "Form 48" for each one
4. Keep records as needed
```

---

### For System Administrators

#### Configuration

**Month Selection Behavior:**
- Defaults to current month on first load
- Persists selected month while navigating employees
- Resets on page refresh

**Period Types:**
- **1st Quincena**: Jan 1-15, Feb 1-15, etc.
- **2nd Quincena**: Jan 16-31, Feb 16-28, etc.
- **Monthly**: Jan 1-31, Feb 1-28, etc.

**Print Formats:**
- Preview print (modern layout with stats)
- Official form print (government-certified)
- Both optimize for A4 paper

#### Data Requirements

For DTR to display correctly, ensure:

```json
{
  "attendance_records": {
    "id": "uuid",
    "employee_id": "uuid",
    "date": "2025-07-01",           // ISO date format
    "time_in": "2025-07-01T09:00:00Z",  // ISO timestamp
    "time_out": "2025-07-01T17:30:00Z", // ISO timestamp or null
    "total_hours": 8.50,                 // Decimal (hours.minutes)
    "status": "present",                 // present|late|absent|undertime
    "remarks": ""                        // Optional notes
  }
}
```

#### API Integration

DTR component is self-contained and doesn't require additional API calls:
- Uses attendance data passed from parent component
- All filtering happens client-side
- No backend calls needed per view mode change

---

## Troubleshooting

### No Records Showing
**Cause**: No attendance data logged for selected month  
**Solution**: 
1. Check if employee clock-in/out records exist
2. Verify month selection is correct
3. Confirm employee is active (not inactive status)

### Times Show as Empty
**Cause**: Time In/Out fields are null in database  
**Solution**:
1. Check Attendance Terminal logs
2. Verify employee manually clocked in
3. Look for correction requests pending

### Undertime Calculation Seems Wrong
**Cause**: System assumes 8-hour workday  
**Solution**:
1. Review working hours policy (default 8AM-5PM)
2. Check if employee has flexible hours
3. Look for approved flexible arrangement records

### Print Layout Broken
**Cause**: Browser zoomed in/out  
**Solution**:
1. Reset browser zoom to 100% (Ctrl+0)
2. Try different browser
3. Use Print Preview first

### Calendar View Colors Not Clear
**Cause**: Monitor color profile or accessibility settings  
**Solution**:
1. Adjust monitor color settings
2. Use Table View for better clarity
3. Enable high contrast mode in OS

---

## Tips for Better Usage

### 1. Regular Monitoring
✓ Check DTR weekly, not monthly  
✓ Catch issues early before payroll processing

### 2. Pattern Recognition
✓ Save screenshots of problematic patterns  
✓ Use calendar view for visual confirmation

### 3. Record Keeping
✓ Print Form 48 quarterly for archival  
✓ Keep PDF copies in employee records

### 4. Correction Process
✓ Note discrepancies with dates and times  
✓ Submit corrections with reason codes  
✓ Follow approval workflow

### 5. Payroll Integration
✓ Use DTR summary for deduction calculations  
✓ Cross-reference with Leave Management  
✓ Verify before final payroll run

---

## Feature Highlights

### What's New
✅ **Month Selection**: View any month instantly  
✅ **Dual Views**: Both table and calendar formats  
✅ **Statistics**: Summary dashboard at a glance  
✅ **Color Coding**: Visual status indicators  
✅ **Quick Print**: Modern and official print formats  
✅ **Easy Navigation**: Intuitive controls  

### What Works Best
- Quick review of monthly attendance
- Pattern analysis across days
- Official compliance records
- Employee discussion materials
- Payroll basis verification

### Limitations
- Single employee view (use Reports for all)
- Client-side filtering only (fast + responsive)
- Standard 8-hour workday assumption
- No custom working hour support (yet)

---

## Keyboard Shortcuts

| Action | Key(s) |
|--------|--------|
| Previous Month | Left Arrow (if focused on navigation) |
| Next Month | Right Arrow (if focused on navigation) |
| Today | Click "Today" button |
| Print | Ctrl+P (standard browser print) |
| Close/Back | Escape or click "Back" button |

---

## Support & Updates

**For Issues**: Contact IT Department or System Administrator  
**For Feature Requests**: Submit via HRIS Feedback Form  
**Documentation**: See DTR_PREVIEW_FEATURE.md for detailed guide  

---

**Last Updated**: April 2026  
**Version**: 1.0  
**Status**: Production Ready
