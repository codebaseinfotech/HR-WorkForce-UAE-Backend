<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttnSheet1Summary implements FromArray, WithTitle, WithStyles
{
    public function __construct(private array $report) {}

    public function title(): string { return 'Attn Sheet 1'; }

    public function array(): array
    {
        if (!empty($this->report['error'])) {
            return [
                ['Attendance Report'],
                ['Error', $this->report['error']],
            ];
        }

        $s = $this->report['summary'];

        return [
            ['Attendance Report Summary'],
            ['User', $this->report['user']['name']],
            ['Company ID', $this->report['user']['company_id']],
            ['From', $s['from'], 'To', $s['to']],
            [],
            ['Total Days', $s['total_days']],
            ['Working Days', $s['working_days']],
            ['Holidays', $s['holiday_days']],
            ['Weekly Off', $s['weekly_off_days']],
            [],
            ['Present', $s['present_days']],
            ['Leave', $s['leave_days']],
            ['Absent', $s['absent_days']],
            [],
            ['Total Work Minutes', $s['total_work_minutes']],
            ['Total OT Minutes', $s['total_overtime_minutes']],
        ];
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->getStyle('A1')->getFont()->setBold(true)->setSize(16);

        $sheet->getColumnDimension('A')->setWidth(22);
        $sheet->getColumnDimension('B')->setWidth(30);
        $sheet->getColumnDimension('C')->setWidth(12);
        $sheet->getColumnDimension('D')->setWidth(18);

        return [];
    }
}
