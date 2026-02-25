<?php

namespace App\Exports\Sheets;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithTitle;
use Maatwebsite\Excel\Concerns\WithHeadings;
use Maatwebsite\Excel\Concerns\WithStyles;
use PhpOffice\PhpSpreadsheet\Worksheet\Worksheet;

class AttnSheet2Daily implements FromArray, WithTitle, WithHeadings, WithStyles
{
    public function __construct(private array $report) {}

    public function title(): string { return 'Attn Sheet 2'; }

    public function headings(): array
    {
        return [
            'Date','Day','Status','Holiday',
            'Check In','Break In','Break Out','Check Out',
            'Work Minutes','OT Minutes'
        ];
    }

    public function array(): array
    {
        return array_map(function ($d) {
            return [
                $d['date'], $d['day'], $d['status'], $d['holiday_title'],
                $d['check_in'], $d['break_in'], $d['break_out'], $d['check_out'],
                $d['work_minutes'], $d['overtime_minutes'],
            ];
        }, $this->report['days'] ?? []);
    }

    public function styles(Worksheet $sheet)
    {
        $sheet->freezePane('A2');
        $sheet->getStyle('A1:J1')->getFont()->setBold(true);

        $sheet->getColumnDimension('A')->setWidth(12);
        $sheet->getColumnDimension('B')->setWidth(8);
        $sheet->getColumnDimension('C')->setWidth(12);
        $sheet->getColumnDimension('D')->setWidth(28);
        $sheet->getColumnDimension('E')->setWidth(12);
        $sheet->getColumnDimension('H')->setWidth(12);

        return [];
    }
}