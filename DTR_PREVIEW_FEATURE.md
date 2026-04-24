# Daily Time Record (DTR) Preview Feature

## Overview
The Enhanced Daily Time Record (DTR) Preview feature allows users to select any month and view detailed attendance records with multiple viewing modes. This feature is designed to provide clear visibility into employee attendance patterns, time-in/time-out records, total hours worked, and any remarks for each day.

## Features

### 1. **Month Selection**
- **Interactive Month Picker**: Select any month and year using the built-in date picker
- **Navigation Buttons**: Quickly move to the previous or next month
- **Quick Access**: Use the "Today" button to quickly jump to the current month

### 2. **Dual View Modes**

#### Preview Mode (Default)
The user-friendly view designed for daily data analysis and review:
- **Table View**: Structured table showing all daily records with columns:
  - Date (e.g., "Jul 01")
  - Day (e.g., "Monday")
  - Status (Present, Late, Undertime, Absent)
  - Time In (e.g., "9:00 AM")
  - Time Out (e.g., "5:30 PM")
  - Total Hours Worked (e.g., "8.50h")
  - Undertime (e.g., "0h 00m" or blank if no undertime)
  - Remarks

- **Calendar View**: Visual calendar grid showing:
  - Color-coded status indicators (Green=Present, Yellow=Late, Orange=Undertime, Red=Absent)
  - Quick time information displayed within each day cell
  - Total hours worked for the day
  - Hover tooltips with detailed information

### 3. **Summary Statistics**
At the top of the preview, quick overview cards display:
- **Days Present**: Count of days employee was present
- **Days Absent**: Count of days with no records
- **Total Hours Worked**: Sum of all hours worked during the selected month
- **Days with Undertime**: Count of days where employee worked less than 8 hours

### 4. **Official Form Mode**
For formal record-keeping and compliance:
- **Civil Service Form No. 48 Format**: Official government DTR form layout
- **Quincena Support**: View records in three period formats:
  - 1st Quincena (Days 1-15)
  - 2nd Quincena (Days 16-End)
  - Full Month
- **Print-Ready**: Optimized for printing with official signatures and certification

## How to Access

1. Navigate to the **Reports** section in the HRIS application
2. Select the desired month using the "Disbursement Month" selector
3. Choose the period type (Quincena 1, Quincena 2, or Monthly)
4. Locate the employee in the report table
5. Click the **"Form 48"** button in the "DTR Preview" column
6. The DTR preview page will open for the selected employee

## Using the Preview Interface

### Selecting a Different Month
1. Use the **left/right navigation arrows** to move between months
2. Or click directly on the **month input field** and select a new month
3. Click the **"Today" button** to return to the current month

### Switching Between View Modes
- **Table View**: Click the **list icon** to see detailed records in table format (recommended for data analysis)
- **Calendar View**: Click the **grid icon** to see a visual calendar representation (great for visual overview)
- **Official Form**: Click the **"Official Form" button** to see the formal government DTR format

### Interpreting Status Colors

| Status | Color | Meaning |
|--------|-------|---------|
| PRESENT | Green | Employee was present and worked full 8 hours or more |
| LATE | Yellow | Employee clocked in late but completed the day |
| UNDERTIME | Orange | Employee worked less than 8 hours |
| ABSENT | Red | No time-in record for the day |
| SATURDAY/SUNDAY | Gray | Weekend (not counted as working day) |

### Understanding the Data

**Time In/Time Out Format**: Displays in 12-hour format with AM/PM (e.g., "9:30 AM", "5:45 PM")

**Total Hours**: Shows decimal format to the hundredth place (e.g., "8.50h" means 8 hours and 30 minutes)

**Undertime**: Shows hours and minutes of shortfall (e.g., "1h 30m" means the employee was 1 hour 30 minutes short of the 8-hour requirement)

**Remarks**: Additional notes such as:
- "SATURDAY" / "SUNDAY" - Weekend indicator
- "NO RECORD" - Day with no attendance record
- Custom remarks if any

## Printing

### From Preview Mode
1. Click the **"Print" button** in the top-right corner
2. This will open the browser's print dialog with the preview data formatted for printing

### From Official Form Mode
1. Click the **"Execute Print Job" button**
2. The form will print in the official Civil Service Form No. 48 format
3. The form includes:
   - Employee details (Name, ID, Department)
   - Period of coverage
   - Daily time records table
   - Certification statement
   - Signature lines for employee and supervisor

## Period Types Explained

- **1st Quincena (Kensena)**: First 15 days of the month (useful for semi-monthly payroll)
- **2nd Quincena (Kensena)**: Days 16 to end of month (useful for semi-monthly payroll)
- **Full Month**: All days in the selected month (for comprehensive records)

## Troubleshooting

### No Data Showing
- Ensure attendance records have been logged for the employee in the selected month
- Verify the employee has not been marked as inactive
- Check that the correct month is selected

### Incorrect Hours Calculation
- Hours are calculated based on the time-in and time-out timestamps
- The system assumes an 8-hour workday (8 AM - 5 PM with 1-hour lunch)
- Verify time-in and time-out records are correct in the system

### Time Format Issues
- All times are displayed in 12-hour format with AM/PM indicator
- Time-out shows the afternoon/evening time when applicable
- For employees with split shifts, the system records first time-in and last time-out

## Tips & Best Practices

1. **Regular Month Checking**: Regularly review DTR records to identify patterns of tardiness or undertime
2. **Early Detection**: Use the calendar view to quickly visualize attendance patterns across the month
3. **Record Correction**: If incorrect records need to be corrected, submit a correction request through the "Correction" feature
4. **Backup Printing**: Print important DTR records for official files and compliance purposes
5. **Multiple Periods**: Compare records across multiple months by selecting different months and taking notes

## Related Features

- **Attendance Tracker**: For logging time-in and time-out
- **Leave Management**: For managing approved leave days
- **Payroll Management**: Uses DTR data to calculate deductions and overtime
- **Audit Logs**: Logs all DTR view and print activities for compliance

---

**Last Updated**: April 2026  
**Version**: 1.0  
**System**: Municipality of Talibon HRIS
