<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\HolidayCalendar;
use Illuminate\Http\Request;

class HolidayCalendarController extends Controller
{
    // GET /holiday-calendars/year?company_id=1&year=2026
    public function year(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'year' => 'required|digits:4|integer|min:2000|max:2100',
            'name' => 'nullable|string|max:50',
        ]);

        $cal = HolidayCalendar::with(['holidays' => fn ($q) => $q->orderBy('date')])
            ->firstOrCreate([
                'company_id' => $data['company_id'],
                'year' => $data['year'],
                'name' => $data['name'] ?? 'Default',
            ]);

        return response()->json(['status' => true, 'data' => $cal]);
    }

    // POST /holiday-calendars/holidays/add-update
    public function addUpdateHoliday(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'year' => 'required|digits:4|integer|min:2000|max:2100',
            'name' => 'nullable|string|max:50',

            'date' => 'required|date',
            'title' => 'required|string|max:120',
            'type' => 'nullable|in:festival,public,company',
            'is_optional' => 'nullable|boolean',
        ]);

        $cal = HolidayCalendar::firstOrCreate([
            'company_id' => $data['company_id'],
            'year' => $data['year'],
            'name' => $data['name'] ?? 'Default',
        ]);

        $holiday = Holiday::updateOrCreate(
            [
                'holiday_calendar_id' => $cal->id,
                'date' => $data['date'],
            ],
            [
                'title' => $data['title'],
                'type' => $data['type'] ?? 'festival',
                'is_optional' => $data['is_optional'] ?? false,
            ]
        );

        return response()->json([
            'status' => true,
            'message' => 'Holiday saved',
            'data' => $holiday,
        ]);
    }

    // DELETE /holiday-calendars/holidays/delete?company_id=1&year=2026&date=2026-10-02
    public function deleteHoliday(Request $request)
    {
        $data = $request->validate([
            'company_id' => 'required|exists:companies,id',
            'year' => 'required|digits:4|integer|min:2000|max:2100',
            'name' => 'nullable|string|max:50',
            'date' => 'required|date',
        ]);

        $cal = HolidayCalendar::where([
            'company_id' => $data['company_id'],
            'year' => $data['year'],
            'name' => $data['name'] ?? 'Default',
        ])->first();

        if (! $cal) {
            return response()->json(['status' => false, 'message' => 'Calendar not found'], 404);
        }

        Holiday::where('holiday_calendar_id', $cal->id)
            ->where('date', $data['date'])
            ->delete();

        return response()->json(['status' => true, 'message' => 'Holiday deleted']);
    }
}
